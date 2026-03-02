'use strict';

const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let isConnected = false;

async function connectRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis max reconnection attempts reached');
          }
          const delay = Math.min(retries * 100, 3000);
          logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
        connectTimeout: 10000,
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err.message);
    });

    redisClient.on('end', () => {
      isConnected = false;
      logger.warn('Redis client disconnected');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    await redisClient.connect();
    isConnected = true;

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error.message);
    // Redis failure is non-fatal - app can run without it with degraded caching
    logger.warn('Application will run without Redis caching');
    return null;
  }
}

function getRedisClient() {
  return redisClient;
}

function isRedisConnected() {
  return isConnected && redisClient !== null;
}

// Helper: set value with optional TTL
async function redisSet(key, value, ttlSeconds = null) {
  if (!isRedisConnected()) return false;
  try {
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (ttlSeconds) {
      await redisClient.setEx(key, ttlSeconds, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (err) {
    logger.error('Redis SET error:', err.message);
    return false;
  }
}

// Helper: get value and auto-parse JSON
async function redisGet(key) {
  if (!isRedisConnected()) return null;
  try {
    const value = await redisClient.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (err) {
    logger.error('Redis GET error:', err.message);
    return null;
  }
}

// Helper: delete key(s)
async function redisDel(...keys) {
  if (!isRedisConnected()) return 0;
  try {
    return await redisClient.del(keys);
  } catch (err) {
    logger.error('Redis DEL error:', err.message);
    return 0;
  }
}

// Helper: check existence
async function redisExists(key) {
  if (!isRedisConnected()) return false;
  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (err) {
    logger.error('Redis EXISTS error:', err.message);
    return false;
  }
}

// Helper: increment counter
async function redisIncr(key, ttlSeconds = null) {
  if (!isRedisConnected()) return null;
  try {
    const value = await redisClient.incr(key);
    if (ttlSeconds && value === 1) {
      await redisClient.expire(key, ttlSeconds);
    }
    return value;
  } catch (err) {
    logger.error('Redis INCR error:', err.message);
    return null;
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisConnected,
  redisSet,
  redisGet,
  redisDel,
  redisExists,
  redisIncr,
};
