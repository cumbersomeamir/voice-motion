'use strict';

const { Resend } = require('resend');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.client = null;
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@voicemotion.ai';
    this.supportAddress = process.env.EMAIL_SUPPORT || 'support@voicemotion.ai';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  _getClient() {
    if (!this.client) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        logger.warn('RESEND_API_KEY not set - emails will be logged but not sent');
        return null;
      }
      this.client = new Resend(apiKey);
    }
    return this.client;
  }

  /**
   * Send an email
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML email body
   * @param {string} options.text - Plain text fallback
   * @returns {Promise<Object>}
   */
  async send({ to, subject, html, text, from }) {
    const client = this._getClient();

    const emailData = {
      from: from || this.fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || this._htmlToText(html),
    };

    if (!client) {
      // Dev mode: just log the email
      logger.info(`[EMAIL - DEV MODE] To: ${emailData.to} | Subject: ${subject}`);
      return { id: 'dev-mode', message: 'Email logged (not sent - no API key)' };
    }

    try {
      const result = await client.emails.send(emailData);
      logger.info(`Email sent: to=${emailData.to} subject="${subject}" id=${result.data?.id}`);
      return result.data;
    } catch (error) {
      logger.error(`Email send failed: ${error.message}`, { to, subject });
      throw error;
    }
  }

  /**
   * Send email verification email
   * @param {Object} user - User document
   * @param {string} token - Verification token
   */
  async sendEmailVerification(user, token) {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verify Your Email - VoiceMotion AI</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">VoiceMotion AI</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Voice Intelligence for Car Dealerships</p>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937;">Verify Your Email Address</h2>
    <p style="color: #4b5563;">Hi ${user.firstName},</p>
    <p style="color: #4b5563;">Welcome to VoiceMotion AI! Please verify your email address to activate your account.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you did not create an account, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      VoiceMotion AI | <a href="${this.frontendUrl}" style="color: #4f46e5;">voicemotion.ai</a>
    </p>
  </div>
</body>
</html>`;

    return this.send({
      to: user.email,
      subject: 'Verify your email - VoiceMotion AI',
      html,
    });
  }

  /**
   * Send password reset email
   * @param {Object} user
   * @param {string} token - Reset token
   */
  async sendPasswordReset(user, token) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset Password - VoiceMotion AI</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">VoiceMotion AI</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937;">Reset Your Password</h2>
    <p style="color: #4b5563;">Hi ${user.firstName},</p>
    <p style="color: #4b5563;">We received a request to reset your VoiceMotion AI password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Reset Password
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link expires in <strong>1 hour</strong>. If you didn't request a reset, ignore this email - your account is secure.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">VoiceMotion AI</p>
  </div>
</body>
</html>`;

    return this.send({
      to: user.email,
      subject: 'Reset your password - VoiceMotion AI',
      html,
    });
  }

  /**
   * Send welcome email after successful registration
   * @param {Object} user
   * @param {Object} organization
   */
  async sendWelcomeEmail(user, organization) {
    const dashboardUrl = `${this.frontendUrl}/dashboard`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to VoiceMotion AI</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to VoiceMotion AI!</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937;">You're in, ${user.firstName}!</h2>
    <p style="color: #4b5563;">Your account for <strong>${organization.name}</strong> has been created. You have a 14-day free trial to explore all features.</p>
    <h3 style="color: #1f2937;">Get started:</h3>
    <ul style="color: #4b5563;">
      <li>Set up your first dealership hub</li>
      <li>Configure your voice AI agents</li>
      <li>Upload sales call recordings for analysis</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Need help? Reply to this email or contact us at <a href="mailto:${this.supportAddress}">${this.supportAddress}</a></p>
  </div>
</body>
</html>`;

    return this.send({
      to: user.email,
      subject: `Welcome to VoiceMotion AI, ${user.firstName}!`,
      html,
    });
  }

  /**
   * Send subscription payment failure alert
   * @param {Object} organization
   * @param {Object} invoice
   */
  async sendPaymentFailureAlert(organization, invoice) {
    const emails = organization.settings?.notificationEmails || [];
    if (emails.length === 0) return;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #dc2626;">Payment Failed - Action Required</h2>
  <p>Hi,</p>
  <p>We were unable to process the payment for <strong>${organization.name}</strong>'s VoiceMotion AI subscription.</p>
  <p><strong>Amount:</strong> ₹${(invoice.amountPaise / 100).toLocaleString('en-IN')}</p>
  <p>Please update your payment method to avoid service interruption.</p>
  <div style="text-align: center; margin: 20px 0;">
    <a href="${this.frontendUrl}/billing" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
      Update Payment Method
    </a>
  </div>
</body>
</html>`;

    return this.send({
      to: emails,
      subject: `[ACTION REQUIRED] Payment failed - ${organization.name}`,
      html,
    });
  }

  /**
   * Send subscription renewal confirmation
   */
  async sendSubscriptionRenewal(organization, invoice) {
    const emails = organization.settings?.notificationEmails || [];
    if (emails.length === 0) return;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #16a34a;">Subscription Renewed</h2>
  <p>Your VoiceMotion AI subscription for <strong>${organization.name}</strong> has been renewed successfully.</p>
  <p><strong>Amount charged:</strong> ₹${(invoice.amountPaise / 100).toLocaleString('en-IN')}</p>
  <p><strong>Next renewal:</strong> ${new Date(invoice.nextBillingDate).toLocaleDateString('en-IN')}</p>
</body>
</html>`;

    return this.send({
      to: emails,
      subject: `Subscription renewed - ${organization.name}`,
      html,
    });
  }

  /**
   * Notification to hub manager when conversation flagged for review
   */
  async sendConversationAlert(manager, conversation, hub) {
    if (!manager?.email) return;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #d97706;">Conversation Review Required</h2>
  <p>Hi ${manager.firstName},</p>
  <p>A sales conversation at <strong>${hub.name}</strong> requires your attention:</p>
  <ul>
    <li><strong>SOP Score:</strong> ${conversation.sopScore ?? 'N/A'}/100</li>
    <li><strong>Sentiment:</strong> ${conversation.sentiment?.overall || 'Unknown'}</li>
    <li><strong>Objections:</strong> ${conversation.objections?.length || 0} detected</li>
  </ul>
  <div style="text-align: center; margin: 20px 0;">
    <a href="${this.frontendUrl}/conversations/${conversation._id}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
      View Conversation
    </a>
  </div>
</body>
</html>`;

    return this.send({
      to: manager.email,
      subject: `Low SOP score alert - ${hub.name}`,
      html,
    });
  }

  _htmlToText(html) {
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = new EmailService();
