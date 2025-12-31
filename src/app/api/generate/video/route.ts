import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {

export const dynamic = 'force-dynamic';
  generateVideo,
  checkVideoJobStatus,
  getVideoResult,
  validateVideoOptions,
  estimateVideoCredits,
  type VideoStyle,
  type VideoAspectRatio,
  type VideoDuration,
} from '@/services/video';

const videoSchema = z.object({
  projectId: z.string(),
  prompt: z.string().min(10).max(500),
  negativePrompt: z.string().max(200).optional(),
  style: z.enum(['cinematic', 'commercial', 'social_media', 'product_showcase', 'lifestyle'] as const),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5'] as const),
  duration: z.union([z.literal(4), z.literal(8), z.literal(16)]),
  referenceImage: z.string().optional(),
  motionIntensity: z.enum(['low', 'medium', 'high']).optional(),
});

// POST /api/generate/video - Start video generation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = videoSchema.parse(body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const requiredCredits = estimateVideoCredits({
      prompt: validatedData.prompt,
      style: validatedData.style as VideoStyle,
      aspectRatio: validatedData.aspectRatio as VideoAspectRatio,
      duration: validatedData.duration as VideoDuration,
    });

    if (!user || (user.trialCredits < requiredCredits && user.plan === 'FREE')) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: requiredCredits,
          available: user?.trialCredits || 0,
        },
        { status: 403 }
      );
    }

    // Validate options
    const validationErrors = validateVideoOptions({
      prompt: validatedData.prompt,
      negativePrompt: validatedData.negativePrompt,
      style: validatedData.style as VideoStyle,
      aspectRatio: validatedData.aspectRatio as VideoAspectRatio,
      duration: validatedData.duration as VideoDuration,
      referenceImage: validatedData.referenceImage,
      motionIntensity: validatedData.motionIntensity,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid options', details: validationErrors },
        { status: 400 }
      );
    }

    // Create video job in database
    const videoJob = await prisma.videoJob.create({
      data: {
        projectId: validatedData.projectId,
        prompt: validatedData.prompt,
        referenceImageUrls: validatedData.referenceImage ? [validatedData.referenceImage] : [],
        status: 'PENDING',
        costCredits: requiredCredits,
      },
    });

    // Start video generation
    const result = await generateVideo({
      prompt: validatedData.prompt,
      negativePrompt: validatedData.negativePrompt,
      style: validatedData.style as VideoStyle,
      aspectRatio: validatedData.aspectRatio as VideoAspectRatio,
      duration: validatedData.duration as VideoDuration,
      referenceImage: validatedData.referenceImage,
      motionIntensity: validatedData.motionIntensity,
    });

    // Update job with external ID
    await prisma.videoJob.update({
      where: { id: videoJob.id },
      data: {
        status: 'PROCESSING',
      },
    });

    // Deduct credits
    if (user.plan === 'FREE' && user.trialCredits >= requiredCredits) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { trialCredits: user.trialCredits - requiredCredits },
      });
    }

    // Log history
    await prisma.projectHistory.create({
      data: {
        projectId: validatedData.projectId,
        action: 'GENERATE_VIDEO',
        details: {
          jobId: videoJob.id,
          externalId: result.id,
          style: validatedData.style,
          duration: validatedData.duration,
          aspectRatio: validatedData.aspectRatio,
          credits: requiredCredits,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: videoJob.id,
        externalId: result.id,
        status: result.status,
        estimatedTime: validatedData.duration * 15, // ~15 seconds per second of video
        credits: requiredCredits,
      },
    });
  } catch (error) {
    console.error('Video generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start video generation' },
      { status: 500 }
    );
  }
}

// GET /api/generate/video?jobId=xxx - Check job status
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

    // Get job from database
    const job = await prisma.videoJob.findFirst({
      where: {
        id: jobId,
        project: {
          ownerId: session.user.id,
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // If job is still processing, check external status
    if (job.status === 'PROCESSING' || job.status === 'PENDING') {
      try {
        // For production, uncomment this to check actual Runway status
        // const externalStatus = await checkVideoJobStatus(job.id);

        // Mock progress for now
        const progress = Math.min(
          100,
          Math.floor((Date.now() - job.createdAt.getTime()) / 1000)
        );

        return NextResponse.json({
          success: true,
          data: {
            id: job.id,
            status: job.status,
            progress,
            resultVideoUrl: job.resultVideoUrl,
            createdAt: job.createdAt,
          },
        });
      } catch {
        // Continue with database status
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.status === 'COMPLETED' ? 100 : 0,
        resultVideoUrl: job.resultVideoUrl,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get video job error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}
