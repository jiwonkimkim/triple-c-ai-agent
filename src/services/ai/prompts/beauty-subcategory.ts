/**
 * 뷰티/스킨케어 서브 카테고리 정의 및 매핑
 * 각 서브 카테고리별 고도화된 프롬프트 시스템 연결
 */

import {
  buildSkincareImagePrompt,
  type SkincareDetailSectionType,
  type SkincareImagePromptOptions,
  SKINCARE_SECTION_BLOCKS,
} from './skincare-image-prompts';

import {
  buildSuncareImagePrompt,
  type SuncareDetailSectionType,
  type SuncareImagePromptOptions,
  SUNCARE_SECTION_BLOCKS,
} from './suncare-image-prompts';

import {
  buildLipImagePrompt,
  type LipDetailSectionType,
  type LipImagePromptOptions,
  LIP_SECTION_BLOCKS,
} from './lip-image-prompts';

import {
  buildMascaraImagePrompt,
  type MascaraDetailSectionType,
  type MascaraImagePromptOptions,
  MASCARA_SECTION_BLOCKS,
} from './mascara-image-prompts';

import {
  buildMaskPackImagePrompt,
  type MaskPackDetailSectionType,
  type MaskPackImagePromptOptions,
  MASKPACK_SECTION_BLOCKS,
} from './maskpack-image-prompts';

// ============================================
// 뷰티 서브 카테고리 타입 정의
// ============================================

export type BeautySubCategory =
  | 'skincare'      // 스킨케어 (토너/에센스/세럼/크림)
  | 'suncare'       // 선케어 (선크림/선스틱/선스프레이)
  | 'lip'           // 립 (립글로스/립틴트/립스틱)
  | 'mascara'       // 마스카라
  | 'maskpack'      // 마스크팩
  | 'cushion'       // 쿠션/베이스 (추후 추가)
  | 'eyeshadow'     // 아이섀도우 (추후 추가)
  | 'cleanser'      // 클렌징 (추후 추가)
  | 'other_beauty'; // 기타 뷰티

// ============================================
// 서브 카테고리 메타 정보
// ============================================

export interface SubCategoryMeta {
  value: BeautySubCategory;
  label: string;
  labelEn: string;
  description: string;
  sectionCount: number;
  isAvailable: boolean; // 프롬프트 시스템 구현 완료 여부
}

export const BEAUTY_SUBCATEGORY_META: SubCategoryMeta[] = [
  {
    value: 'skincare',
    label: '스킨케어',
    labelEn: 'Skincare',
    description: '토너, 에센스, 세럼, 크림, 로션 등',
    sectionCount: 11,
    isAvailable: true,
  },
  {
    value: 'suncare',
    label: '선케어',
    labelEn: 'Suncare',
    description: '선크림, 선스틱, 선스프레이 등',
    sectionCount: 11,
    isAvailable: true,
  },
  {
    value: 'lip',
    label: '립 메이크업',
    labelEn: 'Lip',
    description: '립글로스, 립틴트, 립스틱, 립밤 등',
    sectionCount: 14,
    isAvailable: true,
  },
  {
    value: 'mascara',
    label: '마스카라',
    labelEn: 'Mascara',
    description: '볼륨, 컬링, 롱래쉬, 워터프루프 등',
    sectionCount: 15,
    isAvailable: true,
  },
  {
    value: 'maskpack',
    label: '마스크팩',
    labelEn: 'Mask Pack',
    description: '시트마스크, 워시오프, 수면팩 등',
    sectionCount: 17,
    isAvailable: true,
  },
  {
    value: 'cushion',
    label: '쿠션/베이스',
    labelEn: 'Cushion/Base',
    description: '쿠션, 파운데이션, 프라이머 등',
    sectionCount: 0,
    isAvailable: false,
  },
  {
    value: 'eyeshadow',
    label: '아이섀도우',
    labelEn: 'Eyeshadow',
    description: '아이섀도우 팔레트, 싱글 등',
    sectionCount: 0,
    isAvailable: false,
  },
  {
    value: 'cleanser',
    label: '클렌징',
    labelEn: 'Cleanser',
    description: '클렌징폼, 오일, 워터 등',
    sectionCount: 0,
    isAvailable: false,
  },
  {
    value: 'other_beauty',
    label: '기타 뷰티',
    labelEn: 'Other Beauty',
    description: '기타 뷰티 제품',
    sectionCount: 0,
    isAvailable: false,
  },
];

