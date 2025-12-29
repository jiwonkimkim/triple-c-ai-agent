import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

// 개발 환경에서 사용자 ID 동기화 헬퍼 함수
async function syncDevUserId(user: { id: string; email: string }): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (userByEmail) {
        user.id = userByEmail.id;
      }
    }
  }
}

// EditableElement 스키마
const editableElementSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'heading']),
  content: z.string(),
  styles: z.record(z.string()).optional(),
  level: z.number().optional(),
  alt: z.string().optional(),
});

const updateContentSchema = z.object({
  elements: z.array(editableElementSchema),
  versionId: z.string().optional(),
});

// GET /api/projects/[id]/content - Get current content
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await syncDevUserId(session.user as { id: string; email: string });

    const projectId = params.id;

    // Verify project ownership or membership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        detailPageVersions: {
          // Get the most recent version regardless of status
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Check access
    let hasAccess = project.ownerId === session.user.id;
    if (!hasAccess && project.workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: session.user.id,
          },
        },
      });
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No access to this project' },
        { status: 403 }
      );
    }

    // Get latest draft content
    const latestVersion = project.detailPageVersions[0];

    if (!latestVersion) {
      return NextResponse.json({
        success: true,
        data: {
          elements: [],
          versionId: null,
        },
      });
    }

    // Parse contentJson - can be sections array (new format) or { elements: [...] } (legacy)
    const contentJson = latestVersion.contentJson as
      | Array<{
          id: string;
          name: string;
          blocks: Array<{
            id: string;
            type: string;
            src?: string;
            alt?: string;
            overlayTexts?: Array<{
              id: string;
              type: string;
              content: string;
              style: {
                x: number;
                y: number;
                fontSize: number;
                fontWeight: string;
                fontFamily: string;
                color: string;
                textShadow: boolean;
                textAlign: string;
                opacity: number;
                rotation: number;
              };
              zIndex: number;
            }>;
            overlayGradient?: string;
          }>;
        }>
      | {
          elements?: Array<{
            id: string;
            type: string;
            content: string;
            styles?: Record<string, string>;
            level?: number;
            alt?: string;
          }>;
        }
      | null;

    // Check if contentJson is an array (new editor sections format - saved by auto-save)
    if (Array.isArray(contentJson) && contentJson.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          editorSections: contentJson,
          versionId: latestVersion.id,
          versionNumber: latestVersion.versionNumber,
          updatedAt: latestVersion.updatedAt,
        },
      });
    }

    // If contentJson.elements exists, use it (legacy format)
    if (contentJson && !Array.isArray(contentJson) && contentJson.elements && contentJson.elements.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          elements: contentJson.elements,
          versionId: latestVersion.id,
          versionNumber: latestVersion.versionNumber,
          updatedAt: latestVersion.updatedAt,
        },
      });
    }

    // Convert sections to editor sections format (each AI section becomes an editor section) - fallback for first load
    const aiSections = latestVersion.sections as Array<{
      id: string;
      type: string;
      title?: string;
      body: string;
      order: number;
      imageUrl?: string;
    }>;

    if (aiSections && aiSections.length > 0) {
      // Section type to Korean name mapping
      const sectionTypeNames: Record<string, string> = {
        MAIN: '메인',
        HERO: '히어로',
        FEATURES: '제품 특징',
        SOCIAL_PROOF: '고객 후기',
        HOW_TO_USE: '사용 방법',
        FAQ: 'FAQ',
        CUSTOM: '커스텀',
      };

      // Convert each AI section to an editor section with image-overlay block
      const editorSections: Array<{
        id: string;
        name: string;
        blocks: Array<{
          id: string;
          type: 'image-overlay';
          src: string;
          alt: string;
          overlayTexts: Array<{
            id: string;
            type: 'headline' | 'subheadline' | 'body' | 'statistic' | 'cta';
            content: string;
            style: {
              x: number;
              y: number;
              fontSize: number;
              fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
              fontFamily: string;
              color: string;
              textShadow: boolean;
              textAlign: 'left' | 'center' | 'right';
              opacity: number;
              rotation: number;
            };
            zIndex: number;
          }>;
          overlayGradient?: string;
        }>;
      }> = [];

      // Convert each AI section to an editor section (MAIN, HERO, FEATURES, etc.)
      for (const section of aiSections) {
        const overlayTexts: Array<{
          id: string;
          type: 'headline' | 'subheadline' | 'body' | 'statistic' | 'cta';
          content: string;
          style: {
            x: number;
            y: number;
            fontSize: number;
            fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
            fontFamily: string;
            color: string;
            textShadow: boolean;
            textAlign: 'left' | 'center' | 'right';
            opacity: number;
            rotation: number;
          };
          zIndex: number;
        }> = [];

        let zIndex = 1;

        // Add title as headline
        if (section.title) {
          overlayTexts.push({
            id: `${section.id}-title`,
            type: 'headline',
            content: section.title,
            style: {
              x: 50,
              y: 30,
              fontSize: 36,
              fontWeight: 'bold',
              fontFamily: 'Pretendard, sans-serif',
              color: '#ffffff',
              textShadow: true,
              textAlign: 'center',
              opacity: 100,
              rotation: 0,
            },
            zIndex: zIndex++,
          });
        }

        // Add body as subheadline or body text
        if (section.body) {
          // Split body into multiple lines if too long
          const bodyLines = section.body.split('\n').filter(line => line.trim());

          if (bodyLines.length === 1 && bodyLines[0].length < 50) {
            // Short text - single subheadline
            overlayTexts.push({
              id: `${section.id}-body`,
              type: 'subheadline',
              content: section.body,
              style: {
                x: 50,
                y: 55,
                fontSize: 20,
                fontWeight: 'medium',
                fontFamily: 'Pretendard, sans-serif',
                color: '#ffffff',
                textShadow: true,
                textAlign: 'center',
                opacity: 100,
                rotation: 0,
              },
              zIndex: zIndex++,
            });
          } else {
            // Longer text - body type
            overlayTexts.push({
              id: `${section.id}-body`,
              type: 'body',
              content: section.body,
              style: {
                x: 50,
                y: 60,
                fontSize: 16,
                fontWeight: 'normal',
                fontFamily: 'Pretendard, sans-serif',
                color: '#ffffff',
                textShadow: true,
                textAlign: 'center',
                opacity: 100,
                rotation: 0,
              },
              zIndex: zIndex++,
            });
          }
        }

        // Skip if no overlay texts (shouldn't happen, but just in case)
        if (overlayTexts.length === 0) continue;

        // Create editor section with the block
        editorSections.push({
          id: `section-${section.id}`,
          name: sectionTypeNames[section.type] || section.title || '섹션',
          blocks: [{
            id: section.id,
            type: 'image-overlay',
            src: section.imageUrl || '',
            alt: section.title || 'Section image',
            overlayTexts,
            overlayGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
          }],
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          editorSections,
          versionId: latestVersion.id,
          versionNumber: latestVersion.versionNumber,
          updatedAt: latestVersion.updatedAt,
        },
      });
    }

    // Fallback: empty elements
    return NextResponse.json({
      success: true,
      data: {
        elements: [],
        versionId: latestVersion.id,
        versionNumber: latestVersion.versionNumber,
        updatedAt: latestVersion.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get content' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/content - Update content
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await syncDevUserId(session.user as { id: string; email: string });

    const projectId = params.id;
    const body = await request.json();

    // Validate request body
    const validatedData = updateContentSchema.parse(body);
    const { elements, versionId } = validatedData;

    // Get action type from request (default: UPDATE)
    const action = body.action || 'UPDATE';

    // Verify project ownership or edit permission
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Check access
    let canEdit = project.ownerId === session.user.id;
    if (!canEdit && project.workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId: session.user.id,
          },
        },
      });
      canEdit = membership?.role !== 'VIEWER';
    }

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'No permission to edit this project' },
        { status: 403 }
      );
    }

    // Content to save
    const contentJson = { elements };

    // Also create a projectVersion record for history tracking
    const latestProjectVersion = await prisma.projectVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });
    const newProjectVersionNumber = (latestProjectVersion?.versionNumber || 0) + 1;

    // Create projectVersion for history
    await prisma.projectVersion.create({
      data: {
        projectId,
        versionNumber: newProjectVersionNumber,
        action: action,
        description: action === 'AUTO_SAVE' ? '자동 저장' : '수동 저장',
        content: { sections: elements },
        createdById: session.user.id,
      },
    });

    // Update project's current version
    await prisma.project.update({
      where: { id: projectId },
      data: {
        content: { sections: elements },
        currentVersion: newProjectVersionNumber,
        updatedAt: new Date(),
      },
    });

    if (versionId) {
      // Update existing detailPageVersion
      const existingVersion = await prisma.detailPageVersion.findFirst({
        where: {
          id: versionId,
          projectId,
        },
      });

      if (!existingVersion) {
        return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });
      }

      const updatedVersion = await prisma.detailPageVersion.update({
        where: { id: versionId },
        data: {
          contentJson,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          versionId: updatedVersion.id,
          updatedAt: updatedVersion.updatedAt,
          historyVersionNumber: newProjectVersionNumber,
        },
      });
    } else {
      // Create new draft version
      const versionCount = await prisma.detailPageVersion.count({
        where: { projectId },
      });

      const newVersion = await prisma.detailPageVersion.create({
        data: {
          projectId,
          versionNumber: versionCount + 1,
          contentJson,
          status: 'DRAFT',
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          versionId: newVersion.id,
          versionNumber: newVersion.versionNumber,
          createdAt: newVersion.createdAt,
          historyVersionNumber: newProjectVersionNumber,
        },
      });
    }
  } catch (error) {
    console.error('Update content error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Failed to save content' }, { status: 500 });
  }
}

// POST /api/projects/[id]/content - Create new version from content
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await syncDevUserId(session.user as { id: string; email: string });

    const projectId = params.id;
    const body = await request.json();

    const { elements, publish = false } = body;

    if (!elements || !Array.isArray(elements)) {
      return NextResponse.json(
        { success: false, error: 'Elements array is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Get version count
    const versionCount = await prisma.detailPageVersion.count({
      where: { projectId },
    });

    // Create new version
    const newVersion = await prisma.detailPageVersion.create({
      data: {
        projectId,
        versionNumber: versionCount + 1,
        contentJson: { elements },
        status: publish ? 'PUBLISHED' : 'DRAFT',
      },
    });

    // If publishing, update project status
    if (publish) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'ACTIVE' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        versionId: newVersion.id,
        versionNumber: newVersion.versionNumber,
        status: newVersion.status,
        createdAt: newVersion.createdAt,
      },
    });
  } catch (error) {
    console.error('Create content version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
