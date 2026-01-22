/**
 * DevPrompts 데이터 구조 빌더
 *
 * 초기 생성, 전체 재생성, 섹션 재생성에서 동일한 프로세스를 사용합니다.
 * 이 모듈을 수정하면 모든 devPrompts 저장에 자동 적용됩니다.
 */

import type { GeminiGeneratedImage } from '@/services/image/gemini-image-generator';
import type { OverlayTextContent } from '@/services/ai/prompts';

// ============================================
// 타입 정의
// ============================================

/** 이미지 생성 결과 (gemini-image-generator에서 반환) */
export interface ImageGenerationResult {
  revisedPrompt?: string;
  promptComponents?: GeminiGeneratedImage['promptComponents'];
}

/** 섹션 이미지 프롬프트 데이터 (devPrompts.sectionImagePrompts 배열 아이템) */
export interface SectionImagePromptData {
  sectionType: string;
  // [0] 메타 정보
  generationMode?: 'T2I' | 'I2I';
  sectionTypeOriginal?: string;
  sectionTypeMapped?: string;
  // [1] 섹션별 프롬프트
  sectionBasePrompt?: string;
  orchestrationPrompt?: string;
  i2iSystemPrompt?: string;
  // [2] 카테고리별 프롬프트
  categoryPrompt?: string;
  subCategory?: string;
  // [3] 오버레이 텍스트 관련 프롬프트
  overlayTextPrompt?: string;
  overlayGuidePrompt?: string;
  // [4] 공통 프롬프트 (Flash 모델 전용)
  noTextReinforcement?: string;
  // ★ 최종 결합 프롬프트
  imagePrompt: string;
  // 생성 결과
  generatedImageUrl?: string;
  overlayText?: OverlayTextContent;
  overlayPrompt?: string;
}

/** 오버레이 텍스트 프롬프트 데이터 (devPrompts.overlayTextPrompts 배열 아이템) */
export interface OverlayTextPromptData {
  sectionType: string;
  blockIndex: number;
  overlayPrompt: string;
  generatedOverlay?: OverlayTextContent;
}

/** 빌더 입력 옵션 */
export interface BuildSectionPromptDataOptions {
  sectionType: string;
  blockIndex?: number;
  subCategory?: string;
  imageResult?: ImageGenerationResult;
  imageUrl?: string;
  overlayText?: OverlayTextContent;
  overlayPrompt?: string;
  /** 기존 promptComponents (오케스트레이션에서 생성된 것) */
  existingPromptComponents?: Record<string, unknown>;
}

// ============================================
// 메인 함수
// ============================================

/**
 * 섹션 이미지 프롬프트 데이터를 생성합니다.
 *
 * 사용 위치:
 * - 초기 생성 (detail-page-generator.ts)
 * - 전체 재생성 (detail-page-generator.ts)
 * - 섹션 재생성 (section/route.ts)
 */
export function buildSectionImagePromptData(
  options: BuildSectionPromptDataOptions
): SectionImagePromptData {
  const {
    sectionType,
    blockIndex = 0,
    subCategory,
    imageResult,
    imageUrl,
    overlayText,
    overlayPrompt,
    existingPromptComponents,
  } = options;

  const promptComponents = imageResult?.promptComponents;

  return {
    sectionType,
    // ★★★ [0] 메타 정보 (UI 태그 표시용) ★★★
    generationMode: promptComponents?.generationMode,
    sectionTypeOriginal: promptComponents?.sectionTypeOriginal,
    sectionTypeMapped: promptComponents?.sectionTypeMapped,
    // ★★★ [1] 섹션별 프롬프트 ★★★
    sectionBasePrompt: promptComponents?.sectionBasePrompt,
    orchestrationPrompt: promptComponents?.orchestrationPrompt,
    i2iSystemPrompt: promptComponents?.i2iSystemPrompt,
    // ★★★ [2] 카테고리별 프롬프트 (뷰티 서브카테고리) ★★★
    categoryPrompt: promptComponents?.categoryPrompt || (existingPromptComponents?.categoryPrompt as string),
    subCategory: subCategory || (existingPromptComponents?.subCategory as string),
    // ★★★ [3] 오버레이 텍스트 관련 프롬프트 ★★★
    overlayTextPrompt: promptComponents?.overlayTextPrompt,
    overlayGuidePrompt: promptComponents?.overlayGuidePrompt,
    // ★★★ [4] 공통 프롬프트 (Flash 모델 전용) ★★★
    noTextReinforcement: promptComponents?.noTextReinforcement,
    // ★★★ 최종 결합 프롬프트 (실제 사용된 전체 프롬프트) ★★★
    imagePrompt: imageResult?.revisedPrompt || `${sectionType} section image`,
    // 생성 결과
    generatedImageUrl: imageUrl,
    overlayText,
    overlayPrompt,
  };
}

/**
 * 오버레이 텍스트 프롬프트 데이터를 생성합니다.
 */
export function buildOverlayTextPromptData(
  sectionType: string,
  blockIndex: number,
  overlayPrompt: string,
  generatedOverlay?: OverlayTextContent
): OverlayTextPromptData {
  return {
    sectionType,
    blockIndex,
    overlayPrompt: overlayPrompt || '',
    generatedOverlay,
  };
}

/**
 * 기존 프롬프트 데이터를 새 이미지 결과로 업데이트합니다.
 * 기존 데이터의 모든 필드를 보존하면서 이미지 생성 결과를 병합합니다.
 *
 * @template T - 기존 데이터 타입 (SectionImagePrompt 등)
 */
export function updateSectionImagePromptData<T extends { sectionType?: string; imagePrompt?: string }>(
  existingData: T,
  imageResult: ImageGenerationResult,
  overlayText?: OverlayTextContent,
  overlayPrompt?: string
): T {
  const promptComponents = imageResult.promptComponents;

  return {
    ...existingData,  // ★ 기존 데이터의 모든 필드 보존 (position, compositionGuide 등)
    // ★★★ 새 이미지 결과의 promptComponents로 업데이트 ★★★
    imagePrompt: imageResult.revisedPrompt || existingData.imagePrompt || `${existingData.sectionType} section image`,
    promptComponents: {
      ...(existingData as Record<string, unknown>).promptComponents as Record<string, unknown>,  // 기존 promptComponents 보존
      ...promptComponents,  // 새 promptComponents로 덮어쓰기
    },
    // 오버레이 텍스트 업데이트
    overlayText: overlayText || (existingData as Record<string, unknown>).overlayText,
    overlayPrompt: overlayPrompt || (existingData as Record<string, unknown>).overlayPrompt,
  } as T;
}
