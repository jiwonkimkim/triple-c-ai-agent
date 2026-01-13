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

    // ★ 오버레이 텍스트 항목 타입 (위치 + 스타일 포함)
    interface OverlayTextItem {
      text?: string;
      x?: number;
      y?: number;
      fontSize?: number;
      fontWeight?: string;
      fontFamily?: string;
      color?: string;
      textAlign?: string;
    }
    interface OverlayStatisticItem {
      text: string;
      x?: number;
      y?: number;
      fontSize?: number;
      fontWeight?: string;
      fontFamily?: string;
      color?: string;
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
      overlayText?: {        // ★ AI 생성 오버레이 텍스트 (위치 + 스타일 포함)
        headline?: OverlayTextItem | string;
        subheadline?: OverlayTextItem | string;
        body?: OverlayTextItem | string;
        statistics?: (OverlayStatisticItem | string)[];
        cta?: OverlayTextItem | string;
      };
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

        // ★ AI가 생성한 overlayText가 있으면 우선 사용 (위치 + 스타일 포함)
        const aiOverlayText = section.overlayText as {
          headline?: OverlayTextItem | string;
          subheadline?: OverlayTextItem | string;
          body?: OverlayTextItem | string;
          statistics?: (OverlayStatisticItem | string)[];
          cta?: OverlayTextItem | string;
        } | undefined;

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

        // ★ AI가 생성한 overlayText가 있으면 우선 사용 (위치 + 스타일 + 폰트 포함)
        // 헬퍼 함수: 흰색 계열인지 확인 (흰색만 그림자 적용)
        const isWhiteColor = (color?: string): boolean => {
          if (!color) return true; // 기본값은 흰색이므로 true
          const c = color.toLowerCase().trim();
          // 흰색 계열: #ffffff, #fff, white, #eeeeee, #fafafa 등 밝은 색상
          if (c === '#ffffff' || c === '#fff' || c === 'white') return true;
          if (c.startsWith('#')) {
            // hex 색상 분석 - 밝기가 높으면(RGB 합계가 높으면) 흰색 계열로 판단
            const hex = c.replace('#', '');
            if (hex.length === 3) {
              const r = parseInt(hex[0] + hex[0], 16);
              const g = parseInt(hex[1] + hex[1], 16);
              const b = parseInt(hex[2] + hex[2], 16);
              return (r + g + b) / 3 > 200; // 평균 밝기 200 이상이면 밝은 색
            }
            if (hex.length === 6) {
              const r = parseInt(hex.slice(0, 2), 16);
              const g = parseInt(hex.slice(2, 4), 16);
              const b = parseInt(hex.slice(4, 6), 16);
              return (r + g + b) / 3 > 200;
            }
          }
          return false;
        };

        // 헬퍼 함수: OverlayTextItem 또는 string에서 값 추출 (항상 일관된 타입 반환)
        interface TextValueResult {
          text: string;
          hasStyle: boolean;
          x?: number;
          y?: number;
          fontSize?: number;
          fontWeight?: string;
          fontFamily?: string;  // ★ 폰트 패밀리 추가
          color?: string;
          textAlign?: string;
        }
        const getTextValue = (item: { text?: string; x?: number; y?: number; fontSize?: number; fontWeight?: string; fontFamily?: string; color?: string; textAlign?: string } | string | undefined | null): TextValueResult | null => {
          if (!item) return null;
          if (typeof item === 'string') {
            return { text: item, hasStyle: false };
          }
          return {
            text: item.text || '',
            hasStyle: true,
            x: item.x,
            y: item.y,
            fontSize: item.fontSize,
            fontWeight: item.fontWeight,
            fontFamily: item.fontFamily,  // ★ AI가 선택한 폰트
            color: item.color,
            textAlign: item.textAlign,
          };
        };

        if (aiOverlayText) {
          // headline (AI 생성 또는 section.title)
          const headlineData = getTextValue(aiOverlayText.headline) || (section.title ? { text: section.title, hasStyle: false } : null);
          if (headlineData) {
            const headlineColor = headlineData.color ?? '#ffffff';
            overlayTexts.push({
              id: `${section.id}-headline`,
              type: 'headline',
              content: headlineData.text || '',
              style: {
                x: headlineData.x ?? textPosition.headline.x,
                y: headlineData.y ?? textPosition.headline.y,
                fontSize: headlineData.fontSize ?? (isMain ? 32 : 28),
                fontWeight: (headlineData.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'bold',
                fontFamily: headlineData.fontFamily ?? 'Pretendard, sans-serif',
                color: headlineColor,
                textShadow: isWhiteColor(headlineColor),  // ★ 흰색만 그림자 적용
                textAlign: (headlineData.textAlign as 'left' | 'center' | 'right') ?? textPosition.headline.align,
                opacity: 100,
                rotation: 0,
                width: isMain ? 35 : 80,
              },
              zIndex: zIndex++,
            });
          }

          // subheadline (AI 생성)
          const subheadlineData = getTextValue(aiOverlayText.subheadline);
          if (subheadlineData) {
            const subheadlineColor = subheadlineData.color ?? '#ffffff';
            overlayTexts.push({
              id: `${section.id}-subheadline`,
              type: 'subheadline',
              content: subheadlineData.text || '',
              style: {
                x: subheadlineData.x ?? textPosition.body.x,
                y: subheadlineData.y ?? (textPosition.headline.y + 12),
                fontSize: subheadlineData.fontSize ?? (isMain ? 18 : 16),
                fontWeight: (subheadlineData.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'medium',
                fontFamily: subheadlineData.fontFamily ?? 'Pretendard, sans-serif',
                color: subheadlineColor,
                textShadow: isWhiteColor(subheadlineColor),  // ★ 흰색만 그림자 적용
                textAlign: (subheadlineData.textAlign as 'left' | 'center' | 'right') ?? textPosition.body.align,
                opacity: 100,
                rotation: 0,
                width: isMain ? 35 : 70,
              },
              zIndex: zIndex++,
            });
          }

          // body (AI 생성 또는 section.body)
          const bodyData = getTextValue(aiOverlayText.body);
          const bodyFallback: TextValueResult | null = !bodyData && section.body
            ? { text: Array.isArray(section.body) ? section.body.join('\n') : String(section.body), hasStyle: false }
            : null;
          const finalBodyData = bodyData || bodyFallback;
          if (finalBodyData) {
            const bodyColor = finalBodyData.color ?? '#ffffff';
            overlayTexts.push({
              id: `${section.id}-body`,
              type: 'body',
              content: finalBodyData.text || '',
              style: {
                x: finalBodyData.x ?? textPosition.body.x,
                y: finalBodyData.y ?? (isMain ? 40 : 85),
                fontSize: finalBodyData.fontSize ?? 14,
                fontWeight: (finalBodyData.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'normal',
                fontFamily: finalBodyData.fontFamily ?? 'Pretendard, sans-serif',
                color: bodyColor,
                textShadow: isWhiteColor(bodyColor),  // ★ 흰색만 그림자 적용
                textAlign: (finalBodyData.textAlign as 'left' | 'center' | 'right') ?? textPosition.body.align,
                opacity: 100,
                rotation: 0,
                width: isMain ? 35 : 80,
              },
              zIndex: zIndex++,
            });
          }

          // statistics (AI 생성) - 위치/스타일/폰트 포함 가능
          if (aiOverlayText.statistics && aiOverlayText.statistics.length > 0) {
            aiOverlayText.statistics.forEach((stat, idx) => {
              // statData를 일관된 타입으로 변환 (fontFamily 포함)
              const statData: { text: string; x?: number; y?: number; fontSize?: number; fontWeight?: string; fontFamily?: string; color?: string } =
                typeof stat === 'string' ? { text: stat } : { text: stat.text || '', x: stat.x, y: stat.y, fontSize: stat.fontSize, fontWeight: stat.fontWeight, fontFamily: stat.fontFamily, color: stat.color };
              const statColor = statData.color ?? '#ffffff';
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
                  color: statColor,
                  textShadow: isWhiteColor(statColor),  // ★ 흰색만 그림자 적용
                  textAlign: 'center',
                  opacity: 100,
                  rotation: 0,
                },
                zIndex: zIndex++,
              });
            });
          }

          // cta (AI 생성) - 위치/스타일/폰트 포함 가능
          const ctaData = getTextValue(aiOverlayText.cta);
          if (ctaData) {
            const ctaColor = ctaData.color ?? '#ffffff';
            overlayTexts.push({
              id: `${section.id}-cta`,
              type: 'cta',
              content: ctaData.text || '',
              style: {
                x: ctaData.x ?? 50,
                y: ctaData.y ?? 90,
                fontSize: ctaData.fontSize ?? 16,
                fontWeight: (ctaData.fontWeight as 'normal' | 'medium' | 'semibold' | 'bold') ?? 'semibold',
                fontFamily: ctaData.fontFamily ?? 'Pretendard, sans-serif',
                color: ctaColor,
                textShadow: isWhiteColor(ctaColor),  // ★ 흰색만 그림자 적용
                textAlign: 'center',
                opacity: 100,
                rotation: 0,
              },
              zIndex: zIndex++,
            });
          }
        } else {
          // 폴백: 기존 방식 (section.title, section.body 사용)
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
                width: isMain ? 35 : 80,
              },
              zIndex: zIndex++,
            });
          }

          // Add body as subheadline or body text
          if (section.body) {
            const bodyText = Array.isArray(section.body)
              ? section.body.join('\n')
              : String(section.body);
            const bodyLines = bodyText.split('\n').filter(line => line.trim());

            if (bodyLines.length === 1 && bodyLines[0].length < 50) {
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
                  width: isMain ? 35 : 70,
                },
                zIndex: zIndex++,
              });
            } else {
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