// ============================================
// 서브 카테고리별 섹션 타입 유니온
// ============================================

export type BeautyDetailSectionType =
  | SkincareDetailSectionType
  | SuncareDetailSectionType
  | LipDetailSectionType
  | MascaraDetailSectionType
  | MaskPackDetailSectionType;

// ============================================
// 서브 카테고리별 섹션 목록 반환
// ============================================

export function getSubCategorySections(subCategory: BeautySubCategory): string[] {
  // MAIN(썸네일)은 항상 첫 번째로 포함
  switch (subCategory) {
    case 'skincare':
      return ['MAIN', ...Object.keys(SKINCARE_SECTION_BLOCKS)];
    case 'suncare':
      return ['MAIN', ...Object.keys(SUNCARE_SECTION_BLOCKS)];
    case 'lip':
      return ['MAIN', ...Object.keys(LIP_SECTION_BLOCKS)];
    case 'mascara':
      return ['MAIN', ...Object.keys(MASCARA_SECTION_BLOCKS)];
    case 'maskpack':
      return ['MAIN', ...Object.keys(MASKPACK_SECTION_BLOCKS)];
    default:
      return ['MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ']; // 기본 섹션
  }
}

// ============================================
// 서브 카테고리 감지 (제품명 기반 - 보조용)
// ============================================

const SUBCATEGORY_KEYWORDS: Record<BeautySubCategory, string[]> = {
  skincare: ['토너', '스킨', '에센스', '세럼', '앰플', '크림', '로션', '에멀전', '미스트', '오일'],
  suncare: ['선크림', '선스틱', '선스프레이', '선쿠션', '선젤', '선밀크', 'SPF', 'PA+++', '자외선'],
  lip: ['립글로스', '립틴트', '립스틱', '립밤', '립오일', '립래커', '립펜슬', '립플럼퍼', '립'],
  mascara: ['마스카라', '래쉬', '속눈썹', 'mascara', 'lash'],
  maskpack: ['마스크', '팩', '시트마스크', '마스크팩', '워시오프', '수면팩', '필오프'],
  cushion: ['쿠션', '파운데이션', '프라이머', 'BB', 'CC', '베이스'],
  eyeshadow: ['아이섀도우', '섀도우', '팔레트', 'eyeshadow'],
  cleanser: ['클렌징', '클렌저', '폼', '오일클렌저', '워터클렌저', '세안'],
  other_beauty: [],
};

/**
 * 제품명에서 서브 카테고리 추론 (보조 기능)
 * 정확한 결과를 위해서는 사용자 선택을 권장
 */
export function detectSubCategoryFromProductName(productName: string): BeautySubCategory {
  const lowerName = productName.toLowerCase();

  for (const [subCategory, keywords] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return subCategory as BeautySubCategory;
      }
    }
  }

  return 'other_beauty';
}

// ============================================
// 표준 섹션 → 서브카테고리 섹션 매핑
// ============================================

type StandardSectionType = 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';

/**
 * 표준 섹션 타입을 서브카테고리별 섹션 타입으로 매핑
 * - 오케스트레이션 서비스의 표준 섹션(MAIN, HERO, FEATURES 등)을
 * - 각 뷰티 서브카테고리의 특화된 섹션으로 변환
 */
