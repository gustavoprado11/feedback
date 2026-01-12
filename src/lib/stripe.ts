import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

let stripeInstance: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    if (!stripeInstance) {
      stripeInstance = getStripe();
    }
    return (stripeInstance as any)[prop];
  },
});

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
