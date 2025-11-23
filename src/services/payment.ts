/**
 * @file services/payment.ts
 * @description Service for handling Stripe payment processing
 */

import { createLogger } from '../utils/logger';
// InterviewBooking type imported but not used - remove if not needed in future

const logger = createLogger('PaymentService');

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  candidateId: string;
  interviewerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  failureReason?: string;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewerPayout {
  id: string;
  interviewerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  stripeTransferId?: string;
  transactions: string[]; // Transaction IDs included in payout
  failureReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingCalculation {
  subtotal: number;
  platformFee: number;
  total: number;
  interviewerEarnings: number;
  currency: string;
}

/**
 * Payment Service for Stripe integration
 */
export class PaymentService {
  private stripePublishableKey: string | null = null;
  private backendUrl: string;
  private platformFeePercentage: number = 15; // 15% platform fee

  constructor() {
    this.stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null;
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    if (!this.stripePublishableKey) {
      logger.warn('Stripe publishable key not configured. Payment features will be limited.');
    }
  }

  /**
   * Calculate pricing for a booking
   */
  calculatePricing(
    hourlyRate: number,
    durationMinutes: number,
    currency: string = 'USD'
  ): PricingCalculation {
    const hours = durationMinutes / 60;
    const subtotal = Math.round(hourlyRate * hours * 100) / 100; // Round to 2 decimals
    const platformFee = Math.round(subtotal * (this.platformFeePercentage / 100) * 100) / 100;
    const total = Math.round((subtotal + platformFee) * 100) / 100;
    const interviewerEarnings = subtotal;

    return {
      subtotal,
      platformFee,
      total,
      interviewerEarnings,
      currency,
    };
  }

  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(
    bookingId: string,
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    try {
      if (!this.stripePublishableKey) {
        throw new Error('Stripe not configured');
      }

      // Call backend to create payment intent
      const response = await fetch(`${this.backendUrl}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          metadata: {
            bookingId,
            ...metadata,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }

      const data = await response.json();
      
      logger.info({ bookingId, amount, paymentIntentId: data.id }, 'Payment intent created');

      return {
        id: data.id,
        clientSecret: data.clientSecret,
        amount: data.amount / 100, // Convert from cents
        currency: data.currency.toUpperCase(),
        status: data.status,
      };
    } catch (error) {
      logger.error({ error, bookingId, amount }, 'Failed to create payment intent');
      throw error;
    }
  }

  /**
   * Confirm a payment (mock for now - real implementation requires Stripe Elements)
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      // Payment intent confirmed - data not needed
      await response.json();
      
      logger.info({ paymentIntentId }, 'Payment confirmed');

      return { success: true };
    } catch (error: any) {
      logger.error({ error, paymentIntentId }, 'Payment confirmation failed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Process refund for a booking
   */
  async processRefund(
    bookingId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Refund failed');
      }

      const data = await response.json();
      
      logger.info({ bookingId, refundId: data.refundId }, 'Refund processed');

      return { success: true, refundId: data.refundId };
    } catch (error: any) {
      logger.error({ error, bookingId }, 'Refund processing failed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payment transaction details
   */
  async getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payments/transaction/${transactionId}`);

      if (!response.ok) {
        throw new Error('Transaction not found');
      }

      const data = await response.json();
      
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        refundedAt: data.refundedAt ? new Date(data.refundedAt) : undefined,
      };
    } catch (error) {
      logger.error({ error, transactionId }, 'Failed to get transaction');
      return null;
    }
  }

  /**
   * Get interviewer earnings summary
   */
  async getInterviewerEarnings(
    interviewerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    totalInterviews: number;
    currency: string;
  }> {
    try {
      const params = new URLSearchParams({
        interviewerId,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
      });

      const response = await fetch(`${this.backendUrl}/api/payments/earnings?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch earnings');
      }

      const data = await response.json();
      
      logger.info({ interviewerId, totalEarnings: data.totalEarnings }, 'Fetched earnings');

      return data;
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to get earnings');
      return {
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        totalInterviews: 0,
        currency: 'USD',
      };
    }
  }

  /**
   * Request payout for interviewer
   */
  async requestPayout(
    interviewerId: string,
    amount: number
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payments/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewerId,
          amount: Math.round(amount * 100), // Convert to cents
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payout request failed');
      }

      const data = await response.json();
      
      logger.info({ interviewerId, amount, payoutId: data.payoutId }, 'Payout requested');

      return { success: true, payoutId: data.payoutId };
    } catch (error: any) {
      logger.error({ error, interviewerId, amount }, 'Payout request failed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return this.stripePublishableKey !== null;
  }

  /**
   * Get Stripe publishable key
   */
  getPublishableKey(): string | null {
    return this.stripePublishableKey;
  }

  /**
   * Mock payment for testing (when Stripe not configured)
   */
  async mockPayment(bookingId: string, amount: number): Promise<{ success: boolean }> {
    logger.info({ bookingId, amount }, 'Mock payment processed (Stripe not configured)');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  }
}

// Singleton instance
let paymentServiceInstance: PaymentService | null = null;

export function initializePaymentService(): void {
  paymentServiceInstance = new PaymentService();
  logger.info('Payment service initialized');
}

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    throw new Error('PaymentService not initialized. Call initializePaymentService first.');
  }
  return paymentServiceInstance;
}
