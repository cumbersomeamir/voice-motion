'use strict';

const OpenAI = require('openai');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler.middleware');

// Standard SOP checklist for Indian car dealerships
const SOP_CHECKLIST = [
  { id: 'greeting', item: 'Greeted customer warmly and introduced themselves', weight: 5 },
  { id: 'need_identification', item: 'Identified customer needs and use case for vehicle', weight: 15 },
  { id: 'budget_discussion', item: 'Discussed budget and financing options', weight: 15 },
  { id: 'model_presentation', item: 'Presented appropriate car model(s) with features', weight: 15 },
  { id: 'test_drive_offer', item: 'Offered a test drive', weight: 10 },
  { id: 'competitor_handling', item: 'Addressed competitor comparisons professionally', weight: 10 },
  { id: 'emi_discussion', item: 'Discussed EMI/financing options clearly', weight: 10 },
  { id: 'objection_handling', item: 'Handled objections effectively', weight: 10 },
  { id: 'follow_up_setup', item: 'Set up follow-up action or next steps', weight: 10 },
  { id: 'closing', item: 'Attempted closing or commitment', weight: 0 },
];

class LLMPipelineService {
  constructor() {
    this.openai = null;
  }

  _getClient() {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new AppError('OpenAI API key not configured', 503, 'SERVICE_UNAVAILABLE');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  _getModel() {
    return process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  }

  /**
   * Master analysis function - runs all pipeline steps
   * @param {Object} params
   * @param {string} params.fullText - Full conversation transcript
   * @param {Array} params.segments - Segmented transcript
   * @param {string} params.language - Primary language
   * @param {string} params.organizationId
   * @param {string} params.hubId
   * @returns {Promise<Object>} Complete analysis results
   */
  async analyzeConversation({ fullText, segments, language = 'hi', organizationId, hubId }) {
    if (!fullText || fullText.trim().length < 10) {
      logger.warn('Transcript too short for LLM analysis');
      return this._emptyAnalysis();
    }

    logger.info('Starting LLM analysis pipeline');
    const startTime = Date.now();

    try {
      // Run all analyses in parallel for efficiency
      const [sentimentResult, objectionsResult, summaryResult, sopResult, intentResult] = await Promise.allSettled([
        this.analyzeSentiment(fullText, segments, language),
        this.extractObjections(fullText, language),
        this.generateSummary(fullText, language),
        this.scoreSopCompliance(fullText, language),
        this.extractIntentSignals(fullText, language),
      ]);

      const analysis = {
        sentiment: sentimentResult.status === 'fulfilled' ? sentimentResult.value : this._defaultSentiment(),
        objections: objectionsResult.status === 'fulfilled' ? objectionsResult.value : [],
        summary: summaryResult.status === 'fulfilled' ? summaryResult.value : 'Summary unavailable',
        sopScore: sopResult.status === 'fulfilled' ? sopResult.value.score : null,
        sopChecklist: sopResult.status === 'fulfilled' ? sopResult.value.checklist : [],
        intentSignals: intentResult.status === 'fulfilled' ? intentResult.value : this._defaultIntentSignals(),
      };

      const elapsed = Date.now() - startTime;
      logger.info(`LLM analysis complete in ${elapsed}ms`);

      // Log any pipeline failures
      const failures = [sentimentResult, objectionsResult, summaryResult, sopResult, intentResult]
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason?.message);

      if (failures.length > 0) {
        logger.warn('Some LLM pipeline steps failed:', failures);
      }

      return analysis;
    } catch (error) {
      logger.error('LLM pipeline critical failure:', error.message);
      return this._emptyAnalysis();
    }
  }

