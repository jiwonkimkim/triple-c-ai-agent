import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const trackEventSchema = z.object({
  variantId: z.string(),
  type: z.enum(['VIEW', 'CLICK', 'CONVERSION', 'SCROLL', 'TIME_SPENT']),
  visitorId: z.string(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/ab-tests/[id]/events - Track event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = trackEventSchema.parse(body);

    // Verify test exists and is running
    const test = await prisma.aBTest.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.status !== 'RUNNING') {
      return NextResponse.json(
        { error: 'Test is not running' },
        { status: 400 }
      );
    }

    // Verify variant belongs to this test
    const variant = await prisma.aBTestVariant.findFirst({
      where: { id: data.variantId, testId: params.id },
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Create event
    const event = await prisma.aBTestEvent.create({
      data: {
        testId: params.id,
        variantId: data.variantId,
        type: data.type,
        visitorId: data.visitorId,
        metadata: data.metadata || {},
      },
    });

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Track event error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// GET /api/ab-tests/[id]/events - Get events for a test
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = { testId: params.id };
    if (variantId) where.variantId = variantId;
    if (type) where.type = type;

    const events = await prisma.aBTestEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Failed to get events' },
      { status: 500 }
    );
  }
}
