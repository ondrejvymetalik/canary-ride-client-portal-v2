// Authentication Types
export interface User {
  id: string;
  email: string;
  bookingNumber: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  bookingNumber: string;
  email: string;
}

export interface MagicLinkRequest {
  email: string;
  bookingNumber?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// Booking Types
export interface Booking {
  id: string;
  number: string;
  status: 'draft' | 'reserved' | 'started' | 'stopped' | 'cancelled' | 'concept';
  startDate: string;
  endDate: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  customer: Customer;
  items: BookingItem[];
  location: Location;
  checkInStatus?: CheckInStatus;
  paymentStatus?: PaymentStatus;
}

export interface BookingItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  image?: string;
  imageUrl?: string; // Photo URL from Booqable API
  photos?: ProductPhoto[]; // Multiple photos from Booqable API
  category?: string;
}

export interface ProductPhoto {
  id: string;
  url: string;
  large_url: string;
  original_url: string;
  position: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  driverLicenseNumber?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Check-in Types
export interface CheckInStatus {
  id: string;
  bookingId: string;
  isComplete: boolean;
  documentsCompleted: boolean;
  formsCompleted: boolean;
  termsAccepted: boolean;
  completedAt?: string;
  steps: CheckInStep[];
  customerDocuments?: {
    drivingLicense?: {
      number: string;
      expiryDate: string;
      issuingCountry: string;
    };
    identityDocument?: {
      type: 'passport' | 'national_id';
      number: string;
      issuingCountry: string;
      expiryDate?: string;
    };
  };
}

export interface CheckInStep {
  id: string;
  name: string;
  title: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string;
  order: number;
}

export interface DocumentDetails {
  driving_license: {
    number: string;
    expiryDate: string;
    issuingCountry: string;
  };
  identity_document: {
    type: 'passport' | 'national_id';
    number: string;
    issuingCountry: string;
    expiryDate?: string; // Only for passport
  };
}

// Payment Types
export interface PaymentStatus {
  id: string;
  bookingId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  depositPaid: boolean;
  balanceDue: boolean;
  paymentMethods: PaymentMethod[];
  transactions: PaymentTransaction[];
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'cash';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  type: 'deposit' | 'balance' | 'refund' | 'authorization';
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
  description?: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
  type: 'deposit' | 'balance';
}

// Inspection Types
export interface Inspection {
  id: string;
  bookingId: string;
  type: 'handover' | 'return';
  vehicleId: string;
  inspectorId: string;
  completedAt: string;
  mileage: number;
  fuelLevel: number;
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  photos: InspectionPhoto[];
  damages: Damage[];
  notes: string;
  signature?: string;
}

export interface InspectionPhoto {
  id: string;
  url: string;
  caption: string;
  angle: 'front' | 'back' | 'left' | 'right' | 'dashboard' | 'other';
  uploadedAt: string;
}

export interface Damage {
  id: string;
  type: 'scratch' | 'dent' | 'crack' | 'missing_part' | 'other';
  severity: 'minor' | 'moderate' | 'major';
  location: string;
  description: string;
  photos: string[];
  estimatedCost?: number;
  isPreExisting: boolean;
}

// UI Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface FormErrors {
  [key: string]: string;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  isVisible: boolean;
}

// Utility Types
export type Locale = 'en' | 'es' | 'fr' | 'de' | 'it';

export interface FileUploadProps {
  accept: string;
  maxSize: number;
  multiple?: boolean;
  onUpload: (files: File[]) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export interface CheckInForm {
  // Document Details (instead of file uploads)
  drivingLicense: {
    number: string;
    expiryDate: string;
    issuingCountry: string;
  };
  identityDocument: {
    type: 'passport' | 'national_id';
    number: string;
    issuingCountry: string;
    expiryDate?: string; // Optional for national IDs that don't expire
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  ridingExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  medicalConditions: string;
  specialRequests: string;
  pickupTime: string;
  additionalInfo: string;
}

export interface Contract {
  id: string;
  type: 'documents';
  document_type: 'contract' | 'quote' | 'invoice';
  number: number;
  status: string;
  finalized: boolean;
  confirmed: boolean;
  sent: boolean;
  signature_url?: string;
  date: string;
  name: string;
  price_in_cents: number;
  grand_total_in_cents: number;
  order_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
}

export interface ContractStatus {
  bookingId: string;
  hasContract: boolean;
  contractId: string | null;
  status: string | null;
  signed: boolean;
  signedAt: string | null;
  needsSignature: boolean;
}

export interface SignatureData {
  signature: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
} 