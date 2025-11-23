/**
 * @file components/PaymentCheckout.tsx
 * @description Payment checkout component for booking interviews
 */

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { getPaymentService, type PricingCalculation } from '../services/payment';
import { createLogger } from '../utils/logger';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const logger = createLogger('PaymentCheckout');

interface PaymentCheckoutProps {
  bookingId: string;
  interviewerName: string;
  hourlyRate: number;
  durationMinutes: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  bookingId,
  interviewerName,
  hourlyRate,
  durationMinutes,
  onPaymentSuccess,
  onCancel,
}) => {
  const [pricing, setPricing] = useState<PricingCalculation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  // Mock card details for demo
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  useEffect(() => {
    const paymentService = getPaymentService();
    setStripeConfigured(paymentService.isConfigured());

    // Calculate pricing
    const calculatedPricing = paymentService.calculatePricing(hourlyRate, durationMinutes);
    setPricing(calculatedPricing);

    logger.info({ bookingId, pricing: calculatedPricing }, 'Payment checkout initialized');
  }, [bookingId, hourlyRate, durationMinutes]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (/^\d{0,16}$/.test(value)) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiryDate(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const validateForm = (): boolean => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    if (!expiryDate || expiryDate.length !== 5) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!cvv || cvv.length < 3) {
      setError('Please enter a valid CVV');
      return false;
    }
    if (!cardholderName.trim()) {
      setError('Please enter the cardholder name');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    if (!pricing) {
      setError('Pricing information not available');
      return;
    }

    try {
      setIsProcessing(true);

      const paymentService = getPaymentService();

      if (stripeConfigured) {
        // Create payment intent
        const paymentIntent = await paymentService.createPaymentIntent(
          bookingId,
          pricing.total,
          'usd',
          {
            interviewerName,
            durationMinutes: durationMinutes.toString(),
          }
        );

        // In a real implementation, this would use Stripe Elements
        // For now, we'll simulate the payment
        logger.info({ paymentIntentId: paymentIntent.id }, 'Payment intent created');

        // Mock payment confirmation
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Mock payment when Stripe not configured
        await paymentService.mockPayment(bookingId, pricing.total);
      }

      setSuccess(true);
      logger.info({ bookingId }, 'Payment successful');

      // Wait a moment to show success, then call callback
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    } catch (err: any) {
      logger.error({ error: err, bookingId }, 'Payment failed');
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!pricing) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-4">Your interview has been booked.</p>
        <div className="animate-pulse text-sm text-gray-500">Redirecting...</div>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Booking</h2>
          <p className="text-gray-600">Interview with {interviewerName}</p>
        </div>

        {/* Pricing Breakdown */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Pricing Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">
                Interview ({durationMinutes} minutes @ {getPaymentService().formatCurrency(hourlyRate)}/hour)
              </span>
              <span className="font-medium">{getPaymentService().formatCurrency(pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Platform Fee (15%)</span>
              <span className="font-medium">{getPaymentService().formatCurrency(pricing.platformFee)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-lg text-indigo-600">
                  {getPaymentService().formatCurrency(pricing.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </h3>

          {!stripeConfigured && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Demo Mode: Stripe not configured. This is a simulated payment flow.
            </div>
          )}

          <div className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                maxLength={19}
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={handleCvvChange}
                  placeholder="123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={4}
                />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Payment Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Security Note */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg flex items-start gap-2">
          <Lock className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600">
            Your payment information is encrypted and secure. We use Stripe for payment processing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            size="lg"
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Pay {getPaymentService().formatCurrency(pricing.total)}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
