import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getFilesystemTemplates, FilesystemTemplate } from '@/lib/filesystem-templates';

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

    // Format DB templates
    const formattedDbTemplates = templates.map((template) => ({
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

    // Get filesystem templates (from public/templates directory)
    let filesystemTemplates: FilesystemTemplate[] = [];
    try {
      filesystemTemplates = getFilesystemTemplates();

      // Apply filters to filesystem templates
      if (category && category !== 'all') {
        filesystemTemplates = filesystemTemplates.filter(
          t => t.category === category.toUpperCase()
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filesystemTemplates = filesystemTemplates.filter(
          t =>
            t.name.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Filesystem templates are always free (price = 0)
      if (minPrice !== null && parseInt(minPrice) > 0) {
        filesystemTemplates = [];
      }
    } catch (error) {
      console.error('Error loading filesystem templates:', error);
    }

    // Merge templates - filesystem templates come first, then DB templates
    const allTemplates = [...filesystemTemplates, ...formattedDbTemplates];

    // Sort merged templates
    switch (sortBy) {
      case 'newest':
        allTemplates.sort((a, b) =>
          new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
        );
        break;
      case 'oldest':
        allTemplates.sort((a, b) =>
          new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime()
        );
        break;
      case 'popular':
        allTemplates.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
      case 'rating':
        allTemplates.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_low':
        allTemplates.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        allTemplates.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        allTemplates.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Apply pagination to merged results
    const totalMerged = total + filesystemTemplates.length;
    const paginatedTemplates = allTemplates.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      templates: paginatedTemplates,
      pagination: {
        page,
        limit,
        total: totalMerged,
        totalPages: Math.ceil(totalMerged / limit),
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
