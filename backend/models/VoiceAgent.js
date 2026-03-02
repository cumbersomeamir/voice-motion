'use strict';

const mongoose = require('mongoose');

const voiceAgentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
      minlength: [2, 'Agent name must be at least 2 characters'],
      maxlength: [100, 'Agent name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['followup', 'inbound', 'financing', 'reengagement'],
        message: 'Agent type must be one of: followup, inbound, financing, reengagement',
      },
      required: [true, 'Agent type is required'],
      index: true,
    },
    // ElevenLabs agent ID (created via Conversational AI API)
    elevenLabsAgentId: {
      type: String,
      sparse: true,
    },
    // ElevenLabs voice ID
    voiceId: {
      type: String,
      required: [true, 'Voice ID is required'],
    },
    // System prompt for the AI agent
    systemPrompt: {
      type: String,
      required: [true, 'System prompt is required'],
      minlength: [10, 'System prompt must be at least 10 characters'],
      maxlength: [5000, 'System prompt cannot exceed 5000 characters'],
    },
    // Additional prompt context
    firstMessage: {
      type: String,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['hi', 'en', 'mr', 'ta', 'te', 'kn', 'gu', 'pa', 'bn', 'ml'],
      default: 'hi',
    },
    fallbackLanguage: {
      type: String,
      enum: ['hi', 'en'],
      default: 'en',
    },
    // Agent configuration
    config: {
      maxCallDuration: { type: Number, default: 300 }, // seconds
      silenceTimeout: { type: Number, default: 10 }, // seconds
      maxRetries: { type: Number, default: 2 },
      enableTranscription: { type: Boolean, default: true },
      callbackOnEscalation: { type: Boolean, default: true },
      escalationPhone: { type: String },
    },
    // Performance statistics
    stats: {
      callsTotal: { type: Number, default: 0, min: 0 },
      callsSuccess: { type: Number, default: 0, min: 0 },
      callsFailed: { type: Number, default: 0, min: 0 },
      callsEscalated: { type: Number, default: 0, min: 0 },
      avgDuration: { type: Number, default: 0, min: 0 }, // seconds
      costMinutes: { type: Number, default: 0, min: 0 },
      lastCallAt: { type: Date, default: null },
    },
    // ElevenLabs sync metadata
    syncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

voiceAgentSchema.virtual('successRate').get(function () {
  if (!this.stats.callsTotal || this.stats.callsTotal === 0) return 0;
  return Math.round((this.stats.callsSuccess / this.stats.callsTotal) * 100);
});

voiceAgentSchema.virtual('isSyncedWithElevenLabs').get(function () {
  return !!this.elevenLabsAgentId;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

voiceAgentSchema.index({ organizationId: 1, type: 1 });
voiceAgentSchema.index({ organizationId: 1, isActive: 1 });
voiceAgentSchema.index({ elevenLabsAgentId: 1 }, { sparse: true });

// ─── Static Methods ───────────────────────────────────────────────────────────

voiceAgentSchema.statics.findActiveByOrg = function (organizationId, type = null) {
  const query = { organizationId, isActive: true };
  if (type) query.type = type;
  return this.find(query);
};

voiceAgentSchema.statics.findByElevenLabsId = function (elevenLabsAgentId) {
  return this.findOne({ elevenLabsAgentId });
};

const VoiceAgent = mongoose.model('VoiceAgent', voiceAgentSchema);

module.exports = VoiceAgent;
