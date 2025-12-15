import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/projects/[id]/versions/[versionId]/restore - Restore to a specific version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, versionId } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
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
        changes: null,
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

    return NextResponse.json({
      success: true,
      version: {
        id: restoredVersion.id,
        versionNumber: restoredVersion.versionNumber,
        restoredFrom: versionToRestore.versionNumber,
        content: restoredVersion.content,
      },
    });
  } catch (error) {
    console.error('Restore version error:', error);
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}
