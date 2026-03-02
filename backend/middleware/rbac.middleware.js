'use strict';

const { AppError } = require('./errorHandler.middleware');

// Role hierarchy - higher index = more permissions
const ROLES = {
  viewer: 0,
  hub_manager: 1,
  org_admin: 2,
  super_admin: 3,
};

/**
 * Middleware factory: require one of the specified roles
 * @param {...string} allowedRoles - Roles permitted to access this route
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`,
          403,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
}

/**
 * Middleware factory: require at minimum the specified role level
 * @param {string} minimumRole - Minimum role in hierarchy
 * @returns {Function} Express middleware
 */
function requireMinRole(minimumRole) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const userLevel = ROLES[req.user.role] ?? -1;
    const requiredLevel = ROLES[minimumRole] ?? 999;

    if (userLevel < requiredLevel) {
      return next(
        new AppError(
          `Access denied. Minimum role required: ${minimumRole}. Your role: ${req.user.role}`,
          403,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
}

/**
 * Middleware: require super_admin role
 */
const requireSuperAdmin = requireRole('super_admin');

/**
 * Middleware: require org_admin or super_admin
 */
const requireOrgAdmin = requireRole('org_admin', 'super_admin');

/**
 * Middleware: require hub_manager, org_admin, or super_admin
 */
const requireHubManager = requireRole('hub_manager', 'org_admin', 'super_admin');

/**
 * Middleware: ensure the authenticated user belongs to the organization
 * referenced in the request params or body. Super admins bypass this.
 */
function requireSameOrganization(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  }

  // Super admins can access any org's data
  if (req.user.role === 'super_admin') {
    return next();
  }

  const targetOrgId =
    req.params.organizationId ||
    req.body?.organizationId ||
    req.query?.organizationId ||
    req.headers['x-organization-id'];

  if (!targetOrgId) {
    return next();
  }

  const userOrgId = req.user.organizationId?.toString();

  if (!userOrgId || userOrgId !== targetOrgId.toString()) {
    return next(new AppError('Access denied. You do not have access to this organization.', 403, 'ORG_ACCESS_DENIED'));
  }

  next();
}

/**
 * Middleware: ensure hub_manager can only access their assigned hubs
 * org_admin and super_admin bypass this check
 */
function requireHubAccess(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  }

  // Higher roles bypass hub restriction
  if (req.user.role === 'super_admin' || req.user.role === 'org_admin') {
    return next();
  }

  const targetHubId = req.params.hubId || req.body?.hubId;

  if (!targetHubId) {
    return next();
  }

  const userHubIds = (req.user.hubIds || []).map((id) => id.toString());

  if (!userHubIds.includes(targetHubId.toString())) {
    return next(new AppError('Access denied. You do not have access to this hub.', 403, 'HUB_ACCESS_DENIED'));
  }

  next();
}

/**
 * Check if user has at least the specified role (non-middleware helper)
 * @param {Object} user - User document
 * @param {string} requiredRole
 * @returns {boolean}
 */
function hasRole(user, requiredRole) {
  if (!user) return false;
  const userLevel = ROLES[user.role] ?? -1;
  const requiredLevel = ROLES[requiredRole] ?? 999;
  return userLevel >= requiredLevel;
}

module.exports = {
  ROLES,
  requireRole,
  requireMinRole,
  requireSuperAdmin,
  requireOrgAdmin,
  requireHubManager,
  requireSameOrganization,
  requireHubAccess,
  hasRole,
};
