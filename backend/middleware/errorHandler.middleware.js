'use strict';

const logger = require('../utils/logger');

/**
 * Custom application error class
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code
   * @param {boolean} isOperational - Whether this is an expected operational error
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
function handleCastError(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_ID');
}

/**
 * Handle Mongoose duplicate key error
 */
function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];
  return new AppError(
    `Duplicate value for field '${field}': '${value}'. Please use a different value.`,
    409,
    'DUPLICATE_KEY'
  );
}

/**
 * Handle Mongoose validation errors
 */
function handleValidationError(err) {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  const message = `Validation failed: ${errors.map((e) => e.message).join('. ')}`;
  const appErr = new AppError(message, 422, 'VALIDATION_ERROR');
  appErr.errors = errors;
  return appErr;
}

/**
 * Handle JWT errors
 */
function handleJWTError() {
  return new AppError('Invalid token. Please log in again.', 401, 'TOKEN_INVALID');
}

function handleJWTExpiredError() {
  return new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
}

/**
 * Send error response in development (detailed)
 */
function sendDevError(err, req, res) {
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode,
  });

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    code: err.code || 'INTERNAL_ERROR',
    stack: err.stack,
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
}

/**
 * Send error response in production (sanitized)
 */
function sendProdError(err, req, res) {
  if (err.isOperational) {
    // Known, safe error
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors || undefined,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }

  // Unknown/programmer error - don't leak details
  logger.error('UNEXPECTED ERROR:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    requestId: req.id,
  });

  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
}

/**
 * Global error handling middleware
 * Must be registered as last middleware with 4 parameters
 */
function errorHandler(err, req, res, _next) {
  let error = err;

  // Ensure statusCode is set
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  // Transform known error types
  if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (err.type === 'entity.parse.failed') {
    error = new AppError('Invalid JSON in request body', 400, 'INVALID_JSON');
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File size exceeds the allowed limit', 413, 'FILE_TOO_LARGE');
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    error = new AppError(`Validation failed: ${errors[0]?.message}`, 422, 'VALIDATION_ERROR');
    error.errors = errors;
    error.isOperational = true;
  }

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return sendDevError(error, req, res);
  }

  return sendProdError(error, req, res);
}

module.exports = { AppError, errorHandler };
