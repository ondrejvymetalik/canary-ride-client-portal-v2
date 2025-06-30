import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { booqableService } from '../services/booqableService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/bookings
 * @desc Get all bookings for authenticated customer
 * @access Private
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Add auth middleware to get customer ID from token
    // For now, we'll use a placeholder
    const customerId = req.headers['x-customer-id'] as string;
    
    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    const bookings = await booqableService.getCustomerBookings(customerId);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        total: bookings.length
      }
    });
  })
);

/**
 * @route GET /api/bookings/:id
 * @desc Get specific booking details
 * @access Private
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.id;
    
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

    logger.info('Booking details retrieved', {
      bookingId,
      customerId: booking.customer_id
    });

    res.status(200).json({
      success: true,
      data: booking
    });
  })
);

/**
 * @route GET /api/bookings/current
 * @desc Get current/active bookings
 * @access Private
 */
router.get(
  '/current',
  asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.headers['x-customer-id'] as string;
    
    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    const allBookings = await booqableService.getCustomerBookings(customerId);
    
    // Filter for current/upcoming bookings
    const now = new Date();
    const currentBookings = allBookings.filter(booking => {
      const endDate = new Date(booking.stops_at);
      return endDate >= now;
    });

    res.status(200).json({
      success: true,
      data: {
        bookings: currentBookings,
        total: currentBookings.length
      }
    });
  })
);

/**
 * @route GET /api/bookings/history
 * @desc Get booking history (past bookings)
 * @access Private
 */
router.get(
  '/history',
  asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.headers['x-customer-id'] as string;
    
    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    const allBookings = await booqableService.getCustomerBookings(customerId);
    
    // Filter for past bookings
    const now = new Date();
    const pastBookings = allBookings.filter(booking => {
      const endDate = new Date(booking.stops_at);
      return endDate < now;
    });

    res.status(200).json({
      success: true,
      data: {
        bookings: pastBookings,
        total: pastBookings.length
      }
    });
  })
);

/**
 * @route PUT /api/bookings/:id/update
 * @desc Update booking information (limited fields)
 * @access Private
 */
router.put(
  '/:id/update',
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.id;
    const updateData = req.body;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    // TODO: Add validation for allowed fields
    
    const updatedBooking = await booqableService.updateOrder(bookingId, updateData);
    
    logger.info('Booking updated', {
      bookingId,
      customerId: updatedBooking.customer_id
    });

    res.status(200).json({
      success: true,
      data: updatedBooking
    });
  })
);

export default router; 