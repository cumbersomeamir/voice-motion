'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler.middleware');
const User = require('../models/User');
const { redisGet } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Extract Bearer token from Authorization header
 * @param {Object} req
 * @returns {string|null}
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

/**
 * Core JWT authentication middleware
 * Attaches req.user (full user document) and req.tokenPayload (JWT payload)
 */
async function authenticate(req, _res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError('Authentication required. Please provide a Bearer token.', 401, 'AUTH_REQUIRED');
    }

    // Verify JWT signature and expiry
    const payload = verifyAccessToken(token);

    // Check if token has been revoked (stored in Redis blacklist)
    const blacklistKey = `blacklist:${token}`;
    const isBlacklisted = await redisGet(blacklistKey);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked. Please log in again.', 401, 'TOKEN_REVOKED');
    }

    // Fetch fresh user from database
    const user = await User.findById(payload.sub).select('-passwordHash -mfaSecret').lean();

    if (!user) {
      throw new AppError('User associated with this token no longer exists.', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Attach to request
    req.user = user;
    req.tokenPayload = payload;
    req.organizationId = user.organizationId?.toString();

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware - does not fail if no token provided
 * Useful for public endpoints that optionally benefit from auth context
 */
async function optionalAuthenticate(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash -mfaSecret').lean();
    if (user && user.isActive) {
      req.user = user;
      req.tokenPayload = payload;
      req.organizationId = user.organizationId?.toString();
    }
  } catch (err) {
    // Silently ignore auth errors for optional routes
    logger.debug('Optional auth failed (non-fatal):', err.message);
  }

  next();
}

/**
 * Middleware that ensures email is verified before proceeding
 */
function requireEmailVerified(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  }
  if (!req.user.emailVerified) {
    return next(
      new AppError('Please verify your email address before performing this action.', 403, 'EMAIL_NOT_VERIFIED')
    );
  }
  next();
}

/**
 * Middleware that ensures MFA is verified (if enabled)
 * Typically checked at login and stored in token claim
 */
function requireMfaVerified(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  }

  if (req.user.mfaEnabled && !req.tokenPayload?.mfaVerified) {
    return next(
      new AppError('MFA verification required. Please complete two-factor authentication.', 403, 'MFA_REQUIRED')
    );
  }

  next();
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireEmailVerified,
  requireMfaVerified,
  extractBearerToken,
};
