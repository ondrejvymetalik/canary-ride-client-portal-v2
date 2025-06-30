import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { whipAroundService } from '../services/whipAroundService';
import { booqableService } from '../services/booqableService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/inspections/:bookingId
 * @desc Get all inspections for a booking
 * @access Private
 */
router.get(
  '/:bookingId',
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

    // Get inspections from Whip Around
    const inspections = await whipAroundService.getInspectionsByBooking(bookingId);

    logger.info('Inspections retrieved', {
      bookingId,
      customerId: booking.customer_id,
      inspectionsCount: inspections.length
    });

    res.status(200).json({
      success: true,
      data: {
        bookingId,
        inspections
      }
    });
  })
);

/**
 * @route GET /api/inspections/:bookingId/handover
 * @desc Get handover inspection (before rental)
 * @access Private
 */
router.get(
  '/:bookingId/handover',
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

    // Get handover inspection
    const handoverInspection = await whipAroundService.getHandoverInspection(bookingId);

    if (!handoverInspection) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Handover inspection not found',
          code: 'HANDOVER_INSPECTION_NOT_FOUND'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bookingId,
        inspection: handoverInspection
      }
    });
  })
);

/**
 * @route GET /api/inspections/:bookingId/return
 * @desc Get return inspection (after rental)
 * @access Private
 */
router.get(
  '/:bookingId/return',
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

    // Get return inspection
    const returnInspection = await whipAroundService.getReturnInspection(bookingId);

    if (!returnInspection) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Return inspection not found',
          code: 'RETURN_INSPECTION_NOT_FOUND'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bookingId,
        inspection: returnInspection
      }
    });
  })
);

/**
 * @route GET /api/inspections/:bookingId/photos
 * @desc Get all inspection photos for a booking
 * @access Private
 */
router.get(
  '/:bookingId/photos',
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    const { type } = req.query; // 'handover' or 'return'
    
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

    // Get inspection photos
    const photos = await whipAroundService.getInspectionPhotos(bookingId, type as string);

    res.status(200).json({
      success: true,
      data: {
        bookingId,
        type,
        photos
      }
    });
  })
);

/**
 * @route GET /api/inspections/:bookingId/damages
 * @desc Get damage reports for a booking
 * @access Private
 */
router.get(
  '/:bookingId/damages',
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

    // Get damage reports
    const damages = await whipAroundService.getDamageReports(bookingId);

    res.status(200).json({
      success: true,
      data: {
        bookingId,
        damages
      }
    });
  })
);

/**
 * @route GET /api/inspections/:bookingId/summary
 * @desc Get inspection summary for a booking
 * @access Private
 */
router.get(
  '/:bookingId/summary',
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

    // Get inspection summary
    const summary = await whipAroundService.getInspectionSummary(bookingId);

    res.status(200).json({
      success: true,
      data: {
        bookingId,
        summary
      }
    });
  })
);

export default router; 