import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketplace/purchases
 * List all templates purchased by the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Run count and findMany in parallel
    const [total, purchases] = await Promise.all([
      prisma.templatePurchase.count({
        where: { buyerId: userId },
      }),
      prisma.templatePurchase.findMany({
        where: { buyerId: userId },
        orderBy: { purchasedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true,
              thumbnailUrl: true,
              description: true,
              sections: true,
              isReference: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  nickname: true,
                  image: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Format response
    const formattedPurchases = purchases.map((purchase) => ({
      id: purchase.id,
      purchasedAt: purchase.purchasedAt,
      pricePaid: purchase.pricePaid,
      template: {
        id: purchase.template.id,
        name: purchase.template.name,
        category: purchase.template.category,
        thumbnailUrl: purchase.template.thumbnailUrl,
        description: purchase.template.description,
        isReference: purchase.template.isReference,
        seller: purchase.template.user
          ? {
              id: purchase.template.user.id,
              name: purchase.template.user.name || purchase.template.user.nickname || 'Unknown',
              image: purchase.template.user.image,
            }
          : null,
      },
    }));

    return NextResponse.json({
      purchases: formattedPurchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
