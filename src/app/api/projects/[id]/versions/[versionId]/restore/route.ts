import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string; versionId: string };
}

// POST /api/projects/[id]/versions/[versionId]/restore - Restore to a specific version
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, versionId } = params;

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

    // Get the version to restore
    const versionToRestore = await prisma.projectVersion.findFirst({
      where: {
        id: versionId,
        projectId,
      },
    });

    if (!versionToRestore) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Get current latest version number
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create a new version with the restored content
    const restoredVersion = await prisma.projectVersion.create({
      data: {
        projectId,
        versionNumber: newVersionNumber,
        action: 'RESTORE',
        description: `v${versionToRestore.versionNumber}에서 복원됨`,
        content: versionToRestore.content as any,
        createdById: session.user.id,
      },
    });

    // Update project's current content
    await prisma.project.update({
      where: { id: projectId },
      data: {
        content: versionToRestore.content as any,
        currentVersion: newVersionNumber,
        updatedAt: new Date(),
      },
    });

    // Also update detailPageVersion for the editor
    // ProjectVersion stores content as { sections: [editor sections array] }
    const contentData = versionToRestore.content as { sections?: any[] };
    const editorSections = contentData?.sections || [];

    // Get latest detailPageVersion number
    const latestDetailVersion = await prisma.detailPageVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });
    const newDetailVersionNumber = (latestDetailVersion?.versionNumber || 0) + 1;

    // Create new detailPageVersion with restored content
    // contentJson should be the direct array of editor sections (not wrapped in { elements })
    await prisma.detailPageVersion.create({
      data: {
        projectId,
        versionNumber: newDetailVersionNumber,
        contentJson: editorSections,
        status: 'DRAFT',
      },
    });

    // Log history
    await prisma.projectHistory.create({
      data: {
        projectId,
        action: 'RESTORE',
        details: {
          restoredFromVersionId: versionId,
          restoredFromVersionNumber: versionToRestore.versionNumber,
          newVersionId: restoredVersion.id,
          newVersionNumber: newVersionNumber,
        },
      },
    });

    // devPrompts 추출 (개발 모드에서 히스토리 복원 시 프롬프트 보기 지원)
    const contentWithPrompts = versionToRestore.content as {
      sections?: unknown[];
      hookMessage?: string;
      devPrompts?: unknown;
    };
    const devPrompts = contentWithPrompts?.devPrompts || null;

    return NextResponse.json({
      success: true,
      version: {
        id: restoredVersion.id,
        versionNumber: restoredVersion.versionNumber,
        restoredFrom: versionToRestore.versionNumber,
        content: restoredVersion.content,
      },
      // 개발 모드에서 프롬프트 정보 반환
      ...(devPrompts && { devPrompts }),
    });
  } catch (error) {
    console.error('Restore version error:', error);
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}
