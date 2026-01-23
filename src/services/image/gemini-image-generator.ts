/**
 * ★★★ Gemini 이미지 생성 모듈 - Barrel Re-export ★★★
 *
 * 이 파일은 모듈화된 Gemini 이미지 생성 파이프라인의 진입점입니다.
 * 기존 import 경로 호환을 위해 모든 export를 재-export 합니다.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ 모듈 구조 가이드                                                │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ gemini-types.ts      → 타입/인터페이스 정의                     │
 * │ gemini-resolution.ts → 해상도/비율 매핑 유틸리티                │
 * │ gemini-prompts.ts    → 프롬프트 빌더 (섹션별, 미션, 오버레이)   │
 * │ gemini-utils.ts      → 클라이언트, base64, 재료/무드 유틸리티   │
 * │ gemini-t2i.ts        → Text-to-Image 파이프라인                │
 * │ gemini-i2i.ts        → Image-to-Image 파이프라인 + 배경 제거    │
 * │ gemini-overlay.ts    → 오버레이 텍스트 생성/정규화/폴백         │
 * │ gemini-unified.ts    → 통합 생성 함수 (T2I/I2I 라우팅)          │
 * └─────────────────────────────────────────────────────────────────┘
 */

// ============================================
// [1] 타입/인터페이스 (gemini-types.ts)
// ============================================
export type { GeminiImageModel, ImageAspectRatio } from './gemini-types';
export type { GeminiGenerateImageOptions, GeminiGeneratedImage, RemoveBackgroundOptions, ImageToImageOptions, ImageWithOverlayResult, SectionPromptParams } from './gemini-types';
export { DEFAULT_IMAGE_MODEL } from './gemini-types';

// ============================================
// [2] 해상도/비율 (gemini-resolution.ts)
// ============================================
// getResolutionForAspectRatio, isProImageModel, getSectionAspectRatio
// FLASH_RESOLUTIONS, PRO_RESOLUTIONS
export { getResolutionForAspectRatio, isProImageModel, getSectionAspectRatio } from './gemini-resolution';

// ============================================
// [3] 프롬프트 빌더 (gemini-prompts.ts)
// ============================================
// MISSION_PROMPT, NO_TEXT_IN_IMAGE_REINFORCEMENT
// buildSharedSectionPrompt, buildCreativeOverlayGuide
// buildAudienceStyle, buildFeatureHighlight, buildOverlayTextRequest
// mapToBaseSectionType
export {
  MISSION_PROMPT,
  NO_TEXT_IN_IMAGE_REINFORCEMENT,
  mapToBaseSectionType,
  buildSharedSectionPrompt,
  buildCreativeOverlayGuide,
  buildAudienceStyle,
  buildFeatureHighlight,
  buildOverlayTextRequest,
} from './gemini-prompts';

// ============================================
// [4] 유틸리티 (gemini-utils.ts)
// ============================================
// getGeminiClient, base64ToDataUrl, isGeminiConfigured, urlToBase64DataUrl
// extractBase64FromSource, extractBase64FromDataUrl
// selectRandomMoodObjects, extractIngredientObjects
export {
  getGeminiClient,
  base64ToDataUrl,
  isGeminiConfigured,
  urlToBase64DataUrl,
  extractBase64FromSource,
  extractBase64FromDataUrl,
  selectRandomMoodObjects,
  extractIngredientObjects,
} from './gemini-utils';

// ============================================
// [5] Text-to-Image 파이프라인 (gemini-t2i.ts)
// ============================================
// generateImageWithGemini (핵심 T2I API 호출)
// generateSectionImageWithGemini (섹션별 T2I)
// generateProductHeroImageWithGemini, generateProductFeatureImageWithGemini
// generateLifestyleImageWithGemini, generateDetailPageImagesWithGemini
export {
  generateImageWithGemini,
  generateSectionImageWithGemini,
  generateProductHeroImageWithGemini,
  generateProductFeatureImageWithGemini,
  generateLifestyleImageWithGemini,
  generateDetailPageImagesWithGemini,
} from './gemini-t2i';

// ============================================
// [6] Image-to-Image 파이프라인 (gemini-i2i.ts)
// ============================================
// generateImageFromImage (핵심 I2I API 호출)
// generateSectionImageFromProduct (섹션별 I2I)
// removeBackground, preprocessProductImage
export {
  generateImageFromImage,
  generateSectionImageFromProduct,
  removeBackground,
  preprocessProductImage,
} from './gemini-i2i';

// ============================================
// [7] 오버레이 텍스트 관리 (gemini-overlay.ts)
// ============================================
// generateOverlayTextForSection (텍스트 모델 폴백)
// normalizeOverlayItem, normalizeStatistics
// createDefaultOverlayForSection, createDefaultOverlay
export {
  generateOverlayTextForSection,
  normalizeOverlayItem,
  normalizeStatistics,
  createDefaultOverlayForSection,
  createDefaultOverlay,
} from './gemini-overlay';

// ============================================
// [8] 통합 생성 함수 (gemini-unified.ts)
// ============================================
// generateSectionImageWithOverlay (★ 메인 진입점 - T2I/I2I 자동 라우팅)
export { generateSectionImageWithOverlay } from './gemini-unified';
