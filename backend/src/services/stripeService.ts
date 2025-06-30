import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethodId: string;
  customerId: string;
  description: string;
  metadata?: { [key: string]: string };
}

export interface AuthorizationRequest {
  amount: number;
  currency: string;
  paymentMethodId: string;
  customerId: string;
  description: string;
  metadata?: { [key: string]: string };
}

class StripeService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      // Create or get Stripe customer
      const stripeCustomer = await this.getOrCreateCustomer(customerId);

      const setupIntent = await this.stripe.setupIntents.create({
        customer: stripeCustomer.id,
        usage: 'off_session',
        payment_method_types: ['card'],
      });

      logger.info('Setup intent created', {
        setupIntentId: setupIntent.id,
        customerId
      });

      return setupIntent;
    } catch (error) {
      logger.error('Failed to create setup intent', error, { customerId });
      throw new AppError('Failed to create setup intent', 500, 'STRIPE_SETUP_INTENT_FAILED');
    }
  }

  /**
   * Process a payment
   */
  async processPayment(request: PaymentRequest): Promise<Stripe.PaymentIntent> {
    try {
      // Create or get Stripe customer
      const stripeCustomer = await this.getOrCreateCustomer(request.customerId);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount,
        currency: request.currency,
        customer: stripeCustomer.id,
        payment_method: request.paymentMethodId,
        description: request.description,
        metadata: request.metadata || {},
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`,
      });

      logger.info('Payment processed', {
        paymentIntentId: paymentIntent.id,
        amount: request.amount,
        currency: request.currency,
        customerId: request.customerId,
        status: paymentIntent.status
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Payment processing failed', error, {
        amount: request.amount,
        customerId: request.customerId
      });
      
      if (error instanceof Stripe.errors.StripeCardError) {
        throw new AppError(error.message, 400, 'CARD_ERROR');
      }
      
      throw new AppError('Payment processing failed', 500, 'PAYMENT_FAILED');
    }
  }

  /**
   * Authorize a payment (pre-auth)
   */
  async authorizePayment(request: AuthorizationRequest): Promise<Stripe.PaymentIntent> {
    try {
      // Create or get Stripe customer
      const stripeCustomer = await this.getOrCreateCustomer(request.customerId);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount,
        currency: request.currency,
        customer: stripeCustomer.id,
        payment_method: request.paymentMethodId,
        description: request.description,
        metadata: request.metadata || {},
        capture_method: 'manual', // This creates an authorization
        confirmation_method: 'manual',
        confirm: true,
      });

      logger.info('Payment authorized', {
        paymentIntentId: paymentIntent.id,
        amount: request.amount,
        currency: request.currency,
        customerId: request.customerId,
        status: paymentIntent.status
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Payment authorization failed', error, {
        amount: request.amount,
        customerId: request.customerId
      });
      
      if (error instanceof Stripe.errors.StripeCardError) {
        throw new AppError(error.message, 400, 'CARD_ERROR');
      }
      
      throw new AppError('Payment authorization failed', 500, 'AUTHORIZATION_FAILED');
    }
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(paymentIntentId: string, amount?: number): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId, {
        amount_to_capture: amount,
      });

      logger.info('Payment captured', {
        paymentIntentId,
        capturedAmount: amount || paymentIntent.amount
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Payment capture failed', error, { paymentIntentId });
      throw new AppError('Payment capture failed', 500, 'CAPTURE_FAILED');
    }
  }

  /**
   * Cancel an authorized payment
   */
  async cancelPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      logger.info('Payment cancelled', { paymentIntentId });

      return paymentIntent;
    } catch (error) {
      logger.error('Payment cancellation failed', error, { paymentIntentId });
      throw new AppError('Payment cancellation failed', 500, 'CANCELLATION_FAILED');
    }
  }

  /**
   * Create a refund
   */
  async refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as Stripe.RefundCreateParams.Reason,
      });

      logger.info('Refund processed', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount
      });

      return refund;
    } catch (error) {
      logger.error('Refund failed', error, { paymentIntentId });
      throw new AppError('Refund processing failed', 500, 'REFUND_FAILED');
    }
  }

  /**
   * Get payment history for a customer
   */
  async getPaymentHistory(customerId: string, bookingId?: string): Promise<Stripe.PaymentIntent[]> {
    try {
      // Get or create Stripe customer
      const stripeCustomer = await this.getOrCreateCustomer(customerId);

      const params: Stripe.PaymentIntentListParams = {
        customer: stripeCustomer.id,
        limit: 100,
      };

      if (bookingId) {
        params.metadata = { bookingId };
      }

      const paymentIntents = await this.stripe.paymentIntents.list(params);

      return paymentIntents.data;
    } catch (error) {
      logger.error('Failed to get payment history', error, { customerId });
      throw new AppError('Failed to get payment history', 500, 'PAYMENT_HISTORY_FAILED');
    }
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      // Try to find existing Stripe customer by metadata
      const existingCustomers = await this.stripe.customers.list({
        metadata: { booqable_customer_id: customerId },
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new Stripe customer
      const customer = await this.stripe.customers.create({
        metadata: {
          booqable_customer_id: customerId,
        },
      });

      logger.info('New Stripe customer created', {
        stripeCustomerId: customer.id,
        booqableCustomerId: customerId
      });

      return customer;
    } catch (error) {
      logger.error('Failed to get or create Stripe customer', error, { customerId });
      throw new AppError('Customer creation failed', 500, 'CUSTOMER_CREATION_FAILED');
    }
  }

  /**
   * List payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const stripeCustomer = await this.getOrCreateCustomer(customerId);

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: stripeCustomer.id,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to get payment methods', error, { customerId });
      throw new AppError('Failed to get payment methods', 500, 'PAYMENT_METHODS_FAILED');
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);

      logger.info('Payment method deleted', { paymentMethodId });
    } catch (error) {
      logger.error('Failed to delete payment method', error, { paymentMethodId });
      throw new AppError('Failed to delete payment method', 500, 'PAYMENT_METHOD_DELETE_FAILED');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      throw new AppError('Webhook secret not configured', 500, 'WEBHOOK_SECRET_MISSING');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (error) {
      logger.error('Webhook signature verification failed', error);
      throw new AppError('Invalid webhook signature', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }
  }
}

export const stripeService = new StripeService(); 