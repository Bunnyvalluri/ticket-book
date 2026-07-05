import winston from 'winston';
import { config } from './index.js';

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${stack || message}`;
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  return log;
});

const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat()
  ),
  transports: [
    new winston.transports.Console({
      format: config.isDevelopment
        ? combine(colorize(), devFormat)
        : combine(json()),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(json()),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

export default logger;
