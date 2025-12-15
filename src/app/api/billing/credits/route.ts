import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CREDIT_COSTS } from '@/lib/stripe';
import { z } from 'zod';

// GET /api/billing/credits - Get credit balance and history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [user, transactions, totalCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          credits: true,
          trialCredits: true,
          plan: true,
        },
      }),
      prisma.creditTransaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.creditTransaction.count({
        where: { userId: session.user.id },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: user.credits,
        trialCredits: user.trialCredits,
        plan: user.plan,
        transactions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json(
      { error: 'Failed to get credits' },
      { status: 500 }
    );
  }
}

const useCreditsSchema = z.object({
  operation: z.enum([
    'GENERATE_DETAIL_PAGE',
    'GENERATE_IMAGE_DRAFT',
    'GENERATE_IMAGE_HD',
    'GENERATE_MOTION_GIF',
    'GENERATE_VIDEO_4S',
    'GENERATE_VIDEO_8S',
    'GENERATE_VIDEO_16S',
    'RAG_INDEXING',
  ]),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/billing/credits - Use credits for an operation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, description, metadata } = useCreditsSchema.parse(body);

    const cost = CREDIT_COSTS[operation];

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        credits: true,
        trialCredits: true,
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate total available credits
    const totalCredits = user.credits + user.trialCredits;

    if (totalCredits < cost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: cost,
          available: totalCredits,
        },
        { status: 402 }
      );
    }

    // Deduct from trial credits first, then regular credits
    let newTrialCredits = user.trialCredits;
    let newCredits = user.credits;
    let trialUsed = 0;
    let creditsUsed = 0;

    if (user.trialCredits >= cost) {
      // Use only trial credits
      newTrialCredits = user.trialCredits - cost;
      trialUsed = cost;
    } else if (user.trialCredits > 0) {
      // Use all trial credits, then regular credits
      trialUsed = user.trialCredits;
      creditsUsed = cost - user.trialCredits;
      newTrialCredits = 0;
      newCredits = user.credits - creditsUsed;
    } else {
      // Use only regular credits
      creditsUsed = cost;
      newCredits = user.credits - cost;
    }

    // Update user credits
    await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: newCredits,
        trialCredits: newTrialCredits,
      },
    });

    // Record transaction
    const transaction = await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        type: 'USAGE',
        amount: -cost,
        balance: newCredits + newTrialCredits,
        description: description || getOperationDescription(operation),
        metadata: {
          ...metadata,
          operation,
          trialUsed,
          creditsUsed,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        newBalance: newCredits + newTrialCredits,
        credits: newCredits,
        trialCredits: newTrialCredits,
      },
    });
  } catch (error) {
    console.error('Use credits error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    );
  }
}

function getOperationDescription(
  operation: keyof typeof CREDIT_COSTS
): string {
  const descriptions: Record<string, string> = {
    GENERATE_DETAIL_PAGE: '상세페이지 생성',
    GENERATE_IMAGE_DRAFT: '이미지 생성 (Draft)',
    GENERATE_IMAGE_HD: '이미지 생성 (HD)',
    GENERATE_MOTION_GIF: 'Motion/GIF 생성',
    GENERATE_VIDEO_4S: '영상 생성 (4초)',
    GENERATE_VIDEO_8S: '영상 생성 (8초)',
    GENERATE_VIDEO_16S: '영상 생성 (16초)',
    RAG_INDEXING: 'RAG 인덱싱',
  };

  return descriptions[operation] || operation;
}
