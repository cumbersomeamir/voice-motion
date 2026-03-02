'use strict';

const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Organization name must be at least 2 characters'],
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
      index: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Please provide a valid GSTIN',
      ],
      sparse: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    // Subscription details
    subscriptionTier: {
      type: String,
      enum: {
        values: ['starter', 'growth', 'enterprise'],
        message: 'Subscription tier must be one of: starter, growth, enterprise',
      },
      default: 'starter',
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'paused'],
      default: 'trialing',
      index: true,
    },
    subscriptionExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    // Razorpay
    razorpayCustomerId: {
      type: String,
      sparse: true,
      select: false,
    },
    razorpaySubscriptionId: {
      type: String,
      sparse: true,
      select: false,
    },
    // Usage metrics
    totalHubs: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalConversations: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAgentMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Plan limits
    planLimits: {
      maxHubs: { type: Number, default: 1 },
      maxUsersPerHub: { type: Number, default: 5 },
      maxAgentMinutesPerMonth: { type: Number, default: 100 },
      maxConversationsPerMonth: { type: Number, default: 500 },
      retentionDays: { type: Number, default: 30 },
      canExportData: { type: Boolean, default: false },
      canUseLLMAnalysis: { type: Boolean, default: false },
    },
    // Settings
    settings: {
      defaultLanguage: {
        type: String,
        enum: ['hi', 'en', 'mr', 'ta', 'te', 'kn', 'gu', 'pa', 'bn', 'ml'],
        default: 'hi',
      },
      retentionDays: {
        type: Number,
        default: 30,
        min: 7,
        max: 365,
      },
      notificationEmails: [
        {
          type: String,
          match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
        },
      ],
      enableAutoFollowUp: {
        type: Boolean,
        default: true,
      },
      sopCheckEnabled: {
        type: Boolean,
        default: false,
      },
      webhookUrl: {
        type: String,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        delete ret.razorpayCustomerId;
        delete ret.razorpaySubscriptionId;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

organizationSchema.virtual('isSubscriptionActive').get(function () {
  return (
    ['active', 'trialing'].includes(this.subscriptionStatus) &&
    this.subscriptionExpiresAt > new Date()
  );
});

organizationSchema.virtual('isTrialing').get(function () {
  return this.subscriptionStatus === 'trialing';
});

organizationSchema.virtual('daysUntilExpiry').get(function () {
  const now = new Date();
  const diff = this.subscriptionExpiresAt - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

organizationSchema.index({ subscriptionStatus: 1, subscriptionExpiresAt: 1 });
organizationSchema.index({ ownerId: 1 });

// ─── Pre-save Hooks ───────────────────────────────────────────────────────────

organizationSchema.pre('save', function (next) {
  // Set plan limits based on tier
  if (this.isModified('subscriptionTier')) {
    const limits = {
      starter: {
        maxHubs: 1,
        maxUsersPerHub: 5,
        maxAgentMinutesPerMonth: 100,
        maxConversationsPerMonth: 500,
        retentionDays: 30,
        canExportData: false,
        canUseLLMAnalysis: false,
      },
      growth: {
        maxHubs: 5,
        maxUsersPerHub: 20,
        maxAgentMinutesPerMonth: 1000,
        maxConversationsPerMonth: 5000,
        retentionDays: 90,
        canExportData: true,
        canUseLLMAnalysis: true,
      },
      enterprise: {
        maxHubs: 999,
        maxUsersPerHub: 999,
        maxAgentMinutesPerMonth: 50000,
        maxConversationsPerMonth: 100000,
        retentionDays: 365,
        canExportData: true,
        canUseLLMAnalysis: true,
      },
    };

    this.planLimits = limits[this.subscriptionTier] || limits.starter;
    if (this.settings) {
      this.settings.retentionDays = this.planLimits.retentionDays;
    }
  }
  next();
});

// ─── Static Methods ───────────────────────────────────────────────────────────

organizationSchema.statics.findActiveSubscriptions = function () {
  return this.find({
    subscriptionStatus: { $in: ['active', 'trialing'] },
    subscriptionExpiresAt: { $gt: new Date() },
  });
};

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
