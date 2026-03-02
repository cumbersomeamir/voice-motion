'use strict';

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    // Action performed (e.g., CREATE_CONVERSATION, UPDATE_HUB, DELETE_USER)
    action: {
      type: String,
      required: [true, 'Action is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    // Resource type (URL path)
    resource: {
      type: String,
      trim: true,
    },
    // Resource ID being acted on
    resourceId: {
      type: String,
      index: true,
    },
    // HTTP details
    httpMethod: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
    statusCode: {
      type: Number,
    },
    // Network
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Request correlation
    requestId: {
      type: String,
    },
    // Sanitized request body (sensitive fields redacted)
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Was the action successful?
    success: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Failure reason if applicable
    failureReason: {
      type: String,
      maxlength: 1000,
    },
    // Additional structured metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // No updatedAt needed for audit logs
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: false,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, action: 1, createdAt: -1 });

// TTL index: auto-delete audit logs after 90 days
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 days
);

// ─── Static Methods ───────────────────────────────────────────────────────────

auditLogSchema.statics.findByOrganization = function (organizationId, options = {}) {
  const query = { organizationId };
  if (options.userId) query.userId = options.userId;
  if (options.action) query.action = options.action;
  if (options.from) query.createdAt = { $gte: options.from };
  if (options.to) {
    query.createdAt = { ...query.createdAt, $lte: options.to };
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'firstName lastName email')
    .limit(options.limit || 100);
};

auditLogSchema.statics.logAction = async function (data) {
  try {
    return await this.create(data);
  } catch (err) {
    // Audit log failures should not crash the app
    console.error('AuditLog.logAction failed:', err.message);
    return null;
  }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
