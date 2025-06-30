'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsService } from '@/services/bookings';
import { inspectionsService, WhipAroundInspection } from '@/services/inspections';
import { Booking } from '@/types';
import { 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Clock,
  Download,
  Image as ImageIcon,
  FileText,
  MapPin,
  User,
  Gauge,
  Fuel,
  PenTool,
  ExternalLink,
  ClipboardCheck
} from 'lucide-react';
import PhotoCarousel from '@/components/ui/PhotoCarousel';

export default function InspectionsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [inspection, setInspection] = useState<WhipAroundInspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setIsLoading(true);

      // Load all bookings (current and history)
      const [currentResponse, historyResponse] = await Promise.all([
        bookingsService.getCurrentBookings(),
        bookingsService.getBookingHistory()
      ]);

      const allBookings = [
        ...(currentResponse.success ? currentResponse.data || [] : []),
        ...(historyResponse.success ? historyResponse.data || [] : [])
      ];

      setBookings(allBookings);

      // Auto-select first booking with inspection
      for (const booking of allBookings) {
        const inspectionResponse = await inspectionsService.getInspection(booking.number);
        if (inspectionResponse.success && inspectionResponse.data?.inspection) {
          setSelectedBooking(booking);
          setInspection(inspectionResponse.data.inspection);
          break;
        }
      }
    } catch (error) {
      console.error('Error loading inspections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInspectionForBooking = async (booking: Booking) => {
    try {
      setSelectedBooking(booking);
      setInspection(null);

      const response = await inspectionsService.getInspection(booking.number);
      if (response.success && response.data?.inspection) {
        setInspection(response.data.inspection);
      }
    } catch (error) {
      console.error('Error loading inspection:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openPhoto = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  const downloadPDF = () => {
    if (inspection?.pdfUrl) {
      window.open(inspection.pdfUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Reports</h1>
        {inspection && (
          <button
            onClick={downloadPDF}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Bookings</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => loadInspectionForBooking(booking)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedBooking?.id === booking.id ? 'bg-blue-50 border-r-4 border-primary-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ClipboardCheck className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      Booking #{booking.number}
                    </span>
                  </div>
                  <span className={`badge ${
                    bookingsService.getBookingStatusDisplay(booking).color === 'green'
                      ? 'badge-success'
                      : bookingsService.getBookingStatusDisplay(booking).color === 'blue'
                      ? 'badge-info'
                      : 'badge-warning'
                  }`}>
                    {bookingsService.getBookingStatusDisplay(booking).status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(booking.startDate)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {booking.location?.name || 'Location'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.items?.[0]?.name || 'Vehicle'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inspection Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBooking && inspection ? (
            <>
              {/* Inspection Header */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Vehicle Handover
                      </h3>
                      <p className="text-sm text-gray-600">
                        Completed on {inspectionsService.formatInspectionDate(inspection.dates.completed)}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-2 text-green-600 bg-green-50">
                    <CheckCircle className="w-4 h-4" />
                    <span>Done</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Inspector</div>
                    <div className="font-medium">{inspection.inspector.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rider</div>
                    <div className="font-medium">{inspection.riderName}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Asset</div>
                    <div className="font-medium">{inspection.asset.name}</div>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Condition</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Kilometers */}
                    <div className="flex items-center space-x-3">
                      <Gauge className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Kilometers</div>
                        <div className="font-medium">{inspectionsService.formatMileage(inspection.kilometers)}</div>
                      </div>
                    </div>

                    {/* Fuel Level */}
                    <div className="flex items-center space-x-3">
                      <Fuel className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Fuel Level</div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{inspection.fuelLevel}</span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div 
                              className={`h-2 rounded-full bg-${inspectionsService.formatFuelLevel(inspection.fuelLevel).color}-500`}
                              style={{ 
                                width: `${inspectionsService.formatFuelLevel(inspection.fuelLevel).percentage}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fuel Photo */}
                  {inspection.fuelLevelPhoto && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Fuel Tank Photo</div>
                      <img
                        src={inspection.fuelLevelPhoto}
                        alt="Fuel tank level"
                        className="w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openPhoto(inspection.fuelLevelPhoto)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Motorcycle Photos */}
              {inspection.motorcyclePhotos.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Motorcycle Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {inspection.motorcyclePhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Motorcycle view ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openPhoto(photo)}
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Helmet Photos */}
              {inspection.helmetPhotos.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Helmet Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {inspection.helmetPhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Helmet view ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openPhoto(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Signatures</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inspector Signature */}
                  {inspection.inspectorSignature && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <PenTool className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Inspector Signature</span>
                      </div>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <img
                          src={inspection.inspectorSignature}
                          alt="Inspector signature"
                          className="max-w-full h-20 object-contain cursor-pointer"
                          onClick={() => openPhoto(inspection.inspectorSignature)}
                        />
                        <div className="text-xs text-gray-600 mt-2">{inspection.inspector.name}</div>
                      </div>
                    </div>
                  )}

                  {/* Rider Signature */}
                  {inspection.riderSignature && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <PenTool className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Rider Signature</span>
                      </div>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <img
                          src={inspection.riderSignature}
                          alt="Rider signature"
                          className="max-w-full h-20 object-contain cursor-pointer"
                          onClick={() => openPhoto(inspection.riderSignature)}
                        />
                        <div className="text-xs text-gray-600 mt-2">{inspection.riderName}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : selectedBooking && !inspection ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicle Handover Available</h3>
              <p className="text-gray-500">
                No vehicle handover has been completed for booking #{selectedBooking.number} yet.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Booking</h3>
              <p className="text-gray-500">
                Choose a booking from the list to view its vehicle handover report.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedPhoto}
              alt="Inspection photo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={closePhoto}
              className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 rounded-full p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 