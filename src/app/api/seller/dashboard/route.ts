import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/seller/dashboard
 * Get seller dashboard statistics
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

    // Get published templates count
    const publishedTemplatesCount = await prisma.template.count({
      where: {
        userId,
        isPublished: true,
      },
    });

    // Get total sales count
    const totalSalesCount = await prisma.templatePurchase.count({
      where: { sellerId: userId },
    });

    // Get this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await prisma.templatePurchase.aggregate({
      where: {
        sellerId: userId,
        purchasedAt: { gte: startOfMonth },
      },
      _sum: { sellerEarning: true },
      _count: true,
    });

    // Get recent transactions
    const recentTransactions = await prisma.sellerTransaction.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get top selling templates
    const topTemplates = await prisma.template.findMany({
      where: {
        userId,
        isPublished: true,
      },
      orderBy: { downloadCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        price: true,
        downloadCount: true,
        rating: true,
      },
    });

    return NextResponse.json({
      balance: {
        available: sellerBalance.availableCredits,
        totalEarned: sellerBalance.totalEarned,
        totalWithdrawn: sellerBalance.totalWithdrawn,
      },
      stats: {
        publishedTemplates: publishedTemplatesCount,
        totalSales: totalSalesCount,
        monthlySales: monthlyStats._count,
        monthlyEarnings: monthlyStats._sum.sellerEarning || 0,
      },
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balance: t.balance,
        description: t.description,
        createdAt: t.createdAt,
      })),
      topTemplates,
    });
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller dashboard' },
      { status: 500 }
    );
  }
}
