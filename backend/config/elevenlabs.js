'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const ELEVENLABS_API_BASE = process.env.ELEVENLABS_API_BASE_URL || 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Supported Indian languages for ElevenLabs
const SUPPORTED_LANGUAGES = {
  hi: { name: 'Hindi', code: 'hi', elevenLabsCode: 'hi' },
  en: { name: 'English', code: 'en', elevenLabsCode: 'en' },
  mr: { name: 'Marathi', code: 'mr', elevenLabsCode: 'mr' },
  ta: { name: 'Tamil', code: 'ta', elevenLabsCode: 'ta' },
  te: { name: 'Telugu', code: 'te', elevenLabsCode: 'te' },
  kn: { name: 'Kannada', code: 'kn', elevenLabsCode: 'kn' },
  gu: { name: 'Gujarati', code: 'gu', elevenLabsCode: 'gu' },
  pa: { name: 'Punjabi', code: 'pa', elevenLabsCode: 'pa' },
  bn: { name: 'Bengali', code: 'bn', elevenLabsCode: 'bn' },
  ml: { name: 'Malayalam', code: 'ml', elevenLabsCode: 'ml' },
};

// Agent voice presets for Indian market
const VOICE_PRESETS = {
  hindi_male: { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Hindi Male - Arjun' },
  hindi_female: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Hindi Female - Priya' },
  english_male: { voiceId: 'VR6AewLTigWG4xSOukaG', name: 'English Male - Raj' },
  english_female: { voiceId: 'ThT5KcBeYPX3keUQqHPh', name: 'English Female - Ananya' },
};

// Scribe model for transcription
const SCRIBE_MODEL = 'scribe_v1';

function createElevenLabsClient() {
  if (!ELEVENLABS_API_KEY) {
    logger.warn('ELEVENLABS_API_KEY not set - ElevenLabs features will be unavailable');
    return null;
  }

  const client = axios.create({
    baseURL: ELEVENLABS_API_BASE,
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 120000, // 2 minutes for long transcriptions
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      logger.debug(`ElevenLabs API: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      logger.error('ElevenLabs request error:', error.message);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.detail || error.message;

      if (status === 401) {
        logger.error('ElevenLabs API: Authentication failed - check ELEVENLABS_API_KEY');
      } else if (status === 429) {
        logger.warn('ElevenLabs API: Rate limit exceeded');
      } else if (status >= 500) {
        logger.error(`ElevenLabs API: Server error ${status}: ${message}`);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

let elevenLabsClientInstance = null;

function getElevenLabsClient() {
  if (!elevenLabsClientInstance) {
    elevenLabsClientInstance = createElevenLabsClient();
  }
  return elevenLabsClientInstance;
}

module.exports = {
  getElevenLabsClient,
  ELEVENLABS_API_BASE,
  ELEVENLABS_API_KEY,
  SUPPORTED_LANGUAGES,
  VOICE_PRESETS,
  SCRIBE_MODEL,
};
