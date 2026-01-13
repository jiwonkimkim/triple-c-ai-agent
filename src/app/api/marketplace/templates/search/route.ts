import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  semanticSearchTemplates,
  TemplateSearchOptions,
} from '@/services/marketplace/template-search';
import { prisma } from '@/lib/prisma';
import { TemplateCategory } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketplace/templates/search
 * Semantic search for templates
 *
 * Query Parameters:
 * - q: Search query (required, min 2 chars)
 * - category: Category filter (GENERIC, FASHION, FOOD, BEAUTY, DIGITAL, all)
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - page: Page number (default 1)
 * - limit: Items per page (default 12)
 * - mode: Search mode (semantic, keyword, hybrid) - default hybrid
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category') || 'all';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const mode = searchParams.get('mode') || 'hybrid';

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Set hybrid weight based on search mode
    let hybridWeight: number;
    switch (mode) {
      case 'semantic':
        hybridWeight = 1.0;
        break;
      case 'keyword':
        hybridWeight = 0.0;
        break;
      case 'hybrid':
      default:
        hybridWeight = 0.7;
        break;
    }

    // Validate category
    const validCategories = ['all', 'GENERIC', 'FASHION', 'FOOD', 'BEAUTY', 'DIGITAL'];
    const normalizedCategory = category.toUpperCase();
    const finalCategory =
      normalizedCategory === 'ALL'
        ? 'all'
        : validCategories.includes(normalizedCategory)
          ? (normalizedCategory as TemplateCategory)
          : 'all';

    const options: TemplateSearchOptions = {
      query: query.trim(),
      category: finalCategory,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      limit,
      offset: (page - 1) * limit,
      hybridWeight,
    };

    const { templates, total } = await semanticSearchTemplates(options);

    // Check purchase status for logged-in users
    let purchasedTemplateIds: string[] = [];
    if (userId) {
      const purchases = await prisma.templatePurchase.findMany({
        where: { buyerId: userId },
        select: { templateId: true },
      });
      purchasedTemplateIds = purchases.map((p) => p.templateId);
    }

    const templatesWithPurchaseInfo = templates.map((t) => ({
      ...t,
      isPurchased: purchasedTemplateIds.includes(t.id),
      isOwner: t.seller?.id === userId,
    }));

    return NextResponse.json({
      templates: templatesWithPurchaseInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        query,
        mode,
        category: finalCategory,
      },
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    return NextResponse.json({ error: 'Failed to search templates' }, { status: 500 });
  }
}
