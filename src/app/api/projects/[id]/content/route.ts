import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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
      // sections의 이미지와 contentJson의 이미지가 일치하는지 확인
      // 불일치하면 sections 데이터를 우선 사용 (이전 프로젝트 데이터 오염 방지)
      const aiSectionsForCheck = latestVersion.sections as Array<{ imageUrl?: string }> | null;
      const hasValidImages = aiSectionsForCheck?.some(s => s.imageUrl && s.imageUrl.startsWith('data:image'));

      if (hasValidImages) {
        // sections에 유효한 이미지가 있으면, contentJson과 비교
        const contentJsonFirstImage = contentJson[0]?.blocks?.[0]?.src;
        const sectionsFirstImage = aiSectionsForCheck?.[0]?.imageUrl;

        // 이미지가 다르면 sections 데이터를 사용 (아래 코드로 fallthrough)
        if (contentJsonFirstImage && sectionsFirstImage &&
            contentJsonFirstImage !== sectionsFirstImage &&
            !contentJsonFirstImage.startsWith('data:image')) {
          // contentJson에 잘못된 이미지가 있음 - sections로 재생성
          console.log('[Content API] contentJson has stale images, using sections instead');
        } else {
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
      } else {
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
      imageUrls?: string[];  // 다중 이미지 지원
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
        LIFESTYLE: '라이프스타일',
        CTA: '구매하기',
        CUSTOM: '커스텀',
      };

      // MAIN 섹션은 별도 타입으로 처리 (sectionTypeNames에서 '메인'으로 매핑)

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
              width?: number;
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
            width?: number;
          };
          zIndex: number;
        }> = [];

        let zIndex = 1;

        // 섹션 타입별 제품 위치 및 텍스트 안전 영역 정의
        // 제품 영역을 피해서 텍스트 배치
        const sectionType = section.type;

        // 제품 영역 정의 (이 영역을 피해서 텍스트 배치)
        // productZone: { x: [시작%, 끝%], y: [시작%, 끝%] }
        const productZones: Record<string, { x: [number, number]; y: [number, number] }> = {
          // MAIN: 제품이 중앙-오른쪽에 크게 배치됨 (40~95%, 15~85%)
          MAIN: { x: [40, 95], y: [15, 85] },
          // HERO: 제품이 중앙에 배치됨 (25~75%, 25~75%)
          HERO: { x: [25, 75], y: [25, 75] },
          // FEATURES: 제품/아이콘이 중앙에 배치됨 (20~80%, 30~70%)
          FEATURES: { x: [20, 80], y: [30, 70] },
          // SOCIAL_PROOF: 리뷰/후기 중앙 배치 (15~85%, 25~75%)
          SOCIAL_PROOF: { x: [15, 85], y: [25, 75] },
          // HOW_TO_USE: 사용법 이미지 중앙 (20~80%, 25~75%)
          HOW_TO_USE: { x: [20, 80], y: [25, 75] },
          // FAQ: 텍스트 중심이므로 제품 영역 작음 (30~70%, 35~65%)
          FAQ: { x: [30, 70], y: [35, 65] },
          // LIFESTYLE: 라이프스타일 이미지 전체 활용 (20~80%, 20~80%)
          LIFESTYLE: { x: [20, 80], y: [20, 80] },
          // CTA: 버튼/CTA 중앙 (25~75%, 35~65%)
          CTA: { x: [25, 75], y: [35, 65] },
        };

        const productZone = productZones[sectionType] || productZones.HERO;

        // 텍스트 안전 영역 계산 (제품 영역 밖)
        // MAIN: 왼쪽 영역 사용 (제품이 오른쪽에 있으므로)
        // 다른 섹션: 상단/하단 영역 사용 (제품이 중앙에 있으므로)
        const isMain = sectionType === 'MAIN';

        const textPosition = isMain ? {
          // MAIN 섹션: 왼쪽 상단 영역에 텍스트 배치 (제품 왼쪽)
          headline: {
            x: 5,  // 왼쪽 가장자리
            y: 8,  // 상단
            align: 'left' as const,
          },
          body: {
            x: 5,  // 왼쪽 가장자리
            y: 22, // headline 아래
            align: 'left' as const,
          },
        } : {
          // 다른 섹션: 상단/하단 가장자리에 텍스트 배치
          headline: {
            x: 50, // 중앙 정렬
            y: 5,  // 최상단 (제품 영역 위)
            align: 'center' as const,
          },
          body: {
            x: 50, // 중앙 정렬
            y: 92, // 최하단 (제품 영역 아래)
            align: 'center' as const,
          },
        };

        // Add title as headline
        if (section.title) {
          overlayTexts.push({
            id: `${section.id}-title`,
            type: 'headline',
            content: section.title,
            style: {
              x: textPosition.headline.x,
              y: textPosition.headline.y,
              fontSize: isMain ? 32 : 28,
              fontWeight: 'bold',
              fontFamily: 'Pretendard, sans-serif',
              color: '#ffffff',
              textShadow: true,
              textAlign: textPosition.headline.align,
              opacity: 100,
              rotation: 0,
              width: isMain ? 35 : 80,  // 기본 너비 설정 (화면 안에서 줄바꿈)
            },
            zIndex: zIndex++,
          });
        }

        // Add body as subheadline or body text
        if (section.body) {
          // body가 배열인 경우 문자열로 변환
          const bodyText = Array.isArray(section.body)
            ? section.body.join('\n')
            : String(section.body);
          // Split body into multiple lines if too long
          const bodyLines = bodyText.split('\n').filter(line => line.trim());

          if (bodyLines.length === 1 && bodyLines[0].length < 50) {
            // Short text - single subheadline
            overlayTexts.push({
              id: `${section.id}-body`,
              type: 'subheadline',
              content: bodyText,
              style: {
                x: textPosition.body.x,
                y: textPosition.body.y,
                fontSize: isMain ? 18 : 16,
                fontWeight: 'medium',
                fontFamily: 'Pretendard, sans-serif',
                color: '#ffffff',
                textShadow: true,
                textAlign: textPosition.body.align,
                opacity: 100,
                rotation: 0,
                width: isMain ? 35 : 70,  // 기본 너비 설정 (화면 안에서 줄바꿈)
              },
              zIndex: zIndex++,
            });
          } else {
            // Longer text - body type, position at bottom
            overlayTexts.push({
              id: `${section.id}-body`,
              type: 'body',
              content: bodyText,
              style: {
                x: textPosition.body.x,
                y: isMain ? 40 : 85,
                fontSize: 14,
                fontWeight: 'normal',
                fontFamily: 'Pretendard, sans-serif',
                color: '#ffffff',
                textShadow: true,
                textAlign: textPosition.body.align,
                opacity: 100,
                rotation: 0,
                width: isMain ? 35 : 80,  // 기본 너비 설정 (화면 안에서 줄바꿈)
              },
              zIndex: zIndex++,
            });
          }
        }

        // Skip if no overlay texts (shouldn't happen, but just in case)
        if (overlayTexts.length === 0) continue;

        // 섹션 이름 결정: MAIN은 '메인', HERO는 '히어로'로 매핑
        const sectionName = sectionTypeNames[section.type] || section.title || '섹션';

        // 이미지 목록 결정: imageUrls 배열이 있으면 사용, 없으면 imageUrl 사용
        const images = section.imageUrls && section.imageUrls.length > 0
          ? section.imageUrls
          : section.imageUrl
            ? [section.imageUrl]
            : [''];

        // 여러 이미지가 있으면 여러 블록 생성 (첫 번째만 텍스트 오버레이 포함)
        const blocks = images.map((imageUrl, imgIndex) => ({
          id: `${section.id}-img-${imgIndex}`,
          type: 'image-overlay' as const,
          src: imageUrl,
          alt: `${section.title || 'Section image'} ${imgIndex + 1}`,
          // 첫 번째 이미지에만 텍스트 오버레이 표시
          overlayTexts: imgIndex === 0 ? overlayTexts : [],
          // 기본 테마는 그라데이션 없음
          overlayGradient: undefined,
        }));

        // Create editor section with multiple blocks
        editorSections.push({
          id: `section-${section.id}`,
          name: `${sectionName}${images.length > 1 ? ` (${images.length}장)` : ''}`,
          blocks,
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
