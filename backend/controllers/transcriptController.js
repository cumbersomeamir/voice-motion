'use strict';

const Transcript = require('../models/Transcript');
const Conversation = require('../models/Conversation');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler.middleware');

/**
 * GET /api/v1/conversations/:conversationId/transcript
 */
async function getTranscript(req, res, next) {
  try {
    const { conversationId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify conversation belongs to org
    const conversation = await Conversation.findOne({ _id: conversationId, organizationId }).lean();
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    const transcript = await Transcript.findOne({ conversationId }).lean();
    if (!transcript) {
      throw new AppError('Transcript not yet available for this conversation', 404, 'TRANSCRIPT_NOT_FOUND');
    }

    return sendSuccess(res, { transcript });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/conversations/:conversationId/transcript/segments
 * Return only segments (for efficient pagination in frontend)
 */
async function getTranscriptSegments(req, res, next) {
  try {
    const { conversationId } = req.params;
    const organizationId = req.user.organizationId;
    const { speaker, from, to } = req.query;

    const conversation = await Conversation.findOne({ _id: conversationId, organizationId }).lean();
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    const transcript = await Transcript.findOne({ conversationId }).select('segments speakerStats').lean();
    if (!transcript) {
      throw new AppError('Transcript not available', 404, 'TRANSCRIPT_NOT_FOUND');
    }

    let segments = transcript.segments || [];

    // Filter by speaker
    if (speaker && ['salesperson', 'customer', 'unknown'].includes(speaker)) {
      segments = segments.filter((s) => s.speakerLabel === speaker);
    }

    // Filter by time range
    if (from !== undefined) {
      segments = segments.filter((s) => s.startTime >= parseFloat(from));
    }
    if (to !== undefined) {
      segments = segments.filter((s) => s.endTime <= parseFloat(to));
    }

    return sendSuccess(res, {
      segments,
      speakerStats: transcript.speakerStats,
      totalSegments: segments.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/transcripts/search
 * Full-text search across transcripts in an organization
 */
async function searchTranscripts(req, res, next) {
  try {
    const organizationId = req.user.organizationId;
    const { q, hubId, from, to, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400, 'QUERY_TOO_SHORT');
    }

    const matchQuery = {
      organizationId,
      $text: { $search: q },
    };

    if (hubId) matchQuery.hubId = hubId;
    if (from || to) {
      matchQuery.createdAt = {};
      if (from) matchQuery.createdAt.$gte = new Date(from);
      if (to) matchQuery.createdAt.$lte = new Date(to);
    }

    const transcripts = await Transcript.find(matchQuery, { score: { $meta: 'textScore' } })
      .select('conversationId organizationId hubId wordCount createdAt')
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.min(parseInt(limit, 10), 50))
      .populate('conversationId', 'status duration sentiment.overall sopScore createdAt')
      .lean();

    return sendSuccess(res, { results: transcripts, query: q });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTranscript,
  getTranscriptSegments,
  searchTranscripts,
};
