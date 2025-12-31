import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { purchaseTemplate } from '@/lib/marketplace';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/templates/[id]/purchase
 * Purchase a template from the marketplace
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    const userId = session.user.id;

    // Execute purchase
    const result = await purchaseTemplate(userId, templateId);

    if (!result.success) {
      // Return appropriate status codes
      if (result.error === 'Insufficient credits') {
        return NextResponse.json({ error: result.error }, { status: 402 });
      }
      if (result.error === 'Template already purchased') {
        return NextResponse.json({ error: result.error }, { status: 409 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Get full template data for the buyer
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        name: true,
        category: true,
        thumbnailUrl: true,
        sections: true,
        description: true,
        price: true,
      },
    });

    return NextResponse.json({
      message: 'Template purchased successfully',
      purchase: result.purchase,
      template,
    });
  } catch (error) {
    console.error('Error purchasing template:', error);
    return NextResponse.json(
      { error: 'Failed to purchase template' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/templates/[id]/purchase
 * Check if user has purchased a template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    const userId = session.user.id;

    const purchase = await prisma.templatePurchase.findUnique({
      where: {
        templateId_buyerId: {
          templateId,
          buyerId: userId,
        },
      },
      select: {
        id: true,
        pricePaid: true,
        purchasedAt: true,
      },
    });

    return NextResponse.json({
      isPurchased: !!purchase,
      purchase,
    });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return NextResponse.json(
      { error: 'Failed to check purchase status' },
      { status: 500 }
    );
  }
}
