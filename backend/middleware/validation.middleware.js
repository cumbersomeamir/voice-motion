'use strict';

const { z } = require('zod');
const { AppError } = require('./errorHandler.middleware');

/**
 * Middleware factory that validates request body/params/query against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'params'|'query'|'headers'} target - Which part of the request to validate
 * @returns {Function} Express middleware
 */
function validate(schema, target = 'body') {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[target]);
      // Replace with sanitized/coerced data
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));

        const appErr = new AppError(
          `Validation failed: ${errors[0]?.message || 'Invalid input'}`,
          422,
          'VALIDATION_ERROR'
        );
        appErr.errors = errors;
        appErr.isOperational = true;
        return next(appErr);
      }
      next(err);
    }
  };
}

/**
 * Validate multiple targets at once
 * @param {Object} schemas - { body: ZodSchema, params: ZodSchema, query: ZodSchema }
 * @returns {Function[]} Array of middleware functions
 */
function validateAll(schemas) {
  const middlewares = [];

  if (schemas.params) middlewares.push(validate(schemas.params, 'params'));
  if (schemas.query) middlewares.push(validate(schemas.query, 'query'));
  if (schemas.body) middlewares.push(validate(schemas.body, 'body'));

  return middlewares;
}

// ─── Common Zod Schemas ────────────────────────────────────────────────────────

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId');

const PhoneNumberSchema = z
  .string()
  .regex(/^(\+91|0)?[6-9]\d{9}$/, 'Must be a valid Indian phone number (10 digits starting with 6-9)');

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
});

const IdParamSchema = z.object({
  id: ObjectIdSchema,
});

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()])/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  organizationName: z.string().min(2).max(100).trim(),
  city: z.string().min(1).max(50).trim().optional(),
  state: z.string().min(1).max(50).trim().optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().length(6).optional(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()])/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ─── Conversation Schemas ─────────────────────────────────────────────────────

const CreateConversationSchema = z.object({
  hubId: ObjectIdSchema,
  salesPersonId: ObjectIdSchema,
  customerPhone: PhoneNumberSchema,
  customerLanguage: z.enum(['hi', 'en', 'mr', 'ta', 'te', 'kn', 'gu', 'pa', 'bn', 'ml']).default('hi'),
  recordingUrl: z.string().url().optional(),
  duration: z.number().int().min(0).optional(),
  metadata: z
    .object({
      carSku: z.string().optional(),
      testDriveId: z.string().optional(),
    })
    .optional(),
});

const UpdateConversationSchema = z.object({
  status: z.enum(['processing', 'analyzed', 'failed']).optional(),
  followUpTriggered: z.boolean().optional(),
  metadata: z
    .object({
      carSku: z.string().optional(),
      testDriveId: z.string().optional(),
    })
    .optional(),
});

const TriggerAgentSchema = z.object({
  agentId: ObjectIdSchema,
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

// ─── Hub Schemas ──────────────────────────────────────────────────────────────

const CreateHubSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  city: z.string().min(1).max(50).trim(),
  state: z.string().min(1).max(50).trim(),
  address: z.string().min(5).max(200).trim().optional(),
  managerId: ObjectIdSchema.optional(),
  agentCount: z.number().int().min(0).default(0),
  location: z
    .object({
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    })
    .optional(),
});

const UpdateHubSchema = CreateHubSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── Voice Agent Schemas ───────────────────────────────────────────────────────

const CreateVoiceAgentSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  type: z.enum(['followup', 'inbound', 'financing', 'reengagement']),
  voiceId: z.string().min(1),
  systemPrompt: z.string().min(10).max(5000),
  language: z.enum(['hi', 'en', 'mr', 'ta', 'te', 'kn', 'gu', 'pa', 'bn', 'ml']).default('hi'),
  fallbackLanguage: z.enum(['hi', 'en']).default('en'),
});

const UpdateVoiceAgentSchema = CreateVoiceAgentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

module.exports = {
  validate,
  validateAll,
  // Common schemas
  ObjectIdSchema,
  PhoneNumberSchema,
  PaginationSchema,
  IdParamSchema,
  // Auth schemas
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  RefreshTokenSchema,
  VerifyEmailSchema,
  // Conversation schemas
  CreateConversationSchema,
  UpdateConversationSchema,
  TriggerAgentSchema,
  // Hub schemas
  CreateHubSchema,
  UpdateHubSchema,
  // Voice Agent schemas
  CreateVoiceAgentSchema,
  UpdateVoiceAgentSchema,
};
