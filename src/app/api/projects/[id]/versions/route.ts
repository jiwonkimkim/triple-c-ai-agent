import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// GET /api/projects/[id]/versions - Get version history
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

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

    // Fetch versions with user info
    const versions = await prisma.projectVersion.findMany({
      where: {
        projectId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform to frontend format (content 제외 - 네트워크 전송량 최적화)
    const formattedVersions = versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      createdAt: v.createdAt,
      createdBy: v.createdByUser?.name || v.createdByUser?.email || 'Unknown',
      action: v.action,
      description: v.description || `버전 ${v.versionNumber}`,
      thumbnail: v.thumbnail,
      // content 제외: base64 이미지 포함으로 수백MB 전송 방지
      // 필요시 개별 버전 조회 API 사용
      changes: v.changes as any,
    }));

    return NextResponse.json({
      success: true,
      versions: formattedVersions,
      currentVersion: versions[0]?.versionNumber || 0,
    });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/versions - Create new version
const createVersionSchema = z.object({
  action: z.enum(['CREATE', 'UPDATE', 'GENERATE', 'RESTORE', 'AUTO_SAVE']),
  description: z.string().optional(),
  content: z.object({
    sections: z.array(z.any()),
    metadata: z.record(z.any()).optional(),
  }),
  changes: z
    .object({
      added: z.number(),
      modified: z.number(),
      deleted: z.number(),
    })
    .optional(),
});

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const validatedData = createVersionSchema.parse(body);

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

    // Get latest version number
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create new version
    const version = await prisma.projectVersion.create({
      data: {
        projectId,
        versionNumber: newVersionNumber,
        action: validatedData.action,
        description:
          validatedData.description ||
          `${validatedData.action === 'AUTO_SAVE' ? '자동 저장' : '수동 저장'}`,
        content: validatedData.content,
        changes: validatedData.changes,
        createdById: session.user.id,
      },
    });

    // Update project's current content
    await prisma.project.update({
      where: { id: projectId },
      data: {
        content: validatedData.content,
        currentVersion: newVersionNumber,
        updatedAt: new Date(),
      },
    });

    // Log history
    await prisma.projectHistory.create({
      data: {
        projectId,
        action: validatedData.action,
        details: {
          versionId: version.id,
          versionNumber: newVersionNumber,
          changes: validatedData.changes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        versionNumber: version.versionNumber,
        action: version.action,
        createdAt: version.createdAt,
      },
    });
  } catch (error) {
    console.error('Create version error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
