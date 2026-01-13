import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateUserSubscription, findUserByEmail } from '@/lib/supabase';
import Stripe from 'stripe';

// Helper to get user ID from customer
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;

    // Try to get from metadata first
    if (customer.metadata?.userId) {
      return customer.metadata.userId;
    }

    // If no metadata, try to find user by email
    if (customer.email) {
      const user = await findUserByEmail(customer.email);
      return user?.id || null;
    }

    return null;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Sem assinatura' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Erro ao verificar webhook:', err);
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Try to get userId from metadata (for Checkout Sessions)
        let userId: string | undefined | null = session.metadata?.userId;

        // If no metadata (Payment Links), get userId from customer email
        if (!userId && session.customer_email) {
          const user = await findUserByEmail(session.customer_email);
          userId = user?.id;
        }

        // If still no userId but we have a customer ID, try that
        if (!userId && session.customer) {
          userId = await getUserIdFromCustomer(session.customer as string);
        }

        if (userId && session.subscription) {
          await updateUserSubscription(userId, {
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
          });
        } else {
          console.error('Could not find user for checkout session:', {
            sessionId: session.id,
            customerEmail: session.customer_email,
            customerId: session.customer,
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const userId = await getUserIdFromCustomer(customerId);
        if (!userId) break;

        // current_period_end is a unix timestamp
        const periodEnd = (subscription as any).current_period_end;
        const endDate = new Date(periodEnd * 1000);

        await updateUserSubscription(userId, {
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_end_date: endDate.toISOString(),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const userId = await getUserIdFromCustomer(customerId);
        if (!userId) break;

        await updateUserSubscription(userId, {
          subscription_status: 'canceled',
          subscription_end_date: new Date().toISOString(),
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const userId = await getUserIdFromCustomer(customerId);
        if (!userId) break;

        await updateUserSubscription(userId, {
          subscription_status: 'past_due',
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const userId = await getUserIdFromCustomer(customerId);
        if (!userId) break;

        // If subscription was past_due, reactivate it
        await updateUserSubscription(userId, {
          subscription_status: 'active',
        });
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}
