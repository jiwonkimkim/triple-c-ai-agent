import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/seller/transactions
 * List seller's transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'SALE', 'WITHDRAWAL', or null for all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = { sellerId: userId };

    if (type && ['SALE', 'WITHDRAWAL', 'REFUND'].includes(type)) {
      where.type = type;
    }

    // Get total count
    const total = await prisma.sellerTransaction.count({ where });

    // Get transactions with template info for sales
    const transactions = await prisma.sellerTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get template names for sale transactions
    const templateIds = transactions
      .filter((t) => t.templateId)
      .map((t) => t.templateId as string);

    const templates = await prisma.template.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true, thumbnailUrl: true },
    });

    const templateMap = new Map(templates.map((t) => [t.id, t]));

    // Format response
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      balance: transaction.balance,
      description: transaction.description,
      createdAt: transaction.createdAt,
      template: transaction.templateId
        ? templateMap.get(transaction.templateId) || null
        : null,
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching seller transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
