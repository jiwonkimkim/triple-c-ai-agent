import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  embedTemplates,
  getTemplatesWithoutEmbedding,
  reembedAllTemplates,
  embedTemplate,
} from '@/services/marketplace/template-embedding';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/templates/embed
 * Generate embeddings for templates (admin only)
 *
 * Body:
 * - mode: 'pending' | 'all' | 'specific'
 * - templateIds?: string[] (required when mode is 'specific')
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin role check
    // For now, allow any authenticated user (should be restricted in production)

    const body = await request.json();
    const { mode = 'pending', templateIds } = body;

    let result: { success: number; failed: string[] };

    switch (mode) {
      case 'pending':
        // Process templates without embeddings
        const pendingIds = await getTemplatesWithoutEmbedding(500);
        if (pendingIds.length === 0) {
          return NextResponse.json({
            message: 'No templates pending embedding',
            success: 0,
            failed: [],
            pending: 0,
          });
        }
        result = await embedTemplates(pendingIds);
        break;

      case 'all':
        // Re-embed all published templates
        result = await reembedAllTemplates();
        break;

      case 'specific':
        // Embed specific templates
        if (!templateIds || templateIds.length === 0) {
          return NextResponse.json(
            { error: 'templateIds required for specific mode' },
            { status: 400 }
          );
        }
        result = await embedTemplates(templateIds);
        break;

      case 'single':
        // Embed a single template
        if (!templateIds || templateIds.length !== 1) {
          return NextResponse.json(
            { error: 'Exactly one templateId required for single mode' },
            { status: 400 }
          );
        }
        try {
          await embedTemplate(templateIds[0]);
          result = { success: 1, failed: [] };
        } catch (error) {
          result = { success: 0, failed: templateIds };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid mode. Use: pending, all, specific, or single' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Embedding completed`,
      success: result.success,
      failed: result.failed,
      failedCount: result.failed.length,
    });
  } catch (error) {
    console.error('Error embedding templates:', error);
    return NextResponse.json({ error: 'Failed to embed templates' }, { status: 500 });
  }
}

/**
 * GET /api/admin/templates/embed
 * Get embedding status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingIds = await getTemplatesWithoutEmbedding(1000);

    return NextResponse.json({
      pendingCount: pendingIds.length,
      pendingIds: pendingIds.slice(0, 10), // Return first 10 for preview
    });
  } catch (error) {
    console.error('Error getting embedding status:', error);
    return NextResponse.json({ error: 'Failed to get embedding status' }, { status: 500 });
  }
}
