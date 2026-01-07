import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import {
  indexBrandContent,
  getBrandIndexStats,
  deleteBrandIndex,
  getBrandContext,
} from '@/services/rag/brand-context';

export const dynamic = 'force-dynamic';

const indexSchema = z.object({
  websiteUrls: z.array(z.string().url()).optional(),
  manualContent: z.string().optional(),
  maxPagesPerUrl: z.number().min(1).max(100).optional(),
  clearExisting: z.boolean().optional(),
});

const querySchema = z.object({
  query: z.string().min(1).max(1000),
  topK: z.number().min(1).max(20).optional(),
});

// GET /api/brands/[id]/knowledge - Get knowledge base stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const brandId = params.id;

    // Verify ownership
    const brandProfile = await prisma.brandProfile.findFirst({
      where: {
        id: brandId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        styleGuide: true,
      },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    const stats = await getBrandIndexStats(brandId);

    return NextResponse.json({
      success: true,
      data: {
        brandId,
        brandName: brandProfile.name,
        styleGuide: brandProfile.styleGuide,
        ...stats,
      },
    });
  } catch (error) {
    console.error('Get knowledge stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get knowledge base stats' },
      { status: 500 }
    );
  }
}

// POST /api/brands/[id]/knowledge - Index brand content
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const brandId = params.id;

    // Verify ownership
    const brandProfile = await prisma.brandProfile.findFirst({
      where: {
        id: brandId,
        userId: session.user.id,
      },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = indexSchema.parse(body);

    // Check if user has credits or subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.trialCredits <= 0 && user.plan === 'FREE')) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Index content
    const result = await indexBrandContent(brandId, validatedData);

    // Deduct credit if not on paid plan
    if (user.plan === 'FREE' && user.trialCredits > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { trialCredits: user.trialCredits - 1 },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        brandId,
        chunksIndexed: result.chunksIndexed,
        pagesProcessed: result.pagesProcessed,
        extractedAssets: result.extractedAssets,
      },
    });
  } catch (error) {
    console.error('Index brand content error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Return more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to index brand content';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/brands/[id]/knowledge - Query brand knowledge
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const brandId = params.id;

    // Verify ownership
    const brandProfile = await prisma.brandProfile.findFirst({
      where: {
        id: brandId,
        userId: session.user.id,
      },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { query, topK } = querySchema.parse(body);

    const context = await getBrandContext(brandId, query, topK);

    if (!context) {
      return NextResponse.json(
        { error: 'Failed to retrieve brand context' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: context,
    });
  } catch (error) {
    console.error('Query brand knowledge error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to query brand knowledge' },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id]/knowledge - Delete brand knowledge base
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const brandId = params.id;

    // Verify ownership
    const brandProfile = await prisma.brandProfile.findFirst({
      where: {
        id: brandId,
        userId: session.user.id,
      },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    await deleteBrandIndex(brandId);

    return NextResponse.json({
      success: true,
      message: 'Brand knowledge base deleted successfully',
    });
  } catch (error) {
    console.error('Delete brand knowledge error:', error);
    return NextResponse.json(
      { error: 'Failed to delete brand knowledge base' },
      { status: 500 }
    );
  }
}
