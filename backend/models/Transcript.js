'use strict';

const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema(
  {
    speakerLabel: {
      type: String,
      enum: ['salesperson', 'customer', 'unknown'],
      default: 'unknown',
    },
    speakerId: {
      type: String, // ElevenLabs speaker diarization ID
    },
    text: {
      type: String,
      required: true,
    },
    startTime: {
      type: Number, // seconds
      min: 0,
    },
    endTime: {
      type: Number, // seconds
      min: 0,
    },
    language: {
      type: String,
      enum: ['hi', 'en', 'mr', 'ta', 'te', 'kn', 'gu', 'pa', 'bn', 'ml', 'auto'],
      default: 'auto',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
  },
  { _id: false }
);

const transcriptSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      unique: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      index: true,
    },
    segments: {
      type: [segmentSchema],
      default: [],
    },
    fullText: {
      type: String,
      maxlength: 100000, // ~100k chars should cover most sales calls
    },
    wordCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Language breakdown: { hi: 0.6, en: 0.4 }
    languageBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },
    // Speaker stats
    speakerStats: {
      salespersonTalkTime: { type: Number, default: 0 }, // seconds
      customerTalkTime: { type: Number, default: 0 }, // seconds
      salespersonWordCount: { type: Number, default: 0 },
      customerWordCount: { type: Number, default: 0 },
      talkRatio: { type: Number, default: null }, // salesperson/total
    },
    // Processing metadata
    processingDetails: {
      model: { type: String }, // e.g. 'scribe_v1'
      processingTime: { type: Number }, // ms
      audioFormat: { type: String },
      sampleRate: { type: Number },
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

transcriptSchema.virtual('segmentCount').get(function () {
  return this.segments?.length || 0;
});

transcriptSchema.virtual('primaryLanguage').get(function () {
  if (!this.languageBreakdown || this.languageBreakdown.size === 0) return 'unknown';
  let maxLang = 'en';
  let maxVal = 0;
  for (const [lang, val] of this.languageBreakdown) {
    if (val > maxVal) {
      maxVal = val;
      maxLang = lang;
    }
  }
  return maxLang;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

transcriptSchema.index({ organizationId: 1, createdAt: -1 });
transcriptSchema.index({ conversationId: 1 }, { unique: true });

// Full-text search on transcript content
transcriptSchema.index({ fullText: 'text' });

// ─── Methods ──────────────────────────────────────────────────────────────────

/**
 * Compute talk ratio and speaker stats from segments
 */
transcriptSchema.methods.computeSpeakerStats = function () {
  let salespersonTime = 0;
  let customerTime = 0;
  let salespersonWords = 0;
  let customerWords = 0;

  for (const seg of this.segments) {
    const duration = (seg.endTime || 0) - (seg.startTime || 0);
    const words = (seg.text || '').split(/\s+/).filter(Boolean).length;

    if (seg.speakerLabel === 'salesperson') {
      salespersonTime += duration;
      salespersonWords += words;
    } else if (seg.speakerLabel === 'customer') {
      customerTime += duration;
      customerWords += words;
    }
  }

  const totalTime = salespersonTime + customerTime;

  this.speakerStats = {
    salespersonTalkTime: Math.round(salespersonTime),
    customerTalkTime: Math.round(customerTime),
    salespersonWordCount: salespersonWords,
    customerWordCount: customerWords,
    talkRatio: totalTime > 0 ? Math.round((salespersonTime / totalTime) * 100) / 100 : null,
  };

  return this.speakerStats;
};

/**
 * Extract full text from segments
 */
transcriptSchema.methods.buildFullText = function () {
  this.fullText = this.segments.map((s) => s.text).join(' ');
  this.wordCount = this.fullText.split(/\s+/).filter(Boolean).length;
  return this.fullText;
};

const Transcript = mongoose.model('Transcript', transcriptSchema);

module.exports = Transcript;
