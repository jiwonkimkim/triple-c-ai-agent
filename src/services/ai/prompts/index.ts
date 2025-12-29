/**
 * 프롬프트 모듈 메인 엔트리 포인트
 * 모든 프롬프트 관련 타입과 함수를 re-export
 */

// ============================================
// 타입 정의
// ============================================
export type {
  BrandContext,
  GenerateDetailPageInput,
  ProductVisualReference,
  OverlayTextContent,
  CopyLengthConfig,
  SectionType,
  SectionPosition,
  CategoryPattern,
  SectionStoryGuide,
  SectionCompositionGuide,
} from './types';

// ============================================
// 카테고리 패턴 및 설정
// ============================================
export {
  COPY_LENGTH_CONFIG,
  POSITION_PATTERNS,
  CATEGORY_PATTERNS,
  SECTION_STORY_GUIDE,
  SECTION_COMPOSITION_GUIDE,
  getCategoryPattern,
  getSectionStoryGuide,
} from './category-patterns';

// ============================================
// 시스템 프롬프트
// ============================================
export {
  buildSystemPrompt,
  buildEnhancedSystemPrompt,
} from './system-prompts';

// ============================================
// 사용자 프롬프트
// ============================================
export {
  buildUserPrompt,
  buildEnhancedUserPrompt,
} from './user-prompts';

// ============================================
// 이미지 프롬프트
// ============================================
export {
  buildImagePrompt,
  buildEnhancedImagePrompt,
} from './image-prompts';

// ============================================
// 오버레이 텍스트 프롬프트
// ============================================
export {
  buildOverlayTextPrompt,
} from './overlay-prompts';

// ============================================
// OCR 참조 데이터
// ============================================
export type { OCRImageData } from './reference-data';
export {
  REFERENCE_PROMPT_PATTERNS,
  VISUAL_STYLE_KEYWORDS,
  SECTION_COMPOSITION,
  getReferencePrompts,
  getVisualStyleKeywords,
  mapSectionTypeToPosition,
  MIDJOURNEY_PARAMS,
  addMidjourneyParams,
} from './reference-data';
