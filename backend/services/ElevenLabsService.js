'use strict';

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getElevenLabsClient, SCRIBE_MODEL, VOICE_PRESETS } = require('../config/elevenlabs');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler.middleware');

class ElevenLabsService {
  constructor() {
    this.client = null;
  }

  _getClient() {
    if (!this.client) {
      this.client = getElevenLabsClient();
    }
    if (!this.client) {
      throw new AppError('ElevenLabs service is not configured. Please set ELEVENLABS_API_KEY.', 503, 'SERVICE_UNAVAILABLE');
    }
    return this.client;
  }

  // ─── Transcription (Scribe) ─────────────────────────────────────────────────

  /**
   * Transcribe an audio file using ElevenLabs Scribe
   * @param {string|Buffer} audio - File path or Buffer
   * @param {Object} options
   * @param {string} options.language - BCP-47 language code (e.g. 'hi', 'en')
   * @param {string} options.fileName - Original file name
   * @param {boolean} options.diarize - Enable speaker diarization
   * @param {number} options.numSpeakers - Number of expected speakers
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audio, options = {}) {
    const client = this._getClient();

    const {
      language = 'hi',
      fileName = 'recording.mp3',
      diarize = true,
      numSpeakers = 2,
    } = options;

    try {
      logger.info(`Starting transcription: file=${fileName} lang=${language}`);

      const form = new FormData();
      form.append('model_id', SCRIBE_MODEL);

      // Support both file path and buffer
      if (typeof audio === 'string') {
        form.append('file', fs.createReadStream(audio), {
          filename: path.basename(audio),
          contentType: 'audio/mpeg',
        });
      } else if (Buffer.isBuffer(audio)) {
        form.append('file', audio, {
          filename: fileName,
          contentType: 'audio/mpeg',
        });
      } else {
        // Assume it's a readable stream
        form.append('file', audio, {
          filename: fileName,
          contentType: 'audio/mpeg',
        });
      }

      form.append('language_code', language);

      if (diarize) {
        form.append('diarize', 'true');
        form.append('num_speakers', String(numSpeakers));
      }

      const response = await client.post('/speech-to-text', form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 300000, // 5 minutes for long recordings
      });

      const result = response.data;
      logger.info(`Transcription completed: words=${result.words?.length || 0}`);

      return this._normalizeTranscriptResponse(result);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.detail?.message || error.message;

      logger.error(`Transcription failed: ${message}`, { status, fileName });

      if (status === 400) {
        throw new AppError(`Invalid audio file: ${message}`, 400, 'TRANSCRIPTION_INVALID_FILE');
      }
      if (status === 413) {
        throw new AppError('Audio file is too large (max 1GB)', 413, 'TRANSCRIPTION_FILE_TOO_LARGE');
      }
      throw new AppError(`Transcription failed: ${message}`, 500, 'TRANSCRIPTION_FAILED');
    }
  }

  /**
   * Transcribe audio from a URL
   * @param {string} audioUrl - Public URL of the audio file
   * @param {Object} options
   */
  async transcribeFromUrl(audioUrl, options = {}) {
    const client = this._getClient();
    const { language = 'hi', diarize = true, numSpeakers = 2 } = options;

    try {
      logger.info(`Starting URL transcription: url=${audioUrl}`);

      const response = await client.post('/speech-to-text', {
        model_id: SCRIBE_MODEL,
        url: audioUrl,
        language_code: language,
        diarize,
        num_speakers: numSpeakers,
      });

      return this._normalizeTranscriptResponse(response.data);
    } catch (error) {
      const message = error.response?.data?.detail?.message || error.message;
      logger.error(`URL transcription failed: ${message}`);
      throw new AppError(`Transcription failed: ${message}`, 500, 'TRANSCRIPTION_FAILED');
    }
  }

