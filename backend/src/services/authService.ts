import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { booqableService } from './booqableService';
import { emailService } from './emailService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

// Types for authentication
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CustomerData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bookings: any[];
}

export interface AuthResult {
  customer: CustomerData;
  tokens: AuthTokens;
}

// In-memory store for magic links and refresh tokens (in production, use Redis)
const magicLinks = new Map<string, { email: string; expiresAt: Date }>();
const refreshTokens = new Set<string>();
const blacklistedTokens = new Set<string>();

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private readonly MAGIC_LINK_EXPIRES_IN = 15 * 60 * 1000; // 15 minutes

  /**
   * Login with booking number and email
   */
  async loginWithBooking(bookingNumber: string, email: string): Promise<AuthResult> {
    try {
      // Verify booking exists and belongs to the email
      const booking = await booqableService.verifyBooking(bookingNumber, email);
      
      if (!booking) {
        throw new AppError('Invalid booking number or email', 401, 'INVALID_CREDENTIALS');
      }

      // Get customer data from Booqable
      const customer = await booqableService.getCustomerByEmail(email);
      
      if (!customer) {
        throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      // Get customer's bookings
      const bookings = await booqableService.getCustomerBookings(customer.id);

      const customerData: CustomerData = {
        id: customer.id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        phone: customer.phone,
        bookings
      };

      // Generate tokens
      const tokens = this.generateTokens(customerData);

      logger.info('Successful login', {
        customerId: customer.id,
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        bookingNumber: bookingNumber.substring(0, 3) + '***'
      });

      return {
        customer: customerData,
        tokens
      };
    } catch (error) {
      logger.error('Login failed', error, {
        bookingNumber: bookingNumber.substring(0, 3) + '***',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      });
      throw error;
    }
  }

  /**
   * Send magic link to email
   */
  async sendMagicLink(email: string): Promise<void> {
    try {
      // Check if customer exists in Booqable
      const customer = await booqableService.getCustomerByEmail(email);
      
      if (!customer) {
        // Don't reveal if email exists or not for security
        logger.warn('Magic link requested for non-existent email', {
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        });
        return;
      }

      // Generate magic link token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + this.MAGIC_LINK_EXPIRES_IN);

      // Store magic link
      magicLinks.set(token, { email, expiresAt });

      // Send email
      const magicLinkUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/magic-link?token=${token}`;
      
      await emailService.sendMagicLink(email, magicLinkUrl);

      logger.info('Magic link sent', {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        token: token.substring(0, 10) + '***'
      });
    } catch (error) {
      logger.error('Failed to send magic link', error, {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      });
      throw error;
    }
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(token: string): Promise<AuthResult> {
    try {
      const magicLink = magicLinks.get(token);
      
      if (!magicLink) {
        throw new AppError('Invalid or expired magic link', 401, 'INVALID_MAGIC_LINK');
      }

      if (magicLink.expiresAt < new Date()) {
        magicLinks.delete(token);
        throw new AppError('Magic link has expired', 401, 'EXPIRED_MAGIC_LINK');
      }

      // Get customer data
      const customer = await booqableService.getCustomerByEmail(magicLink.email);
      
      if (!customer) {
        throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      // Get customer's bookings
      const bookings = await booqableService.getCustomerBookings(customer.id);

      const customerData: CustomerData = {
        id: customer.id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        phone: customer.phone,
        bookings
      };

      // Generate tokens
      const tokens = this.generateTokens(customerData);

      // Clean up used magic link
      magicLinks.delete(token);

      logger.info('Magic link verified successfully', {
        customerId: customer.id,
        email: customer.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      });

      return {
        customer: customerData,
        tokens
      };
    } catch (error) {
      logger.error('Magic link verification failed', error, {
        token: token.substring(0, 10) + '***'
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      if (!refreshTokens.has(refreshToken)) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
      
      // Get fresh customer data
      const customer = await booqableService.getCustomerById(decoded.customerId);
      
      if (!customer) {
        throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
      }

      const customerData: CustomerData = {
        id: customer.id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        phone: customer.phone,
        bookings: [] // Don't need bookings for token refresh
      };

      // Generate new tokens
      const tokens = this.generateTokens(customerData);

      // Remove old refresh token and add new one
      refreshTokens.delete(refreshToken);

      logger.info('Token refreshed', {
        customerId: customer.id
      });

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Logout user (blacklist token)
   */
  async logout(token: string): Promise<void> {
    try {
      // Add token to blacklist
      blacklistedTokens.add(token);

      // Try to decode token to get refresh token info
      const decoded = jwt.decode(token) as any;
      if (decoded?.refreshToken) {
        refreshTokens.delete(decoded.refreshToken);
      }

      logger.info('User logged out', {
        customerId: decoded?.customerId
      });
    } catch (error) {
      logger.error('Logout failed', error);
      // Don't throw error for logout failures
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    if (blacklistedTokens.has(token)) {
      throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
    }

    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error: any) {
      if (error && error.name === 'TokenExpiredError') {
        throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(customer: CustomerData): AuthTokens {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    const accessTokenPayload = {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      type: 'access'
    };

    const refreshTokenPayload = {
      customerId: customer.id,
      type: 'refresh'
    };

    const accessToken = jwt.sign(
      accessTokenPayload, 
      this.JWT_SECRET, 
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const refreshTokenJwt = jwt.sign(
      refreshTokenPayload, 
      this.JWT_SECRET as string, 
      { expiresIn: '7d' }
    );

    // Store refresh token
    refreshTokens.add(refreshTokenJwt);

    return {
      accessToken,
      refreshToken: refreshTokenJwt,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    };
  }

  /**
   * Clean up expired magic links (should be called periodically)
   */
  cleanupExpiredMagicLinks(): void {
    const now = new Date();
    for (const [token, data] of magicLinks.entries()) {
      if (data.expiresAt < now) {
        magicLinks.delete(token);
      }
    }
  }
}

export const authService = new AuthService(); 