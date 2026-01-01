import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string; versionId: string };
}

const updateVersionSchema = z.object({
  description: z.string().min(1).max(100),
});

// PATCH /api/projects/[id]/versions/[versionId] - Update version description
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, versionId } = params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateVersionSchema.parse(body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Find and update the version
    const version = await prisma.projectVersion.findFirst({
      where: {
        id: versionId,
        projectId,
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Update version description
    const updatedVersion = await prisma.projectVersion.update({
      where: { id: versionId },
      data: {
        description: validatedData.description,
      },
    });

    return NextResponse.json({
      success: true,
      version: {
        id: updatedVersion.id,
        versionNumber: updatedVersion.versionNumber,
        description: updatedVersion.description,
      },
    });
  } catch (error) {
    console.error('Update version error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update version' },
      { status: 500 }
    );
  }
}
