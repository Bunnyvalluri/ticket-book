import logger from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/index.js';

// Global error handler
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    error = new ApiError(409, `${field} already exists`);
  }

  if (err.code === 'P2025') {
    error = new ApiError(404, 'Record not found');
  }

  if (err.code === 'P2003') {
    error = new ApiError(400, 'Invalid reference: related record not found');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    error = new ApiError(400, message);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errorCode: error.errorCode || null,
    ...(config.isDevelopment && { stack: err.stack }),
  });
};

// 404 handler
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};
