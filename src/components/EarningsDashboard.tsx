/**
 * @file components/EarningsDashboard.tsx
 * @description Dashboard component for interviewer earnings and payouts
 */

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { getPaymentService } from '../services/payment';
import { createLogger } from '../utils/logger';
import { DollarSign, TrendingUp, Calendar, Download, AlertCircle } from 'lucide-react';

const logger = createLogger('EarningsDashboard');

interface EarningsDashboardProps {
  interviewerId: string;
}

export const EarningsDashboard: React.FC<EarningsDashboardProps> = ({ interviewerId }) => {
  const [earnings, setEarnings] = useState<{
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    totalInterviews: number;
    currency: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const paymentService = getPaymentService();

  useEffect(() => {
    loadEarnings();
  }, [interviewerId]);

  const loadEarnings = async () => {
    try {
      setIsLoading(true);
      const data = await paymentService.getInterviewerEarnings(interviewerId);
      setEarnings(data);
      logger.info({ interviewerId, earnings: data }, 'Earnings loaded');
    } catch (error) {
      logger.error({ error, interviewerId }, 'Failed to load earnings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!earnings || earnings.pendingEarnings === 0) {
      setPayoutError('No pending earnings to withdraw');
      return;
    }

    try {
      setIsRequestingPayout(true);
      setPayoutError(null);
      setPayoutSuccess(false);

      const result = await paymentService.requestPayout(interviewerId, earnings.pendingEarnings);

      if (result.success) {
        setPayoutSuccess(true);
        // Reload earnings
        await loadEarnings();
        
        // Clear success message after 5 seconds
        setTimeout(() => setPayoutSuccess(false), 5000);
      } else {
        setPayoutError(result.error || 'Payout request failed');
      }
    } catch (error: any) {
      logger.error({ error, interviewerId }, 'Payout request failed');
      setPayoutError(error.message || 'Failed to request payout');
    } finally {
      setIsRequestingPayout(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading earnings..." />
        </div>
      </Card>
    );
  }

  if (!earnings) {
    return (
      <Card className="text-center py-12 p-6">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">Unable to load earnings data</p>
      </Card>
    );
  }

  const averagePerInterview = earnings.totalInterviews > 0 
    ? earnings.totalEarnings / earnings.totalInterviews 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Earnings Overview</h2>
        <p className="text-gray-600">Track your interview earnings and request payouts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Earnings */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <Badge label="Lifetime" variant="success" size="sm" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900">
            {paymentService.formatCurrency(earnings.totalEarnings, earnings.currency)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            From {earnings.totalInterviews} interviews
          </p>
        </Card>

        {/* Pending Earnings */}
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <Badge label="Available" variant="warning" size="sm" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Pending Earnings</p>
          <p className="text-3xl font-bold text-gray-900">
            {paymentService.formatCurrency(earnings.pendingEarnings, earnings.currency)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Ready to withdraw
          </p>
        </Card>

        {/* Paid Out */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <Badge label="Paid" variant="primary" size="sm" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Already Paid</p>
          <p className="text-3xl font-bold text-gray-900">
            {paymentService.formatCurrency(earnings.paidEarnings, earnings.currency)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Avg: {paymentService.formatCurrency(averagePerInterview, earnings.currency)}/interview
          </p>
        </Card>
      </div>

      {/* Payout Section */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Request Payout</h3>
            <p className="text-sm text-gray-600">
              Withdraw your pending earnings to your bank account
            </p>
          </div>
        </div>

        {/* Success Message */}
        {payoutSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Download className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Payout Requested</h4>
              <p className="text-sm text-green-700 mt-1">
                Your payout request has been submitted. Funds will be transferred within 2-5 business days.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {payoutError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Payout Error</h4>
              <p className="text-sm text-red-700 mt-1">{payoutError}</p>
            </div>
          </div>
        )}

        {/* Payout Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">Available for Payout</span>
            <span className="text-2xl font-bold text-gray-900">
              {paymentService.formatCurrency(earnings.pendingEarnings, earnings.currency)}
            </span>
          </div>

          {earnings.pendingEarnings > 0 ? (
            <div className="space-y-2 text-xs text-gray-600">
              <p>• Minimum payout amount: $50.00</p>
              <p>• Processing time: 2-5 business days</p>
              <p>• No fees for standard payouts</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Complete more interviews to earn and withdraw funds.
            </p>
          )}
        </div>

        {/* Payout Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleRequestPayout}
            disabled={isRequestingPayout || earnings.pendingEarnings === 0 || earnings.pendingEarnings < 50}
            size="lg"
            className="flex-1"
          >
            {isRequestingPayout ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Request Payout
              </>
            )}
          </Button>
        </div>

        {earnings.pendingEarnings < 50 && earnings.pendingEarnings > 0 && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Minimum payout amount is $50.00. You need {paymentService.formatCurrency(50 - earnings.pendingEarnings)} more.
          </p>
        )}
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">How Earnings Work</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• You earn the interview fee minus the 15% platform fee</li>
              <li>• Earnings become available after the interview is completed</li>
              <li>• Request payouts anytime once you reach the $50 minimum</li>
              <li>• Funds are transferred directly to your bank account via Stripe</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
