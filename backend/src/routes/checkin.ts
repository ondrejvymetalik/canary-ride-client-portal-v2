import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { booqableService } from '../services/booqableService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/checkin/:bookingId/status
 * @desc Get check-in status for a booking
 * @access Private
 */
router.get(
  '/:bookingId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking || !booking.customer_id) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    // Check check-in status from booking properties
    const checkinData = booking.properties?.checkin || {};
    
    // Define check-in steps
    const steps = [
      {
        id: 'documents',
        name: 'documents',
        title: 'Document Details',
        description: 'Provide driving license and ID details',
        isRequired: true,
        isCompleted: !!checkinData.documents_completed,
        completedAt: checkinData.documents_completed_at || null,
        order: 0
      },
      {
        id: 'forms',
        name: 'forms',
        title: 'Personal Information',
        description: 'Emergency contact and preferences',
        isRequired: true,
        isCompleted: !!checkinData.forms_completed,
        completedAt: checkinData.forms_completed_at || null,
        order: 1
      },
      {
        id: 'terms',
        name: 'terms',
        title: 'Terms & Conditions',
        description: 'Accept rental agreement',
        isRequired: true,
        isCompleted: !!checkinData.terms_accepted,
        completedAt: checkinData.terms_accepted_at || null,
        order: 2
      }
    ];

    const checkinStatus = {
      id: `checkin_${bookingId}`,
      bookingId,
      isComplete: !!checkinData.completed,
      documentsCompleted: !!checkinData.documents_completed,
      formsCompleted: !!checkinData.forms_completed,
      termsAccepted: !!checkinData.terms_accepted,
      completedAt: checkinData.completed_at || null,
      steps
    };

    res.status(200).json({
      success: true,
      data: checkinStatus
    });
  })
);

/**
 * @route POST /api/checkin/:bookingId/documents
 * @desc Submit document details (driving license and identity document)
 * @access Private
 */
router.post(
  '/:bookingId/documents',
  [
    body('drivingLicense.number').notEmpty().withMessage('Driving license number is required'),
    body('drivingLicense.expiryDate').isISO8601().withMessage('Valid driving license expiry date is required'),
    body('drivingLicense.issuingCountry').notEmpty().withMessage('Driving license issuing country is required'),
    body('identityDocument.type').isIn(['passport', 'national_id']).withMessage('Valid identity document type is required'),
    body('identityDocument.number').notEmpty().withMessage('Identity document number is required'),
    body('identityDocument.issuingCountry').notEmpty().withMessage('Identity document issuing country is required'),
    body('identityDocument.expiryDate').optional().isISO8601().withMessage('Valid expiry date is required'),
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
    const { drivingLicense, identityDocument } = req.body;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking || !booking.customer_id) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    // Validate driving license expiry
    const licenseExpiry = new Date(drivingLicense.expiryDate);
    if (licenseExpiry <= new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Driving license has expired',
          code: 'EXPIRED_LICENSE'
        }
      });
    }

    // Validate passport expiry if provided
    if (identityDocument.type === 'passport' && identityDocument.expiryDate) {
      const passportExpiry = new Date(identityDocument.expiryDate);
      if (passportExpiry <= new Date()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Passport has expired',
            code: 'EXPIRED_PASSPORT'
          }
        });
      }
    }

    // Update booking with document details
    const checkinData = booking.properties?.checkin || {};
    checkinData.documents_completed = true;
    checkinData.documents_completed_at = new Date().toISOString();
    checkinData.driving_license = drivingLicense;
    checkinData.identity_document = identityDocument;

    // Store document details in booking properties for later use
    // (Custom fields will be set at checkout time)
    const documentProperties: any = {
      driving_license_number: drivingLicense.number,
      driving_license_expiry: drivingLicense.expiryDate,
      driving_license_country: drivingLicense.issuingCountry,
      identity_document_type: identityDocument.type,
      identity_document_number: identityDocument.number,
      identity_document_country: identityDocument.issuingCountry,
    };
    
    if (identityDocument.expiryDate) {
      documentProperties.identity_document_expiry = identityDocument.expiryDate;
    }

    checkinData.document_details = documentProperties;

    await booqableService.updateOrder(bookingId as string, {
      properties: {
        ...booking.properties,
        checkin: checkinData
      }
    });

    logger.info('Check-in document details submitted', {
      bookingId,
      customerId: booking.customer_id,
      hasLicense: !!drivingLicense.number,
      hasIdentityDoc: !!identityDocument.number
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Document details saved successfully'
      }
    });
  })
);

