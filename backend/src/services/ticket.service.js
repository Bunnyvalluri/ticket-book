import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

class TicketService {
  // Generate QR Code as base64 data URL
  async generateQRCode(data) {
    try {
      const qrData = JSON.stringify({
        bookingId: data.bookingId,
        bookingNumber: data.bookingNumber,
        userId: data.userId,
        showId: data.showId,
        seats: data.seats,
        timestamp: Date.now(),
      });

      const qrDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        color: {
          dark: '#1a1a2e',
          light: '#ffffff',
        },
        width: 300,
      });

      return qrDataUrl;
    } catch (error) {
      logger.error('QR generation failed:', error);
      throw error;
    }
  }

  // Generate QR Code as buffer
  async generateQRBuffer(data) {
    const qrData = JSON.stringify({
      bookingId: data.bookingId,
      bookingNumber: data.bookingNumber,
    });
    return QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      width: 300,
    });
  }

  // Generate PDF Ticket
  async generatePDFTicket(booking) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [600, 850],
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Background
        doc.rect(0, 0, 600, 850).fill('#0f0f1a');

        // Gradient header bar
        const gradient = doc.linearGradient(0, 0, 600, 0);
        gradient.stop(0, '#7c3aed');
        gradient.stop(1, '#ec4899');
        doc.rect(0, 0, 600, 160).fill(gradient);

        // Logo / App Name
        doc.fontSize(32).font('Helvetica-Bold').fillColor('white')
          .text('🎬 CineMax', 40, 40);
        doc.fontSize(13).font('Helvetica').fillColor('rgba(255,255,255,0.8)')
          .text('Your Premium Ticket', 40, 80);

        // Booking Number
        doc.fontSize(12).font('Helvetica').fillColor('rgba(255,255,255,0.7)')
          .text('BOOKING ID', 400, 50);
        doc.fontSize(16).font('Helvetica-Bold').fillColor('white')
          .text(booking.bookingNumber, 400, 68);

        // Movie Banner background
        doc.rect(0, 160, 600, 200).fill('#16213e');

        // Movie Title
        doc.fontSize(26).font('Helvetica-Bold').fillColor('#e2e8f0')
          .text(booking.show?.movie?.title || 'Movie Title', 40, 185, { width: 520 });

        // Details section
        const details = [
          { label: 'Date & Time', value: new Date(booking.show?.startTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) },
          { label: 'Theatre', value: booking.show?.screen?.theatre?.name || '' },
          { label: 'Screen', value: `${booking.show?.screen?.name || ''} • ${booking.show?.format || '2D'}` },
          { label: 'Language', value: booking.show?.language?.name || '' },
          { label: 'Seats', value: booking.seats?.map((s) => s.seat?.label).join(', ') || '' },
          { label: 'Seat Type', value: booking.seats?.[0]?.seatType || 'STANDARD' },
        ];

        let y = 380;
        doc.fontSize(11).font('Helvetica').fillColor('#64748b');

        details.forEach(({ label, value }) => {
          // Divider
          doc.moveTo(40, y - 8).lineTo(560, y - 8).strokeColor('#2d2d4a').lineWidth(1).stroke();

          doc.fillColor('#64748b').text(label.toUpperCase(), 40, y, { width: 200 });
          doc.fillColor('#e2e8f0').font('Helvetica-Bold').text(value, 240, y, { width: 320 });
          doc.font('Helvetica');
          y += 40;
        });

        // Price Section
        doc.rect(40, y + 10, 520, 130).fill('#16213e').strokeColor('#2d2d4a').lineWidth(1).stroke();

        doc.fontSize(11).font('Helvetica').fillColor('#64748b');
        const priceY = y + 26;

        const priceRows = [
          { label: 'Ticket Price', value: `₹${(booking.totalAmount || 0).toFixed(2)}` },
          { label: 'Convenience Fee', value: `₹${(booking.convenienceFee || 0).toFixed(2)}` },
          { label: 'GST (18%)', value: `₹${(booking.gstAmount || 0).toFixed(2)}` },
        ];

        priceRows.forEach(({ label, value }, i) => {
          doc.fillColor('#64748b').font('Helvetica').text(label, 60, priceY + i * 26);
          doc.fillColor('#94a3b8').text(value, 420, priceY + i * 26, { align: 'right', width: 120 });
        });

        // Total line
        doc.moveTo(60, priceY + 78).lineTo(540, priceY + 78).strokeColor('#7c3aed').lineWidth(2).stroke();
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#7c3aed')
          .text('TOTAL AMOUNT', 60, priceY + 90);
        doc.fillColor('#e2e8f0').text(`₹${(booking.grandTotal || 0).toFixed(2)}`, 420, priceY + 90, { align: 'right', width: 120 });

        y = priceY + 160;

        // QR Code
        try {
          const qrBuffer = await this.generateQRBuffer({
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
          });
          doc.image(qrBuffer, 220, y, { width: 160, height: 160 });
        } catch (e) {
          logger.warn('QR code in PDF failed:', e.message);
        }

        doc.fontSize(11).font('Helvetica').fillColor('#64748b')
          .text('Scan QR code at the theatre entrance', 40, y + 170, {
            width: 520,
            align: 'center',
          });

        // Perforated line
        doc.moveTo(40, y + 200).lineTo(560, y + 200)
          .strokeColor('#2d2d4a').lineWidth(1).dash(6, { space: 4 }).stroke();

        // Footer
        doc.fontSize(10).fillColor('#475569')
          .text(
            `Transaction ID: ${booking.payment?.razorpayPaymentId || 'N/A'} • Generated: ${new Date().toLocaleString('en-IN')}`,
            40,
            y + 216,
            { width: 520, align: 'center' }
          );

        doc.end();
      } catch (error) {
        logger.error('PDF generation failed:', error);
        reject(error);
      }
    });
  }
}

export const ticketService = new TicketService();
