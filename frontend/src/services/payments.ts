import { apiService } from './api';
import { PaymentStatus, PaymentIntent, PaymentTransaction, ApiResponse } from '@/types';

class PaymentsService {
  // Get payment status for a booking
  async getPaymentStatus(bookingId: string): Promise<ApiResponse<PaymentStatus>> {
    return await apiService.get(`/payments/${bookingId}/status`);
  }

  // Create Stripe setup intent for payment method
  async createSetupIntent(bookingId: string): Promise<ApiResponse<PaymentIntent>> {
    return await apiService.post(`/payments/${bookingId}/setup-intent`);
  }

  // Process deposit payment
  async payDeposit(bookingId: string, paymentMethodId: string): Promise<ApiResponse<PaymentTransaction>> {
    return await apiService.post(`/payments/${bookingId}/pay-deposit`, {
      paymentMethodId,
    });
  }

  // Process balance payment
  async payBalance(bookingId: string, paymentMethodId: string): Promise<ApiResponse<PaymentTransaction>> {
    return await apiService.post(`/payments/${bookingId}/pay-balance`, {
      paymentMethodId,
    });
  }

  // Pre-authorize deposit amount
  async authorizeDeposit(bookingId: string, paymentMethodId: string): Promise<ApiResponse<PaymentTransaction>> {
    return await apiService.post(`/payments/${bookingId}/authorize-deposit`, {
      paymentMethodId,
    });
  }

  // Get payment history for a booking
  async getPaymentHistory(bookingId: string): Promise<ApiResponse<PaymentTransaction[]>> {
    return await apiService.get(`/payments/${bookingId}/history`);
  }

  // Format currency amount for display
  formatAmount(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert cents to euros
  }

  // Get payment status display info
  getPaymentStatusDisplay(paymentStatus: PaymentStatus): {
    status: string;
    color: string;
    description: string;
    action?: string;
  } {
    const { totalAmount, paidAmount, remainingAmount, depositPaid, balanceDue } = paymentStatus;

    if (paidAmount >= totalAmount) {
      return {
        status: 'Paid',
        color: 'green',
        description: 'Payment completed',
      };
    }

    if (!depositPaid) {
      return {
        status: 'Deposit Required',
        color: 'yellow',
        description: `Deposit of ${this.formatAmount(remainingAmount)} required`,
        action: 'Pay Deposit',
      };
    }

    if (balanceDue && remainingAmount > 0) {
      return {
        status: 'Balance Due',
        color: 'orange',
        description: `Balance of ${this.formatAmount(remainingAmount)} due`,
        action: 'Pay Balance',
      };
    }

    return {
      status: 'Processing',
      color: 'blue',
      description: 'Payment processing',
    };
  }

  // Calculate payment breakdown
  calculatePaymentBreakdown(paymentStatus: PaymentStatus): {
    deposit: number;
    balance: number;
    paid: number;
    remaining: number;
    total: number;
  } {
    const { totalAmount, paidAmount } = paymentStatus;
    const deposit = Math.round(totalAmount * 0.3); // 30% deposit
    const balance = totalAmount - deposit;

    return {
      deposit,
      balance,
      paid: paidAmount,
      remaining: totalAmount - paidAmount,
      total: totalAmount,
    };
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService; 