import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production configuration (should use real SMTP)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development configuration (uses ethereal email for testing)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass',
        },
      });
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLink(email: string, magicLinkUrl: string): Promise<void> {
    const subject = 'Your Canary Ride Login Link';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Canary Ride - Login Link</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #ff6b35; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏍️ Canary Ride</h1>
          </div>
          <div class="content">
            <h2>Access Your Bookings</h2>
            <p>Hello,</p>
            <p>Click the button below to securely access your Canary Ride bookings and manage your motorcycle rentals:</p>
            <div style="text-align: center;">
              <a href="${magicLinkUrl}" class="button">Access My Bookings</a>
            </div>
            <p><strong>This link expires in 15 minutes</strong> for your security.</p>
            <p>If you didn't request this link, you can safely ignore this email.</p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${magicLinkUrl}</p>
          </div>
          <div class="footer">
            <p>🌴 Canary Ride - Premium Motorcycle Rentals in the Canary Islands</p>
            <p>📧 info@canaryride.com | 📞 +34 828 685 006 (Gran Canaria) | +34 822 680 805 (Tenerife)</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Canary Ride - Access Your Bookings
      
      Hello,
      
      Click the link below to securely access your Canary Ride bookings:
      ${magicLinkUrl}
      
      This link expires in 15 minutes for your security.
      
      If you didn't request this link, you can safely ignore this email.
      
      Best regards,
      Canary Ride Team
      
      info@canaryride.com
      +34 828 685 006 (Gran Canaria)
      +34 822 680 805 (Tenerife)
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send check-in reminder email
   */
  async sendCheckinReminder(email: string, bookingNumber: string, checkInUrl: string): Promise<void> {
    const subject = `Complete Your Check-in - Booking ${bookingNumber}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Canary Ride - Check-in Required</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #ff6b35; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .highlight { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏍️ Canary Ride</h1>
          </div>
          <div class="content">
            <h2>Complete Your Check-in</h2>
            <p>Hello,</p>
            <p>Your motorcycle rental is coming up soon! Please complete your online check-in for booking <strong>${bookingNumber}</strong>.</p>
            
            <div class="highlight">
              <strong>⚠️ Action Required:</strong> Complete check-in before your rental pickup to ensure a smooth experience.
            </div>
            
            <p>During check-in, you'll need to:</p>
            <ul>
              <li>Upload your driving license</li>
              <li>Fill out rental forms</li>
              <li>Sign terms and conditions</li>
              <li>Complete any pending payments</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${checkInUrl}" class="button">Complete Check-in</a>
            </div>
            
            <p>If you have any questions, don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>🌴 Canary Ride - Premium Motorcycle Rentals in the Canary Islands</p>
            <p>📧 info@canaryride.com | 📞 +34 828 685 006 (Gran Canaria) | +34 822 680 805 (Tenerife)</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Canary Ride - Complete Your Check-in
      
      Hello,
      
      Your motorcycle rental is coming up soon! Please complete your online check-in for booking ${bookingNumber}.
      
      Complete check-in at: ${checkInUrl}
      
      During check-in, you'll need to:
      - Upload your driving license
      - Fill out rental forms
      - Sign terms and conditions
      - Complete any pending payments
      
      Best regards,
      Canary Ride Team
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(email: string, bookingNumber: string, amount: number, paymentUrl: string): Promise<void> {
    const subject = `Payment Required - Booking ${bookingNumber}`;
    const amountFormatted = (amount / 100).toFixed(2);
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Canary Ride - Payment Required</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #ff6b35; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .amount { font-size: 24px; font-weight: bold; color: #ff6b35; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏍️ Canary Ride</h1>
          </div>
          <div class="content">
            <h2>Payment Required</h2>
            <p>Hello,</p>
            <p>You have a pending payment for your booking <strong>${bookingNumber}</strong>.</p>
            
            <div class="amount">€${amountFormatted}</div>
            
            <p>Please complete your payment to confirm your motorcycle rental.</p>
            
            <div style="text-align: center;">
              <a href="${paymentUrl}" class="button">Pay Now</a>
            </div>
            
            <p>If you have any questions about your booking or payment, please contact us.</p>
          </div>
          <div class="footer">
            <p>🌴 Canary Ride - Premium Motorcycle Rentals in the Canary Islands</p>
            <p>📧 info@canaryride.com | 📞 +34 828 685 006 (Gran Canaria) | +34 822 680 805 (Tenerife)</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send generic email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME || 'Canary Ride'} <${process.env.FROM_EMAIL || 'noreply@canaryride.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: options.to.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        subject: options.subject,
        messageId: info.messageId,
        ...(process.env.NODE_ENV === 'development' && {
          previewUrl: nodemailer.getTestMessageUrl(info)
        })
      });

      // In development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info(`📧 Email preview: ${previewUrl}`);
        }
      }
    } catch (error) {
      logger.error('Failed to send email', error, {
        to: options.to.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        subject: options.subject,
      });
      throw new AppError('Failed to send email', 500, 'EMAIL_SEND_FAILED');
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', error);
      return false;
    }
  }
}

export const emailService = new EmailService(); 