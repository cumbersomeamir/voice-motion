'use strict';

const mongoose = require('mongoose');

const hubSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Hub name is required'],
      trim: true,
      minlength: [2, 'Hub name must be at least 2 characters'],
      maxlength: [100, 'Hub name cannot exceed 100 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
      index: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    agentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Daily/aggregate stats (updated by analytics aggregator)
    stats: {
      conversationsToday: {
        type: Number,
        default: 0,
        min: 0,
      },
      conversationsThisMonth: {
        type: Number,
        default: 0,
        min: 0,
      },
      conversionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      avgSentiment: {
        type: Number,
        default: 0,
        min: -1,
        max: 1,
      },
      avgSopScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      totalConversations: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
    },
    location: {
      lat: {
        type: Number,
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    // Hub-specific settings
    settings: {
      defaultLanguage: {
        type: String,
        enum: ['hi', 'en', 'mr', 'ta', 'te', 'kn', 'gu', 'pa', 'bn', 'ml'],
        default: 'hi',
      },
      enableAutoFollowUp: {
        type: Boolean,
        default: true,
      },
      followUpAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VoiceAgent',
      },
      workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '19:00' },
        timezone: { type: String, default: 'Asia/Kolkata' },
      },
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

hubSchema.virtual('hasLocation').get(function () {
  return !!(this.location?.lat && this.location?.lng);
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

hubSchema.index({ organizationId: 1, isActive: 1 });
hubSchema.index({ organizationId: 1, city: 1 });
hubSchema.index({ organizationId: 1, state: 1 });

// Compound unique: org cannot have two hubs with same name
hubSchema.index({ organizationId: 1, name: 1 }, { unique: true });

// ─── Static Methods ───────────────────────────────────────────────────────────

hubSchema.statics.findByOrganization = function (organizationId, activeOnly = true) {
  const query = { organizationId };
  if (activeOnly) query.isActive = true;
  return this.find(query).populate('managerId', 'firstName lastName email');
};

hubSchema.statics.getHubStats = async function (hubId) {
  const hub = await this.findById(hubId).lean();
  if (!hub) return null;
  return hub.stats;
};

const Hub = mongoose.model('Hub', hubSchema);

module.exports = Hub;
