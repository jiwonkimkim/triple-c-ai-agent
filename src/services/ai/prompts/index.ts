/**
 * 프롬프트 모듈 메인 엔트리 포인트
 * 모든 프롬프트 관련 타입과 함수를 re-export
 */

// ============================================
// 타입 정의
// ============================================
export type {
  BrandStyleGuide,  // ★ 브랜드 스타일 가이드 (크롤링에서 추출)
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
export type { BlockOverlayOptions } from './overlay-prompts';
export {
  buildOverlayTextPrompt,
  CATEGORY_STATISTICS_PATTERNS,
  SENSORY_KEYWORDS,
  SECTION_TEXT_EXAMPLES,
  CATEGORY_TEXT_STYLE,
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
  IndexedImagePrompt,
  CategorySpecificPrompt,
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
  // 인덱스 기반 이미지 프롬프트 시스템
  getSectionImagePromptByIndex,
  getAllIndexedPromptsForSection,
  hasIndexedPrompts,
  getIndexedPromptCount,
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

// ============================================
// 스킨케어 카테고리 전용 이미지 프롬프트 (고도화)
// ============================================
export type {
  SkincareDetailSectionType,
  SkincareSubCategory,
  SectionBlockVariation,
  SkincareImagePromptOptions,
} from './skincare-image-prompts';
export {
  SKINCARE_EFFICACY_KEYWORDS,
  SKINCARE_SECTION_BLOCKS,
  SKINCARE_SECTION_BASE_PROMPTS,
  SUBCATEGORY_VISUAL_MODIFIERS,
  BARRIER_KEYWORDS,
  EFFICACY_KEYWORD_PATTERNS,
  buildSkincareImagePrompt,
  buildSkincareFullPromptSet,
  buildSkincareSectionPrompts,
  getEfficacyVisualModifiers,
  getEfficacyColorPalette,
  // ★ 피부장벽 매칭 함수
  detectBarrierKeywords,
  detectEfficacyFromText,
  getBarrierDetailedPrompt,
  shouldUseBarrierDetailedPrompt,
  buildSkincareOptionsFromProduct,
} from './skincare-image-prompts';

// ============================================
// 선케어 카테고리 전용 이미지 프롬프트 (고도화)
// ============================================
export type {
  SuncareDetailSectionType,
  SuncareSubCategory,
  SPFLevel,
  PALevel,
  SunProtectionLevel,
  SuncareSectionBlockVariation,
  SuncareImagePromptOptions,
} from './suncare-image-prompts';
export {
  SUNCARE_FEATURE_KEYWORDS,
  SUNCARE_FREE_SYSTEMS,
  SUNCARE_SECTION_BLOCKS,
  SUNCARE_SECTION_BASE_PROMPTS,
  SUNCARE_SUBCATEGORY_MODIFIERS,
  SPF_VISUAL_INTENSITY,
  buildSuncareImagePrompt,
  buildSuncareFullPromptSet,
  buildSuncareSectionPrompts,
  getProtectionVisualIntensity,
  getSuncareColorPalette,
  getSeasonalModifier,
} from './suncare-image-prompts';

// ============================================
// 립 메이크업 카테고리 전용 이미지 프롬프트 (고도화)
// ============================================
export type {
  LipDetailSectionType,
  LipSubCategory,
  LipFinish,
  LipSectionBlockVariation,
  LipImagePromptOptions,
} from './lip-image-prompts';
export {
  LIP_COLOR_PALETTE,
  LIP_FEATURE_KEYWORDS,
  LIP_SECTION_BLOCKS,
  LIP_SECTION_BASE_PROMPTS,
  LIP_SUBCATEGORY_MODIFIERS,
  LIP_FINISH_MODIFIERS,
  buildLipImagePrompt,
  buildLipFullPromptSet,
  buildLipSectionPrompts,
  getLipColorInfo,
  getLipFinishColorPalette,
  getModelColorToneModifier,
} from './lip-image-prompts';

// ============================================
// 마스카라 카테고리 전용 이미지 프롬프트 (고도화)
// ============================================
export type {
  MascaraDetailSectionType,
  MascaraType,
  WandType,
  MascaraSectionBlockVariation,
  MascaraImagePromptOptions,
} from './mascara-image-prompts';
export {
  MASCARA_FEATURE_KEYWORDS,
  MASCARA_MOOD_KEYWORDS,
  MASCARA_COLOR_PALETTE,
  MASCARA_SECTION_BLOCKS,
  MASCARA_SECTION_BASE_PROMPTS,
  MASCARA_TYPE_MODIFIERS,
  WAND_TYPE_MODIFIERS,
  buildMascaraImagePrompt,
  buildMascaraFullPromptSet,
  buildMascaraSectionPrompts,
  getRecommendedMoodForType,
  getMascaraColorInfo,
  getRecommendedWandForType,
} from './mascara-image-prompts';

// ============================================
// 마스크팩 카테고리 전용 이미지 프롬프트 (고도화)
// ============================================
export type {
  MaskPackDetailSectionType,
  MaskPackType,
  MaskIngredient,
  MaskPackSectionBlockVariation,
  MaskPackImagePromptOptions,
} from './maskpack-image-prompts';
export {
  MASK_INGREDIENT_DATA,
  MASKPACK_FEATURE_KEYWORDS,
  MASKPACK_SECTION_BLOCKS,
  MASKPACK_SECTION_BASE_PROMPTS,
  MASKPACK_TYPE_MODIFIERS,
  buildMaskPackImagePrompt,
  buildMaskPackFullPromptSet,
  buildMaskPackSectionPrompts,
  getIngredientColorPalette,
  getIngredientVisualKeywords,
  getIngredientMood,
  buildIngredientSectionPrompt,
} from './maskpack-image-prompts';

// ============================================
// 뷰티 서브 카테고리 통합 시스템
// ============================================
export type {
  BeautySubCategory,
  SubCategoryMeta,
  BeautyDetailSectionType,
  UnifiedPromptOptions,
} from './beauty-subcategory';
export {
  BEAUTY_SUBCATEGORY_META,
  getSubCategorySections,
  detectSubCategoryFromProductName,
  buildUnifiedImagePrompt,
  hasAdvancedPromptSystem,
  isBeautyCategory,
} from './beauty-subcategory';

// ============================================
// 텍스트 배경 섹션 프롬프트 (공통)
// ============================================
export type {
  TextBackgroundSectionType,
  CategoryColorTheme,
  TextBackgroundBlockVariation,
  TextBackgroundPromptOptions,
} from './text-background-prompts';
export {
  CATEGORY_COLOR_THEMES,
  TEXT_BACKGROUND_BLOCKS,
  TEXT_BACKGROUND_BASE_PROMPTS,
  TEXT_BG_BASE_PROMPTS,
  TEXT_BG_BLOCKS,
  buildTextBackgroundPrompt,
  buildTextBackgroundSectionPrompts,
  buildAllTextBackgroundPrompts,
  getInterleavedSectionOrder,
} from './text-background-prompts';
