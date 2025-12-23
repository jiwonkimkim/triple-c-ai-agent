import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/seller/templates
 * List seller's published and draft templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'published', 'draft', or 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build where clause
    const where: any = {
      userId,
      createdBy: 'USER',
    };

    if (status === 'published') {
      where.isPublished = true;
    } else if (status === 'draft') {
      where.isPublished = false;
    }

    // Get total count
    const total = await prisma.template.count({ where });

    // Get templates with sales stats
    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        thumbnailUrl: true,
        description: true,
        price: true,
        isPublished: true,
        publishedAt: true,
        downloadCount: true,
        rating: true,
        ratingCount: true,
        createdAt: true,
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    // Calculate earnings for each template
    const templateIds = templates.map((t) => t.id);
    const earnings = await prisma.templatePurchase.groupBy({
      by: ['templateId'],
      where: { templateId: { in: templateIds } },
      _sum: { sellerEarning: true },
    });

    const earningsMap = new Map(
      earnings.map((e) => [e.templateId, e._sum.sellerEarning || 0])
    );

    // Format response
    const formattedTemplates = templates.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      thumbnailUrl: template.thumbnailUrl,
      description: template.description,
      price: template.price,
      isPublished: template.isPublished,
      publishedAt: template.publishedAt,
      downloadCount: template.downloadCount,
      rating: template.rating,
      ratingCount: template.ratingCount,
      createdAt: template.createdAt,
      salesCount: template._count.purchases,
      totalEarnings: earningsMap.get(template.id) || 0,
    }));

    return NextResponse.json({
      templates: formattedTemplates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching seller templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller templates' },
      { status: 500 }
    );
  }
}
