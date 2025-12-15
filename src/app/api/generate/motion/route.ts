import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  generateMotion,
  validateMotionOptions,
  type MotionType,
  type OutputFormat,
} from '@/services/motion/motion-generator';

const motionSchema = z.object({
  projectId: z.string(),
  images: z.array(z.string().url()).min(1).max(10),
  effect: z.object({
    type: z.enum(['zoom', 'pan', 'rotate', 'bounce', 'fade', 'parallax'] as const),
    intensity: z.enum(['subtle', 'moderate', 'dramatic'] as const),
    duration: z.number().min(1).max(30),
    easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const),
  }),
  outputFormat: z.enum(['gif', 'mp4', 'webm'] as const),
  outputSize: z
    .object({
      width: z.number().min(100).max(1920),
      height: z.number().min(100).max(1920),
    })
    .optional(),
  fps: z.number().min(10).max(60).optional(),
  loop: z.boolean().optional(),
});

// POST /api/generate/motion - Create motion/GIF
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = motionSchema.parse(body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.trialCredits <= 0 && user.plan === 'FREE')) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Validate options
    const validationErrors = validateMotionOptions(validatedData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid options', details: validationErrors },
        { status: 400 }
      );
    }

    // Create motion job in database
    const motionJob = await prisma.motionJob.create({
      data: {
        projectId: validatedData.projectId,
        inputImages: validatedData.images,
        effect: validatedData.effect.type,
        parameters: validatedData,
        status: 'PENDING',
      },
    });

    // Start generation (in production, this would be a background job)
    const result = await generateMotion(validatedData);

    // Update job status
    await prisma.motionJob.update({
      where: { id: motionJob.id },
      data: {
        status: 'PROCESSING',
      },
    });

    // Deduct credit
    if (user.plan === 'FREE' && user.trialCredits > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { trialCredits: user.trialCredits - 1 },
      });
    }

    // Log history
    await prisma.projectHistory.create({
      data: {
        projectId: validatedData.projectId,
        action: 'GENERATE_MOTION',
        details: {
          jobId: motionJob.id,
          effect: validatedData.effect.type,
          format: validatedData.outputFormat,
          imageCount: validatedData.images.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: motionJob.id,
        status: result.status,
        estimatedTime: Math.ceil(
          5 *
            validatedData.images.length *
            (validatedData.effect.duration / 3) *
            (validatedData.effect.intensity === 'dramatic' ? 1.6 : 1)
        ),
      },
    });
  } catch (error) {
    console.error('Motion generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start motion generation' },
      { status: 500 }
    );
  }
}

// GET /api/generate/motion?jobId=xxx - Check job status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const job = await prisma.motionJob.findFirst({
      where: {
        id: jobId,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        outputUrl: job.outputUrl,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    console.error('Get motion job error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}
