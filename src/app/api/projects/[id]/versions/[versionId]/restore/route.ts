import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string; versionId: string };
}

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

// AI 섹션 타입
interface AISection {
  id: string;
  type: string;
  title?: string;
  body: string | string[];
  order: number;
  imageUrl?: string;
  imageUrls?: string[];
  overlayText?: {
    headline?: { text?: string; x?: number; y?: number; fontSize?: number; fontWeight?: string; fontFamily?: string; color?: string; textAlign?: string } | string;
    subheadline?: { text?: string; x?: number; y?: number; fontSize?: number; fontWeight?: string; fontFamily?: string; color?: string; textAlign?: string } | string;
    body?: { text?: string; x?: number; y?: number; fontSize?: number; fontWeight?: string; fontFamily?: string; color?: string; textAlign?: string } | string;
    statistics?: Array<{ text: string; x?: number; y?: number; fontSize?: number; fontWeight?: string; fontFamily?: string; color?: string } | string>;
    cta?: { text?: string; x?: number; y?: number; fontSize?: number; fontWeight?: string; fontFamily?: string; color?: string } | string;
  };
}

// 에디터 섹션 타입
interface EditorSection {
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
}

// AI 포맷인지 확인
function isAIFormat(sections: unknown[]): boolean {
  if (!sections || sections.length === 0) return false;
  const firstSection = sections[0] as Record<string, unknown>;
  // AI 포맷: body, type, imageUrl 필드가 있고 blocks 필드가 없음
  return 'body' in firstSection && 'type' in firstSection && !('blocks' in firstSection);
}

