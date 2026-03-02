'use strict';

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional message
 * @param {number} statusCode - HTTP status code (default 200)
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (res.req?.id) {
    response.requestId = res.req.id;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource
 * @param {string} message
 */
function sendCreated(res, data, message = 'Resource created successfully') {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send a no-content response (204)
 * @param {Object} res
 */
function sendNoContent(res) {
  return res.status(204).send();
}

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {number} pagination.page - Current page (1-indexed)
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.total - Total items
 * @param {string} message
 */
function sendPaginated(res, data, pagination, message = 'Success') {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const response = {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
    timestamp: new Date().toISOString(),
  };

  if (res.req?.id) {
    response.requestId = res.req.id;
  }

  return res.status(200).json(response);
}

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Machine-readable error code
 * @param {*} details - Optional error details
 */
function sendError(res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }

  if (res.req?.id) {
    response.requestId = res.req.id;
  }

  return res.status(statusCode).json(response);
}

/**
 * Parse query params for pagination
 * @param {Object} query - Express query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Parse sort query parameter
 * @param {string} sortParam - e.g. "createdAt:desc,name:asc"
 * @param {Object} allowedFields - Whitelist of sortable fields
 * @returns {Object} Mongoose sort object
 */
function parseSort(sortParam, allowedFields = {}) {
  if (!sortParam) return { createdAt: -1 };

  const sortObj = {};
  const parts = sortParam.split(',');

  for (const part of parts) {
    const [field, direction] = part.trim().split(':');
    if (allowedFields[field] !== false) {
      sortObj[field] = direction === 'asc' ? 1 : -1;
    }
  }

  return Object.keys(sortObj).length > 0 ? sortObj : { createdAt: -1 };
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  sendError,
  parsePagination,
  parseSort,
};
