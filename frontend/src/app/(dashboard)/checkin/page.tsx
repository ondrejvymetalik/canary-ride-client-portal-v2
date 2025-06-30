'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckInStatus, CheckInStep, DocumentDetails } from '@/types';
import { checkInService } from '@/services/checkin';
import { bookingsService } from '@/services/bookings';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  CreditCard,
  FileCheck
} from 'lucide-react';

export default function CheckInPage() {
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [documentDetails, setDocumentDetails] = useState({
    drivingLicense: {
      number: '',
      expiryDate: '',
      issuingCountry: 'ES'
    },
    identityDocument: {
      type: 'passport' as 'passport' | 'national_id',
      number: '',
      issuingCountry: 'ES',
      expiryDate: ''
    }
  });

  // Terms acceptance state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);

  useEffect(() => {
    loadCheckInStatus();
  }, []);

  const loadCheckInStatus = async () => {
    try {
      setIsLoading(true);
      
      // Get current booking first
      const bookingsResponse = await bookingsService.getCurrentBookings();
      if (bookingsResponse.success && bookingsResponse.data && bookingsResponse.data[0]) {
        const bookingId = bookingsResponse.data[0].id;
        
        const response = await checkInService.getCheckInStatus(bookingId);
        if (response.success && response.data) {
          setCheckInStatus(response.data);
          
          // Pre-populate document details from customer profile if available
          if (response.data.customerDocuments) {
            setDocumentDetails({
              drivingLicense: {
                number: response.data.customerDocuments.drivingLicense?.number || '',
                expiryDate: response.data.customerDocuments.drivingLicense?.expiryDate || '',
                issuingCountry: response.data.customerDocuments.drivingLicense?.issuingCountry || 'ES'
              },
              identityDocument: {
                type: response.data.customerDocuments.identityDocument?.type as 'passport' | 'national_id' || 'passport',
                number: response.data.customerDocuments.identityDocument?.number || '',
                issuingCountry: response.data.customerDocuments.identityDocument?.issuingCountry || 'ES',
                expiryDate: response.data.customerDocuments.identityDocument?.expiryDate || ''
              }
            });
          }
          
          // Find first incomplete step
          const firstIncomplete = response.data.steps.find(step => !step.isCompleted);
          if (firstIncomplete) {
            setActiveStep(firstIncomplete.order);
          }
        }
      }
    } catch (error) {
      console.error('Error loading check-in status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInStatus) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate document details
      const validation = checkInService.validateDocumentDetails(documentDetails);
      if (!validation.valid) {
        setErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      const response = await checkInService.submitDocumentDetails(
        checkInStatus.bookingId,
        documentDetails
      );

      if (response.success) {
        await loadCheckInStatus();
        setActiveStep(1); // Move directly to terms step (skip forms)
      }
    } catch (error) {
      console.error('Error submitting document details:', error);
      setErrors({ general: 'Failed to submit document details. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!checkInStatus) return;

    try {
      const response = await checkInService.acceptTerms(checkInStatus.bookingId, 'digital-acceptance');
      if (response.success) {
        // Reload the status to get updated completion state
        await loadCheckInStatus();
        
        // Check if all steps are now complete
        const updatedStatus = await checkInService.getCheckInStatus(checkInStatus.bookingId);
        if (updatedStatus.success && updatedStatus.data) {
          const allStepsComplete = updatedStatus.data.steps.every(step => step.isCompleted);
          if (allStepsComplete || updatedStatus.data.isComplete) {
            // If all steps are complete, don't change the active step - let it show completion
            setCheckInStatus(updatedStatus.data);
          } else {
            // If there are still incomplete steps, find the next one
            const nextIncomplete = updatedStatus.data.steps.find(step => !step.isCompleted);
            if (nextIncomplete) {
              setActiveStep(nextIncomplete.order);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error accepting terms:', error);
    }
  };

  const getStepIcon = (step: CheckInStep) => {
    if (step.isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (step.order === activeStep) {
      return <Clock className="w-5 h-5 text-blue-600" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderDocumentDetailsForm = () => {
    const isDocumentsCompleted = checkInStatus?.documentsCompleted;

    return (
      <form onSubmit={handleDocumentSubmit} className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Document Details
            {isDocumentsCompleted && (
              <CheckCircle className="w-5 h-5 ml-2 text-green-600" />
            )}
          </h3>
          {isDocumentsCompleted && (
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              From Your Profile
            </span>
          )}
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        {isDocumentsCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-800 font-medium">
                Document details loaded from your customer profile. You can update them if needed.
              </span>
            </div>
          </div>
        )}

        {/* Driving License Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Driving License Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">License Number *</label>
              <input
                type="text"
                value={documentDetails.drivingLicense.number}
                onChange={(e) => setDocumentDetails(prev => ({
                  ...prev,
                  drivingLicense: { ...prev.drivingLicense, number: e.target.value }
                }))}
                className={`input ${errors.drivingLicenseNumber ? 'border-red-300' : ''}`}
                placeholder="Enter your driving license number"
                required
              />
              {errors.drivingLicenseNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.drivingLicenseNumber}</p>
              )}
            </div>
            
            <div>
              <label className="label">Expiry Date *</label>
              <input
                type="date"
                value={documentDetails.drivingLicense.expiryDate}
                onChange={(e) => setDocumentDetails(prev => ({
                  ...prev,
                  drivingLicense: { ...prev.drivingLicense, expiryDate: e.target.value }
                }))}
                className={`input ${errors.drivingLicenseExpiry ? 'border-red-300' : ''}`}
                required
              />
              {errors.drivingLicenseExpiry && (
                <p className="text-red-600 text-sm mt-1">{errors.drivingLicenseExpiry}</p>
              )}
            </div>
            
            <div>
              <label className="label">Issuing Country *</label>
              <select
                value={documentDetails.drivingLicense.issuingCountry}
                onChange={(e) => setDocumentDetails(prev => ({
                  ...prev,
                  drivingLicense: { ...prev.drivingLicense, issuingCountry: e.target.value }
                }))}
                className={`input ${errors.drivingLicenseCountry ? 'border-red-300' : ''}`}
                required
              >
                {checkInService.getCountryList().map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.drivingLicenseCountry && (
                <p className="text-red-600 text-sm mt-1">{errors.drivingLicenseCountry}</p>
              )}
            </div>
          </div>
        </div>

        {/* Identity Document Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Identity Document Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Document Type *</label>
              <select
                value={documentDetails.identityDocument.type}
                onChange={(e) => setDocumentDetails(prev => ({
                  ...prev,
                  identityDocument: { ...prev.identityDocument, type: e.target.value as 'passport' | 'national_id' }
                }))}
                className={`input ${errors.identityDocumentType ? 'border-red-300' : ''}`}
                required
              >
                <option value="passport">Passport</option>
                <option value="national_id">National ID Card</option>
              </select>
              {errors.identityDocumentType && (
                <p className="text-red-600 text-sm mt-1">{errors.identityDocumentType}</p>
              )}
            </div>

            <div>
              <label className="label">Document Number *</label>
              <input
                type="text"
                value={documentDetails.identityDocument.number}
                onChange={(e) => setDocumentDetails(prev => ({
                  ...prev,
                  identityDocument: { ...prev.identityDocument, number: e.target.value }
                }))}
                className={`input ${errors.identityDocumentNumber ? 'border-red-300' : ''}`}
                placeholder="Enter your document number"
                required
              />
              {errors.identityDocumentNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.identityDocumentNumber}</p>
              )}
            </div>

            <div>
              <label className="label">Issuing Country *</label>
              <select
                value={documentDetails.identityDocument.issuingCountry}
                onChange={(e) => setDocumentDetails(prev => ({
                  ...prev,
                  identityDocument: { ...prev.identityDocument, issuingCountry: e.target.value }
                }))}
                className={`input ${errors.identityDocumentCountry ? 'border-red-300' : ''}`}
                required
              >
                {checkInService.getCountryList().map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.identityDocumentCountry && (
                <p className="text-red-600 text-sm mt-1">{errors.identityDocumentCountry}</p>
              )}
            </div>

            {documentDetails.identityDocument.type === 'passport' && (
              <div>
                <label className="label">Expiry Date</label>
                <input
                  type="date"
                  value={documentDetails.identityDocument.expiryDate}
                  onChange={(e) => setDocumentDetails(prev => ({
                    ...prev,
                    identityDocument: { ...prev.identityDocument, expiryDate: e.target.value }
                  }))}
                  className={`input ${errors.identityDocumentExpiry ? 'border-red-300' : ''}`}
                />
                {errors.identityDocumentExpiry && (
                  <p className="text-red-600 text-sm mt-1">{errors.identityDocumentExpiry}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (isDocumentsCompleted ? 'Updating...' : 'Saving...') : (isDocumentsCompleted ? 'Update Document Details' : 'Continue to Terms & Conditions')}
        </button>
      </form>
    );
  };

  const renderTermsAcceptance = () => {    
    const handleTermsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked && !isAcceptingTerms) {
        setIsAcceptingTerms(true);
        setTermsAccepted(true);
        await handleAcceptTerms();
        setIsAcceptingTerms(false);
      }
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Terms and Conditions</h3>
        
        <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed">
            {/* Terms and conditions text would go here */}
            By accepting these terms, you agree to the rental conditions, 
            safety requirements, and policies of Canary Ride. Please read 
            all terms carefully before proceeding with your rental.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="accept-terms"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={termsAccepted}
            disabled={isAcceptingTerms}
            onChange={handleTermsChange}
          />
          <label htmlFor="accept-terms" className="text-sm font-medium text-gray-900">
            {isAcceptingTerms ? 'Processing...' : 'I accept the terms and conditions'}
          </label>
        </div>

        {isAcceptingTerms && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-blue-800">Accepting terms and completing check-in...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!checkInStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Check-in Required</h3>
        <p className="text-gray-500">You don't have any active bookings that require check-in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Check-in</h1>
        <div className="text-sm text-gray-500">
          Progress: {checkInService.getCheckInProgress(checkInStatus)}%
        </div>
      </div>

      {/* Rental Agreements Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileCheck className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Rental Agreement</h2>
              <p className="text-sm text-gray-600">Review and sign your rental contract before check-in</p>
            </div>
          </div>
          <Link
            href="/contracts"
            className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            View & Sign Contract
          </Link>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> Please review and digitally sign your rental agreement before proceeding with check-in. 
            This ensures all terms and conditions are agreed upon before you pick up your motorcycle.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          {checkInStatus.steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step.isCompleted
                  ? 'bg-green-100 border-green-500'
                  : step.order === activeStep
                  ? 'bg-blue-100 border-blue-500'
                  : 'bg-gray-100 border-gray-300'
              }`}>
                {getStepIcon(step)}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  step.isCompleted ? 'text-green-900' : 'text-gray-900'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < checkInStatus.steps.length - 1 && (
                <div className={`w-16 h-0.5 ml-6 ${
                  step.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeStep === 0 && renderDocumentDetailsForm()}
        {activeStep === 1 && renderTermsAcceptance()}
        
        {checkInStatus.isComplete && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Check-in Complete!</h3>
            <p className="text-gray-600">
              Your check-in is complete. You're all set for pickup!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}