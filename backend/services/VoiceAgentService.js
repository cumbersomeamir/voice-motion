'use strict';

const VoiceAgent = require('../models/VoiceAgent');
const AgentCall = require('../models/AgentCall');
const Conversation = require('../models/Conversation');
const ElevenLabsService = require('./ElevenLabsService');
const { hashPhoneNumber, encryptPhone, decryptPhone } = require('../utils/crypto');
const { AppError } = require('../middleware/errorHandler.middleware');
const logger = require('../utils/logger');

class VoiceAgentService {
  /**
   * Create a voice agent (creates in DB and syncs to ElevenLabs)
   * @param {Object} data
   * @param {string} organizationId
   */
  async createAgent(data, organizationId) {
    const { name, type, voiceId, systemPrompt, firstMessage, language, fallbackLanguage } = data;

    // Create agent in DB first
    const agent = new VoiceAgent({
      organizationId,
      name,
      type,
      voiceId,
      systemPrompt,
      firstMessage,
      language: language || 'hi',
      fallbackLanguage: fallbackLanguage || 'en',
      isActive: true,
    });

    await agent.save();

    // Sync to ElevenLabs (non-blocking - if it fails, agent still works locally)
    try {
      const elevenLabsAgent = await ElevenLabsService.createAgent({
        name,
        voiceId,
        systemPrompt: this._buildSystemPrompt(agent),
        firstMessage: firstMessage || this._getDefaultFirstMessage(language),
        language,
      });

      agent.elevenLabsAgentId = elevenLabsAgent.elevenLabsAgentId;
      agent.syncedAt = new Date();
      await agent.save();

      logger.info(`Voice agent synced to ElevenLabs: agentId=${agent._id}`);
    } catch (error) {
      logger.error(`Failed to sync agent to ElevenLabs: ${error.message} (agent saved locally)`);
    }

    return agent;
  }

  /**
   * Update a voice agent
   * @param {string} agentId
   * @param {Object} updates
   * @param {string} organizationId
   */
  async updateAgent(agentId, updates, organizationId) {
    const agent = await VoiceAgent.findOne({ _id: agentId, organizationId });

    if (!agent) {
      throw new AppError('Voice agent not found', 404, 'AGENT_NOT_FOUND');
    }

    Object.assign(agent, updates);
    await agent.save();

    // Sync to ElevenLabs if agent is linked
    if (agent.elevenLabsAgentId) {
      try {
        await ElevenLabsService.updateAgent(agent.elevenLabsAgentId, {
          name: agent.name,
          systemPrompt: this._buildSystemPrompt(agent),
          voiceId: agent.voiceId,
        });
        agent.syncedAt = new Date();
        await agent.save();
      } catch (error) {
        logger.error(`Failed to sync agent update to ElevenLabs: ${error.message}`);
      }
    }

    return agent;
  }

  /**
   * Delete a voice agent (deactivate and remove from ElevenLabs)
   * @param {string} agentId
   * @param {string} organizationId
   */
  async deleteAgent(agentId, organizationId) {
    const agent = await VoiceAgent.findOne({ _id: agentId, organizationId });

    if (!agent) {
      throw new AppError('Voice agent not found', 404, 'AGENT_NOT_FOUND');
    }

    // Soft delete
    agent.isActive = false;
    await agent.save();

    // Remove from ElevenLabs
    if (agent.elevenLabsAgentId) {
      try {
        await ElevenLabsService.deleteAgent(agent.elevenLabsAgentId);
      } catch (error) {
        logger.error(`Failed to delete agent from ElevenLabs: ${error.message}`);
      }
    }

    return { success: true };
  }

  /**
   * Queue an agent call for a conversation
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.agentId - VoiceAgent._id
   * @param {string} params.customerPhone - Plain phone number
   * @param {string} params.organizationId
   * @param {string} params.priority
   * @param {Date} params.scheduledAt
   */
  async queueCall(params) {
    const { conversationId, agentId, customerPhone, organizationId, priority = 'normal', scheduledAt } = params;

    const agent = await VoiceAgent.findOne({ _id: agentId, organizationId, isActive: true });
    if (!agent) {
      throw new AppError('Voice agent not found or inactive', 404, 'AGENT_NOT_FOUND');
    }

    // Hash and encrypt phone
    const customerPhoneHash = hashPhoneNumber(customerPhone);
    const customerPhoneEncrypted = encryptPhone(customerPhone);

    const call = new AgentCall({
      organizationId,
      agentId,
      conversationId,
      customerPhone: customerPhoneHash,
      customerPhoneEncrypted,
      status: 'queued',
      priority,
      scheduledAt: scheduledAt || new Date(),
    });

    await call.save();
    logger.info(`Agent call queued: callId=${call._id} agentId=${agentId}`);

    return call;
  }