const SECTION_TYPE_MAPPING: Record<BeautySubCategory, Record<StandardSectionType, string>> = {
  skincare: {
    MAIN: 'MAIN', // 썸네일 전용 - 매핑 안 함
    HERO: 'HERO_SPLASH',
    FEATURES: 'EFFICACY_VISUAL',
    SOCIAL_PROOF: 'REVIEW_SHOWCASE',
    HOW_TO_USE: 'STEP_GUIDE',
    FAQ: 'SIZE_OPTIONS',
  },
  suncare: {
    MAIN: 'MAIN', // 썸네일 전용 - 매핑 안 함
    HERO: 'HERO_SUNCARE',
    FEATURES: 'KEY_BENEFITS',
    SOCIAL_PROOF: 'UV_PROTECTION_TECH',
    HOW_TO_USE: 'HOW_TO_USE',
    FAQ: 'FREE_SYSTEM',
  },
  lip: {
    MAIN: 'MAIN', // 썸네일 전용 - 매핑 안 함
    HERO: 'HERO_LIP',
    FEATURES: 'TEXTURE_VISUAL',
    SOCIAL_PROOF: 'COLOR_COMPARISON',
    HOW_TO_USE: 'HOW_TO_USE',
    FAQ: 'LONGEVITY_INFO',
  },
  mascara: {
    MAIN: 'MAIN', // 썸네일 전용 - 매핑 안 함
    HERO: 'HERO_MASCARA',
    FEATURES: 'CURL_EFFECT_VISUAL',
    SOCIAL_PROOF: 'EYE_BEFORE_AFTER',
    HOW_TO_USE: 'HOW_TO_USE',
    FAQ: 'WATERPROOF_TEST',
  },
  maskpack: {
    MAIN: 'MAIN', // 썸네일 전용 - 매핑 안 함
    HERO: 'HERO_MASKPACK',
    FEATURES: 'KEY_INGREDIENTS',
    SOCIAL_PROOF: 'BEFORE_AFTER',
    HOW_TO_USE: 'HOW_TO_USE',
    FAQ: 'BULK_PACK',
  },
  // 미구현 카테고리는 표준 섹션 그대로 사용
  cushion: {
    MAIN: 'MAIN',
    HERO: 'HERO',
    FEATURES: 'FEATURES',
    SOCIAL_PROOF: 'SOCIAL_PROOF',
    HOW_TO_USE: 'HOW_TO_USE',
    FAQ: 'FAQ',
  },
  eyeshadow: {
    MAIN: 'MAIN',
    HERO: 'HERO',
    FEATURES: 'FEATURES',
    SOCIAL_PROOF: 'SOCIAL_PROOF',
    HOW_TO_USE: 'HOW_TO_USE',
    FAQ: 'FAQ',
  },
  cleanser: {
    MAIN: 'MAIN',
    HERO: 'HERO',
    FEATURES: 'FEATURES',
    SOCIAL_PROOF: 'SOCIAL_PROOF',
    HOW_TO_USE: 'HOW_TO_USE',
    FAQ: 'FAQ',
  },
  other_beauty: {
    MAIN: 'MAIN',
    HERO: 'HERO',
    FEATURES: 'FEATURES',
    SOCIAL_PROOF: 'SOCIAL_PROOF',
    HOW_TO_USE: 'HOW_TO_USE',
    FAQ: 'FAQ',
  },
};

/**
 * 표준 섹션 타입을 서브카테고리 섹션 타입으로 변환
 */
export function mapStandardSectionToSubcategory(
  standardSection: string,
  subCategory: BeautySubCategory
): string {
  const mapping = SECTION_TYPE_MAPPING[subCategory];
  if (!mapping) return standardSection;

  const mapped = mapping[standardSection as StandardSectionType];
  return mapped || standardSection;
}

// ============================================
// 통합 프롬프트 생성 인터페이스
// ============================================

export interface UnifiedPromptOptions {
  productName: string;
  subCategory: BeautySubCategory;
  keyFeatures: string[];
  brandStyle?: string;
  // 서브 카테고리별 추가 옵션
  skincareOptions?: Partial<SkincareImagePromptOptions>;
  suncareOptions?: Partial<SuncareImagePromptOptions>;
  lipOptions?: Partial<LipImagePromptOptions>;
  mascaraOptions?: Partial<MascaraImagePromptOptions>;
  maskpackOptions?: Partial<MaskPackImagePromptOptions>;
}

/**
 * 통합 이미지 프롬프트 생성
 * 서브 카테고리에 따라 적절한 프롬프트 빌더 호출
 * ★ 표준 섹션(MAIN, HERO 등)을 서브카테고리 섹션으로 자동 매핑
 * ★★★ 이미 서브카테고리 섹션인 경우 매핑 스킵 (동적 섹션 지원)
 */