// AI 포맷 → 에디터 포맷 변환
function convertAIToEditorFormat(aiSections: AISection[]): EditorSection[] {
  const editorSections: EditorSection[] = [];

  for (const section of aiSections) {
    const overlayTexts: EditorSection['blocks'][0]['overlayTexts'] = [];
    let zIndex = 1;

    const sectionType = section.type;
    const isMain = sectionType === 'MAIN';

    const textPosition = isMain ? {
      headline: { x: 5, y: 8, align: 'left' as const },
      body: { x: 5, y: 22, align: 'left' as const },
    } : {
      headline: { x: 50, y: 5, align: 'center' as const },
      body: { x: 50, y: 92, align: 'center' as const },
    };

    const aiOverlayText = section.overlayText;

    if (aiOverlayText) {
      // headline
      const headlineData = typeof aiOverlayText.headline === 'string'
        ? { text: aiOverlayText.headline }
        : aiOverlayText.headline;
      if (headlineData?.text || section.title) {
        overlayTexts.push({
          id: `${section.id}-headline`,
          type: 'headline',
          content: headlineData?.text || section.title || '',
          style: {
            x: headlineData?.x ?? textPosition.headline.x,
            y: headlineData?.y ?? textPosition.headline.y,
            fontSize: headlineData?.fontSize ?? (isMain ? 32 : 28),
            fontWeight: (headlineData?.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'bold',
            fontFamily: headlineData?.fontFamily ?? 'Pretendard, sans-serif',
            color: headlineData?.color ?? '#ffffff',
            textShadow: true,
            textAlign: (headlineData?.textAlign as 'left' | 'center' | 'right') ?? textPosition.headline.align,
            opacity: 100,
            rotation: 0,
            width: isMain ? 35 : 80,
          },
          zIndex: zIndex++,
        });
      }

      // subheadline
      const subheadlineData = typeof aiOverlayText.subheadline === 'string'
        ? { text: aiOverlayText.subheadline }
        : aiOverlayText.subheadline;
      if (subheadlineData?.text) {
        overlayTexts.push({
          id: `${section.id}-subheadline`,
          type: 'subheadline',
          content: subheadlineData.text,
          style: {
            x: subheadlineData.x ?? textPosition.body.x,
            y: subheadlineData.y ?? (textPosition.headline.y + 12),
            fontSize: subheadlineData.fontSize ?? (isMain ? 18 : 16),
            fontWeight: (subheadlineData.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'medium',
            fontFamily: subheadlineData.fontFamily ?? 'Pretendard, sans-serif',
            color: subheadlineData.color ?? '#ffffff',
            textShadow: true,
            textAlign: (subheadlineData.textAlign as 'left' | 'center' | 'right') ?? textPosition.body.align,
            opacity: 100,
            rotation: 0,
            width: isMain ? 35 : 70,
          },
          zIndex: zIndex++,
        });
      }

      // body
      const bodyData = typeof aiOverlayText.body === 'string'
        ? { text: aiOverlayText.body }
        : aiOverlayText.body;
      const bodyText = bodyData?.text || (section.body ? (Array.isArray(section.body) ? section.body.join('\n') : String(section.body)) : null);
      if (bodyText) {
        overlayTexts.push({
          id: `${section.id}-body`,
          type: 'body',
          content: bodyText,
          style: {
            x: bodyData?.x ?? textPosition.body.x,
            y: bodyData?.y ?? (isMain ? 40 : 85),
            fontSize: bodyData?.fontSize ?? 14,
            fontWeight: (bodyData?.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'normal',
            fontFamily: bodyData?.fontFamily ?? 'Pretendard, sans-serif',
            color: bodyData?.color ?? '#ffffff',
            textShadow: true,
            textAlign: (bodyData?.textAlign as 'left' | 'center' | 'right') ?? textPosition.body.align,
            opacity: 100,
            rotation: 0,
            width: isMain ? 35 : 80,
          },
          zIndex: zIndex++,
        });
      }

      // statistics
      if (aiOverlayText.statistics && aiOverlayText.statistics.length > 0) {
        aiOverlayText.statistics.forEach((stat, idx) => {
          const statData = typeof stat === 'string' ? { text: stat } : stat;
          overlayTexts.push({
            id: `${section.id}-stat-${idx}`,
            type: 'statistic',
            content: statData.text || '',
            style: {
              x: statData.x ?? 50,
              y: statData.y ?? (50 + (idx * 15)),
              fontSize: statData.fontSize ?? 48,
              fontWeight: (statData.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'bold',
              fontFamily: statData.fontFamily ?? 'Montserrat, sans-serif',
              color: statData.color ?? '#ffffff',
              textShadow: true,
              textAlign: 'center',
              opacity: 100,
              rotation: 0,
            },
            zIndex: zIndex++,
          });
        });
      }

      // cta
      const ctaData = typeof aiOverlayText.cta === 'string'
        ? { text: aiOverlayText.cta }
        : aiOverlayText.cta;
      if (ctaData?.text) {
        overlayTexts.push({
          id: `${section.id}-cta`,
          type: 'cta',
          content: ctaData.text,
          style: {
            x: ctaData.x ?? 50,
            y: ctaData.y ?? 90,
            fontSize: ctaData.fontSize ?? 16,
            fontWeight: (ctaData.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'semibold',
            fontFamily: ctaData.fontFamily ?? 'Pretendard, sans-serif',
            color: ctaData.color ?? '#ffffff',
            textShadow: true,
            textAlign: 'center',
            opacity: 100,
            rotation: 0,
          },
          zIndex: zIndex++,
        });
      }
    } else {
      // Fallback: use section.title and section.body
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
            width: isMain ? 35 : 80,
          },
          zIndex: zIndex++,
        });
      }

      if (section.body) {
        const bodyText = Array.isArray(section.body) ? section.body.join('\n') : String(section.body);
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
            width: isMain ? 35 : 80,
          },
          zIndex: zIndex++,
        });
      }
    }

    // Skip if no image
    if (!section.imageUrl && (!section.imageUrls || section.imageUrls.length === 0)) {
      continue;
    }

    const sectionName = sectionTypeNames[section.type] || section.title || '섹션';
    const images = section.imageUrls && section.imageUrls.length > 0
      ? section.imageUrls
      : section.imageUrl ? [section.imageUrl] : [''];

    const blocks = images.map((imageUrl, imgIndex) => ({
      id: `${section.id}-img-${imgIndex}`,
      type: 'image-overlay' as const,
      src: imageUrl,
      alt: `${section.title || 'Section image'} ${imgIndex + 1}`,
      overlayTexts: imgIndex === 0 ? overlayTexts : [],
      overlayGradient: undefined,
    }));

    editorSections.push({
      id: `section-${section.id}`,
      name: `${sectionName}${images.length > 1 ? ` (${images.length}장)` : ''}`,
      blocks,
    });
  }

  return editorSections;
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

    // Extract content data
    const contentData = versionToRestore.content as {
      sections?: unknown[];
      devPrompts?: unknown;
      hookMessage?: string;
    };
    const originalSections = contentData?.sections || [];

    // ★ AI 포맷이면 에디터 포맷으로 변환
    let editorSections: unknown[];
    if (isAIFormat(originalSections)) {
      console.log(`[Restore] Converting AI format to editor format (${originalSections.length} sections)`);
      editorSections = convertAIToEditorFormat(originalSections as AISection[]);
    } else {
      console.log(`[Restore] Already in editor format (${originalSections.length} sections)`);
      editorSections = originalSections;
    }

    // 변환된 콘텐츠로 새 버전 생성
    const newContent = {
      sections: editorSections,
      devPrompts: contentData?.devPrompts,
      hookMessage: contentData?.hookMessage,
    };

    // Create a new version with the restored content
    const restoredVersion = await prisma.projectVersion.create({
      data: {
        projectId,
        versionNumber: newVersionNumber,
        action: 'RESTORE',
        description: `v${versionToRestore.versionNumber}에서 복원됨`,
        content: newContent as any,
        createdById: session.user.id,
      },
    });

    // Update project's current content
    await prisma.project.update({
      where: { id: projectId },
      data: {
        content: newContent as any,
        currentVersion: newVersionNumber,
        updatedAt: new Date(),
      },
    });

    // Get latest detailPageVersion number
    const latestDetailVersion = await prisma.detailPageVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
    });
    const newDetailVersionNumber = (latestDetailVersion?.versionNumber || 0) + 1;

    // Create new detailPageVersion with converted content
    await prisma.detailPageVersion.create({
      data: {
        projectId,
        versionNumber: newDetailVersionNumber,
        contentJson: editorSections as any,
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

    // devPrompts 추출
    const devPrompts = contentData?.devPrompts || null;

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
