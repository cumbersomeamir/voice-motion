'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Organization = require('../models/Organization');
const Subscription = require('../models/Subscription');
const EmailService = require('./EmailService');
const { AppError } = require('../middleware/errorHandler.middleware');
const logger = require('../utils/logger');

// Razorpay plan IDs for each tier + billing cycle
// These should be pre-created in your Razorpay dashboard
const PLAN_IDS = {
  starter_monthly: process.env.RAZORPAY_PLAN_STARTER_MONTHLY || 'plan_starter_monthly',
  starter_annual: process.env.RAZORPAY_PLAN_STARTER_ANNUAL || 'plan_starter_annual',
  growth_monthly: process.env.RAZORPAY_PLAN_GROWTH_MONTHLY || 'plan_growth_monthly',
  growth_annual: process.env.RAZORPAY_PLAN_GROWTH_ANNUAL || 'plan_growth_annual',
  enterprise_monthly: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY || 'plan_enterprise_monthly',
  enterprise_annual: process.env.RAZORPAY_PLAN_ENTERPRISE_ANNUAL || 'plan_enterprise_annual',
};

// Pricing in paise (INR)
const PRICING = {
  starter: { monthly: 299900, annual: 299900 * 10 },   // ₹2,999/mo, ₹29,990/yr
  growth: { monthly: 999900, annual: 999900 * 10 },     // ₹9,999/mo, ₹99,990/yr
  enterprise: { monthly: 2999900, annual: 2999900 * 10 }, // ₹29,999/mo, custom annual
};

class PaymentService {
  constructor() {
    this.razorpay = null;
  }

