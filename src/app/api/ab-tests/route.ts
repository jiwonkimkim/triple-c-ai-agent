import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/ab-tests - List A/B tests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: any = {};

    if (projectId) {
      // Verify user owns the project
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: session.user.id },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    const tests = await prisma.aBTest.findMany({
      where,
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            isControl: true,
            weight: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    console.error('List A/B tests error:', error);
    return NextResponse.json(
      { error: 'Failed to list A/B tests' },
      { status: 500 }
    );
  }
}

const createTestSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  variants: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      content: z.any(),
      weight: z.number().min(0).max(100).default(50),
      isControl: z.boolean().default(false),
    })
  ).min(2),
});

// POST /api/ab-tests - Create A/B test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTestSchema.parse(body);

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, ownerId: session.user.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validate weights sum to 100
    const totalWeight = data.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: 'Variant weights must sum to 100' },
        { status: 400 }
      );
    }

    // Ensure exactly one control variant
    const controlCount = data.variants.filter((v) => v.isControl).length;
    if (controlCount !== 1) {
      return NextResponse.json(
        { error: 'Exactly one variant must be marked as control' },
        { status: 400 }
      );
    }

    const test = await prisma.aBTest.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        variants: {
          create: data.variants.map((v) => ({
            name: v.name,
            description: v.description,
            content: v.content,
            weight: v.weight,
            isControl: v.isControl,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('Create A/B test error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    );
  }
}
