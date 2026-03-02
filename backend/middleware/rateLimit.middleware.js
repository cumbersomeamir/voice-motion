'use strict';

const rateLimit = require('express-rate-limit');
const { redisGet, redisIncr, redisDel } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Standard rate limit response
 */
function rateLimitHandler(req, res) {
  logger.warn(`Rate limit exceeded: IP=${req.ip} path=${req.path}`);
  return res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: res.getHeader('Retry-After'),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global rate limiter: 100 requests per 15 minutes per IP
 */
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/v1/health';
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind a proxy
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  },
});

/**
 * Strict rate limiter for auth endpoints: 10 requests per 15 minutes per IP
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    return `auth:${ip}`;
  },
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Forgot password rate limiter: 5 requests per hour per IP
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    return `forgot-password:${ip}`;
  },
});

/**
 * Webhook rate limiter: permissive since webhooks come from trusted services
 * 1000 requests per 15 minutes per IP
 */
const webhookRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * API rate limiter per organization: 1000 requests per 15 minutes
 * Uses Redis for distributed rate limiting across instances
 */
async function orgRateLimiter(req, res, next) {
  const orgId = req.organizationId || req.user?.organizationId?.toString();

  if (!orgId) {
    return next();
  }

  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 1000;
  const windowKey = Math.floor(Date.now() / windowMs);
  const key = `org-rate:${orgId}:${windowKey}`;

  try {
    const count = await redisIncr(key, Math.ceil(windowMs / 1000));

    if (count !== null) {
      res.setHeader('X-OrgRateLimit-Limit', maxRequests);
      res.setHeader('X-OrgRateLimit-Remaining', Math.max(0, maxRequests - count));

      if (count > maxRequests) {
        logger.warn(`Org rate limit exceeded: orgId=${orgId}`);
        return res.status(429).json({
          success: false,
          message: 'Organization API rate limit exceeded. Please try again later.',
          code: 'ORG_RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    // Non-fatal - continue without org rate limiting if Redis fails
    logger.error('Org rate limiter error:', err.message);
  }

  next();
}

/**
 * Agent call rate limiter: max 60 outbound calls per hour per org
 */
async function agentCallRateLimiter(req, res, next) {
  const orgId = req.organizationId || req.user?.organizationId?.toString();

  if (!orgId) {
    return next();
  }

  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxCalls = 60;
  const windowKey = Math.floor(Date.now() / windowMs);
  const key = `agent-calls:${orgId}:${windowKey}`;

  try {
    const count = await redisIncr(key, Math.ceil(windowMs / 1000));

    if (count !== null && count > maxCalls) {
      return res.status(429).json({
        success: false,
        message: 'Hourly agent call limit exceeded. Upgrade your plan or try again later.',
        code: 'AGENT_CALL_RATE_LIMIT_EXCEEDED',
        limit: maxCalls,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    logger.error('Agent call rate limiter error:', err.message);
  }

  next();
}

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  forgotPasswordLimiter,
  webhookRateLimiter,
  orgRateLimiter,
  agentCallRateLimiter,
};
