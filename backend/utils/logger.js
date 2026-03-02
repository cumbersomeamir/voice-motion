'use strict';

const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  let log = `${ts} [${level}]: ${message}`;
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

// Log levels aligned with HTTP status severity
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

winston.addColors(customLevels.colors);

function buildTransports() {
  const transports = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  if (!isTest) {
    transports.push(
      new winston.transports.Console({
        format: isProduction
          ? combine(timestamp(), errors({ stack: true }), splat(), json())
          : combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), splat(), devFormat),
      })
    );
  }

  if (isProduction) {
    // Combined log
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: combine(timestamp(), errors({ stack: true }), json()),
        maxsize: 20 * 1024 * 1024, // 20MB
        maxFiles: 14,
        tailable: true,
      })
    );

    // Error log
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: combine(timestamp(), errors({ stack: true }), json()),
        maxsize: 20 * 1024 * 1024,
        maxFiles: 30,
        tailable: true,
      })
    );
  }

  return transports;
}

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  defaultMeta: {
    service: 'voicemotion-ai',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: buildTransports(),
  exitOnError: false,
  silent: process.env.NODE_ENV === 'test' && process.env.LOG_SILENT === 'true',
});

// Stream interface for Morgan HTTP logging
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
