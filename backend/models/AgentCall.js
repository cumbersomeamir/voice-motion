'use strict';

const mongoose = require('mongoose');

const agentCallSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoiceAgent',
      required: [true, 'Agent ID is required'],
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      index: true,
    },
    // Hashed customer phone (HMAC-SHA256)
    customerPhone: {
      type: String,
      index: true,
    },
    // Encrypted customer phone (AES-256) for display
    customerPhoneEncrypted: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: {
        values: ['queued', 'in_progress', 'completed', 'failed', 'escalated', 'canceled'],
        message: 'Status must be one of: queued, in_progress, completed, failed, escalated, canceled',
      },
      default: 'queued',
      index: true,
    },
    // Duration in seconds
    duration: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Full transcript of the agent call
    transcript: {
      type: String,
      maxlength: 50000,
    },
    // Call outcome / summary
    outcome: {
      type: String,
      enum: ['interested', 'not_interested', 'callback_requested', 'escalated', 'no_answer', 'voicemail', 'unknown'],
      default: 'unknown',
    },
    outcomeDetails: {
      type: String,
      maxlength: 500,
    },
    // Cost in minutes
    costMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // If escalated, reference to new agent call
    escalatedToAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VoiceAgent',
    },
    escalatedAt: {
      type: Date,
    },
    // Scheduling
    scheduledAt: {
      type: Date,
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    // ElevenLabs call SID
    elevenLabsCallId: {
      type: String,
      sparse: true,
      select: false,
    },
    // Retry tracking
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 2,
    },
    // Priority for queue ordering
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    failureReason: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        delete ret.customerPhoneEncrypted;
        delete ret.elevenLabsCallId;
        delete ret.failureReason;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

agentCallSchema.virtual('isCompleted').get(function () {
  return ['completed', 'failed', 'escalated', 'canceled'].includes(this.status);
});

agentCallSchema.virtual('durationFormatted').get(function () {
  if (!this.duration) return '0:00';
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

agentCallSchema.index({ organizationId: 1, status: 1 });
agentCallSchema.index({ organizationId: 1, createdAt: -1 });
agentCallSchema.index({ scheduledAt: 1, status: 1 }); // For job scheduler
agentCallSchema.index({ agentId: 1, createdAt: -1 });

// ─── Static Methods ───────────────────────────────────────────────────────────

agentCallSchema.statics.findPendingCalls = function () {
  return this.find({
    status: 'queued',
    scheduledAt: { $lte: new Date() },
  })
    .sort({ priority: -1, scheduledAt: 1 })
    .limit(50);
};

agentCallSchema.statics.getCallMetrics = async function (organizationId, from, to) {
  return this.aggregate([
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        createdAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        totalCostMinutes: { $sum: '$costMinutes' },
      },
    },
  ]);
};

const AgentCall = mongoose.model('AgentCall', agentCallSchema);

module.exports = AgentCall;
