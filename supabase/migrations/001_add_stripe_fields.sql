-- Migration: Add Stripe subscription fields
-- Date: 2026-01-13
-- Description: Adds fields necessary for Stripe payment integration

-- Add Stripe fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text default 'inactive',
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Add weekly reports field to establishments table
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS weekly_reports_enabled boolean default true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add RLS policy for updating users (required for Stripe webhook)
CREATE POLICY IF NOT EXISTS "Allow service to update users" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN users.subscription_status IS 'Subscription status: inactive, active, trialing, past_due, canceled';
COMMENT ON COLUMN users.subscription_end_date IS 'Next billing date or subscription end date';
COMMENT ON COLUMN establishments.weekly_reports_enabled IS 'Whether to send weekly summary reports via email';