export function buildUnifiedImagePrompt(
  section: string,
  options: UnifiedPromptOptions,
  blockIndex: number = 0
): string | null {
  const { subCategory, productName, keyFeatures, brandStyle } = options;

  // ★★★ MAIN 섹션은 기본 썸네일 프롬프트 사용 (서브카테고리 프롬프트 아님)
  // orchestration-service의 표준 MAIN 핸들러가 처리하도록 null 반환
  if (section === 'MAIN') {
    console.log(`[BeautySubcategory] MAIN section - using standard thumbnail prompt`);
    return null;
  }

  // ★★★ 이미 서브카테고리 섹션인지 확인 (동적 섹션 지원)
  // getSubCategorySections로 해당 서브카테고리의 섹션 목록 가져와서 확인
  const subcategorySections = getSubCategorySections(subCategory);
  const isAlreadySubcategorySection = subcategorySections.includes(section);

  // 이미 서브카테고리 섹션이면 매핑 스킵, 아니면 매핑
  const mappedSection = isAlreadySubcategorySection
    ? section
    : mapStandardSectionToSubcategory(section, subCategory);

  if (isAlreadySubcategorySection) {
    console.log(`[BeautySubcategory] ★ Direct section (no mapping): ${section} (${subCategory})`);
  } else {
    console.log(`[BeautySubcategory] Mapping section: ${section} → ${mappedSection} (${subCategory})`);
  }

  switch (subCategory) {
    case 'skincare': {
      const skincareOpts: SkincareImagePromptOptions = {
        productName,
        subCategory: options.skincareOptions?.subCategory || 'toner',
        primaryEfficacy: options.skincareOptions?.primaryEfficacy || 'hydrating',
        brandStyle,
        additionalKeywords: keyFeatures,
        ...options.skincareOptions,
      };
      return buildSkincareImagePrompt(
        mappedSection as SkincareDetailSectionType,
        skincareOpts,
        blockIndex
      );
    }

    case 'suncare': {
      const suncareOpts: SuncareImagePromptOptions = {
        productName,
        subCategory: options.suncareOptions?.subCategory || 'sun_cream',
        protectionLevel: options.suncareOptions?.protectionLevel || { spf: 'SPF50+', pa: 'PA++++' },
        primaryFeature: options.suncareOptions?.primaryFeature || 'uv_protection',
        brandStyle,
        additionalKeywords: keyFeatures,
        ...options.suncareOptions,
      };
      return buildSuncareImagePrompt(
        mappedSection as SuncareDetailSectionType,
        suncareOpts,
        blockIndex
      );
    }

    case 'lip': {
      const lipOpts: LipImagePromptOptions = {
        productName,
        subCategory: options.lipOptions?.subCategory || 'lip_gloss',
        finish: options.lipOptions?.finish || 'glossy',
        primaryFeature: options.lipOptions?.primaryFeature || 'glossy',
        brandStyle,
        additionalKeywords: keyFeatures,
        ...options.lipOptions,
      };
      return buildLipImagePrompt(
        mappedSection as LipDetailSectionType,
        lipOpts,
        blockIndex
      );
    }

    case 'mascara': {
      const mascaraOpts: MascaraImagePromptOptions = {
        productName,
        mascaraType: options.mascaraOptions?.mascaraType || 'volume',
        wandType: options.mascaraOptions?.wandType || 'curved',
        primaryFeature: options.mascaraOptions?.primaryFeature || 'volume',
        brandStyle,
        additionalKeywords: keyFeatures,
        ...options.mascaraOptions,
      };
      return buildMascaraImagePrompt(
        mappedSection as MascaraDetailSectionType,
        mascaraOpts,
        blockIndex
      );
    }

    case 'maskpack': {
      const maskpackOpts: MaskPackImagePromptOptions = {
        productName,
        maskType: options.maskpackOptions?.maskType || 'sheet_mask',
        primaryIngredient: options.maskpackOptions?.primaryIngredient || 'hyaluronic',
        primaryFeature: options.maskpackOptions?.primaryFeature || 'hydrating',
        brandStyle,
        additionalKeywords: keyFeatures,
        ...options.maskpackOptions,
      };
      return buildMaskPackImagePrompt(
        mappedSection as MaskPackDetailSectionType,
        maskpackOpts,
        blockIndex
      );
    }

    default:
      // 기타 카테고리는 기존 프롬프트 시스템 사용
      return null;
  }
}

/**
 * 서브 카테고리가 고도화된 프롬프트 시스템을 사용하는지 확인
 */
export function hasAdvancedPromptSystem(subCategory: BeautySubCategory): boolean {
  const meta = BEAUTY_SUBCATEGORY_META.find(m => m.value === subCategory);
  return meta?.isAvailable ?? false;
}

/**
 * 메인 카테고리가 뷰티인지 확인
 */
export function isBeautyCategory(category: string): boolean {
  const beautyKeywords = ['beauty', 'skincare', '뷰티', '스킨케어', 'cosmetic', '화장품'];
  const lowerCategory = category.toLowerCase();
  return beautyKeywords.some(keyword => lowerCategory.includes(keyword));
}

// ============================================
// Export
// ============================================

export {
  // 개별 프롬프트 빌더 (필요시 직접 사용)
  buildSkincareImagePrompt,
  buildSuncareImagePrompt,
  buildLipImagePrompt,
  buildMascaraImagePrompt,
  buildMaskPackImagePrompt,
};
