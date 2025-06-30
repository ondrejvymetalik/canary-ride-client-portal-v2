import { apiService } from './api';
import { CheckInStatus, CheckInForm, DocumentDetails, ApiResponse } from '@/types';

class CheckInService {
  // Get check-in status for a booking
  async getCheckInStatus(bookingId: string): Promise<ApiResponse<CheckInStatus>> {
    return await apiService.get(`/checkin/${bookingId}/status`);
  }

  // Submit document details (instead of uploading files)
  async submitDocumentDetails(
    bookingId: string,
    documentDetails: {
      drivingLicense: CheckInForm['drivingLicense'];
      identityDocument: CheckInForm['identityDocument'];
    }
  ): Promise<ApiResponse<DocumentDetails[]>> {
    return await apiService.post(`/checkin/${bookingId}/documents`, documentDetails);
  }

  // Submit check-in forms (including emergency contact, etc.)
  async submitForms(bookingId: string, formData: CheckInForm): Promise<ApiResponse> {
    return await apiService.post(`/checkin/${bookingId}/forms`, formData);
  }

  // Accept terms and conditions
  async acceptTerms(bookingId: string, signature: string): Promise<ApiResponse> {
    return await apiService.post(`/checkin/${bookingId}/terms`, {
      signature,
      acceptedAt: new Date().toISOString(),
    });
  }

  // Complete check-in process
  async completeCheckIn(bookingId: string): Promise<ApiResponse> {
    return await apiService.post(`/checkin/${bookingId}/complete`);
  }

  // Validate document details
  validateDocumentDetails(details: {
    drivingLicense: CheckInForm['drivingLicense'];
    identityDocument: CheckInForm['identityDocument'];
  }): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Driving License validation
    if (!details.drivingLicense.number?.trim()) {
      errors.drivingLicenseNumber = 'Driving license number is required';
    }
    if (!details.drivingLicense.expiryDate?.trim()) {
      errors.drivingLicenseExpiry = 'Driving license expiry date is required';
    } else {
      const expiryDate = new Date(details.drivingLicense.expiryDate);
      if (expiryDate <= new Date()) {
        errors.drivingLicenseExpiry = 'Driving license has expired';
      }
    }
    if (!details.drivingLicense.issuingCountry?.trim()) {
      errors.drivingLicenseCountry = 'Issuing country is required';
    }

    // Identity Document validation
    if (!details.identityDocument.type) {
      errors.identityDocumentType = 'Document type is required';
    }
    if (!details.identityDocument.number?.trim()) {
      errors.identityDocumentNumber = 'Document number is required';
    }
    if (!details.identityDocument.issuingCountry?.trim()) {
      errors.identityDocumentCountry = 'Issuing country is required';
    }
    
    // Passport requires expiry date
    if (details.identityDocument.type === 'passport' && !details.identityDocument.expiryDate?.trim()) {
      errors.identityDocumentExpiry = 'Passport expiry date is required';
    }
    
    // Check passport expiry if provided
    if (details.identityDocument.expiryDate?.trim()) {
      const expiryDate = new Date(details.identityDocument.expiryDate);
      if (expiryDate <= new Date()) {
        errors.identityDocumentExpiry = 'Document has expired';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Get check-in progress percentage
  getCheckInProgress(status: CheckInStatus): number {
    const totalSteps = status.steps.length;
    const completedSteps = status.steps.filter(step => step.isCompleted).length;
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  }

  // Get next required step
  getNextStep(status: CheckInStatus): CheckInStatus['steps'][0] | null {
    const nextStep = status.steps
      .filter(step => step.isRequired && !step.isCompleted)
      .sort((a, b) => a.order - b.order)[0];
    
    return nextStep || null;
  }

  // Check if all required steps are completed
  isCheckInComplete(status: CheckInStatus): boolean {
    return status.steps
      .filter(step => step.isRequired)
      .every(step => step.isCompleted);
  }

  // Get document type display name
  getDocumentTypeDisplayName(type: DocumentDetails['type']): string {
    const typeMap = {
      driving_license: "Driver's License",
      identity_document: 'Identity Document',
    };
    return typeMap[type] || 'Document';
  }

  // Validate check-in form
  validateCheckInForm(form: Partial<CheckInForm>): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Emergency contact validation
    if (!form.emergencyContact?.name?.trim()) {
      errors.emergencyContactName = 'Emergency contact name is required';
    }
    if (!form.emergencyContact?.phone?.trim()) {
      errors.emergencyContactPhone = 'Emergency contact phone is required';
    }
    if (!form.emergencyContact?.relationship?.trim()) {
      errors.emergencyContactRelationship = 'Relationship is required';
    }

    // Riding experience validation
    if (!form.ridingExperience) {
      errors.ridingExperience = 'Riding experience level is required';
    }

    // Pickup time validation
    if (!form.pickupTime?.trim()) {
      errors.pickupTime = 'Pickup time is required';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Format country list for dropdown
  getCountryList(): { code: string; name: string }[] {
    return [
      { code: 'ES', name: 'Spain' },
      { code: 'FR', name: 'France' },
      { code: 'DE', name: 'Germany' },
      { code: 'IT', name: 'Italy' },
      { code: 'PT', name: 'Portugal' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'IE', name: 'Ireland' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'BE', name: 'Belgium' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'AT', name: 'Austria' },
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      // Add more countries as needed
    ];
  }
}

export const checkInService = new CheckInService();
export default checkInService; 