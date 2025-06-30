import { apiService } from './api';
import { Booking, ApiResponse } from '@/types';

class BookingsService {
  // Get all customer bookings (current + history)
  async getBookings(): Promise<ApiResponse<Booking[]>> {
    try {
      const [currentResponse, historyResponse] = await Promise.all([
        this.getCurrentBookings(),
        this.getBookingHistory()
      ]);
      
      const allBookings = [
        ...(currentResponse.data || []),
        ...(historyResponse.data || [])
      ];
      
      return {
        success: true,
        data: allBookings
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch bookings'
      };
    }
  }

  // Get specific booking details
  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return await apiService.get(`/bookings/${id}`);
  }

  // Get current/active bookings
  async getCurrentBookings(): Promise<ApiResponse<Booking[]>> {
    return await apiService.get('/bookings/current');
  }

  // Get past bookings
  async getBookingHistory(): Promise<ApiResponse<Booking[]>> {
    return await apiService.get('/bookings/history');
  }

  // Update booking information
  async updateBooking(id: string, updates: Partial<Booking>): Promise<ApiResponse<Booking>> {
    return await apiService.put(`/bookings/${id}/update`, updates);
  }

  // Get booking by number
  async getBookingByNumber(bookingNumber: string): Promise<ApiResponse<Booking>> {
    const bookingsResponse = await this.getBookings();
    
    if (bookingsResponse.success && bookingsResponse.data) {
      const booking = bookingsResponse.data.find(b => b.number === bookingNumber);
      if (booking) {
        return {
          success: true,
          data: booking,
        };
      }
    }
    
    return {
      success: false,
      error: 'Booking not found',
    };
  }

  // Check if booking is active
  isBookingActive(booking: Booking): boolean {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    
    return now >= startDate && now <= endDate && booking.status === 'started';
  }

  // Check if booking is upcoming
  isBookingUpcoming(booking: Booking): boolean {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    
    return now < startDate && ['reserved', 'concept'].includes(booking.status);
  }

  // Check if booking is completed
  isBookingCompleted(booking: Booking): boolean {
    const now = new Date();
    const endDate = new Date(booking.endDate);
    
    return now > endDate || booking.status === 'stopped';
  }

  // Format booking dates
  formatBookingDates(booking: Booking): { startDate: string; endDate: string; duration: string } {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      startDate: start.toLocaleDateString(),
      endDate: end.toLocaleDateString(),
      duration: `${duration} day${duration !== 1 ? 's' : ''}`,
    };
  }

  // Calculate booking status
  getBookingStatusDisplay(booking: Booking): { status: string; color: string; description: string } {
    const statusMap = {
      draft: { status: 'Draft', color: 'gray', description: 'Booking is being prepared' },
      concept: { status: 'Pending', color: 'yellow', description: 'Awaiting confirmation' },
      reserved: { status: 'Reserved', color: 'blue', description: 'Booking confirmed' },
      started: { status: 'Active', color: 'green', description: 'Rental in progress' },
      stopped: { status: 'Completed', color: 'gray', description: 'Rental completed' },
      cancelled: { status: 'Cancelled', color: 'red', description: 'Booking cancelled' },
    };

    return statusMap[booking.status] || { status: 'Unknown', color: 'gray', description: 'Status unknown' };
  }
}

export const bookingsService = new BookingsService();
export default bookingsService; 