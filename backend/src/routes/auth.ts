import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc Login with booking number and email
 * @access Public
 */
router.post(
  '/login',
  [
    body('bookingNumber').notEmpty().withMessage('Booking number is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }

    const { bookingNumber, email } = req.body;

    logger.info('Login attempt', {
      bookingNumber: bookingNumber.substring(0, 3) + '***', // Partially hide booking number
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Partially hide email
      ip: req.ip
    });

    const result = await authService.loginWithBooking(bookingNumber, email);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @route POST /api/auth/magic-link
 * @desc Send magic link to email
 * @access Public
 */
router.post(
  '/magic-link',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }

    const { email } = req.body;

    logger.info('Magic link requested', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      ip: req.ip
    });

    await authService.sendMagicLink(email);

    res.status(200).json({
      success: true,
      data: {
        message: 'Magic link sent to your email if you have bookings with us'
      }
    });
  })
);

/**
 * @route GET /api/auth/magic-link/verify
 * @desc Verify magic link token
 * @access Public
 */
router.get(
  '/magic-link/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid or missing token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    logger.info('Magic link verification attempt', {
      token: token.substring(0, 10) + '***',
      ip: req.ip
    });

    const result = await authService.verifyMagicLink(token);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Private
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
    }

    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      data: result
    });
  })
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await authService.logout(token);
    }

    logger.info('User logged out', {
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  })
);

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authorization token required',
          code: 'MISSING_TOKEN'
        }
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authorization token required',
          code: 'MISSING_TOKEN'
        }
      });
    }

    try {
      // Verify token
      const decoded = authService.verifyToken(token);
      
      if (!decoded.customerId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token payload',
            code: 'INVALID_TOKEN'
          }
        });
      }

      // Return user data from token (contains basic info)
      const customer = {
        id: decoded.customerId,
        email: decoded.email,
        name: decoded.name
      };
      
      res.status(200).json({
        success: true,
        data: {
          user: customer
        }
      });
    } catch (error: any) {
      logger.error('Failed to get user info', error);
      
      // Handle specific auth errors
      if (error.code === 'TOKEN_EXPIRED' || error.code === 'TOKEN_REVOKED' || error.code === 'INVALID_TOKEN') {
        return res.status(401).json({
          success: false,
          error: {
            message: error.message,
            code: error.code
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get user information',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  })
);

export default router; 