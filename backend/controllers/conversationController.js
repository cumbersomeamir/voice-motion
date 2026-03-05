'use strict';

const Conversation = require('../models/Conversation');
const Hub = require('../models/Hub');
const AgentCall = require('../models/AgentCall');
const { hashPhoneNumber, encryptPhone, decryptPhone, encryptAES256, decryptAES256 } = require('../utils/crypto');
const { sendSuccess, sendCreated, sendNoContent, sendPaginated, parsePagination, parseSort } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler.middleware');
const VoiceAgentService = require('../services/VoiceAgentService');
const { transcriptionQueue } = require('../jobs/transcriptionQueue');
const logger = require('../utils/logger');

/**
 * GET /api/v1/conversations
 */
async function listConversations(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const organizationId = req.user.organizationId;
    const { hubId, status, from, to, sentimentOverall, minSopScore, maxSopScore, sort } = req.query;

    const query = { organizationId };

    // Role-based filtering: hub_manager only sees their hubs
    if (req.user.role === 'hub_manager') {
      const hubIds = req.user.hubIds?.map((id) => id.toString()) || [];
      query.hubId = { $in: hubIds };
    } else if (hubId) {
      query.hubId = hubId;
    }

    if (status) query.status = status;
    if (sentimentOverall) query['sentiment.overall'] = sentimentOverall;
    if (minSopScore) query.sopScore = { $gte: parseFloat(minSopScore) };
    if (maxSopScore) query.sopScore = { ...query.sopScore, $lte: parseFloat(maxSopScore) };

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const sortObj = parseSort(sort, { createdAt: true, sopScore: true, 'sentiment.score': true, duration: true });

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .select('-recordingUrl -customerPhoneEncrypted -elevenLabsJobId -processingError')
        .populate('hubId', 'name city state')
        .populate('salesPersonId', 'firstName lastName email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(query),
    ]);

    return sendPaginated(res, conversations, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/conversations/:id
 */
async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const conversation = await Conversation.findOne({ _id: id, organizationId })
      .populate('hubId', 'name city state')
      .populate('salesPersonId', 'firstName lastName email')
      .populate('transcriptId')
      .lean();

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    // Hub manager can only view their hub's conversations
    if (req.user.role === 'hub_manager') {
      const hubIds = req.user.hubIds?.map((id) => id.toString()) || [];
      if (!hubIds.includes(conversation.hubId?._id?.toString())) {
        throw new AppError('Access denied to this conversation', 403, 'HUB_ACCESS_DENIED');
      }
    }

    return sendSuccess(res, { conversation });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/conversations
 */
async function createConversation(req, res, next) {
  try {
    const { hubId, salesPersonId, customerPhone, customerLanguage, recordingUrl, duration, metadata } = req.body;

    const organizationId = req.user.organizationId;

    // Verify hub belongs to organization
    const hub = await Hub.findOne({ _id: hubId, organizationId, isActive: true });
    if (!hub) {
      throw new AppError('Hub not found or not active', 404, 'HUB_NOT_FOUND');
    }

    // Hash and encrypt customer phone
    const customerPhoneHash = hashPhoneNumber(customerPhone);
    const customerPhoneEncrypted = encryptPhone(customerPhone);

    // Encrypt recording URL if provided
    let encryptedRecordingUrl = null;
    if (recordingUrl) {
      encryptedRecordingUrl = encryptAES256(recordingUrl);
    }

    const conversation = new Conversation({
      organizationId,
      hubId,
      salesPersonId: salesPersonId || req.user._id,
      customerPhone: customerPhoneHash,
      customerPhoneEncrypted,
      customerLanguage: customerLanguage || hub.settings?.defaultLanguage || 'hi',
      duration: duration || 0,
      recordingUrl: encryptedRecordingUrl,
      status: recordingUrl ? 'processing' : 'processing',
      metadata: metadata || {},
    });

    await conversation.save();

    // Queue for transcription if recording URL is provided
    if (recordingUrl) {
      await transcriptionQueue.add(
        'transcribe',
        { conversationId: conversation._id.toString() },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30000 },
          delay: 2000, // 2 second initial delay
        }
      );
      logger.info(`Transcription queued: conversationId=${conversation._id}`);
    }

    // Update hub conversation count
    await Hub.findByIdAndUpdate(hubId, { $inc: { 'stats.conversationsToday': 1 } });

    return sendCreated(
      res,
      { conversation: conversation.toJSON() },
      recordingUrl ? 'Conversation created and queued for processing' : 'Conversation created'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/conversations/:id
 */
async function updateConversation(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { status, followUpTriggered, metadata } = req.body;

    const conversation = await Conversation.findOne({ _id: id, organizationId });
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    const updates = {};
    if (status) updates.status = status;
    if (typeof followUpTriggered === 'boolean') updates.followUpTriggered = followUpTriggered;
    if (metadata) updates.metadata = { ...conversation.metadata, ...metadata };

    const updated = await Conversation.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('hubId', 'name city state')
      .lean();

    return sendSuccess(res, { conversation: updated }, 'Conversation updated');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/conversations/:id
 */
async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const conversation = await Conversation.findOne({ _id: id, organizationId });
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    // Only org_admin and super_admin can delete conversations
    if (!['org_admin', 'super_admin'].includes(req.user.role)) {
      throw new AppError('Insufficient permissions to delete conversations', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    await Conversation.findByIdAndDelete(id);

    // Also delete associated transcript
    const Transcript = require('../models/Transcript');
    await Transcript.deleteOne({ conversationId: id });

    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/conversations/:id/trigger-agent
 * Trigger an AI follow-up agent call for a conversation
 */
async function triggerAgent(req, res, next) {
  try {
    const { id } = req.params;
    const { agentId, priority } = req.body;
    const organizationId = req.user.organizationId;

    const conversation = await Conversation.findOne({ _id: id, organizationId })
      .select('+customerPhoneEncrypted')
      .lean();

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.status !== 'analyzed') {
      throw new AppError(
        'Conversation must be analyzed before triggering an agent call',
        400,
        'CONVERSATION_NOT_ANALYZED'
      );
    }

    // Decrypt phone for queuing
    let customerPhone;
    try {
      customerPhone = decryptPhone(conversation.customerPhoneEncrypted);
    } catch {
      throw new AppError('Customer phone is not available for this conversation', 400, 'PHONE_UNAVAILABLE');
    }

    // Queue the call
    const call = await VoiceAgentService.queueCall({
      conversationId: id,
      agentId,
      customerPhone,
      organizationId,
      priority: priority || 'normal',
      scheduledAt: new Date(),
    });

    // Mark follow-up triggered
    await Conversation.findByIdAndUpdate(id, {
      followUpTriggered: true,
      agentCallId: call._id,
    });

    logger.info(`Agent call triggered: conversationId=${id} agentCallId=${call._id}`);

    return sendSuccess(
      res,
      { agentCall: call.toJSON() },
      'Agent call queued successfully'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/conversations/:id/retry
 * Retry transcription for a failed conversation
 */
async function retryTranscription(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const conversation = await Conversation.findOne({ _id: id, organizationId });
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.status !== 'failed') {
      throw new AppError('Only failed conversations can be retried', 400, 'NOT_FAILED_STATUS');
    }

    await Conversation.findByIdAndUpdate(id, {
      $set: { status: 'processing' },
      $unset: { processingError: 1 },
    });

    await transcriptionQueue.add(
      'transcribe',
      { conversationId: id },
      { attempts: 2, priority: 10 }
    );

    return sendSuccess(res, null, 'Conversation queued for retry');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  triggerAgent,
  retryTranscription,
};
