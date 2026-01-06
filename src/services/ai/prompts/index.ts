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
  // 브랜드 톤 프리셋 타입
  BrandToneType,
  BrandTonePreset,
  CategoryColorGuide,
  ExtendedCategoryPattern,
  QualityCheckItem,
  RequiredFieldDefinition,
  // 이미지 구도 타입
  LayoutStyle,
  DetailPageLayoutPreset,
  SafeZonePosition,
  TextSafeZone,
  NegativePromptCategory,
  NegativePromptConfig,
  ImageCompositionConfig,
  // 이미지 분석 결과 (오버레이 스타일 결정용)
  ImageAnalysisResult,
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
  // 색상 가이드 관련
  CATEGORY_COLOR_GUIDE,
  CONCERN_COLORS,
  getExtendedCategoryPattern,
  buildColorGuidePrompt,
} from './category-patterns';

// ============================================
// 브랜드 톤 프리셋
// ============================================
export {
  BRAND_TONE_PRESETS,
  QUALITY_CHECKLIST,
  REQUIRED_FIELDS,
  getBrandTonePreset,
  buildBrandTonePrompt,
  buildQualityChecklistPrompt,
  buildRequiredFieldsPrompt,
  checkMissingRequiredFields,
} from './brand-presets';

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
export type { ImagePromptOptions } from './image-prompts';
export {
  buildImagePrompt,
  buildEnhancedImagePrompt,
  buildSimpleImagePrompt,
  buildLayoutSpecificPrompt,
} from './image-prompts';

// ============================================
// 이미지 구도 (레이아웃, 텍스트 영역, 네거티브)
// ============================================
export {
  // 레이아웃 프리셋
  LAYOUT_PRESETS,
  SECTION_LAYOUT_RECOMMENDATIONS,
  getLayoutPreset,
  getRecommendedLayouts,
  // 텍스트 안전 영역
  TEXT_SAFE_ZONES,
  LAYOUT_SAFE_ZONE_MAPPING,
  getSafeZonesForLayout,
  getTextSafeZone,
  // 네거티브 프롬프트
  NEGATIVE_PROMPTS,
  CATEGORY_NEGATIVE_PROMPTS,
  buildNegativePrompt,
  // 통합 유틸리티
  buildLayoutPrompt,
  buildTextSafeZonePrompt,
  getOptimalCompositionForSection,
} from './image-composition';

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
} from './reference-data';

// ============================================
// 비주얼 테마 시스템
// ============================================
export type { ThemeStyle, VisualTheme, SectionThemeGuide } from './visual-theme';
export {
  VISUAL_THEMES,
  SECTION_THEME_GUIDES,
  recommendThemeForCategory,
  recommendThemeForBrandTone,
  getVisualTheme,
  buildThemePromptExtension,
  buildFullPageThemePrompt,
  autoSelectTheme,
} from './visual-theme';

// ============================================
// 섹션 템플릿 시스템
// ============================================
export type {
  ExtendedSectionType,
  SectionTemplate,
  CategorySectionConfig,
} from './section-templates';
export {
  SECTION_TEMPLATES,
  CATEGORY_SECTION_CONFIGS,
  getSectionTemplate,
  mapToExtendedSectionType,
  getCategorySectionConfig,
  buildSectionTemplatePrompt,
  generateDetailPageStructure,
  shouldGenerateImageForSection,
  // 이미지 개수 관련
  getSectionImagePrompt,
  isMultiImageSection,
  getMaxImageCount,
  // 섹션별 다양한 배경색 시스템
  buildSectionPromptWithPalette,
  buildCategoryPromptWithPalette,
  generatePageBackgroundMap,
  buildDetailPageMasterPrompt,
  getPalette,
  getRecommendedPalette,
} from './section-templates';

// ============================================
// 섹션별 색상 팔레트 시스템
// ============================================
export type {
  PaletteTheme,
  ColorPalette,
  BackgroundRole,
} from './section-color-palette';
export {
  COLOR_PALETTES,
  SECTION_BACKGROUND_ROLES,
  ROLE_TO_PALETTE_INDEX,
  recommendPaletteForCategory,
  recommendPaletteFromProductColor,
  getSectionBackgroundPrompt,
  buildPaletteHarmonyPrompt,
  generateSectionBackgroundMap,
  injectBackgroundToPrompt,
  autoSelectPalette,
  getColorPalette,
  getAllPalettes,
} from './section-color-palette';