  _getClient() {
    if (!this.razorpay) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        logger.warn('Razorpay keys not configured - payment features unavailable');
        return null;
      }

      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return this.razorpay;
  }

  /**
   * Create or get a Razorpay customer for an organization
   * @param {Object} organization - Organization document
   * @param {Object} user - Primary user (org admin)
   */
  async getOrCreateCustomer(organization, user) {
    const razorpay = this._getClient();
    if (!razorpay) throw new AppError('Payment service unavailable', 503, 'SERVICE_UNAVAILABLE');

    // Return existing customer if we have one
    if (organization.razorpayCustomerId) {
      try {
        const customer = await razorpay.customers.fetch(organization.razorpayCustomerId);
        return customer;
      } catch (err) {
        logger.warn(`Failed to fetch existing Razorpay customer: ${err.message}`);
      }
    }

    // Create new customer
    try {
      const customer = await razorpay.customers.create({
        name: organization.name,
        email: user.email,
        contact: '', // Optional phone
        gstin: organization.gstin,
        notes: {
          organizationId: organization._id.toString(),
          userId: user._id.toString(),
        },
      });

      // Save customer ID
      await Organization.findByIdAndUpdate(organization._id, {
        razorpayCustomerId: customer.id,
      });

      logger.info(`Razorpay customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error(`Failed to create Razorpay customer: ${error.message}`);
      throw new AppError('Failed to create payment customer', 500, 'CUSTOMER_CREATE_FAILED');
    }
  }

  /**
   * Create a subscription
   * @param {Object} params
   * @param {string} params.organizationId
   * @param {string} params.tier - 'starter', 'growth', 'enterprise'
   * @param {string} params.billingCycle - 'monthly', 'annual'
   * @param {Object} params.organization
   * @param {Object} params.user
   */
  async createSubscription(params) {
    const { organizationId, tier, billingCycle = 'monthly', organization, user } = params;
    const razorpay = this._getClient();
    if (!razorpay) throw new AppError('Payment service unavailable', 503, 'SERVICE_UNAVAILABLE');

    const planKey = `${tier}_${billingCycle}`;
    const planId = PLAN_IDS[planKey];
    if (!planId) {
      throw new AppError(`Invalid subscription tier or billing cycle: ${planKey}`, 400, 'INVALID_PLAN');
    }

    const customer = await this.getOrCreateCustomer(organization, user);
    const amountPaise = PRICING[tier]?.[billingCycle];

    try {
      const rzpSubscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: billingCycle === 'annual' ? 1 : 12,
        notes: {
          organizationId: organizationId.toString(),
          tier,
          billingCycle,
        },
      });

      // Save subscription in DB
      const subscription = new Subscription({
        organizationId,
        tier,
        billingCycle,
        amountPaise,
        status: rzpSubscription.status,
        razorpaySubscriptionId: rzpSubscription.id,
        razorpayPlanId: planId,
        razorpayCustomerId: customer.id,
        currentPeriodStart: new Date(rzpSubscription.current_start * 1000),
        currentPeriodEnd: new Date(rzpSubscription.current_end * 1000),
      });

      await subscription.save();

      // Update organization
      await Organization.findByIdAndUpdate(organizationId, {
        razorpaySubscriptionId: rzpSubscription.id,
        subscriptionTier: tier,
        subscriptionStatus: 'pending',
      });

      logger.info(`Subscription created: orgId=${organizationId} tier=${tier} rzpId=${rzpSubscription.id}`);

      return {
        subscription,
        razorpaySubscription: rzpSubscription,
        authorizationLink: rzpSubscription.short_url,
      };
    } catch (error) {
      logger.error(`Subscription creation failed: ${error.message}`);
      throw new AppError('Failed to create subscription', 500, 'SUBSCRIPTION_CREATE_FAILED');
    }
  }

  /**
   * Cancel a subscription
   * @param {string} organizationId
   * @param {string} reason
   */
  async cancelSubscription(organizationId, reason) {
    const razorpay = this._getClient();
    if (!razorpay) throw new AppError('Payment service unavailable', 503, 'SERVICE_UNAVAILABLE');

    const subscription = await Subscription.findOne({
      organizationId,
      status: { $in: ['active', 'authenticated'] },
    });

    if (!subscription) {
      throw new AppError('No active subscription found', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    try {
      await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, false);

      subscription.status = 'cancelled';
      subscription.canceledAt = new Date();
      subscription.cancellationReason = reason;
      await subscription.save();

      await Organization.findByIdAndUpdate(organizationId, {
        subscriptionStatus: 'canceled',
      });

      logger.info(`Subscription cancelled: orgId=${organizationId}`);
      return subscription;
    } catch (error) {
      logger.error(`Subscription cancellation failed: ${error.message}`);
      throw new AppError('Failed to cancel subscription', 500, 'SUBSCRIPTION_CANCEL_FAILED');
    }
  }

  /**
   * Handle Razorpay subscription webhook
   * @param {Object} event - Parsed webhook payload
   */
  async handleWebhookEvent(event) {
    const { event: eventType, payload } = event;

    logger.info(`Razorpay webhook: ${eventType}`);

    switch (eventType) {
      case 'subscription.activated':
        await this._handleSubscriptionActivated(payload.subscription.entity);
        break;

      case 'subscription.charged':
        await this._handleSubscriptionCharged(payload.subscription.entity, payload.payment?.entity);
        break;

      case 'subscription.pending':
      case 'subscription.halted':
        await this._handleSubscriptionIssue(payload.subscription.entity, eventType);
        break;

      case 'subscription.cancelled':
        await this._handleSubscriptionCancelled(payload.subscription.entity);
        break;

      case 'payment.failed':
        await this._handlePaymentFailed(payload.payment?.entity);
        break;

      default:
        logger.debug(`Unhandled Razorpay event: ${eventType}`);
    }
  }

  async _handleSubscriptionActivated(rzpSubscription) {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: rzpSubscription.id,
    });

    if (!subscription) return;

    subscription.status = 'active';
    subscription.currentPeriodStart = new Date(rzpSubscription.current_start * 1000);
    subscription.currentPeriodEnd = new Date(rzpSubscription.current_end * 1000);
    await subscription.save();

    await Organization.findByIdAndUpdate(subscription.organizationId, {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: subscription.currentPeriodEnd,
      subscriptionTier: subscription.tier,
    });

    logger.info(`Subscription activated: ${rzpSubscription.id}`);
  }

  async _handleSubscriptionCharged(rzpSubscription, payment) {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: rzpSubscription.id,
    });

    if (!subscription) return;

    subscription.status = 'active';
    subscription.currentPeriodStart = new Date(rzpSubscription.current_start * 1000);
    subscription.currentPeriodEnd = new Date(rzpSubscription.current_end * 1000);

    if (payment) {
      subscription.invoices.push({
        razorpayPaymentId: payment.id,
        amountPaise: payment.amount,
        status: 'paid',
        paidAt: new Date(payment.created_at * 1000),
      });
    }

    await subscription.save();

    await Organization.findByIdAndUpdate(subscription.organizationId, {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: subscription.currentPeriodEnd,
    });

    // Send renewal confirmation
    const org = await Organization.findById(subscription.organizationId).lean();
    if (org && payment) {
      await EmailService.sendSubscriptionRenewal(org, {
        amountPaise: payment.amount,
        nextBillingDate: subscription.currentPeriodEnd,
      });
    }

    logger.info(`Subscription charged: ${rzpSubscription.id}`);
  }

  async _handleSubscriptionIssue(rzpSubscription, eventType) {
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: rzpSubscription.id,
    });

    if (!subscription) return;

    const newStatus = eventType === 'subscription.halted' ? 'halted' : 'pending';
    subscription.status = newStatus;
    await subscription.save();

    await Organization.findByIdAndUpdate(subscription.organizationId, {
      subscriptionStatus: newStatus === 'halted' ? 'past_due' : 'past_due',
    });

    const org = await Organization.findById(subscription.organizationId).lean();
    if (org) {
      await EmailService.sendPaymentFailureAlert(org, { amountPaise: subscription.amountPaise });
    }
  }

  async _handleSubscriptionCancelled(rzpSubscription) {
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: rzpSubscription.id },
      { status: 'cancelled', canceledAt: new Date() }
    );
  }

  async _handlePaymentFailed(payment) {
    if (!payment) return;
    logger.warn(`Payment failed: paymentId=${payment.id}`);
  }

  /**
   * Verify Razorpay webhook signature
   * @param {string} rawBody
   * @param {string} signature
   */
  verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      logger.warn('RAZORPAY_WEBHOOK_SECRET not configured');
      return process.env.NODE_ENV !== 'production';
    }

    try {
      const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature || ''));
    } catch {
      return false;
    }
  }

  /**
   * Get subscription details for an organization
   */
  async getSubscriptionDetails(organizationId) {
    const subscription = await Subscription.findOne({
      organizationId,
      status: { $in: ['active', 'authenticated', 'pending', 'halted'] },
    }).sort({ createdAt: -1 });

    return subscription;
  }

  /**
   * Get all available plans
   */
  getPlans() {
    return [
      {
        tier: 'starter',
        name: 'Starter',
        description: 'Perfect for small dealerships getting started with voice AI',
        pricing: { monthly: PRICING.starter.monthly / 100, annual: PRICING.starter.annual / 100 },
        currency: 'INR',
        features: ['1 hub', '5 users', '100 agent minutes/month', '500 conversations/month', '30-day retention'],
      },
      {
        tier: 'growth',
        name: 'Growth',
        description: 'For growing dealership networks with multiple locations',
        pricing: { monthly: PRICING.growth.monthly / 100, annual: PRICING.growth.annual / 100 },
        currency: 'INR',
        features: ['5 hubs', '20 users/hub', '1,000 agent minutes/month', '5,000 conversations/month', '90-day retention', 'LLM Analysis', 'Data Export'],
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        description: 'Unlimited scale for large dealership groups',
        pricing: { monthly: PRICING.enterprise.monthly / 100, annual: 'Custom' },
        currency: 'INR',
        features: ['Unlimited hubs', 'Unlimited users', '50,000 agent minutes/month', 'Unlimited conversations', '365-day retention', 'All Growth features', 'Dedicated support', 'Custom integrations'],
      },
    ];
  }
}

module.exports = new PaymentService();
