import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, PLANS, type PlanId } from '@/lib/stripe';
import { z } from 'zod';

// GET /api/billing/subscription - Get current subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentSubscription = user.subscriptions[0];
    const plan = PLANS[user.plan];

    return NextResponse.json({
      success: true,
      data: {
        plan: {
          id: user.plan,
          name: plan.name,
          description: plan.description,
          features: plan.features,
          limits: plan.limits,
        },
        credits: user.credits,
        subscription: currentSubscription
          ? {
              id: currentSubscription.id,
              status: currentSubscription.status,
              currentPeriodEnd: currentSubscription.currentPeriodEnd,
              cancelAtPeriodEnd: currentSubscription.cancelAtPeriodEnd,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

const cancelSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
});

// DELETE /api/billing/subscription - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cancelAtPeriodEnd } = cancelSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      );
    }

    if (cancelAtPeriodEnd) {
      // Cancel at period end (user keeps access until then)
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await prisma.subscription.update({
        where: { stripeSubscriptionId: user.stripeSubscriptionId },
        data: {
          cancelAtPeriodEnd: true,
        },
      });
    } else {
      // Cancel immediately
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: 'FREE',
          credits: 3,
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        },
      });

      await prisma.subscription.update({
        where: { stripeSubscriptionId: user.stripeSubscriptionId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: cancelAtPeriodEnd
        ? '구독이 기간 종료 시 취소됩니다.'
        : '구독이 취소되었습니다.',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  planId: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
  billingCycle: z.enum(['monthly', 'yearly']),
});

// PUT /api/billing/subscription - Update subscription (change plan)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingCycle } = updateSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription to update' },
        { status: 400 }
      );
    }

    const newPlan = PLANS[planId];
    const newPriceId =
      billingCycle === 'yearly'
        ? newPlan.stripePriceIdYearly
        : newPlan.stripePriceIdMonthly;

    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Price not configured for this plan' },
        { status: 400 }
      );
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );

    // Update the subscription with the new price
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    return NextResponse.json({
      success: true,
      message: '플랜이 변경되었습니다.',
    });
  } catch (error) {
    console.error('Update subscription error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
