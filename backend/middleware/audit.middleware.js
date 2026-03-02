'use strict';

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// Actions that should always be audited
const ALWAYS_AUDIT_PATHS = [
  '/api/v1/auth',
  '/api/v1/billing',
  '/api/v1/hubs',
  '/api/v1/voice-agents',
];

// Methods that modify data
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Extract meaningful action name from route
 */
function getActionName(req) {
  const method = req.method;
  const path = req.route?.path || req.path;

  const methodMap = {
    GET: 'READ',
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };

  const pathParts = req.originalUrl.split('/').filter(Boolean);
  const resource = pathParts[2] || 'unknown'; // e.g., 'conversations', 'hubs'

  return `${methodMap[method] || method}_${resource.toUpperCase().replace(/-/g, '_')}`;
}

/**
 * Get resource ID from request if available
 */
function getResourceId(req) {
  return req.params?.id || req.params?.hubId || req.params?.agentId || req.params?.conversationId || null;
}

/**
 * Sanitize request body for audit log (remove sensitive fields)
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return null;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'mfaSecret', 'cardNumber', 'cvv'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Audit logging middleware factory
 * @param {Object} options
 * @param {boolean} options.onlyWriteOps - Only log POST/PUT/PATCH/DELETE (default: true)
 * @param {boolean} options.logBody - Include request body in audit log (default: false in prod)
 */
function auditLogger(options = {}) {
  const { onlyWriteOps = true, logBody = process.env.NODE_ENV !== 'production' } = options;

  return async (req, res, next) => {
    // Skip health checks and non-write operations if configured
    if (req.path === '/health' || req.path === '/api/v1/health') {
      return next();
    }

    if (onlyWriteOps && !WRITE_METHODS.includes(req.method)) {
      return next();
    }

    // Check if this path should be audited
    const shouldAudit = ALWAYS_AUDIT_PATHS.some((p) => req.originalUrl.startsWith(p));
    if (!shouldAudit && onlyWriteOps) {
      return next();
    }

    // Capture response via hook
    const originalEnd = res.end.bind(res);
    let responseBody = null;
    let statusCode = null;

    res.end = function (chunk, encoding) {
      statusCode = res.statusCode;
      originalEnd(chunk, encoding);

      // Fire-and-forget audit log creation
      setImmediate(async () => {
        try {
          const auditData = {
            userId: req.user?._id || null,
            organizationId: req.user?.organizationId || null,
            action: getActionName(req),
            resource: req.originalUrl.split('?')[0],
            resourceId: getResourceId(req),
            httpMethod: req.method,
            statusCode,
            ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip,
            userAgent: req.headers['user-agent'],
            requestId: req.id,
            success: statusCode >= 200 && statusCode < 400,
          };

          if (logBody && req.body && Object.keys(req.body).length > 0) {
            auditData.requestBody = sanitizeBody(req.body);
          }

          await AuditLog.create(auditData);
        } catch (auditErr) {
          // Audit failure should never affect the response
          logger.error('Failed to create audit log:', auditErr.message);
        }
      });
    };

    next();
  };
}

/**
 * Create an explicit audit log entry (for use in controllers)
 * @param {Object} params
 * @param {Object} params.user - Authenticated user
 * @param {string} params.action - Action name
 * @param {string} params.resource - Resource being acted on
 * @param {string} params.resourceId - Resource ID
 * @param {Object} params.metadata - Additional metadata
 * @param {boolean} params.success
 */
async function createAuditEntry({ user, action, resource, resourceId, metadata = {}, success = true, req = null }) {
  try {
    await AuditLog.create({
      userId: user?._id || null,
      organizationId: user?.organizationId || null,
      action,
      resource,
      resourceId,
      metadata,
      success,
      ipAddress: req ? req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip : null,
      requestId: req?.id || null,
    });
  } catch (err) {
    logger.error('Failed to create audit entry:', err.message);
  }
}

module.exports = { auditLogger, createAuditEntry };
