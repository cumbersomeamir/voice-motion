'use strict';

const Conversation = require('../models/Conversation');
const Transcript = require('../models/Transcript');
const ElevenLabsService = require('./ElevenLabsService');
const LLMPipelineService = require('./LLMPipelineService');
const { decryptAES256 } = require('../utils/crypto');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler.middleware');

class TranscriptionService {
  /**
   * Process a conversation recording end-to-end:
   * 1. Fetch encrypted recording URL
   * 2. Transcribe via ElevenLabs Scribe
   * 3. Store transcript
   * 4. Run LLM analysis pipeline
   * 5. Update conversation with results
   *
   * @param {string} conversationId - MongoDB ObjectId
   * @returns {Promise<Object>} Updated conversation
   */
  async processConversation(conversationId) {
    logger.info(`Starting transcription pipeline: conversationId=${conversationId}`);

    // Fetch conversation with all fields including encrypted ones
    const conversation = await Conversation.findById(conversationId)
      .select('+recordingUrl +elevenLabsJobId')
      .lean();

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.status === 'analyzed') {
      logger.warn(`Conversation ${conversationId} already analyzed - skipping`);
      return conversation;
    }

    try {
      // Update status to processing
      await Conversation.findByIdAndUpdate(conversationId, { status: 'processing' });

      // Decrypt recording URL
      let audioUrl;
      if (conversation.recordingUrl) {
        try {
          audioUrl = decryptAES256(conversation.recordingUrl);
        } catch {
          // Maybe it's a plain URL (during dev)
          audioUrl = conversation.recordingUrl;
        }
      }

      if (!audioUrl) {
        throw new AppError('No recording URL available for transcription', 400, 'NO_RECORDING_URL');
      }

      // Step 1: Transcribe
      logger.info(`Transcribing audio: conversationId=${conversationId}`);
      const transcriptionResult = await ElevenLabsService.transcribeFromUrl(audioUrl, {
        language: conversation.customerLanguage || 'hi',
        diarize: true,
        numSpeakers: 2,
      });

      // Step 2: Map speaker labels (S0 = salesperson, S1 = customer, or vice versa)
      const segments = this._mapSpeakerLabels(transcriptionResult.segments);

      // Step 3: Save transcript
      const existingTranscript = await Transcript.findOne({ conversationId });

      let transcript;
      if (existingTranscript) {
        existingTranscript.segments = segments;
        existingTranscript.fullText = transcriptionResult.fullText;
        existingTranscript.wordCount = transcriptionResult.fullText.split(/\s+/).filter(Boolean).length;
        existingTranscript.languageBreakdown = this._computeLanguageBreakdown(segments);
        existingTranscript.processingDetails = {
          model: transcriptionResult.processingModel,
          audioFormat: 'mp3',
        };
        existingTranscript.computeSpeakerStats();
        transcript = await existingTranscript.save();
      } else {
        const newTranscript = new Transcript({
          conversationId,
          organizationId: conversation.organizationId,
          hubId: conversation.hubId,
          segments,
          fullText: transcriptionResult.fullText,
          wordCount: transcriptionResult.fullText.split(/\s+/).filter(Boolean).length,
          languageBreakdown: this._computeLanguageBreakdown(segments),
          processingDetails: {
            model: transcriptionResult.processingModel,
            audioFormat: 'mp3',
          },
        });
        newTranscript.computeSpeakerStats();
        transcript = await newTranscript.save();
      }

      // Step 4: Run LLM analysis pipeline
      logger.info(`Running LLM analysis: conversationId=${conversationId}`);
      const analysis = await LLMPipelineService.analyzeConversation({
        fullText: transcript.fullText,
        segments: transcript.segments,
        language: conversation.customerLanguage,
        hubId: conversation.hubId,
        organizationId: conversation.organizationId,
      });

      // Step 5: Update conversation with analysis results
      const updatedConversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
          $set: {
            status: 'analyzed',
            transcriptId: transcript._id,
            sentiment: analysis.sentiment,
            objections: analysis.objections,
            sopScore: analysis.sopScore,
            summary: analysis.summary,
            intentSignals: analysis.intentSignals,
            sopChecklist: analysis.sopChecklist,
            followUpTriggered: analysis.intentSignals?.purchaseIntent > 0.7,
          },
        },
        { new: true }
      );

      logger.info(`Transcription pipeline complete: conversationId=${conversationId}`);
      return updatedConversation;
    } catch (error) {
      // Mark as failed
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          status: 'failed',
          processingError: error.message,
        },
      });

      logger.error(`Transcription pipeline failed: ${error.message}`, { conversationId });
      throw error;
    }
  }

  /**
   * Map raw speaker IDs to meaningful labels
   * Heuristic: the speaker who talks more is the salesperson
   * @param {Array} segments
   * @returns {Array} Segments with speakerLabel set
   */
  _mapSpeakerLabels(segments) {
    // Count word counts per speaker
    const speakerWordCount = {};
    for (const seg of segments) {
      const id = seg.speakerId || 'S0';
      const words = (seg.text || '').split(/\s+/).filter(Boolean).length;
      speakerWordCount[id] = (speakerWordCount[id] || 0) + words;
    }

    // Speaker with most words = salesperson
    let salespersonId = null;
    let maxWords = 0;
    for (const [id, count] of Object.entries(speakerWordCount)) {
      if (count > maxWords) {
        maxWords = count;
        salespersonId = id;
      }
    }

    return segments.map((seg) => ({
      ...seg,
      speakerLabel: seg.speakerId === salespersonId ? 'salesperson' : 'customer',
    }));
  }

  /**
   * Compute language breakdown from segments
   * @param {Array} segments
   * @returns {Object} { hi: 0.6, en: 0.4 }
   */
  _computeLanguageBreakdown(segments) {
    const langWordCount = {};
    let totalWords = 0;

    for (const seg of segments) {
      const lang = seg.language || 'hi';
      const words = (seg.text || '').split(/\s+/).filter(Boolean).length;
      langWordCount[lang] = (langWordCount[lang] || 0) + words;
      totalWords += words;
    }

    const breakdown = {};
    if (totalWords > 0) {
      for (const [lang, count] of Object.entries(langWordCount)) {
        breakdown[lang] = Math.round((count / totalWords) * 100) / 100;
      }
    }

    return breakdown;
  }

  /**
   * Retry failed transcription
   * @param {string} conversationId
   */
  async retryTranscription(conversationId) {
    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    if (conversation.status !== 'failed') {
      throw new AppError('Can only retry failed conversations', 400, 'NOT_FAILED_STATUS');
    }

    // Reset status and retry
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { status: 'processing' },
      $unset: { processingError: 1 },
    });

    return this.processConversation(conversationId);
  }

  /**
   * Get transcription status
   * @param {string} conversationId
   */
  async getStatus(conversationId) {
    const conversation = await Conversation.findById(conversationId)
      .select('status transcriptId processingError createdAt')
      .lean();

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    const hasTranscript = !!(await Transcript.exists({ conversationId }));

    return {
      conversationId,
      status: conversation.status,
      hasTranscript,
      processedAt: conversation.status === 'analyzed' ? conversation.updatedAt : null,
    };
  }
}

module.exports = new TranscriptionService();
