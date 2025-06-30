import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { booqableService } from '../services/booqableService';
import { stripeService } from '../services/stripeService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/payments/:bookingId/status
 * @desc Get payment status for a booking
 * @access Private
 */
router.get(
  '/:bookingId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    const paymentStatus = {
      totalAmount: booking.grand_total_in_cents,
      depositAmount: booking.deposit_in_cents,
      paidAmount: booking.total_paid_in_cents || 0,
      remainingBalance: booking.grand_total_in_cents - (booking.total_paid_in_cents || 0),
      depositPaid: (booking.deposit_in_cents || 0) <= (booking.total_paid_in_cents || 0),
      fullyPaid: booking.grand_total_in_cents <= (booking.total_paid_in_cents || 0),
      currency: 'EUR',
      paymentMethods: [], // Will be populated from Stripe
    };

    res.status(200).json({
      success: true,
      data: {
        bookingId,
        paymentStatus
      }
    });
  })
);

/**
 * @route POST /api/payments/:bookingId/setup-intent
 * @desc Create Stripe setup intent for payment method
 * @access Private
 */
router.post(
  '/:bookingId/setup-intent',
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    const setupIntent = await stripeService.createSetupIntent(booking.customer_id);

    logger.info('Setup intent created', {
      bookingId,
      customerId: booking.customer_id,
      setupIntentId: setupIntent.id
    });

    res.status(200).json({
      success: true,
      data: {
        setupIntent: {
          id: setupIntent.id,
          clientSecret: setupIntent.client_secret
        }
      }
    });
  })
);

/**
 * @route POST /api/payments/:bookingId/pay-deposit
 * @desc Process deposit payment
 * @access Private
 */
router.post(
  '/:bookingId/pay-deposit',
  [
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
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

    const bookingId = req.params.bookingId;
    const { paymentMethodId } = req.body;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    // Check if deposit is already paid
    if (booking.deposit_in_cents <= (booking.total_paid_in_cents || 0)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Deposit already paid',
          code: 'DEPOSIT_ALREADY_PAID'
        }
      });
    }

    const paymentResult = await stripeService.processPayment({
      amount: booking.deposit_in_cents,
      currency: 'eur',
      paymentMethodId,
      customerId: booking.customer_id,
      description: `Deposit for booking ${booking.number}`,
      metadata: {
        bookingId,
        type: 'deposit'
      }
    });

    // Update booking with payment info
    await booqableService.updateOrder(bookingId, {
      total_paid_in_cents: (booking.total_paid_in_cents || 0) + booking.deposit_in_cents,
      properties: {
        ...booking.properties,
        payments: {
          ...booking.properties?.payments,
          deposit_paid: true,
          deposit_payment_id: paymentResult.id,
          deposit_paid_at: new Date().toISOString()
        }
      }
    });

    logger.info('Deposit payment processed', {
      bookingId,
      customerId: booking.customer_id,
      amount: booking.deposit_in_cents,
      paymentId: paymentResult.id
    });

    res.status(200).json({
      success: true,
      data: {
        payment: paymentResult,
        message: 'Deposit payment processed successfully'
      }
    });
  })
);

/**
 * @route POST /api/payments/:bookingId/pay-balance
 * @desc Process remaining balance payment
 * @access Private
 */
router.post(
  '/:bookingId/pay-balance',
  [
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
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

    const bookingId = req.params.bookingId;
    const { paymentMethodId } = req.body;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    const remainingBalance = booking.grand_total_in_cents - (booking.total_paid_in_cents || 0);
    
    if (remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No remaining balance to pay',
          code: 'NO_BALANCE_DUE'
        }
      });
    }

    const paymentResult = await stripeService.processPayment({
      amount: remainingBalance,
      currency: 'eur',
      paymentMethodId,
      customerId: booking.customer_id,
      description: `Balance payment for booking ${booking.number}`,
      metadata: {
        bookingId,
        type: 'balance'
      }
    });

    // Update booking with payment info
    await booqableService.updateOrder(bookingId, {
      total_paid_in_cents: booking.grand_total_in_cents,
      properties: {
        ...booking.properties,
        payments: {
          ...booking.properties?.payments,
          balance_paid: true,
          balance_payment_id: paymentResult.id,
          balance_paid_at: new Date().toISOString(),
          fully_paid: true
        }
      }
    });

    logger.info('Balance payment processed', {
      bookingId,
      customerId: booking.customer_id,
      amount: remainingBalance,
      paymentId: paymentResult.id
    });

    res.status(200).json({
      success: true,
      data: {
        payment: paymentResult,
        message: 'Balance payment processed successfully'
      }
    });
  })
);

/**
 * @route POST /api/payments/:bookingId/authorize-deposit
 * @desc Authorize deposit payment (pre-auth)
 * @access Private
 */
router.post(
  '/:bookingId/authorize-deposit',
  [
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
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

    const bookingId = req.params.bookingId;
    const { paymentMethodId } = req.body;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    const authResult = await stripeService.authorizePayment({
      amount: booking.deposit_in_cents,
      currency: 'eur',
      paymentMethodId,
      customerId: booking.customer_id,
      description: `Deposit authorization for booking ${booking.number}`,
      metadata: {
        bookingId,
        type: 'deposit_auth'
      }
    });

    // Update booking with authorization info
    await booqableService.updateOrder(bookingId, {
      properties: {
        ...booking.properties,
        payments: {
          ...booking.properties?.payments,
          deposit_authorized: true,
          deposit_auth_id: authResult.id,
          deposit_authorized_at: new Date().toISOString()
        }
      }
    });

    logger.info('Deposit authorized', {
      bookingId,
      customerId: booking.customer_id,
      amount: booking.deposit_in_cents,
      authId: authResult.id
    });

    res.status(200).json({
      success: true,
      data: {
        authorization: authResult,
        message: 'Deposit authorized successfully'
      }
    });
  })
);

/**
 * @route GET /api/payments/:bookingId/history
 * @desc Get payment history for a booking
 * @access Private
 */
router.get(
  '/:bookingId/history',
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    // Get payment history from Stripe
    const paymentHistory = await stripeService.getPaymentHistory(booking.customer_id, bookingId);

    res.status(200).json({
      success: true,
      data: {
        bookingId,
        payments: paymentHistory
      }
    });
  })
);

export default router; 