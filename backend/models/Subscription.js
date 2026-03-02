'use strict';

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    // Plan details
    tier: {
      type: String,
      enum: ['starter', 'growth', 'enterprise'],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly',
    },
    // Pricing (in INR paise, like Razorpay)
    amountPaise: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // Status
    status: {
      type: String,
      enum: ['created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'],
      default: 'created',
      index: true,
    },
    // Razorpay references
    razorpaySubscriptionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpayPlanId: {
      type: String,
    },
    razorpayCustomerId: {
      type: String,
    },
    // Billing period
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
      index: true,
    },
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    canceledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      maxlength: 500,
    },
    // Invoices / payment history
    invoices: [
      {
        razorpayPaymentId: String,
        razorpayInvoiceId: String,
        amountPaise: Number,
        status: {
          type: String,
          enum: ['pending', 'paid', 'failed', 'refunded'],
        },
        paidAt: Date,
        invoiceUrl: String,
        createdAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    // Usage for current period
    usageThisPeriod: {
      conversations: { type: Number, default: 0 },
      agentMinutes: { type: Number, default: 0 },
      hubs: { type: Number, default: 0 },
    },
    // Metadata from Razorpay
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

subscriptionSchema.virtual('isActive').get(function () {
  return ['active', 'authenticated'].includes(this.status);
});

subscriptionSchema.virtual('amountRupees').get(function () {
  return this.amountPaise ? this.amountPaise / 100 : 0;
});

subscriptionSchema.virtual('isInTrial').get(function () {
  if (!this.trialEnd) return false;
  return new Date() < this.trialEnd;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

subscriptionSchema.index({ organizationId: 1, status: 1 });
subscriptionSchema.index({ razorpaySubscriptionId: 1 }, { sparse: true });
subscriptionSchema.index({ currentPeriodEnd: 1, status: 1 }); // For renewal jobs

// ─── Static Methods ───────────────────────────────────────────────────────────

subscriptionSchema.statics.findActiveForOrg = function (organizationId) {
  return this.findOne({
    organizationId,
    status: { $in: ['active', 'authenticated'] },
  });
};

subscriptionSchema.statics.findExpiringSoon = function (days = 3) {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.find({
    status: 'active',
    currentPeriodEnd: { $lte: cutoff, $gte: new Date() },
  }).populate('organizationId', 'name settings.notificationEmails');
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
