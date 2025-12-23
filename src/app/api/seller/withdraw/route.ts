import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withdrawSellerEarnings } from '@/lib/marketplace';
import { MARKETPLACE_CONFIG } from '@/lib/stripe';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z
    .number()
    .int()
    .min(
      MARKETPLACE_CONFIG.WITHDRAWAL_MIN_AMOUNT,
      `Minimum withdrawal is ${MARKETPLACE_CONFIG.WITHDRAWAL_MIN_AMOUNT} credits`
    ),
});

/**
 * POST /api/seller/withdraw
 * Withdraw seller earnings to user credits
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const validation = withdrawSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { amount } = validation.data;

    // Execute withdrawal
    const result = await withdrawSellerEarnings(userId, amount);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: `Successfully withdrew ${amount} credits`,
      newSellerBalance: result.newBalance,
      newUserCredits: result.newCredits,
    });
  } catch (error) {
    console.error('Error withdrawing earnings:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw earnings' },
      { status: 500 }
    );
  }
}
