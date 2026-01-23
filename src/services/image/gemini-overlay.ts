/**
 * ★ Gemini 오버레이 텍스트 관리 모듈
 * - 원본: gemini-image-generator.ts에서 분리
 * - 오버레이 텍스트 생성, 정규화, 기본값 생성
 */

import type { OverlayTextContent, OverlayTextItem, OverlayStatisticItem, SectionType } from '@/services/ai/prompts/types';
import { buildOverlayTextPrompt, BlockOverlayOptions } from '@/services/ai/prompts/overlay-prompts';
import { mapToBaseSectionType } from './gemini-prompts';
import { getGeminiClient } from './gemini-utils';

// ============================================
// ★ 오버레이 텍스트 생성 (텍스트 모델 사용 - 폴백)
// ============================================

/**
 * 섹션용 오버레이 텍스트 생성
 * - 위치, 내용, 스타일(색상, 폰트크기, 굵기, 폰트, 정렬) 모두 포함
 * - 이미지 시나리오 컨텍스트를 기반으로 이미지와 어울리는 텍스트 생성
 * - ★ 텍스트 배경 섹션은 임팩트 있는 대형 타이포그래피 스타일 적용
 */
export async function generateOverlayTextForSection(
  sectionType: string,
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  blockOptions?: {
    blockIndex?: number;
    totalBlocks?: number;
    variationHint?: string;
  },
  _imageScenarioPrompt?: string
): Promise<{ overlayText: OverlayTextContent; prompt: string }> {
  const gemini = getGeminiClient();

  // ★★★ 모듈 레벨 mapToBaseSectionType 사용 (중복 제거)
  const normalizedSection = mapToBaseSectionType(sectionType);

  // 섹션별 기본 폴백 위치 (AI 응답 실패 시에만 사용)
  const fallbackPositions: Record<string, { x: number; y: number; fontSize: number }[]> = {
    MAIN: [{ x: 8, y: 12, fontSize: 28 }],
    HERO: [{ x: 50, y: 12, fontSize: 24 }],
    FEATURES: [{ x: 50, y: 12, fontSize: 24 }],
    SOCIAL_PROOF: [{ x: 50, y: 65, fontSize: 20 }],
    HOW_TO_USE: [{ x: 50, y: 12, fontSize: 18 }],
    FAQ: [{ x: 50, y: 15, fontSize: 18 }],
  };

  const fallback = fallbackPositions[normalizedSection] || fallbackPositions.FEATURES;

  // ★★★ 공통 프롬프트 빌더 사용 (overlay-prompts.ts)
  const overlayBlockOptions: BlockOverlayOptions = {
    blockIndex: blockOptions?.blockIndex,
    totalBlocks: blockOptions?.totalBlocks,
    variationHint: blockOptions?.variationHint,
  };

  const prompt = buildOverlayTextPrompt(
    normalizedSection as SectionType,
    productName,
    category,
    keyFeatures,
    targetAudience,
    overlayBlockOptions
  );

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // JSON 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr) as OverlayTextContent & { texts?: OverlayTextItem[] };

    // ★ 새 형식 (texts 배열) 또는 기존 형식 처리
    let normalizedOverlay: OverlayTextContent;

    if (parsed.texts && Array.isArray(parsed.texts) && parsed.texts.length > 0) {
      normalizedOverlay = {
        texts: parsed.texts.map(item => ({
          text: item.text || '',
          x: item.x ?? 50,
          y: item.y ?? 50,
          fontSize: item.fontSize ?? 24,
          fontWeight: item.fontWeight ?? 'medium',
          fontFamily: item.fontFamily ?? 'Pretendard, sans-serif',
          color: item.color ?? '#333333',
          textAlign: item.textAlign ?? 'center',
        })),
      };
      console.log(`[Overlay] Generated ${parsed.texts.length} texts (free form) for ${sectionType}`);
    } else {
      normalizedOverlay = createDefaultOverlay(normalizedSection, productName, keyFeatures, fallback);
      console.log(`[Overlay] Using fallback overlay for ${sectionType}`);
    }

    return {
      overlayText: normalizedOverlay,
      prompt,
    };
  } catch (error) {
    console.error(`[Overlay] Failed to generate overlay text for ${sectionType}:`, error);

    return {
      overlayText: createDefaultOverlay(normalizedSection, productName, keyFeatures, fallback),
      prompt,
    };
  }
}

// ============================================
// ★ 오버레이 아이템 정규화
// ============================================

/**
 * 오버레이 아이템 정규화 (string → OverlayTextItem)
 * - fontFamily도 처리
 */
