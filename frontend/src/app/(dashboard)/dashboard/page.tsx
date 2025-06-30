'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsService } from '@/services/bookings';
import { paymentsService } from '@/services/payments';
import { checkInService } from '@/services/checkin';
import { inspectionsService, InspectionStatus } from '@/services/inspections';
import { Booking, PaymentStatus, CheckInStatus } from '@/types';
import { 
  Calendar, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  MapPin,
  Car,
  ClipboardCheck,
  Pen
} from 'lucide-react';
import PhotoCarousel from '@/components/ui/PhotoCarousel';

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState<InspectionStatus | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.bookingNumber) {
        console.log('No booking number available');
        return;
      }

      console.log('Loading dashboard data for booking:', user.bookingNumber);

      // Load all data in parallel
      const [
        bookingsResponse,
        paymentResponse,
        checkInResponse,
        inspectionResponse
      ] = await Promise.all([
        bookingsService.getCurrentBookings().catch(err => {
          console.error('Error loading current bookings:', err);
          return { success: false, data: [] };
        }),
        paymentsService.getPaymentStatus(user.bookingNumber).catch(err => {
          console.error('Error loading payment status:', err);
          return { success: false, data: null };
        }),
        checkInService.getCheckInStatus(user.bookingNumber).catch(err => {
          console.error('Error loading checkin status:', err);
          return { success: false, data: null };
        }),
        inspectionsService.getInspectionStatus(user.bookingNumber).catch(err => {
          console.error('Error loading inspection status:', err);
          return { success: false, data: null };
        })
      ]);

      // Extract data from responses
      console.log('Raw API responses:', {
        bookingsResponse,
        paymentResponse,
        checkInResponse,
        inspectionResponse
      });

      const bookingsData = bookingsResponse.success ? (bookingsResponse.data || []) : [];
      const paymentData = paymentResponse.success ? (paymentResponse.data || null) : null;
      const checkInData = checkInResponse.success ? (checkInResponse.data || null) : null;
      const inspectionData = inspectionResponse.success ? (inspectionResponse.data || null) : null;

      console.log('Processed data:', {
        bookingsData,
        paymentData,
        checkInData,
        inspectionData
      });

      setBookings(bookingsData);
      setPaymentStatus(paymentData);
      setCheckInStatus(checkInData);
      setInspectionStatus(inspectionData);

      // Set current booking (most recent active one)
      const activeBooking = bookingsData.find(b => 
        b.status === 'started' || b.status === 'reserved'
      ) || bookingsData[0];
      
      console.log('Active booking search:', {
        totalBookings: bookingsData.length,
        bookingStatuses: bookingsData.map(b => ({ id: b.id, status: b.status })),
        foundActiveBooking: activeBooking
      });

      setCurrentBooking(activeBooking || null);

      console.log('Dashboard data loaded:', {
        bookings: bookingsData.length,
        currentBooking: activeBooking?.id,
        paymentStatus: !!paymentData,
        checkInStatus: !!checkInData,
        inspectionStatus: !!inspectionData
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || 'Guest'}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your motorcycle rental with Canary Ride.
        </p>
      </div>

      {currentBooking ? (
        <>
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Payment Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Payment Status</h3>
                </div>
                {paymentStatus && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    paymentStatus.paidAmount >= paymentStatus.totalAmount
                      ? 'bg-green-100 text-green-800'
                      : paymentStatus.depositPaid
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {paymentStatus.paidAmount >= paymentStatus.totalAmount
                      ? 'Paid'
                      : paymentStatus.depositPaid
                      ? 'Deposit Paid'
                      : 'Payment Required'}
                  </span>
                )}
              </div>
              {paymentStatus && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Paid: {paymentsService.formatAmount(paymentStatus.paidAmount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: {paymentsService.formatAmount(paymentStatus.totalAmount)}
                  </div>
                  {paymentStatus.remainingAmount > 0 && (
                    <Link
                      href="/payments"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Pay remaining {paymentsService.formatAmount(paymentStatus.remainingAmount)}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Check-in Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Check-in</h3>
                </div>
                                  {checkInStatus && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      checkInStatus.isComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {checkInStatus.isComplete ? 'Complete' : 'Pending'}
                  </span>
                )}
              </div>
              {checkInStatus && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Progress: {checkInService.getCheckInProgress(checkInStatus)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${checkInService.getCheckInProgress(checkInStatus)}%`}}
                    ></div>
                  </div>
                  {!checkInStatus.isComplete && (
                    <Link
                      href="/checkin"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Complete check-in
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  )}
                </div>
              )}
            </div>



            {/* Inspection Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ClipboardCheck className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Vehicle Handover</h3>
                </div>
                {inspectionStatus && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    inspectionStatus.hasInspection ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inspectionsService.getInspectionStatusDisplay(inspectionStatus.hasInspection, inspectionStatus.passed).label}
                  </span>
                )}
              </div>
              {inspectionStatus && (
                <div className="space-y-2">
                  {inspectionStatus.hasInspection ? (
                    <>
                      <div className="text-sm text-gray-600">
                        Inspector: {inspectionStatus.inspector || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Completed: {inspectionStatus.completedAt ? 
                          new Date(inspectionStatus.completedAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <Link
                        href="/inspections"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View vehicle handover report
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Vehicle handover not yet completed
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Current Booking Details */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Current Booking</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Booking Details</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Booking Number:</dt>
                      <dd className="text-sm font-medium text-gray-900">{currentBooking.number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Status:</dt>
                      <dd>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bookingsService.getBookingStatusDisplay(currentBooking).color === 'green'
                            ? 'bg-green-100 text-green-800'
                            : bookingsService.getBookingStatusDisplay(currentBooking).color === 'blue'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bookingsService.getBookingStatusDisplay(currentBooking).status}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Pickup Date:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formatDate(currentBooking.startDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Duration:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {bookingsService.formatBookingDates(currentBooking).duration}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Location:</dt>
                      <dd className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {currentBooking.location?.name || 'Pickup Location'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Total Price:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        €{(currentBooking.totalPrice / 100).toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Rental Items</h3>
                  <div className="space-y-3">
                    {(currentBooking.items || []).map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <PhotoCarousel
                          photos={item.photos || []}
                          fallbackUrl={item.imageUrl || item.image}
                          alt={item.name}
                          className="w-16 h-16"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-600 line-clamp-2">{item.description}</div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          €{(item.price / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/bookings"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View All Bookings
                </Link>
                <Link
                  href="/checkin"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Online Check-in
                </Link>

                <Link
                  href="/payments"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Manage Payments
                </Link>
                {inspectionStatus?.hasInspection && (
                  <Link
                    href="/inspections"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Inspection
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* No Current Bookings */
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Current Bookings</h3>
          <p className="text-gray-600 mb-6">
            You don't have any active bookings at the moment.
          </p>
          <Link
            href="/bookings"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Booking History
          </Link>
        </div>
      )}
    </div>
  );
} 