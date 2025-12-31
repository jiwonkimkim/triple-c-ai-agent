import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface ChunkMetadata {
  sourceUrl?: string;
  createdAt?: string;
  fileName?: string;
}

// GET /api/brands/[id]/knowledge/chunks - Get paginated list of chunks
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source'); // WEBSITE, UPLOAD, INSTAGRAM
    const search = searchParams.get('search');

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

    // Build where clause
    const where: {
      brandProfileId: string;
      source?: 'WEBSITE' | 'UPLOAD' | 'INSTAGRAM';
      content?: { contains: string; mode: 'insensitive' };
    } = { brandProfileId: brandId };

    if (source && ['WEBSITE', 'UPLOAD', 'INSTAGRAM'].includes(source)) {
      where.source = source as 'WEBSITE' | 'UPLOAD' | 'INSTAGRAM';
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    // Get total count and paginated chunks
    const [total, chunks] = await Promise.all([
      prisma.brandDocumentChunk.count({ where }),
      prisma.brandDocumentChunk.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          source: true,
          content: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    // Get source counts for filtering
    const sourceCounts = await prisma.brandDocumentChunk.groupBy({
      by: ['source'],
      where: { brandProfileId: brandId },
      _count: true,
    });

    const sourceCountMap = sourceCounts.reduce((acc, item) => {
      acc[item.source] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Format chunks for response
    const formattedChunks = chunks.map((chunk) => {
      const metadata = chunk.metadata as ChunkMetadata;
      return {
        id: chunk.id,
        source: chunk.source,
        content: chunk.content,
        preview: chunk.content.length > 200
          ? chunk.content.substring(0, 200) + '...'
          : chunk.content,
        sourceUrl: metadata?.sourceUrl || null,
        fileName: metadata?.fileName || null,
        createdAt: chunk.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        chunks: formattedChunks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        sourceCounts: sourceCountMap,
      },
    });
  } catch (error) {
    console.error('Get chunks error:', error);
    return NextResponse.json(
      { error: 'Failed to get chunks' },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id]/knowledge/chunks - Delete specific chunks
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
    const body = await request.json();
    const { chunkIds } = body as { chunkIds: string[] };

    if (!chunkIds || !Array.isArray(chunkIds) || chunkIds.length === 0) {
      return NextResponse.json(
        { error: 'chunkIds array is required' },
        { status: 400 }
      );
    }

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

    // Delete chunks
    const result = await prisma.brandDocumentChunk.deleteMany({
      where: {
        id: { in: chunkIds },
        brandProfileId: brandId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    console.error('Delete chunks error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chunks' },
      { status: 500 }
    );
  }
}