/**
 * @route POST /api/checkin/:bookingId/forms
 * @desc Submit check-in forms (including emergency contact and document details)
 * @access Private
 */
router.post(
  '/:bookingId/forms',
  [
    body('emergencyContact.name').notEmpty().withMessage('Emergency contact name is required'),
    body('emergencyContact.phone').notEmpty().withMessage('Emergency contact phone is required'),
    body('emergencyContact.relationship').notEmpty().withMessage('Emergency contact relationship is required'),
    body('ridingExperience').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Valid riding experience is required'),
    body('medicalConditions').optional().isString(),
    body('specialRequests').optional().isString(),
    body('pickupTime').notEmpty().withMessage('Pickup time is required'),
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
    const formData = req.body;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking || !booking.customer_id) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    // Update booking with form data
    const checkinData = booking.properties?.checkin || {};
    checkinData.forms_completed = true;
    checkinData.forms_completed_at = new Date().toISOString();
    checkinData.forms_data = formData;

    await booqableService.updateOrder(bookingId, {
      properties: {
        ...booking.properties,
        checkin: checkinData
      }
    });

    logger.info('Check-in forms submitted', {
      bookingId,
      customerId: booking.customer_id
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Forms submitted successfully'
      }
    });
  })
);

/**
 * @route POST /api/checkin/:bookingId/terms
 * @desc Accept terms and conditions
 * @access Private
 */
router.post(
  '/:bookingId/terms',
  [
    body('termsAccepted').isBoolean().withMessage('Terms acceptance is required'),
    body('rentalAgreementSigned').isBoolean().withMessage('Rental agreement signature is required'),
    body('signature').notEmpty().withMessage('Digital signature is required'),
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
    const { termsAccepted, rentalAgreementSigned, signature } = req.body;
    
    if (!termsAccepted || !rentalAgreementSigned) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Terms and rental agreement must be accepted',
          code: 'TERMS_NOT_ACCEPTED'
        }
      });
    }

    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking || !booking.customer_id) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    // Update booking with terms acceptance
    const checkinData = booking.properties?.checkin || {};
    checkinData.terms_accepted = true;
    checkinData.rental_agreement_signed = true;
    checkinData.signature = signature;
    checkinData.terms_accepted_at = new Date().toISOString();

    await booqableService.updateOrder(bookingId, {
      properties: {
        ...booking.properties,
        checkin: checkinData
      }
    });

    logger.info('Terms and conditions accepted', {
      bookingId,
      customerId: booking.customer_id
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Terms and conditions accepted successfully'
      }
    });
  })
);

/**
 * @route POST /api/checkin/:bookingId/complete
 * @desc Complete the check-in process
 * @access Private
 */
router.post(
  '/:bookingId/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    
    // TODO: Add auth middleware and verify booking belongs to customer
    const booking = await booqableService.getOrderById(bookingId);
    
    if (!booking || !booking.customer_id) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      });
    }

    const checkinData = booking.properties?.checkin || {};
    
    // Verify all required steps are completed
    if (!checkinData.documents_completed || !checkinData.forms_completed || !checkinData.terms_accepted) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'All check-in steps must be completed first',
          code: 'CHECKIN_INCOMPLETE'
        }
      });
    }

    // Mark check-in as completed
    checkinData.completed = true;
    checkinData.completed_at = new Date().toISOString();

    await booqableService.updateOrder(bookingId, {
      properties: {
        ...booking.properties,
        checkin: checkinData
      }
    });

    logger.info('Check-in completed', {
      bookingId,
      customerId: booking.customer_id
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Check-in completed successfully',
        completedAt: checkinData.completed_at
      }
    });
  })
);

export default router; 