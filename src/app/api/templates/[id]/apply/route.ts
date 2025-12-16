import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applyTemplateSchema = z.object({
  projectId: z.string(),
});

// POST /api/templates/[id]/apply - Apply template to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: templateId } = await params;
    const body = await request.json();
    const { projectId } = applyTemplateSchema.parse(body);

    // Get template
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check template access
    if (template.createdBy === 'USER' && template.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get current version number
    const latestVersion = await prisma.projectVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Apply template sections to project
    const templateContent = {
      sections: template.sections,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        appliedAt: new Date().toISOString(),
      },
    };

    // Create new version with template content
    const version = await prisma.projectVersion.create({
      data: {
        projectId,
        versionNumber: newVersionNumber,
        action: 'UPDATE',
        description: `템플릿 "${template.name}" 적용`,
        content: templateContent,
        createdById: session.user.id,
      },
    });

    // Update project content
    await prisma.project.update({
      where: { id: projectId },
      data: {
        content: templateContent,
        currentVersion: newVersionNumber,
        updatedAt: new Date(),
      },
    });

    // Log history
    await prisma.projectHistory.create({
      data: {
        projectId,
        action: 'APPLY_TEMPLATE',
        details: {
          templateId: template.id,
          templateName: template.name,
          versionNumber: newVersionNumber,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        templateId: template.id,
        templateName: template.name,
        versionNumber: newVersionNumber,
        content: templateContent,
      },
    });
  } catch (error) {
    console.error('Apply template error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    );
  }
}