  /**
   * Normalize ElevenLabs transcript response to our internal format
   */
  _normalizeTranscriptResponse(data) {
    const segments = [];

    if (data.utterances && Array.isArray(data.utterances)) {
      // Diarized response
      for (const utterance of data.utterances) {
        segments.push({
          speakerId: utterance.speaker,
          speakerLabel: 'unknown', // Will be mapped after diarization
          text: utterance.text,
          startTime: utterance.start,
          endTime: utterance.end,
          confidence: utterance.confidence || null,
          language: data.language_code || 'hi',
        });
      }
    } else if (data.words && Array.isArray(data.words)) {
      // Word-level response - group into segments
      let currentSegment = null;
      let currentSpeaker = null;

      for (const word of data.words) {
        if (currentSpeaker !== word.speaker_id || !currentSegment) {
          if (currentSegment) {
            segments.push(currentSegment);
          }
          currentSegment = {
            speakerId: word.speaker_id || 'S0',
            speakerLabel: 'unknown',
            text: word.text,
            startTime: word.start,
            endTime: word.end,
            language: data.language_code || 'hi',
            confidence: null,
          };
          currentSpeaker = word.speaker_id;
        } else {
          currentSegment.text += ` ${word.text}`;
          currentSegment.endTime = word.end;
        }
      }
      if (currentSegment) {
        segments.push(currentSegment);
      }
    }

    return {
      segments,
      fullText: data.text || segments.map((s) => s.text).join(' '),
      language: data.language_code || 'hi',
      confidence: data.confidence || null,
      processingModel: SCRIBE_MODEL,
    };
  }

  // ─── Voice Agent Management ─────────────────────────────────────────────────

