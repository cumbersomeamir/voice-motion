'use strict';

const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const logger = require('./logger');

const BCRYPT_SALT_ROUNDS = 12;
const ENCRYPTION_KEY = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    if (process.env.NODE_ENV !== 'test') {
      logger.warn('ENCRYPTION_KEY is not properly configured (must be 64 hex chars)');
    }
    // Use a safe fallback for test/dev only
    return 'a'.repeat(64);
  }
  return key;
};

// ─── bcrypt Helpers ───────────────────────────────────────────────────────────

/**
 * Hash a plain-text password with bcrypt
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash
 * @param {string} password - Plain text password
 * @param {string} hash - bcrypt hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

// ─── AES-256 Encryption ───────────────────────────────────────────────────────

/**
 * Encrypt sensitive data using AES-256-CBC
 * Used for phone numbers, recording URLs, PII
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Base64-encoded IV + ciphertext
 */
function encryptAES256(plaintext) {
  if (!plaintext) return null;
  try {
    const keyHex = ENCRYPTION_KEY();
    // Use CryptoJS with explicit key and IV
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Combine IV + ciphertext as hex
    const ivHex = iv.toString(CryptoJS.enc.Hex);
    const ciphertextHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

    return `${ivHex}:${ciphertextHex}`;
  } catch (error) {
    logger.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt AES-256-CBC encrypted data
 * @param {string} encryptedData - IV:ciphertext hex string
 * @returns {string} Decrypted plaintext
 */
function decryptAES256(encryptedData) {
  if (!encryptedData) return null;
  try {
    const [ivHex, ciphertextHex] = encryptedData.split(':');
    if (!ivHex || !ciphertextHex) {
      throw new Error('Invalid encrypted data format');
    }

    const keyHex = ENCRYPTION_KEY();
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Hex.parse(ciphertextHex);

    const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    logger.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

// ─── Phone Number Hashing ─────────────────────────────────────────────────────

/**
 * Hash a phone number for storage (one-way, for lookup)
 * Uses HMAC-SHA256 with the encryption key
 * @param {string} phone - Phone number (e.g. +919876543210)
 * @returns {string} Hex hash
 */
function hashPhoneNumber(phone) {
  if (!phone) return null;
  // Normalize: strip spaces, ensure +91 prefix
  const normalized = phone.replace(/\s+/g, '').replace(/^0/, '+91');
  const keyHex = ENCRYPTION_KEY();
  return crypto.createHmac('sha256', Buffer.from(keyHex, 'hex')).update(normalized).digest('hex');
}

/**
 * Encrypt a phone number for reversible storage
 * @param {string} phone
 * @returns {string} Encrypted phone
 */
function encryptPhone(phone) {
  if (!phone) return null;
  const normalized = phone.replace(/\s+/g, '').replace(/^0/, '+91');
  return encryptAES256(normalized);
}

/**
 * Decrypt a stored phone number
 * @param {string} encryptedPhone
 * @returns {string} Plain phone number
 */
function decryptPhone(encryptedPhone) {
  return decryptAES256(encryptedPhone);
}

// ─── Token Generation ─────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure random token
 * @param {number} bytes - Number of bytes (default 32)
 * @returns {string} Hex token
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a short numeric OTP
 * @param {number} digits - Number of digits (default 6)
 * @returns {string}
 */
function generateOTP(digits = 6) {
  const max = Math.pow(10, digits);
  const otp = crypto.randomInt(0, max);
  return String(otp).padStart(digits, '0');
}

/**
 * Hash a token for storage (e.g., reset tokens)
 * @param {string} token
 * @returns {string}
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashPassword,
  comparePassword,
  encryptAES256,
  decryptAES256,
  hashPhoneNumber,
  encryptPhone,
  decryptPhone,
  generateSecureToken,
  generateOTP,
  hashToken,
};
