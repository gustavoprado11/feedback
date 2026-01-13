import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { findUserById } from '@/lib/supabase';

// TEMPORARY DEBUG ENDPOINT - REMOVE IN PRODUCTION
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not authenticated',
      });
    }

    const fullUser = await findUserById(user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: fullUser?.id,
        email: fullUser?.email,
        subscription_status: fullUser?.subscription_status,
        stripe_customer_id: fullUser?.stripe_customer_id,
        stripe_subscription_id: fullUser?.stripe_subscription_id,
        subscription_end_date: fullUser?.subscription_end_date,
        created_at: fullUser?.created_at,
      },
      debug_info: {
        has_stripe_customer_id: !!fullUser?.stripe_customer_id,
        has_stripe_subscription_id: !!fullUser?.stripe_subscription_id,
        status_is_active: fullUser?.subscription_status === 'active',
        status_is_trialing: fullUser?.subscription_status === 'trialing',
        status_is_past_due: fullUser?.subscription_status === 'past_due',
        should_have_access:
          fullUser?.subscription_status === 'active' ||
          fullUser?.subscription_status === 'trialing' ||
          fullUser?.subscription_status === 'past_due',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
