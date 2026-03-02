'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGOOSE_OPTIONS = {
  // Connection pool
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  // Buffering
  bufferCommands: false,
  // Auto-index disabled in production for performance
  autoIndex: process.env.NODE_ENV !== 'production',
};

let isConnected = false;

async function connectDatabase() {
  if (isConnected) {
    logger.debug('MongoDB already connected, reusing connection');
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('MongoDB connection established');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected');
    });

    await mongoose.connect(uri, MONGOOSE_OPTIONS);
    isConnected = true;

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

async function disconnectDatabase() {
  if (!isConnected) return;
  await mongoose.connection.close();
  isConnected = false;
  logger.info('MongoDB connection closed');
}

function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}

module.exports = { connectDatabase, disconnectDatabase, getConnectionStatus };
