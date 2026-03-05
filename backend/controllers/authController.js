'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { generateSecureToken, hashToken } = require('../utils/crypto');
const { redisSet, redisDel, redisGet } = require('../config/redis');
const EmailService = require('../services/EmailService');
const { AppError } = require('../middleware/errorHandler.middleware');
const { sendSuccess, sendCreated } = require('../utils/response');
const logger = require('../utils/logger');

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const EMAIL_VERIFY_TTL = 24 * 60 * 60; // 24 hours
const PASSWORD_RESET_TTL = 60 * 60; // 1 hour

/**
 * POST /api/v1/auth/register
 * Create org + first admin user
 */
async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName, organizationName, city, state } = req.body;

    // Check for existing user
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    // Create organization first
    const organization = new Organization({
      name: organizationName,
      city,
      state,
      subscriptionTier: 'starter',
      subscriptionStatus: 'trialing',
    });

    // Create user (passwordHash set to plain password - pre-save hook will hash it)
    const user = new User({
      email,
      passwordHash: password, // Will be hashed in pre-save hook
      firstName,
      lastName,
      role: 'org_admin',
      emailVerified: false,
    });

    // Generate email verification token
    const verificationToken = generateSecureToken(32);
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFY_TTL * 1000);

    // Save both in order
    await organization.save();

    user.organizationId = organization._id;
    organization.ownerId = user._id;
    await user.save();
    await organization.save();

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Store refresh token reference in Redis
    await redisSet(`refresh:${user._id}`, tokens.refreshToken, REFRESH_TOKEN_TTL);

    // Send verification email (non-blocking)
    EmailService.sendEmailVerification(user, verificationToken).catch((err) =>
      logger.error('Failed to send verification email:', err.message)
    );
    EmailService.sendWelcomeEmail(user, organization).catch((err) =>
      logger.error('Failed to send welcome email:', err.message)
    );

    logger.info(`New registration: userId=${user._id} orgId=${organization._id}`);

    return sendCreated(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          organizationId: organization._id,
        },
        organization: {
          id: organization._id,
          name: organization.name,
          subscriptionTier: organization.subscriptionTier,
          subscriptionStatus: organization.subscriptionStatus,
        },
        ...tokens,
      },
      'Registration successful. Please verify your email.'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Fetch user with password hash
    const user = await User.findByEmail(email).select('+passwordHash +loginAttempts +lockUntil');

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check account lock
    if (user.isLocked) {
      const lockRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new AppError(
        `Account temporarily locked due to too many failed attempts. Try again in ${lockRemaining} minutes.`,
        423,
        'ACCOUNT_LOCKED'
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact support.', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Reset login attempts on success
    await user.resetLoginAttempts();

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Store refresh token in Redis
    await redisSet(`refresh:${user._id}`, tokens.refreshToken, REFRESH_TOKEN_TTL);

    logger.info(`Login: userId=${user._id} email=${email}`);

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          organizationId: user.organizationId,
          mfaEnabled: user.mfaEnabled,
        },
        ...tokens,
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Issue new access token from refresh token
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    // Verify JWT signature
    const payload = verifyRefreshToken(token);
    const userId = payload.sub;

    // Validate against stored token
    const storedToken = await redisGet(`refresh:${userId}`);
    if (!storedToken || storedToken !== token) {
      throw new AppError('Refresh token is invalid or has been revoked', 401, 'REFRESH_TOKEN_INVALID');
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401, 'USER_NOT_FOUND');
    }

    // Issue new token pair (token rotation)
    const tokens = generateTokenPair(user);
    await redisSet(`refresh:${userId}`, tokens.refreshToken, REFRESH_TOKEN_TTL);

    return sendSuccess(res, tokens, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 */
async function logout(req, res, next) {
  try {
    const userId = req.user._id.toString();

    // Revoke refresh token
    await redisDel(`refresh:${userId}`);

    // Blacklist access token (get from header)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      // Blacklist for remaining TTL of access token (15 minutes max)
      await redisSet(`blacklist:${token}`, '1', 15 * 60);
    }

    logger.info(`Logout: userId=${userId}`);
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return sendSuccess(res, null, 'If an account exists with that email, a reset link has been sent.');
    }

    // Generate secure reset token
    const resetToken = generateSecureToken(32);
    const hashedToken = hashToken(resetToken);

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_TTL * 1000),
    });

    // Send email (non-blocking)
    EmailService.sendPasswordReset(user, resetToken).catch((err) =>
      logger.error('Failed to send password reset email:', err.message)
    );

    logger.info(`Password reset requested: userId=${user._id}`);

    return sendSuccess(res, null, 'If an account exists with that email, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired', 400, 'INVALID_RESET_TOKEN');
    }

    // Update password
    user.passwordHash = password; // Pre-save hook will hash it
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all active sessions
    await redisDel(`refresh:${user._id}`);

    logger.info(`Password reset completed: userId=${user._id}`);

    return sendSuccess(res, null, 'Password reset successful. Please log in with your new password.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/verify-email
 */
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      throw new AppError('Email verification token is invalid or has expired', 400, 'INVALID_VERIFY_TOKEN');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Mark organization onboarding
    if (user.organizationId) {
      await Organization.findByIdAndUpdate(user.organizationId, { onboardingCompleted: true });
    }

    logger.info(`Email verified: userId=${user._id}`);

    return sendSuccess(res, null, 'Email verified successfully. Your account is now active.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/resend-verification
 */
async function resendVerification(req, res, next) {
  try {
    const user = req.user;

    if (user.emailVerified) {
      throw new AppError('Email is already verified', 400, 'ALREADY_VERIFIED');
    }

    const verificationToken = generateSecureToken(32);
    const hashedToken = hashToken(verificationToken);

    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFY_TTL * 1000),
    });

    await EmailService.sendEmailVerification(user, verificationToken);

    return sendSuccess(res, null, 'Verification email resent. Please check your inbox.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .populate('organizationId', 'name subscriptionTier subscriptionStatus planLimits settings')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return sendSuccess(res, { user }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
};
