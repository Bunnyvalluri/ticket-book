import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    if (config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      logger.info('Email service initialized');
    } else {
      logger.warn('SMTP credentials not configured. Emails will be logged to console.');
    }
  }

  async sendMail({ to, subject, html, attachments = [] }) {
    if (!this.transporter) {
      logger.info(`[EMAIL - DEV MODE]\nTo: ${to}\nSubject: ${subject}`);
      return { messageId: 'dev-mode', preview: 'Email logged to console' };
    }

    const mailOptions = {
      from: `"${config.smtp.fromName}" <${config.smtp.from}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await this.transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  }

  async sendVerificationEmail(to, firstName, token) {
    const verifyUrl = `${config.cors.origins[0]}/verify-email?token=${token}`;
    await this.sendMail({
      to,
      subject: '🎬 Verify your CineMax account',
      html: this.getVerificationTemplate(firstName, verifyUrl),
    });
  }

  async sendPasswordResetEmail(to, firstName, token) {
    const resetUrl = `${config.cors.origins[0]}/reset-password?token=${token}`;
    await this.sendMail({
      to,
      subject: '🔐 Reset your CineMax password',
      html: this.getPasswordResetTemplate(firstName, resetUrl),
    });
  }

  async sendBookingConfirmation(to, firstName, booking, pdfBuffer) {
    await this.sendMail({
      to,
      subject: `🎫 Booking Confirmed - ${booking.bookingNumber}`,
      html: this.getBookingConfirmationTemplate(firstName, booking),
      attachments: pdfBuffer
        ? [
            {
              filename: `ticket-${booking.bookingNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        : [],
    });
  }

  async sendCancellationEmail(to, firstName, booking) {
    await this.sendMail({
      to,
      subject: `❌ Booking Cancelled - ${booking.bookingNumber}`,
      html: this.getCancellationTemplate(firstName, booking),
    });
  }

  // =====================
  // EMAIL TEMPLATES
  // =====================

  baseTemplate(content) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2d2d4a; }
        .header { background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 32px; text-align: center; }
        .header h1 { color: white; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px; }
        .body { padding: 32px; }
        .body h2 { color: #e2e8f0; font-size: 22px; margin-bottom: 16px; }
        .body p { color: #94a3b8; line-height: 1.7; margin-bottom: 16px; }
        .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 16px 0; }
        .info-box { background: #16213e; border: 1px solid #2d2d4a; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2d2d4a; }
        .info-row:last-child { border-bottom: none; }
        .label { color: #64748b; font-size: 13px; }
        .value { color: #e2e8f0; font-weight: 600; font-size: 13px; }
        .footer { padding: 24px 32px; text-align: center; color: #475569; font-size: 12px; background: #0f0f1a; }
        .divider { height: 1px; background: #2d2d4a; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>🎬 CineMax</h1>
            <p>Your Premium Movie Booking Experience</p>
          </div>
          <div class="body">
            ${content}
          </div>
          <div class="footer">
            <p>© 2026 CineMax. All rights reserved.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>`;
  }

  getVerificationTemplate(firstName, url) {
    return this.baseTemplate(`
      <h2>Welcome, ${firstName}! 🎉</h2>
      <p>You're one step away from booking your first movie. Verify your email to get started.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${url}" class="btn">✓ Verify Email Address</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">This link expires in 24 hours. If you didn't sign up for CineMax, you can safely ignore this email.</p>
    `);
  }

  getPasswordResetTemplate(firstName, url) {
    return this.baseTemplate(`
      <h2>Reset Your Password</h2>
      <p>Hi ${firstName}, we received a request to reset your password. Click the button below to create a new one.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${url}" class="btn">🔐 Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">This link expires in 1 hour. If you didn't request a password reset, please secure your account.</p>
    `);
  }

  getBookingConfirmationTemplate(firstName, booking) {
    const seats = booking.seats?.map((s) => s.label).join(', ') || '';
    return this.baseTemplate(`
      <h2>Booking Confirmed! 🎫</h2>
      <p>Great news, ${firstName}! Your booking is confirmed. See you at the movies!</p>
      <div class="info-box">
        <div class="info-row"><span class="label">Booking ID</span><span class="value">${booking.bookingNumber}</span></div>
        <div class="info-row"><span class="label">Movie</span><span class="value">${booking.show?.movie?.title || ''}</span></div>
        <div class="info-row"><span class="label">Theatre</span><span class="value">${booking.show?.screen?.theatre?.name || ''}</span></div>
        <div class="info-row"><span class="label">Date & Time</span><span class="value">${new Date(booking.show?.startTime).toLocaleString('en-IN')}</span></div>
        <div class="info-row"><span class="label">Seats</span><span class="value">${seats}</span></div>
        <div class="info-row"><span class="label">Amount Paid</span><span class="value">₹${booking.grandTotal?.toFixed(2)}</span></div>
      </div>
      <p style="font-size: 13px; color: #64748b;">Your e-ticket with QR code is attached to this email. Show it at the theatre entrance.</p>
    `);
  }

  getCancellationTemplate(firstName, booking) {
    return this.baseTemplate(`
      <h2>Booking Cancelled</h2>
      <p>Hi ${firstName}, your booking <strong>${booking.bookingNumber}</strong> has been cancelled.</p>
      <div class="info-box">
        <div class="info-row"><span class="label">Booking ID</span><span class="value">${booking.bookingNumber}</span></div>
        <div class="info-row"><span class="label">Refund Amount</span><span class="value">₹${booking.grandTotal?.toFixed(2)}</span></div>
        <div class="info-row"><span class="label">Refund Status</span><span class="value">Processing (3-5 business days)</span></div>
      </div>
    `);
  }
}

export const emailService = new EmailService();
