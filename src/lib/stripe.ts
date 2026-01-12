import Stripe from 'stripe';

// Use a placeholder during build time, actual key needed at runtime
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';

// Helper to check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY &&
         !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
         !!process.env.STRIPE_PRICE_ID;
}
