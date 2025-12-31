import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET /api/ab-tests/[id] - Get A/B test details with stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const test = await prisma.aBTest.findUnique({
      where: { id: params.id },
      include: {
        variants: {
          include: {
            _count: {
              select: {
                events: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Calculate stats for each variant
    const variantStats = await Promise.all(
      test.variants.map(async (variant) => {
        const [views, clicks, conversions] = await Promise.all([
          prisma.aBTestEvent.count({
            where: { variantId: variant.id, type: 'VIEW' },
          }),
          prisma.aBTestEvent.count({
            where: { variantId: variant.id, type: 'CLICK' },
          }),
          prisma.aBTestEvent.count({
            where: { variantId: variant.id, type: 'CONVERSION' },
          }),
        ]);

        const clickRate = views > 0 ? (clicks / views) * 100 : 0;
        const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

        return {
          ...variant,
          stats: {
            views,
            clicks,
            conversions,
            clickRate: Math.round(clickRate * 100) / 100,
            conversionRate: Math.round(conversionRate * 100) / 100,
          },
        };
      })
    );

    // Calculate statistical significance if we have enough data
    const controlVariant = variantStats.find((v) => v.isControl);
    const treatmentVariants = variantStats.filter((v) => !v.isControl);

    const statsWithSignificance = variantStats.map((variant) => {
      if (variant.isControl) {
        return { ...variant, significance: null };
      }

      // Simple significance check (can be enhanced with proper statistical tests)
      const control = controlVariant!;
      const sampleSize = Math.min(variant.stats.views, control.stats.views);
      const isSignificant = sampleSize >= 100;

      const improvement =
        control.stats.conversionRate > 0
          ? ((variant.stats.conversionRate - control.stats.conversionRate) /
              control.stats.conversionRate) *
            100
          : 0;

      return {
        ...variant,
        significance: {
          isSignificant,
          improvement: Math.round(improvement * 100) / 100,
          minSampleSize: 100,
          currentSampleSize: sampleSize,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...test,
        variants: statsWithSignificance,
      },
    });
  } catch (error) {
    console.error('Get A/B test error:', error);
    return NextResponse.json(
      { error: 'Failed to get A/B test' },
      { status: 500 }
    );
  }
}

const updateTestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED']).optional(),
});

// PATCH /api/ab-tests/[id] - Update A/B test
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateTestSchema.parse(body);

    const test = await prisma.aBTest.findUnique({
      where: { id: params.id },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Handle status changes
    const updateData: any = { ...data };

    if (data.status === 'RUNNING' && test.status !== 'RUNNING') {
      updateData.startedAt = new Date();
    }

    if (data.status === 'COMPLETED' && test.status !== 'COMPLETED') {
      updateData.endedAt = new Date();
    }

    const updated = await prisma.aBTest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        variants: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update A/B test error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update A/B test' },
      { status: 500 }
    );
  }
}

// DELETE /api/ab-tests/[id] - Delete A/B test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const test = await prisma.aBTest.findUnique({
      where: { id: params.id },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    await prisma.aBTest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'A/B test deleted',
    });
  } catch (error) {
    console.error('Delete A/B test error:', error);
    return NextResponse.json(
      { error: 'Failed to delete A/B test' },
      { status: 500 }
    );
  }
}
