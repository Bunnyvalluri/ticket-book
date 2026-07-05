import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';
import { emailService } from './email.service.js';
import logger from '../config/logger.js';

class AuthService {
  // Generate access token
  generateAccessToken(userId, role) {
    return jwt.sign({ userId, role }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  // Generate refresh token
  generateRefreshToken(userId) {
    return jwt.sign({ userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  // Hash password
  async hashPassword(password) {
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  // Compare password
  async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }

  // Register
  async register({ firstName, lastName, email, password, phone }) {
    const existing = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (existing) {
      throw new ApiError(409, 'Email already registered');
    }

    const passwordHash = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        phone: phone || null,
        status: 'PENDING_VERIFICATION',
        notificationSettings: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    // Send verification email
    await this.sendVerificationEmail(user.id, user.email, user.firstName);

    return user;
  }

  // Login
  async login({ email, password, rememberMe = false, ipAddress, userAgent }) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) throw new ApiError(401, 'Invalid email or password');
    if (!user.passwordHash) throw new ApiError(401, 'Please use Google login for this account');
    if (user.status === 'BANNED') throw new ApiError(403, 'Account suspended. Contact support.');
    if (user.status === 'INACTIVE') throw new ApiError(403, 'Account deactivated');

    const isMatch = await this.comparePassword(password, user.passwordHash);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh tokens
  async refreshTokens(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, isRevoked: false },
      include: { user: true },
    });

    if (!storedToken || new Date() > storedToken.expiresAt) {
      throw new ApiError(401, 'Refresh token expired or revoked');
    }

    if (storedToken.user.status === 'BANNED') {
      throw new ApiError(403, 'Account suspended');
    }

    // Rotate refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const newAccessToken = this.generateAccessToken(storedToken.user.id, storedToken.user.role);
    const newRefreshToken = this.generateRefreshToken(storedToken.user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt,
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // Logout
  async logout(refreshToken) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }
  }

  // Google OAuth login/register
  async googleAuth({ googleId, email, firstName, lastName, avatarUrl, ipAddress, userAgent }) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
        deletedAt: null,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          firstName,
          lastName,
          avatarUrl,
          status: 'ACTIVE',
          isEmailVerified: true,
          notificationSettings: { create: {} },
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, isEmailVerified: true, status: 'ACTIVE' },
      });
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt, ipAddress, userAgent },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isEmailVerified: true,
      },
      accessToken,
      refreshToken,
    };
  }

  // Send verification email
  async sendVerificationEmail(userId, email, firstName) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.emailVerification.create({
      data: { token, userId, expiresAt },
    });

    await emailService.sendVerificationEmail(email, firstName, token);
  }

  // Verify email
  async verifyEmail(token) {
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) throw new ApiError(400, 'Invalid verification token');
    if (verification.isUsed) throw new ApiError(400, 'Token already used');
    if (new Date() > verification.expiresAt) throw new ApiError(400, 'Token expired');

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { isEmailVerified: true, status: 'ACTIVE' },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { isUsed: true },
      }),
    ]);

    return verification.user;
  }

  // Forgot password
  async forgotPassword(email) {
    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) return; // Silent — don't leak user existence

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Invalidate old tokens
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    await prisma.passwordReset.create({
      data: { token, userId: user.id, expiresAt },
    });

    await emailService.sendPasswordResetEmail(user.email, user.firstName, token);
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) throw new ApiError(400, 'Invalid reset token');
    if (reset.isUsed) throw new ApiError(400, 'Token already used');
    if (new Date() > reset.expiresAt) throw new ApiError(400, 'Reset token expired');

    const passwordHash = await this.hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { isUsed: true },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId },
        data: { isRevoked: true },
      }),
    ]);
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new ApiError(400, 'No password set (social account)');

    const isMatch = await this.comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

    const passwordHash = await this.hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}

export const authService = new AuthService();