export function normalizeOverlayItem(
  item: OverlayTextItem | string | null | undefined,
  defaultLayout: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' }
): OverlayTextItem | undefined {
  if (!item) return undefined;

  if (typeof item === 'string') {
    return {
      text: item,
      x: defaultLayout.x,
      y: defaultLayout.y,
      fontSize: defaultLayout.fontSize,
      fontWeight: 'medium',
      fontFamily: 'Pretendard, sans-serif',
      color: '#333333',
      textAlign: defaultLayout.align,
    };
  }

  return {
    text: item.text,
    x: item.x ?? defaultLayout.x,
    y: item.y ?? defaultLayout.y,
    fontSize: item.fontSize ?? defaultLayout.fontSize,
    fontWeight: item.fontWeight ?? 'medium',
    fontFamily: item.fontFamily ?? 'Pretendard, sans-serif',
    color: item.color ?? '#333333',
    textAlign: item.textAlign ?? defaultLayout.align,
  };
}

/**
 * 통계 배열 정규화
 * - fontFamily도 처리
 */
export function normalizeStatistics(
  stats: (OverlayStatisticItem | string)[] | null | undefined,
  defaultLayout: { x: number; y: number; fontSize: number }
): OverlayStatisticItem[] | undefined {
  if (!stats || stats.length === 0) return undefined;

  return stats.map((stat, idx) => {
    if (typeof stat === 'string') {
      return {
        text: stat,
        x: defaultLayout.x,
        y: defaultLayout.y + (idx * 12),
        fontSize: defaultLayout.fontSize,
        fontWeight: 'bold' as const,
        fontFamily: 'Montserrat, sans-serif',
        color: '#ffffff',
      };
    }
    return {
      text: stat.text,
      x: stat.x ?? defaultLayout.x,
      y: stat.y ?? defaultLayout.y + (idx * 12),
      fontSize: stat.fontSize ?? defaultLayout.fontSize,
      fontWeight: stat.fontWeight ?? 'bold',
      fontFamily: stat.fontFamily ?? 'Montserrat, sans-serif',
      color: stat.color ?? '#ffffff',
    };
  });
}

// ============================================
// ★ 기본 오버레이 생성 (폴백)
// ============================================

/**
 * 섹션별 기본 오버레이 텍스트 생성 (이미지 모델이 리턴 안했을 때 폴백)
 * - 심플한 texts 배열 형식으로 반환
 */
export function createDefaultOverlayForSection(
  sectionType: string,
  productName: string,
  keyFeatures: string[]
): OverlayTextContent {
  const normalizedSection = mapToBaseSectionType(sectionType);

  const sectionHeadlines: Record<string, string> = {
    MAIN: productName.slice(0, 20),
    HERO: productName,
    FEATURES: keyFeatures[0] || productName,
    SOCIAL_PROOF: productName,
    HOW_TO_USE: productName,
    FAQ: productName,
  };

  const texts: OverlayTextItem[] = [
    {
      text: sectionHeadlines[normalizedSection] || productName,
      x: 50,
      y: 15,
      fontSize: 28,
      fontWeight: 'bold' as const,
      color: '#333333',
      textAlign: 'center' as const,
    },
  ];

  if (keyFeatures[0]) {
    texts.push({
      text: keyFeatures[0].slice(0, 40),
      x: 50,
      y: 28,
      fontSize: 16,
      fontWeight: 'normal' as const,
      color: '#666666',
      textAlign: 'center' as const,
    });
  }

  return { texts };
}

/**
 * 기본 오버레이 텍스트 생성 (폴백용 - texts 배열 형식)
 * - 자유로운 텍스트 배열 형식으로 반환
 */
export function createDefaultOverlay(
  sectionType: string,
  productName: string,
  keyFeatures: string[],
  fallbackPositions: { x: number; y: number; fontSize: number }[]
): OverlayTextContent {
  const texts: OverlayTextItem[] = [];
  const basePosition = fallbackPositions[0] || { x: 50, y: 12, fontSize: 24 };

  texts.push({
    text: keyFeatures[0] || productName,
    x: basePosition.x,
    y: basePosition.y,
    fontSize: basePosition.fontSize,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  });

  if (keyFeatures.length > 1) {
    texts.push({
      text: keyFeatures[1],
      x: basePosition.x,
      y: basePosition.y + 8,
      fontSize: Math.round(basePosition.fontSize * 0.8),
      fontWeight: 'normal',
      color: '#666666',
      textAlign: 'center',
    });
  }

  return { texts };
}