  /**
   * Create a new Conversational AI agent in ElevenLabs
   * @param {Object} agentConfig
   * @param {string} agentConfig.name
   * @param {string} agentConfig.voiceId
   * @param {string} agentConfig.systemPrompt
   * @param {string} agentConfig.firstMessage
   * @param {string} agentConfig.language
   * @returns {Promise<Object>} Created agent data
   */
  async createAgent(agentConfig) {
    const client = this._getClient();
    const { name, voiceId, systemPrompt, firstMessage, language = 'hi' } = agentConfig;

    try {
      logger.info(`Creating ElevenLabs agent: name=${name}`);

      const payload = {
        name,
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
              llm: 'gpt-4o',
              temperature: 0.7,
              max_tokens: 300,
            },
            first_message: firstMessage || 'Namaste! Main aapki kaise madad kar sakta hoon?',
            language,
          },
          tts: {
            voice_id: voiceId,
            model_id: 'eleven_turbo_v2_5',
            optimize_streaming_latency: 4,
          },
          stt: {
            model: 'scribe_v1',
          },
          conversation: {
            max_duration_seconds: 300,
            client_events: ['conversation_initiation_metadata', 'audio'],
          },
        },
        platform_settings: {
          auth: {
            enable_auth: false,
          },
        },
      };

      const response = await client.post('/convai/agents/create', payload);
      logger.info(`Agent created: elevenLabsId=${response.data.agent_id}`);

      return {
        elevenLabsAgentId: response.data.agent_id,
        raw: response.data,
      };
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      logger.error(`Agent creation failed: ${message}`);
      throw new AppError(`Failed to create voice agent: ${message}`, 500, 'AGENT_CREATION_FAILED');
    }
  }

  /**
   * Update an existing ElevenLabs agent
   * @param {string} elevenLabsAgentId
   * @param {Object} updates
   */
  async updateAgent(elevenLabsAgentId, updates) {
    const client = this._getClient();

    try {
      const payload = {};

      if (updates.systemPrompt) {
        payload.conversation_config = {
          agent: {
            prompt: { prompt: updates.systemPrompt },
          },
        };
      }

      if (updates.voiceId) {
        payload.conversation_config = {
          ...payload.conversation_config,
          tts: { voice_id: updates.voiceId },
        };
      }

      if (updates.name) {
        payload.name = updates.name;
      }

      const response = await client.patch(`/convai/agents/${elevenLabsAgentId}`, payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      logger.error(`Agent update failed: ${message}`);
      throw new AppError(`Failed to update voice agent: ${message}`, 500, 'AGENT_UPDATE_FAILED');
    }
  }

  /**
   * Delete an ElevenLabs agent
   * @param {string} elevenLabsAgentId
   */
  async deleteAgent(elevenLabsAgentId) {
    const client = this._getClient();

    try {
      await client.delete(`/convai/agents/${elevenLabsAgentId}`);
      logger.info(`Agent deleted: elevenLabsId=${elevenLabsAgentId}`);
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      logger.error(`Agent deletion failed: ${message}`);
      throw new AppError(`Failed to delete voice agent: ${message}`, 500, 'AGENT_DELETE_FAILED');
    }
  }

  /**
   * Get agent details from ElevenLabs
   * @param {string} elevenLabsAgentId
   */
  async getAgent(elevenLabsAgentId) {
    const client = this._getClient();

    try {
      const response = await client.get(`/convai/agents/${elevenLabsAgentId}`);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        throw new AppError('Agent not found in ElevenLabs', 404, 'AGENT_NOT_FOUND');
      }
      throw new AppError('Failed to fetch agent details', 500, 'AGENT_FETCH_FAILED');
    }
  }

  // ─── Agent Calls ─────────────────────────────────────────────────────────────

  /**
   * Initiate an outbound call via ElevenLabs agent
   * @param {Object} callConfig
   * @param {string} callConfig.elevenLabsAgentId
   * @param {string} callConfig.customerPhone - E.164 format
   * @param {Object} callConfig.dynamicVariables - Context variables for the agent
   * @returns {Promise<Object>} Call initiation result
   */
  async initiateCall(callConfig) {
    const client = this._getClient();
    const { elevenLabsAgentId, customerPhone, dynamicVariables = {} } = callConfig;

    try {
      logger.info(`Initiating agent call: agentId=${elevenLabsAgentId}`);

      const response = await client.post(`/convai/agents/${elevenLabsAgentId}/outbound-call`, {
        phone_number: customerPhone,
        dynamic_variables: dynamicVariables,
      });

      return {
        callId: response.data.call_id,
        status: response.data.status,
        raw: response.data,
      };
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      logger.error(`Call initiation failed: ${message}`);
      throw new AppError(`Failed to initiate agent call: ${message}`, 500, 'CALL_INITIATION_FAILED');
    }
  }

  /**
   * Get call status from ElevenLabs
   * @param {string} callId
   */
  async getCallStatus(callId) {
    const client = this._getClient();

    try {
      const response = await client.get(`/convai/calls/${callId}`);
      return response.data;
    } catch (error) {
      throw new AppError('Failed to get call status', 500, 'CALL_STATUS_FAILED');
    }
  }

  /**
   * Get call transcript from ElevenLabs
   * @param {string} callId
   */
  async getCallTranscript(callId) {
    const client = this._getClient();

    try {
      const response = await client.get(`/convai/calls/${callId}/transcript`);
      return response.data;
    } catch (error) {
      throw new AppError('Failed to get call transcript', 500, 'TRANSCRIPT_FETCH_FAILED');
    }
  }

  // ─── Webhook Handling ─────────────────────────────────────────────────────────

  /**
   * Verify ElevenLabs webhook signature
   * @param {string} rawBody - Raw request body string
   * @param {string} signature - X-ElevenLabs-Signature header value
   * @returns {boolean}
   */
  verifyWebhookSignature(rawBody, signature) {
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (!secret) {
      logger.warn('ELEVENLABS_WEBHOOK_SECRET not set - skipping webhook verification');
      return true; // Permissive in dev mode
    }

    try {
      const crypto = require('crypto');
      const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const providedSig = signature?.replace('sha256=', '') || '';
      return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig));
    } catch {
      return false;
    }
  }

  /**
   * Parse and normalize ElevenLabs webhook payload
   * @param {Object} payload - Parsed webhook body
   * @returns {Object} Normalized event
   */
  parseWebhookEvent(payload) {
    return {
      type: payload.type || payload.event_type,
      callId: payload.call_id || payload.data?.call_id,
      agentId: payload.agent_id || payload.data?.agent_id,
      status: payload.status || payload.data?.status,
      duration: payload.duration || payload.data?.duration,
      transcript: payload.transcript || payload.data?.transcript,
      outcome: payload.outcome || payload.data?.outcome,
      timestamp: payload.timestamp || new Date().toISOString(),
      raw: payload,
    };
  }

  // ─── Voices ───────────────────────────────────────────────────────────────────

  /**
   * List available voices
   */
  async listVoices() {
    const client = this._getClient();

    try {
      const response = await client.get('/voices');
      return response.data.voices || [];
    } catch (error) {
      throw new AppError('Failed to list voices', 500, 'VOICES_FETCH_FAILED');
    }
  }

  /**
   * Get pre-configured voice presets for Indian market
   */
  getVoicePresets() {
    return VOICE_PRESETS;
  }
}

module.exports = new ElevenLabsService();
