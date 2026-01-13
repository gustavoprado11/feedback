import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUserSubscription } from '@/lib/supabase';

// TEMPORARY DEBUG ENDPOINT - REMOVE IN PRODUCTION
// This endpoint allows manually activating a subscription for testing
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { forceActive } = body;

    if (!forceActive) {
      return NextResponse.json(
        { error: 'Missing forceActive parameter' },
        { status: 400 }
      );
    }

    // Force activate the subscription
    await updateUserSubscription(user.id, {
      subscription_status: 'active',
      stripe_customer_id: 'manual_test_customer',
      stripe_subscription_id: 'manual_test_subscription',
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription forcefully activated for testing',
      user_id: user.id,
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
