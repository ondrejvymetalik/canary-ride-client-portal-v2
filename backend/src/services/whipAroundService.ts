import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

// Whip Around API types
export interface WhipAroundInspection {
  id: string;
  type: 'handover' | 'return' | 'maintenance';
  vehicleId: string;
  bookingReference: string;
  inspectorName: string;
  inspectionDate: string;
  status: string;
  mileage?: number;
  fuelLevel?: number;
  notes?: string;
  photos: WhipAroundPhoto[];
  damages: WhipAroundDamage[];
  checklist: WhipAroundChecklistItem[];
}

export interface WhipAroundPhoto {
  id: string;
  url: string;
  filename: string;
  category: string;
  timestamp: string;
  inspectionId: string;
}

export interface WhipAroundDamage {
  id: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  location: string;
  photos: string[];
  estimatedCost?: number;
  inspectionId: string;
}

export interface WhipAroundChecklistItem {
  id: string;
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'attention';
  notes?: string;
  photos?: string[];
}

export interface WhipAroundSummary {
  bookingId: string;
  vehicleId: string;
  handoverInspection?: WhipAroundInspection;
  returnInspection?: WhipAroundInspection;
  totalDamages: number;
  newDamages: number;
  totalPhotos: number;
  mileageDifference?: number;
}

class WhipAroundService {
  private api: AxiosInstance;
  private readonly baseURL: string;
  private readonly apiKey: string;

