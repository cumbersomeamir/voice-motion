'use strict';

const mongoose = require('mongoose');
const { hashPassword, comparePassword } = require('../utils/crypto');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never return by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    role: {
      type: String,
      enum: {
        values: ['super_admin', 'org_admin', 'hub_manager', 'viewer'],
        message: 'Role must be one of: super_admin, org_admin, hub_manager, viewer',
      },
      default: 'viewer',
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    hubIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hub',
      },
    ],
    lastLogin: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
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
        delete ret.passwordHash;
        delete ret.mfaSecret;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.refreshTokenHash;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ email: 1, isActive: 1 });

// ─── Pre-save Hooks ───────────────────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  // Only hash password if it was modified
  if (!this.isModified('passwordHash')) return next();

  // If passwordHash looks like a plain text (set via setPassword), hash it
  // Convention: controller should set user.passwordHash = plaintext, then save
  // The pre-save hook will detect it's not a bcrypt hash and hash it
  if (!this.passwordHash.startsWith('$2')) {
    try {
      this.passwordHash = await hashPassword(this.passwordHash);
    } catch (err) {
      return next(err);
    }
  }

  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return comparePassword(candidatePassword, this.passwordHash);
};

/**
 * Increment login failure count and lock if threshold reached
 */
userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

  // If previous lock expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_DURATION };
  }

  return this.updateOne(updates);
};

/**
 * Reset login attempts after successful login
 */
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

// ─── Static Methods ───────────────────────────────────────────────────────────

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.findActiveByOrg = function (organizationId) {
  return this.find({ organizationId, isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
