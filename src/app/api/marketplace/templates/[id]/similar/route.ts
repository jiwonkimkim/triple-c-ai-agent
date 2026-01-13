import { NextRequest, NextResponse } from 'next/server';
import { findSimilarTemplates } from '@/services/marketplace/template-search';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketplace/templates/:id/similar
 * Find similar templates based on embedding similarity
 *
 * Query Parameters:
 * - limit: Number of similar templates to return (default 5)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const templates = await findSimilarTemplates(id, Math.min(limit, 20));

    return NextResponse.json({
      templates,
      meta: {
        templateId: id,
        limit,
      },
    });
  } catch (error) {
    console.error('Error finding similar templates:', error);
    return NextResponse.json({ error: 'Failed to find similar templates' }, { status: 500 });
  }
}
