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

    // Handle Style Search (Text-to-Image)
    if (mode === 'style') {
      const { searchTemplatesByStyle } = await import('@/services/marketplace/template-search');
      const templates = await searchTemplatesByStyle(query, {
        limit,
        category: finalCategory,
      });

      return NextResponse.json({
        templates: templates.map(t => ({ ...t, isPurchased: false, isOwner: false })), // Simplify for style search for now or fetch purchase info if needed
        pagination: {
          page,
          limit,
          total: templates.length, // Style search doesn't return total count efficiently yet
          totalPages: 1,
        },
        meta: { query, mode, category: finalCategory },
      });
    }

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
        hybridWeight,
        // 점수 설명
        scoring: {
          semantic: `Dense search (벡터 유사도) - 가중치 ${(hybridWeight * 100).toFixed(0)}%`,
          keyword: `Sparse search (키워드 매칭) - 가중치 ${((1 - hybridWeight) * 100).toFixed(0)}%`,
          formula: 'combined = (semantic × hybridWeight) + (keyword × (1 - hybridWeight))',
        },
      },
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    return NextResponse.json({ error: 'Failed to search templates' }, { status: 500 });
  }
}

/**
 * POST /api/marketplace/templates/search
 * Image-to-Image Search
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'all';
    const limit = parseInt((formData.get('limit') as string) || '12');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { searchTemplatesByImage } = await import('@/services/marketplace/template-search');

    // Validate category like in GET
    const validCategories = ['all', 'GENERIC', 'FASHION', 'FOOD', 'BEAUTY', 'DIGITAL'];
    const normalizedCategory = category.toUpperCase();
    const finalCategory =
      normalizedCategory === 'ALL'
        ? 'all'
        : validCategories.includes(normalizedCategory)
          ? (normalizedCategory as TemplateCategory)
          : 'all';

    const templates = await searchTemplatesByImage(buffer, {
      limit,
      category: finalCategory,
    });

    return NextResponse.json({
      templates: templates.map(t => ({ ...t, isPurchased: false, isOwner: false })),
      meta: { mode: 'image', category: finalCategory }
    });
  } catch (error) {
    console.error('Error in image search:', error);
    return NextResponse.json({ error: 'Failed to search by image' }, { status: 500 });
  }
}