  constructor() {
    this.baseURL = process.env.WHIP_AROUND_API_URL || 'https://api.whiparound.com/v1';
    this.apiKey = process.env.WHIP_AROUND_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('WHIP_AROUND_API_KEY is required');
    }

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Version': '1.0',
      },
      timeout: 30000, // 30 seconds
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        logger.debug('Whip Around API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('Whip Around API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.api.interceptors.response.use(
      (response) => {
        logger.debug('Whip Around API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('Whip Around API error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });

        // Transform Whip Around errors to our error format
        if (error.response?.status === 401) {
          throw new AppError('Unauthorized Whip Around API access', 500, 'WHIP_AROUND_UNAUTHORIZED');
        }
        if (error.response?.status === 404) {
          throw new AppError('Inspection not found in Whip Around', 404, 'WHIP_AROUND_NOT_FOUND');
        }
        if (error.response?.status >= 500) {
          throw new AppError('Whip Around service unavailable', 503, 'WHIP_AROUND_UNAVAILABLE');
        }

        throw new AppError('Whip Around API error', 500, 'WHIP_AROUND_ERROR');
      }
    );
  }

  /**
   * Get all inspections for a booking
   */
  async getInspectionsByBooking(bookingId: string): Promise<WhipAroundInspection[]> {
    try {
      const response = await this.api.get('/inspections', {
        params: {
          booking_reference: bookingId,
        },
      });

      const inspections = response.data?.data || [];
      
      return inspections.map((inspection: any) => this.transformInspection(inspection));
    } catch (error) {
      logger.error('Failed to get inspections by booking', error, { bookingId });
      throw error;
    }
  }

  /**
   * Get handover inspection (before rental)
   */
  async getHandoverInspection(bookingId: string): Promise<WhipAroundInspection | null> {
    try {
      const response = await this.api.get('/inspections', {
        params: {
          booking_reference: bookingId,
          type: 'handover',
        },
      });

      const inspections = response.data?.data || [];
      
      if (inspections.length === 0) {
        return null;
      }

      return this.transformInspection(inspections[0]);
    } catch (error) {
      logger.error('Failed to get handover inspection', error, { bookingId });
      throw error;
    }
  }

  /**
   * Get return inspection (after rental)
   */
  async getReturnInspection(bookingId: string): Promise<WhipAroundInspection | null> {
    try {
      const response = await this.api.get('/inspections', {
        params: {
          booking_reference: bookingId,
          type: 'return',
        },
      });

      const inspections = response.data?.data || [];
      
      if (inspections.length === 0) {
        return null;
      }

      return this.transformInspection(inspections[0]);
    } catch (error) {
      logger.error('Failed to get return inspection', error, { bookingId });
      throw error;
    }
  }

  /**
   * Get inspection photos
   */
  async getInspectionPhotos(bookingId: string, type?: string): Promise<WhipAroundPhoto[]> {
    try {
      const params: any = {
        booking_reference: bookingId,
      };

      if (type) {
        params.inspection_type = type;
      }

      const response = await this.api.get('/inspections/photos', { params });

      const photos = response.data?.data || [];
      
      return photos.map((photo: any) => this.transformPhoto(photo));
    } catch (error) {
      logger.error('Failed to get inspection photos', error, { bookingId, type });
      throw error;
    }
  }

  /**
   * Get damage reports
   */
  async getDamageReports(bookingId: string): Promise<WhipAroundDamage[]> {
    try {
      const response = await this.api.get('/damages', {
        params: {
          booking_reference: bookingId,
        },
      });

      const damages = response.data?.data || [];
      
      return damages.map((damage: any) => this.transformDamage(damage));
    } catch (error) {
      logger.error('Failed to get damage reports', error, { bookingId });
      throw error;
    }
  }

  /**
   * Get inspection summary
   */
  async getInspectionSummary(bookingId: string): Promise<WhipAroundSummary> {
    try {
      // Get all inspections for the booking
      const inspections = await this.getInspectionsByBooking(bookingId);
      
      const handoverInspection = inspections.find(i => i.type === 'handover');
      const returnInspection = inspections.find(i => i.type === 'return');
      
      // Get damages
      const damages = await this.getDamageReports(bookingId);
      
      // Calculate new damages (damages found in return but not in handover)
      const handoverDamages = handoverInspection?.damages || [];
      const returnDamages = returnInspection?.damages || [];
      const newDamages = returnDamages.filter(damage => 
        !handoverDamages.some(hd => hd.location === damage.location && hd.category === damage.category)
      );

      // Calculate total photos
      const totalPhotos = inspections.reduce((total, inspection) => total + inspection.photos.length, 0);

      // Calculate mileage difference
      let mileageDifference: number | undefined;
      if (handoverInspection?.mileage && returnInspection?.mileage) {
        mileageDifference = returnInspection.mileage - handoverInspection.mileage;
      }

      const summary: WhipAroundSummary = {
        bookingId,
        vehicleId: handoverInspection?.vehicleId || returnInspection?.vehicleId || '',
        handoverInspection,
        returnInspection,
        totalDamages: damages.length,
        newDamages: newDamages.length,
        totalPhotos,
        mileageDifference,
      };

      return summary;
    } catch (error) {
      logger.error('Failed to get inspection summary', error, { bookingId });
      throw error;
    }
  }

  /**
   * Transform Whip Around inspection to our format
   */
  private transformInspection(inspection: any): WhipAroundInspection {
    return {
      id: inspection.id,
      type: inspection.type || 'handover',
      vehicleId: inspection.vehicle_id,
      bookingReference: inspection.booking_reference,
      inspectorName: inspection.inspector_name || 'Unknown',
      inspectionDate: inspection.created_at || new Date().toISOString(),
      status: inspection.status || 'completed',
      mileage: inspection.mileage,
      fuelLevel: inspection.fuel_level,
      notes: inspection.notes,
      photos: (inspection.photos || []).map((photo: any) => this.transformPhoto(photo)),
      damages: (inspection.damages || []).map((damage: any) => this.transformDamage(damage)),
      checklist: (inspection.checklist || []).map((item: any) => this.transformChecklistItem(item)),
    };
  }

  /**
   * Transform Whip Around photo to our format
   */
  private transformPhoto(photo: any): WhipAroundPhoto {
    return {
      id: photo.id,
      url: photo.url || photo.photo_url,
      filename: photo.filename || photo.name,
      category: photo.category || 'general',
      timestamp: photo.created_at || new Date().toISOString(),
      inspectionId: photo.inspection_id,
    };
  }

  /**
   * Transform Whip Around damage to our format
   */
  private transformDamage(damage: any): WhipAroundDamage {
    return {
      id: damage.id,
      severity: damage.severity || 'low',
      category: damage.category || 'unknown',
      description: damage.description || '',
      location: damage.location || '',
      photos: damage.photos || [],
      estimatedCost: damage.estimated_cost,
      inspectionId: damage.inspection_id,
    };
  }

  /**
   * Transform Whip Around checklist item to our format
   */
  private transformChecklistItem(item: any): WhipAroundChecklistItem {
    return {
      id: item.id,
      category: item.category || 'general',
      item: item.item || item.name,
      status: item.status || 'pass',
      notes: item.notes,
      photos: item.photos || [],
    };
  }
}

export const whipAroundService = new WhipAroundService(); 