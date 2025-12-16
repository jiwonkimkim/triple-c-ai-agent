import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, getPlanByPriceId, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// POST /api/billing/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in checkout session');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const planId = getPlanByPriceId(priceId);

  if (!planId) {
    console.error('Could not determine plan from price ID:', priceId);
    return;
  }

  const plan = PLANS[planId];

  // Update user with subscription info
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planId,
      credits: plan.credits,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Create subscription record
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    update: {
      stripePriceId: priceId,
      plan: planId,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCustomerId: subscription.customer as string,
      plan: planId,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Record initial credit transaction
  await prisma.creditTransaction.create({
    data: {
      userId,
      type: 'SUBSCRIPTION_RENEWAL',
      amount: plan.credits,
      balance: plan.credits,
      description: `${plan.name} 플랜 구독 시작`,
      metadata: {
        subscriptionId,
        planId,
      },
    },
  });

  console.log(`Checkout completed for user ${userId}, plan: ${planId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    });

    if (!user) {
      console.error('Could not find user for subscription:', subscription.id);
      return;
    }
  }

  const priceId = subscription.items.data[0]?.price.id;
  const planId = getPlanByPriceId(priceId);

  if (!planId) {
    console.error('Could not determine plan from price ID:', priceId);
    return;
  }

  // Update subscription record
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      stripePriceId: priceId,
      plan: planId,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
    create: {
      userId: userId!,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCustomerId: subscription.customer as string,
      plan: planId,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Update user record
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: subscription.customer as string },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: planId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find user by subscription ID
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!user) {
    console.error('Could not find user for deleted subscription:', subscription.id);
    return;
  }

  // Update user to FREE plan
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: 'FREE',
      credits: 3, // Reset to free credits
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  // Update subscription record
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });

  console.log(`Subscription deleted for user ${user.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!user) {
    console.error('Could not find user for invoice:', invoice.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const planId = getPlanByPriceId(priceId);

  if (!planId || planId === 'FREE') return;

  const plan = PLANS[planId];

  // Record payment
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentId: invoice.payment_intent as string || invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'SUCCEEDED',
      description: `${plan.name} 플랜 결제`,
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
        planId,
      },
    },
  });

  // Renew credits for renewal payments (not initial)
  if (invoice.billing_reason === 'subscription_cycle') {
    const newBalance = user.credits + plan.credits;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: newBalance,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        type: 'SUBSCRIPTION_RENEWAL',
        amount: plan.credits,
        balance: newBalance,
        description: `${plan.name} 플랜 갱신 - 크레딧 충전`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          planId,
        },
      },
    });
  }

  console.log(`Payment succeeded for user ${user.id}, invoice: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (!user) {
    console.error('Could not find user for failed invoice:', invoice.id);
    return;
  }

  // Record failed payment
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentId: invoice.payment_intent as string || invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'FAILED',
      description: '결제 실패',
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id ?? null,
      },
    },
  });

  // Update subscription status
  if (invoice.subscription) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: {
        status: 'PAST_DUE',
      },
    });
  }

  console.log(`Payment failed for user ${user.id}, invoice: ${invoice.id}`);
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING' {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELED';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
      return 'UNPAID';
    case 'trialing':
      return 'TRIALING';
    default:
      return 'ACTIVE';
  }
}
