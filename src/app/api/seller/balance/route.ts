import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/seller/balance
 * Get seller's current balance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get or create seller balance
    let sellerBalance = await prisma.sellerBalance.findUnique({
      where: { userId },
    });

    if (!sellerBalance) {
      sellerBalance = await prisma.sellerBalance.create({
        data: {
          userId,
          availableCredits: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        },
      });
    }

    return NextResponse.json({
      availableCredits: sellerBalance.availableCredits,
      totalEarned: sellerBalance.totalEarned,
      totalWithdrawn: sellerBalance.totalWithdrawn,
      updatedAt: sellerBalance.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching seller balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller balance' },
      { status: 500 }
    );
  }
}
