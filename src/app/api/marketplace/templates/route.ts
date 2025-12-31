import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketplace/templates
 * List published marketplace templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build where clause
    const where: any = {
      isPublished: true,
    };

    if (category && category !== 'all') {
      where.category = category.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (minPrice !== null && minPrice !== undefined) {
      where.price = { ...where.price, gte: parseInt(minPrice) };
    }

    if (maxPrice !== null && maxPrice !== undefined) {
      where.price = { ...where.price, lte: parseInt(maxPrice) };
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'newest':
        orderBy = { publishedAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { publishedAt: 'asc' };
        break;
      case 'popular':
        orderBy = { downloadCount: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
    }

    // Run count and findMany in parallel
    const [total, templates] = await Promise.all([
      prisma.template.count({ where }),
      prisma.template.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          category: true,
          thumbnailUrl: true,
          previewImages: true,
          sections: true,
          description: true,
          price: true,
          tags: true,
          downloadCount: true,
          rating: true,
          ratingCount: true,
          isReference: true,
          createdBy: true,
          publishedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              nickname: true,
              image: true,
            },
          },
        },
      }),
    ]);

    // If user is logged in, check which templates they've purchased
    let purchasedTemplateIds: string[] = [];
    if (userId && templates.length > 0) {
      const purchases = await prisma.templatePurchase.findMany({
        where: {
          buyerId: userId,
          templateId: { in: templates.map((t) => t.id) },
        },
        select: { templateId: true },
      });
      purchasedTemplateIds = purchases.map((p) => p.templateId);
    }

    // Format response
    const formattedTemplates = templates.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      thumbnailUrl: template.thumbnailUrl,
      previewImages: template.previewImages,
      sections: template.sections,
      description: template.description,
      price: template.price,
      tags: template.tags,
      downloadCount: template.downloadCount,
      rating: template.rating,
      ratingCount: template.ratingCount,
      isReference: template.isReference,
      createdBy: template.createdBy,
      publishedAt: template.publishedAt,
      seller: template.user
        ? {
            id: template.user.id,
            name: template.user.name || template.user.nickname || 'Unknown',
            image: template.user.image,
          }
        : null,
      isPurchased: purchasedTemplateIds.includes(template.id),
      isOwner: template.user?.id === userId,
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
    console.error('Error fetching marketplace templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace templates' },
      { status: 500 }
    );
  }
}
