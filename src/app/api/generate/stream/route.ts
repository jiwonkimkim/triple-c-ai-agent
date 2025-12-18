import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateDetailPage } from '@/services/ai/detail-page-generator';
import { getBrandContext } from '@/services/rag/brand-context';

const generateSchema = z.object({
  projectId: z.string(),
  type: z.enum(['detail_page', 'motion', 'video']),
  options: z.object({
    productName: z.string(),
    productDescription: z.string().optional(),
    category: z.string(),
    keyFeatures: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    copyLength: z.enum(['short', 'medium', 'long']).optional(),
    imageQuality: z.enum(['draft', 'hd']).optional(),
    brandProfileId: z.string().optional(),
    productImages: z.array(z.string()).optional(),
  }),
});

// Server-Sent Events based streaming API
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validation = generateSchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request data', details: validation.error.errors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { projectId, type, options } = validation.data;

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: session.user.id,
    },
  });

  if (!project) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check credits
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || (user.trialCredits <= 0 && user.plan === 'FREE')) {
    return new Response(
      JSON.stringify({ error: 'Insufficient credits. Please upgrade your plan.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: string, data: any) => {
    await writer.write(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  };

  // Start generation in background
  (async () => {
    try {
      const jobId = `job-${Date.now()}`;

      // Step 1: Initialize
      await sendEvent('progress', {
        jobId,
        step: 'init',
        status: 'in_progress',
        progress: 0,
        message: 'Initializing generation...',
      });
      await sleep(500);
      await sendEvent('progress', {
        jobId,
        step: 'init',
        status: 'completed',
        progress: 100,
      });

      // Step 2: Brand Analysis (if brand profile provided)
      let brandContext: {
        name: string;
        identity: string;
        toneAndManner: string;
        imageKeywords: string[];
        ragContext?: string;
      } | null = null;

      if (options.brandProfileId) {
        await sendEvent('progress', {
          jobId,
          step: 'brand_analysis',
          status: 'in_progress',
          progress: 0,
          message: 'Analyzing brand context...',
        });

        const context = await getBrandContext(
          options.brandProfileId,
          `${options.productName} ${options.category} ${options.productDescription || ''}`
        );

        if (context) {
          // Transform RAG BrandContext to AI BrandContext format
          brandContext = {
            name: context.brandName,
            identity: context.identity || '',
            toneAndManner: context.toneAndManner || '',
            imageKeywords: context.imageKeywords || [],
            ragContext: context.relevantChunks.map(c => c.text).join('\n\n'),
          };
        }

        await sendEvent('progress', {
          jobId,
          step: 'brand_analysis',
          status: 'completed',
          progress: 100,
        });
      }

      // Step 3: Content Generation
      await sendEvent('progress', {
        jobId,
        step: 'content_generation',
        status: 'in_progress',
        progress: 0,
        message: 'Generating content with AI...',
      });

      // Simulate content generation progress
      for (let i = 20; i <= 80; i += 20) {
        await sleep(1000);
        await sendEvent('progress', {
          jobId,
          step: 'content_generation',
          status: 'in_progress',
          progress: i,
        });
      }

      // Actually generate content
      const generatedVersions = await generateDetailPage({
        productImages: options.productImages || [],
        productName: options.productName,
        category: options.category,
        keyFeatures: options.keyFeatures || [],
        targetAudience: options.targetAudience || '일반 소비자',
        copyLength: options.copyLength || 'medium',
        brandContext: brandContext || undefined,
      });

      await sendEvent('progress', {
        jobId,
        step: 'content_generation',
        status: 'completed',
        progress: 100,
      });

      // Step 4: Image Generation (if HD quality)
      if (options.imageQuality === 'hd') {
        await sendEvent('progress', {
          jobId,
          step: 'image_generation',
          status: 'in_progress',
          progress: 0,
          message: 'Generating high-quality images...',
        });

        // Simulate image generation
        for (let i = 25; i <= 100; i += 25) {
          await sleep(1500);
          await sendEvent('progress', {
            jobId,
            step: 'image_generation',
            status: 'in_progress',
            progress: i,
          });
        }

        await sendEvent('progress', {
          jobId,
          step: 'image_generation',
          status: 'completed',
          progress: 100,
        });
      }

      // Step 5: Layout Assembly
      await sendEvent('progress', {
        jobId,
        step: 'layout_assembly',
        status: 'in_progress',
        progress: 0,
        message: 'Assembling page layout...',
      });

      await sleep(500);

      await sendEvent('progress', {
        jobId,
        step: 'layout_assembly',
        status: 'completed',
        progress: 100,
      });

      // Step 6: Finalize - Save to database
      await sendEvent('progress', {
        jobId,
        step: 'finalize',
        status: 'in_progress',
        progress: 0,
        message: 'Saving generated content...',
      });

      // Save versions to database
      const savedVersions = [];
      const versionCount = await prisma.detailPageVersion.count({
        where: { projectId },
      });

      for (let i = 0; i < generatedVersions.length; i++) {
        const version = await prisma.detailPageVersion.create({
          data: {
            projectId,
            hookMessage: generatedVersions[i].hookMessage,
            sections: generatedVersions[i].sections as any,
          },
        });
        savedVersions.push(version);
      }

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
          projectId,
          action: 'GENERATE',
          details: {
            type,
            versionsCreated: savedVersions.length,
            options,
          },
        },
      });

      await sendEvent('progress', {
        jobId,
        step: 'finalize',
        status: 'completed',
        progress: 100,
      });

      // Send completion event
      await sendEvent('complete', {
        jobId,
        versionIds: savedVersions.map((v) => v.id),
        message: 'Generation completed successfully!',
      });
    } catch (error) {
      console.error('Generation error:', error);
      await sendEvent('error', {
        message: error instanceof Error ? error.message : 'Generation failed',
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
