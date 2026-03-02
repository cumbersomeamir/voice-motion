'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler.middleware');
const logger = require('./logger');

const JWT_SECRET = () => process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = () => process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = () => process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Sign an access token
 * @param {Object} payload - Data to embed in the token
 * @returns {string} Signed JWT
 */
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET(), {
    expiresIn: JWT_EXPIRES_IN(),
    issuer: 'voicemotion.ai',
    audience: 'voicemotion-api',
  });
}

/**
 * Sign a refresh token
 * @param {Object} payload - Minimal payload (userId only recommended)
 * @returns {string} Signed refresh JWT
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET(), {
    expiresIn: JWT_REFRESH_EXPIRES_IN(),
    issuer: 'voicemotion.ai',
    audience: 'voicemotion-refresh',
  });
}

/**
 * Verify an access token
 * @param {string} token
 * @returns {Object} Decoded payload
 * @throws {AppError} 401 if invalid or expired
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET(), {
      issuer: 'voicemotion.ai',
      audience: 'voicemotion-api',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access token has expired', 401, 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid access token', 401, 'TOKEN_INVALID');
    }
    logger.error('JWT verification error:', error);
    throw new AppError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
  }
}

/**
 * Verify a refresh token
 * @param {string} token
 * @returns {Object} Decoded payload
 * @throws {AppError} 401 if invalid or expired
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET(), {
      issuer: 'voicemotion.ai',
      audience: 'voicemotion-refresh',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token has expired, please login again', 401, 'REFRESH_TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid refresh token', 401, 'REFRESH_TOKEN_INVALID');
    }
    logger.error('Refresh token verification error:', error);
    throw new AppError('Refresh token verification failed', 401, 'REFRESH_TOKEN_VERIFICATION_FAILED');
  }
}

/**
 * Decode token without verification (use for logging only)
 * @param {string} token
 * @returns {Object|null}
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

/**
 * Build standard access token payload from a User document
 * @param {Object} user - Mongoose User document
 * @returns {Object} Token payload
 */
function buildTokenPayload(user) {
  return {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: user.organizationId?.toString() || null,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Generate both access and refresh tokens for a user
 * @param {Object} user - Mongoose User document
 * @returns {{ accessToken: string, refreshToken: string, expiresIn: string }}
 */
function generateTokenPair(user) {
  const payload = buildTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user._id.toString() });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN(),
    tokenType: 'Bearer',
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  buildTokenPayload,
  generateTokenPair,
};
