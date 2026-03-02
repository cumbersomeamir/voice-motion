'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const { validateEnv } = require('./config/env');

// Validate environment variables on startup
validateEnv();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

let server;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Create HTTP server
    server = http.createServer(app);

    server.listen(PORT, HOST, () => {
      logger.info(`VoiceMotion AI Backend running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error) => {
      if (error.syscall !== 'listen') throw error;

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async (err) => {
      if (err) {
        logger.error('Error during server close:', err);
        process.exit(1);
      }

      try {
        // Close database connections
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        // Close Redis connection
        const { getRedisClient } = require('./config/redis');
        const redisClient = getRedisClient();
        if (redisClient) {
          await redisClient.quit();
          logger.info('Redis connection closed');
        }

        // Close Bull queues
        try {
          const { transcriptionQueue } = require('./jobs/transcriptionQueue');
          const { analyticsQueue } = require('./jobs/analyticsAggregator');
          const { agentCallQueue } = require('./jobs/agentCallScheduler');
          await Promise.all([
            transcriptionQueue.close(),
            analyticsQueue.close(),
            agentCallQueue.close(),
          ]);
          logger.info('Bull queues closed');
        } catch (queueErr) {
          logger.warn('Could not close queues cleanly:', queueErr.message);
        }

        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (shutdownErr) {
        logger.error('Error during graceful shutdown:', shutdownErr);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
}

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production to keep the server running
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

startServer();
