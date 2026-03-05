'use strict';

const VoiceAgent = require('../models/VoiceAgent');
const AgentCall = require('../models/AgentCall');
const VoiceAgentService = require('../services/VoiceAgentService');
const ElevenLabsService = require('../services/ElevenLabsService');
const { sendSuccess, sendCreated, sendNoContent, sendPaginated, parsePagination } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler.middleware');

/**
 * GET /api/v1/voice-agents
 */
async function listAgents(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const organizationId = req.user.organizationId;
    const { type, isActive } = req.query;

    const query = { organizationId };
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const [agents, total] = await Promise.all([
      VoiceAgent.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      VoiceAgent.countDocuments(query),
    ]);

    return sendPaginated(res, agents, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/voice-agents/:id
 */
async function getAgent(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const agent = await VoiceAgent.findOne({ _id: id, organizationId }).lean();
    if (!agent) {
      throw new AppError('Voice agent not found', 404, 'AGENT_NOT_FOUND');
    }

    return sendSuccess(res, { agent });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/voice-agents
 */
async function createAgent(req, res, next) {
  try {
    const organizationId = req.user.organizationId;
    const agent = await VoiceAgentService.createAgent(req.body, organizationId);
    return sendCreated(res, { agent: agent.toJSON() }, 'Voice agent created successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/voice-agents/:id
 */
async function updateAgent(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const agent = await VoiceAgentService.updateAgent(id, req.body, organizationId);
    return sendSuccess(res, { agent: agent.toJSON() }, 'Voice agent updated');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/voice-agents/:id
 */
async function deleteAgent(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    await VoiceAgentService.deleteAgent(id, organizationId);
    return sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/voice-agents/:id/sync
 * Force sync agent configuration with ElevenLabs
 */
async function syncWithElevenLabs(req, res, next) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const agent = await VoiceAgent.findOne({ _id: id, organizationId });
    if (!agent) {
      throw new AppError('Voice agent not found', 404, 'AGENT_NOT_FOUND');
    }

    if (agent.elevenLabsAgentId) {
      // Update existing
      await ElevenLabsService.updateAgent(agent.elevenLabsAgentId, {
        name: agent.name,
        systemPrompt: agent.systemPrompt,
        voiceId: agent.voiceId,
      });
    } else {
      // Create new
      const result = await ElevenLabsService.createAgent({
        name: agent.name,
        voiceId: agent.voiceId,
        systemPrompt: agent.systemPrompt,
        language: agent.language,
      });
      agent.elevenLabsAgentId = result.elevenLabsAgentId;
    }

    agent.syncedAt = new Date();
    await agent.save();

    return sendSuccess(res, { agent: agent.toJSON() }, 'Agent synced with ElevenLabs');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/voice-agents/:id/calls
 */
async function getAgentCalls(req, res, next) {
  try {
    const { id } = req.params;
    const { page, limit, skip } = parsePagination(req.query);
    const organizationId = req.user.organizationId;
    const { status } = req.query;

    const agent = await VoiceAgent.findOne({ _id: id, organizationId }).lean();
    if (!agent) {
      throw new AppError('Voice agent not found', 404, 'AGENT_NOT_FOUND');
    }

    const query = { agentId: id, organizationId };
    if (status) query.status = status;

    const [calls, total] = await Promise.all([
      AgentCall.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AgentCall.countDocuments(query),
    ]);

    return sendPaginated(res, calls, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/voice-agents/voices
 * List available ElevenLabs voices
 */
async function listVoices(req, res, next) {
  try {
    const voices = await ElevenLabsService.listVoices();
    const presets = ElevenLabsService.getVoicePresets();

    return sendSuccess(res, { voices, presets });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  syncWithElevenLabs,
  getAgentCalls,
  listVoices,
};
