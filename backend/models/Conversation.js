'use strict';

const mongoose = require('mongoose');

const objectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['price', 'competitor', 'timing', 'features', 'financing', 'trust', 'other'],
      required: true,
    },
    timestamp: {
      type: Number, // seconds from start of recording
      min: 0,
    },
    text: {
      type: String,
      maxlength: 1000,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolutionText: {
      type: String,
      maxlength: 500,
    },
  },
  { _id: false }
);

const sentimentTimelineSchema = new mongoose.Schema(
  {
    timestamp: { type: Number, min: 0 },
    score: { type: Number, min: -1, max: 1 },
    label: { type: String, enum: ['positive', 'neutral', 'negative'] },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      required: [true, 'Hub ID is required'],
      index: true,
    },
    salesPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Customer phone hashed (HMAC-SHA256) for lookup without revealing PII
    customerPhone: {
      type: String,
      index: true,
    },
    // Encrypted phone for display (AES-256)
    customerPhoneEncrypted: {
      type: String,
      select: false,
    },
    customerLanguage: {
      type: String,
      enum: ['hi', 'en', 'mr', 'ta', 'te', 'kn', 'gu', 'pa', 'bn', 'ml'],
      default: 'hi',
    },
    // Duration in seconds
    duration: {
      type: Number,
      min: 0,
      default: 0,
    },
    // AES-256 encrypted S3 URL
    recordingUrl: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: {
        values: ['processing', 'analyzed', 'failed'],
        message: 'Status must be one of: processing, analyzed, failed',
      },
      default: 'processing',
      index: true,
    },
    // Sentiment analysis
    sentiment: {
      overall: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        default: null,
      },
      score: {
        type: Number,
        min: -1,
        max: 1,
        default: null,
      },
      timeline: [sentimentTimelineSchema],
    },
    // Detected objections
    objections: [objectionSchema],
    // SOP compliance score (0-100)
    sopScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // AI-generated summary
    summary: {
      type: String,
      maxlength: 2000,
    },
    // Intent signals
    intentSignals: {
      purchaseIntent: { type: Number, min: 0, max: 1, default: null },
      testDriveInterest: { type: Boolean, default: false },
      financingInterest: { type: Boolean, default: false },
      competitorMentioned: [String],
      carModelsDiscussed: [String],
    },
    // SOP checklist compliance
    sopChecklist: [
      {
        item: String,
        passed: Boolean,
        _id: false,
      },
    ],
    followUpTriggered: {
      type: Boolean,
      default: false,
    },
    followUpAt: {
      type: Date,
      default: null,
    },
    // Reference to the outbound agent call
    agentCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgentCall',
    },
    // Reference to transcript
    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transcript',
    },
    // Raw metadata
    metadata: {
      carSku: { type: String, trim: true },
      testDriveId: { type: String, trim: true },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fileSize: { type: Number },
      fileFormat: { type: String },
    },
    // ElevenLabs job tracking
    elevenLabsJobId: {
      type: String,
      sparse: true,
      select: false,
    },
    processingError: {
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
        delete ret.recordingUrl;
        delete ret.customerPhoneEncrypted;
        delete ret.elevenLabsJobId;
        delete ret.processingError;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

conversationSchema.virtual('durationFormatted').get(function () {
  if (!this.duration) return '0:00';
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

conversationSchema.virtual('hasObjections').get(function () {
  return this.objections && this.objections.length > 0;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

conversationSchema.index({ organizationId: 1, createdAt: -1 });
conversationSchema.index({ hubId: 1, createdAt: -1 });
conversationSchema.index({ organizationId: 1, hubId: 1, status: 1 });
conversationSchema.index({ organizationId: 1, status: 1 });
conversationSchema.index({ salesPersonId: 1, createdAt: -1 });
conversationSchema.index({ customerPhone: 1, organizationId: 1 });
conversationSchema.index({ createdAt: -1 }); // For global queries

// TTL index to auto-delete conversations after retention period
// Note: actual retention is handled by a scheduled job, not MongoDB TTL
// since TTL is per-org configurable

// ─── Static Methods ───────────────────────────────────────────────────────────

conversationSchema.statics.findByOrganization = function (organizationId, options = {}) {
  const query = { organizationId };
  if (options.hubId) query.hubId = options.hubId;
  if (options.status) query.status = options.status;
  if (options.from) query.createdAt = { $gte: options.from };
  if (options.to) {
    query.createdAt = { ...query.createdAt, $lte: options.to };
  }
  return this.find(query);
};

conversationSchema.statics.getDailyCount = async function (organizationId, hubId, date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const matchQuery = { organizationId, createdAt: { $gte: start, $lte: end } };
  if (hubId) matchQuery.hubId = hubId;

  return this.countDocuments(matchQuery);
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
