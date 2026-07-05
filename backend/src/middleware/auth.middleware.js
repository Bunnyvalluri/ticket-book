import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

// Verify access token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        avatarUrl: true,
      },
    });

    if (!user) throw new ApiError(401, 'User not found');
    if (user.status === 'BANNED') throw new ApiError(403, 'Account suspended');
    if (user.status === 'INACTIVE') throw new ApiError(403, 'Account inactive');

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired', 'TOKEN_EXPIRED'));
    }
    next(error);
  }
};

// Optional auth — doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.accessToken;

    if (!token) return next();

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    req.user = user;
    next();
  } catch {
    next();
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
};

// Require verified email
export const requireEmailVerified = (req, res, next) => {
  if (!req.user?.isEmailVerified) {
    return next(new ApiError(403, 'Please verify your email first'));
  }
  next();
};