  /**
   * Analyze conversation sentiment
   * @param {string} fullText
   * @param {Array} segments
   * @param {string} language
   */
  async analyzeSentiment(fullText, segments = [], language = 'hi') {
    const client = this._getClient();

    const systemPrompt = `You are an expert sales call sentiment analyzer for Indian car dealerships.
Analyze the conversation and return a JSON response with:
1. overall: "positive", "neutral", or "negative"
2. score: float from -1 (most negative) to 1 (most positive)
3. timeline: array of { timestamp (seconds), score (float -1 to 1), label ("positive"|"neutral"|"negative") }

Consider Indian cultural context, mixed Hindi-English (Hinglish) speech, and car sales dynamics.
Respond ONLY with valid JSON.`;

    const userPrompt = `Analyze the sentiment of this car sales conversation (language: ${language}):

${fullText.substring(0, 8000)}`;

    try {
      const response = await client.chat.completions.create({
        model: this._getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);

      return {
        overall: result.overall || 'neutral',
        score: Math.max(-1, Math.min(1, parseFloat(result.score) || 0)),
        timeline: Array.isArray(result.timeline) ? result.timeline.slice(0, 50) : [],
      };
    } catch (error) {
      logger.error('Sentiment analysis failed:', error.message);
      return this._defaultSentiment();
    }
  }

  /**
   * Extract objections from conversation
   * @param {string} fullText
   * @param {string} language
   * @returns {Promise<Array>}
   */
  async extractObjections(fullText, language = 'hi') {
    const client = this._getClient();

    const systemPrompt = `You are an expert in Indian car sales conversations. Extract customer objections from the transcript.
Return a JSON array of objections, each with:
- type: one of "price", "competitor", "timing", "features", "financing", "trust", "other"
- timestamp: approximate second where objection occurs (or null)
- text: exact or paraphrased quote of the objection (in original language)
- resolved: boolean - was the objection handled/resolved by the salesperson?
- resolutionText: brief description of how it was resolved (or null)

Common Indian car sales objections: price too high, competitor comparison (Maruti, Tata, etc.),
waiting period, EMI concerns, exchange value, insurance cost.

Respond ONLY with valid JSON array. Return [] if no objections found.`;

    const userPrompt = `Extract objections from this car sales conversation (language: ${language}):

${fullText.substring(0, 8000)}`;

    try {
      const response = await client.chat.completions.create({
        model: this._getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      const objections = Array.isArray(result) ? result : result.objections || [];

      return objections.slice(0, 20).map((obj) => ({
        type: ['price', 'competitor', 'timing', 'features', 'financing', 'trust', 'other'].includes(obj.type)
          ? obj.type
          : 'other',
        timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : null,
        text: String(obj.text || '').substring(0, 500),
        resolved: !!obj.resolved,
        resolutionText: obj.resolutionText ? String(obj.resolutionText).substring(0, 300) : null,
      }));
    } catch (error) {
      logger.error('Objection extraction failed:', error.message);
      return [];
    }
  }

  /**
   * Generate conversation summary
   * @param {string} fullText
   * @param {string} language
   * @returns {Promise<string>}
   */
  async generateSummary(fullText, language = 'hi') {
    const client = this._getClient();

    const systemPrompt = `You are a sales call summarizer for an Indian car dealership.
Generate a concise English summary (150-200 words) of the sales conversation covering:
1. Customer's interest and requirements (car model, budget, use case)
2. Key points discussed (features, pricing, EMI, test drive)
3. Objections raised and how they were handled
4. Outcome and next steps agreed upon
5. Overall assessment of the interaction quality

Be specific and factual. Use English only for the summary.`;

    const userPrompt = `Summarize this car sales conversation (primary language: ${language}):

${fullText.substring(0, 8000)}`;

    try {
      const response = await client.chat.completions.create({
        model: this._getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Summary generation failed:', error.message);
      return 'Summary generation failed. Please review the transcript manually.';
    }
  }

  /**
   * Score SOP compliance
   * @param {string} fullText
   * @param {string} language
   * @returns {Promise<{ score: number, checklist: Array }>}
   */
  async scoreSopCompliance(fullText, language = 'hi') {
    const client = this._getClient();

    const checklistItems = SOP_CHECKLIST.map((item) => `${item.id}: ${item.item}`).join('\n');

    const systemPrompt = `You are a car dealership sales trainer assessing SOP compliance.
Given a sales call transcript, evaluate whether the salesperson followed each SOP checklist item.

SOP Checklist items:
${checklistItems}

Return a JSON object with:
- checklist: array of { id, item, passed (boolean), evidence (brief quote or reason) }
- score: weighted score from 0-100 based on completion

Respond ONLY with valid JSON.`;

    const userPrompt = `Evaluate SOP compliance for this car sales call (language: ${language}):

${fullText.substring(0, 8000)}`;

    try {
      const response = await client.chat.completions.create({
        model: this._getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);

      // Calculate weighted score if not provided
      const checklist = Array.isArray(result.checklist) ? result.checklist : [];
      let score = result.score;

      if (score === undefined || score === null) {
        let totalWeight = 0;
        let earnedWeight = 0;
        for (const item of SOP_CHECKLIST) {
          const checkItem = checklist.find((c) => c.id === item.id);
          if (item.weight > 0) {
            totalWeight += item.weight;
            if (checkItem?.passed) {
              earnedWeight += item.weight;
            }
          }
        }
        score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
      }

      return {
        score: Math.max(0, Math.min(100, Math.round(score))),
        checklist: checklist.map((c) => ({
          item: c.item || '',
          passed: !!c.passed,
        })),
      };
    } catch (error) {
      logger.error('SOP scoring failed:', error.message);
      return { score: null, checklist: [] };
    }
  }

  /**
   * Extract intent signals from conversation
   * @param {string} fullText
   * @param {string} language
   */
  async extractIntentSignals(fullText, language = 'hi') {
    const client = this._getClient();

    const systemPrompt = `You are an expert in Indian car buyer behavior analysis.
Extract purchase intent signals from the conversation.

Return a JSON object with:
- purchaseIntent: float 0-1 (probability of purchase intent)
- testDriveInterest: boolean (did customer show interest in test drive?)
- financingInterest: boolean (did customer discuss EMI/loan/financing?)
- competitorMentioned: array of competitor brand/model names mentioned (e.g., ["Maruti Swift", "Tata Nexon"])
- carModelsDiscussed: array of car models discussed (e.g., ["Honda City", "Honda Amaze"])
- urgencyLevel: "low", "medium", "high" (how urgently does customer want to buy?)

Respond ONLY with valid JSON.`;

    const userPrompt = `Extract intent signals from this car sales conversation (language: ${language}):

${fullText.substring(0, 6000)}`;

    try {
      const response = await client.chat.completions.create({
        model: this._getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);

      return {
        purchaseIntent: Math.max(0, Math.min(1, parseFloat(result.purchaseIntent) || 0)),
        testDriveInterest: !!result.testDriveInterest,
        financingInterest: !!result.financingInterest,
        competitorMentioned: Array.isArray(result.competitorMentioned) ? result.competitorMentioned.slice(0, 10) : [],
        carModelsDiscussed: Array.isArray(result.carModelsDiscussed) ? result.carModelsDiscussed.slice(0, 10) : [],
        urgencyLevel: ['low', 'medium', 'high'].includes(result.urgencyLevel) ? result.urgencyLevel : 'low',
      };
    } catch (error) {
      logger.error('Intent extraction failed:', error.message);
      return this._defaultIntentSignals();
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  _defaultSentiment() {
    return { overall: 'neutral', score: 0, timeline: [] };
  }

  _defaultIntentSignals() {
    return {
      purchaseIntent: 0,
      testDriveInterest: false,
      financingInterest: false,
      competitorMentioned: [],
      carModelsDiscussed: [],
      urgencyLevel: 'low',
    };
  }

  _emptyAnalysis() {
    return {
      sentiment: this._defaultSentiment(),
      objections: [],
      summary: 'Analysis not available',
      sopScore: null,
      sopChecklist: [],
      intentSignals: this._defaultIntentSignals(),
    };
  }
}

module.exports = new LLMPipelineService();
