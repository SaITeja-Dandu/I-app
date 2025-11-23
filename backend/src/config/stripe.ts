/**
 * @file config/stripe.ts
 * @description Stripe SDK initialization
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

let stripeClient: Stripe;

export const initializeStripe = (): Stripe => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });

  console.log('✅ Stripe initialized successfully');
  return stripeClient;
};

export const getStripe = (): Stripe => {
  if (!stripeClient) {
    throw new Error('Stripe not initialized');
  }
  return stripeClient;
};

export { Stripe };
