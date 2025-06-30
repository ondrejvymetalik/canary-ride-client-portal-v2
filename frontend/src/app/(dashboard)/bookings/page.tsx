'use client';

import { useState, useEffect } from 'react';
import { Booking } from '@/types';
import { bookingsService } from '@/services/bookings';
import { Calendar, MapPin, Car, Clock, CreditCard } from 'lucide-react';
import PhotoCarousel from '@/components/ui/PhotoCarousel';

export default function BookingsPage() {
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);

      // Load current bookings
      const currentResponse = await bookingsService.getCurrentBookings();
      console.log('📍 Current bookings response:', currentResponse);
      
      if (currentResponse.success && currentResponse.data) {
        console.log('📍 Current bookings data:', currentResponse.data);
        console.log('📍 Is data an array?', Array.isArray(currentResponse.data));
        setCurrentBookings(currentResponse.data);
      } else {
        console.log('📍 Current bookings failed or no data:', currentResponse);
        setCurrentBookings([]);
      }

      // Load past bookings
      const pastResponse = await bookingsService.getBookingHistory();
      console.log('📍 Past bookings response:', pastResponse);
      
      if (pastResponse.success && pastResponse.data) {
        console.log('📍 Past bookings data:', pastResponse.data);
        setPastBookings(pastResponse.data);
      } else {
        console.log('📍 Past bookings failed or no data:', pastResponse);
        setPastBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setCurrentBookings([]);
      setPastBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started':
        return 'badge-success';
      case 'reserved':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>

      {/* Current Bookings */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Bookings</h2>
        {currentBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Current Bookings</h3>
            <p className="text-gray-500">You don't have any active bookings at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Booking #{booking.number}
                    </h3>
                    <span className={`badge ${getStatusColor(booking.status)} mt-2`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatAmount(booking.totalPrice, booking.currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Paid: {formatAmount(booking.paidAmount, booking.currency)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <div>
                      <div className="text-sm">Pickup</div>
                      <div className="font-medium">{formatDate(booking.startDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <div>
                      <div className="text-sm">Return</div>
                      <div className="font-medium">{formatDate(booking.endDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <div>
                      <div className="text-sm">Location</div>
                      <div className="font-medium">{booking.location.name}</div>
                    </div>
                  </div>
                </div>

                {booking.items.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Rental Items</h4>
                    <div className="space-y-3">
                      {booking.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <PhotoCarousel
                            photos={item.photos || []}
                            fallbackUrl={item.imageUrl || item.image}
                            alt={item.name}
                            className="w-16 h-16"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{item.name}</div>
                            {item.description && (
                              <div className="text-gray-500 text-sm line-clamp-2">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {formatAmount(item.price, booking.currency)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Bookings</h2>
        {pastBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Bookings</h3>
            <p className="text-gray-500">Your completed bookings will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm p-6 opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Booking #{booking.number}
                    </h3>
                    <span className={`badge ${getStatusColor(booking.status)} mt-2`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {formatAmount(booking.totalPrice, booking.currency)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <div>
                      <div className="text-sm">Duration</div>
                      <div className="font-medium">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <div>
                      <div className="text-sm">Location</div>
                      <div className="font-medium">{booking.location.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Car className="w-4 h-4 mr-2" />
                    <div>
                      <div className="text-sm">Items</div>
                      <div className="font-medium">{booking.items.length} item(s)</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 