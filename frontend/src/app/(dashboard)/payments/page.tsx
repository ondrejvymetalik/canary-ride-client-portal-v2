'use client';

import { useState, useEffect } from 'react';
import { PaymentStatus, PaymentTransaction, PaymentIntent } from '@/types';
import { paymentsService } from '@/services/payments';
import { bookingsService } from '@/services/bookings';
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  DollarSign,
  Calendar,
  Receipt
} from 'lucide-react';

export default function PaymentsPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setIsLoading(true);
      
      // Get current booking first
      const bookingsResponse = await bookingsService.getCurrentBookings();
      if (bookingsResponse.success && bookingsResponse.data && bookingsResponse.data[0]) {
        const bookingId = bookingsResponse.data[0].id;
        
        // Load payment status
        const statusResponse = await paymentsService.getPaymentStatus(bookingId);
        if (statusResponse.success && statusResponse.data) {
          setPaymentStatus(statusResponse.data);
        }

        // Load payment history
        const historyResponse = await paymentsService.getPaymentHistory(bookingId);
        if (historyResponse.success && historyResponse.data) {
          setTransactions(historyResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (type: 'deposit' | 'balance') => {
    if (!paymentStatus) return;

    try {
      setIsProcessingPayment(true);
      
      // First create a setup intent to get payment method
      const setupResponse = await paymentsService.createSetupIntent(paymentStatus.bookingId);
      
      if (setupResponse.success && setupResponse.data) {
        // Redirect to payment setup page
        window.location.href = `/payments/setup?intent=${setupResponse.data.clientSecret}&type=${type}&booking=${paymentStatus.bookingId}`;
      } else {
        // For now, show alert since we don't have Stripe setup page yet
        alert(`${type === 'deposit' ? 'Deposit' : 'Balance'} payment will be processed here. Integration with Stripe checkout coming soon.`);
        
        // Simulate payment success for demo
        await loadPaymentData();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatAmount = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionDescription = (transaction: PaymentTransaction) => {
    switch (transaction.type) {
      case 'deposit':
        return 'Security Deposit';
      case 'balance':
        return 'Balance Payment';
      case 'refund':
        return 'Refund';
      case 'authorization':
        return 'Pre-authorization';
      default:
        return 'Payment';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Information</h3>
        <p className="text-gray-500">No active bookings require payment at this time.</p>
      </div>
    );
  }

  const depositAmount = paymentStatus.totalAmount * 0.3; // 30% deposit
  const isDepositPaid = paymentStatus.depositPaid;
  const isFullyPaid = paymentStatus.paidAmount >= paymentStatus.totalAmount;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Payments</h1>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Amount */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-primary-600 mr-2" />
              <h3 className="font-medium text-gray-900">Total Amount</h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">
              {formatAmount(paymentStatus.totalAmount, paymentStatus.currency)}
            </div>
            <div className="text-sm text-gray-600">
              Paid: {formatAmount(paymentStatus.paidAmount, paymentStatus.currency)}
            </div>
            <div className="text-sm text-gray-600">
              Remaining: {formatAmount(paymentStatus.remainingAmount, paymentStatus.currency)}
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Receipt className="w-5 h-5 text-primary-600 mr-2" />
              <h3 className="font-medium text-gray-900">Payment Status</h3>
            </div>
            <span className={`badge ${
              isFullyPaid
                ? 'badge-success'
                : isDepositPaid
                ? 'badge-warning'
                : 'badge-error'
            }`}>
              {isFullyPaid
                ? 'Fully Paid'
                : isDepositPaid
                ? 'Deposit Paid'
                : 'Payment Required'}
            </span>
          </div>
          <div className="space-y-4">
            {/* Deposit */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Security Deposit (30%)</div>
                <div className="text-sm text-gray-500">
                  {formatAmount(depositAmount, paymentStatus.currency)}
                </div>
              </div>
              {isDepositPaid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <button
                  onClick={() => handlePayment('deposit')}
                  disabled={isProcessingPayment}
                  className="btn-primary btn-sm"
                >
                  {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-gray-900">Balance Payment</div>
                <div className="text-sm text-gray-500">
                  {formatAmount(paymentStatus.remainingAmount, paymentStatus.currency)}
                </div>
              </div>
              {isFullyPaid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : paymentStatus.remainingAmount > 0 ? (
                <button
                  onClick={() => handlePayment('balance')}
                  disabled={isProcessingPayment || !isDepositPaid}
                  className="btn-primary btn-sm"
                >
                  {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                </button>
              ) : (
                <span className="text-sm text-gray-500">No balance due</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Payment History
          </h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions</h4>
            <p className="text-gray-500">Your payment history will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {getTransactionDescription(transaction)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </div>
                      {transaction.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      transaction.type === 'refund' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.type === 'refund' ? '+' : ''}
                      {formatAmount(transaction.amount, transaction.currency)}
                    </div>
                    <div className={`text-sm capitalize ${
                      transaction.status === 'succeeded'
                        ? 'text-green-600'
                        : transaction.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <CreditCard className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Secure Payments</h4>
            <p className="text-sm text-blue-700 mt-1">
              All payments are processed securely through Stripe. Your payment information 
              is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 