  /**
   * Execute a queued agent call
   * @param {string} callId - AgentCall._id
   */
  async executeCall(callId) {
    const call = await AgentCall.findById(callId).select('+customerPhoneEncrypted +elevenLabsCallId');
    if (!call) {
      throw new AppError('Agent call not found', 404, 'CALL_NOT_FOUND');
    }

    if (call.status !== 'queued') {
      throw new AppError(`Call cannot be executed in status: ${call.status}`, 400, 'INVALID_CALL_STATUS');
    }

    const agent = await VoiceAgent.findById(call.agentId);
    if (!agent || !agent.elevenLabsAgentId) {
      throw new AppError('Agent not configured with ElevenLabs', 503, 'AGENT_NOT_SYNCED');
    }

    // Decrypt phone for the actual call
    let customerPhone;
    try {
      customerPhone = decryptPhone(call.customerPhoneEncrypted);
    } catch {
      throw new AppError('Failed to decrypt customer phone for call', 500, 'DECRYPT_ERROR');
    }

    // Build dynamic variables from conversation context
    let dynamicVariables = {};
    if (call.conversationId) {
      const conversation = await Conversation.findById(call.conversationId).lean();
      if (conversation) {
        dynamicVariables = {
          customer_language: conversation.customerLanguage || 'hi',
          car_sku: conversation.metadata?.carSku || '',
          follow_up_context: conversation.summary || '',
        };
      }
    }

    // Update call to in_progress
    call.status = 'in_progress';
    call.startedAt = new Date();
    await call.save();

    try {
      const result = await ElevenLabsService.initiateCall({
        elevenLabsAgentId: agent.elevenLabsAgentId,
        customerPhone,
        dynamicVariables,
      });

      call.elevenLabsCallId = result.callId;
      await call.save();

      // Update agent stats
      await VoiceAgent.findByIdAndUpdate(call.agentId, {
        $inc: { 'stats.callsTotal': 1 },
        $set: { 'stats.lastCallAt': new Date() },
      });

      logger.info(`Agent call initiated: callId=${call._id} elevenLabsCallId=${result.callId}`);
      return call;
    } catch (error) {
      call.status = 'failed';
      call.completedAt = new Date();
      call.failureReason = error.message;

      if (call.retryCount < call.maxRetries) {
        call.retryCount += 1;
        call.status = 'queued';
        call.scheduledAt = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes
      }

      await call.save();
      await VoiceAgent.findByIdAndUpdate(call.agentId, { $inc: { 'stats.callsFailed': 1 } });

      throw error;
    }
  }

  /**
   * Handle call completion from webhook
   * @param {Object} event - Normalized webhook event
   */
  async handleCallCompletion(event) {
    const call = await AgentCall.findOne({ elevenLabsCallId: event.callId });
    if (!call) {
      logger.warn(`No call found for elevenLabsCallId: ${event.callId}`);
      return null;
    }

    call.status = event.status === 'completed' ? 'completed' : 'failed';
    call.duration = event.duration || 0;
    call.transcript = event.transcript || null;
    call.outcome = event.outcome || 'unknown';
    call.completedAt = new Date();
    call.costMinutes = Math.ceil((event.duration || 0) / 60);

    await call.save();

    // Update agent success stats
    if (call.status === 'completed') {
      await VoiceAgent.findByIdAndUpdate(call.agentId, {
        $inc: {
          'stats.callsSuccess': 1,
          'stats.costMinutes': call.costMinutes,
        },
      });
    }

    logger.info(`Call completed: callId=${call._id} status=${call.status}`);
    return call;
  }

  /**
   * Build an enhanced system prompt for the agent
   */
  _buildSystemPrompt(agent) {
    const basePrompt = agent.systemPrompt;
    const context = `
You are a professional car sales assistant for an Indian dealership.
Language: ${agent.language} (with English fallback if customer prefers)
Type: ${agent.type} call

Always be polite, professional, and customer-focused.
If the customer wants to speak in a different language, adapt accordingly.
Do not pressure the customer. Focus on understanding their needs.

${basePrompt}`;

    return context;
  }

  _getDefaultFirstMessage(language) {
    const messages = {
      hi: 'Namaste! Main aapka sales assistant hoon. Kya aap kisi car mein interested hain?',
      en: 'Hello! I am your sales assistant. Are you interested in any of our vehicles?',
      mr: 'Namaskar! Mi tumcha sales sahayak ahe. Tumhala kontyahi gadichya vishayi aavadat ka?',
      ta: 'Vanakkam! Naan ungal vikka ceyya uthavi. Ethavathu vahanathil azhivam irukkirathaa?',
    };
    return messages[language] || messages.hi;
  }
}

module.exports = new VoiceAgentService();
