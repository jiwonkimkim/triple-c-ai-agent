/**
 * 뷰티/스킨케어 서브 카테고리 정의 및 매핑
 * 각 서브 카테고리별 고도화된 프롬프트 시스템 연결
 */

import {
  buildSkincareImagePrompt,
  buildSkincareSectionPrompts,
  type SkincareDetailSectionType,
  type SkincareImagePromptOptions,
  SKINCARE_SECTION_BLOCKS,
} from './skincare-image-prompts';

import {
  buildSuncareImagePrompt,
  buildSuncareSectionPrompts,
  type SuncareDetailSectionType,
  type SuncareImagePromptOptions,
  SUNCARE_SECTION_BLOCKS,
} from './suncare-image-prompts';

import {
  buildLipImagePrompt,
  buildLipSectionPrompts,
  type LipDetailSectionType,
  type LipImagePromptOptions,
  LIP_SECTION_BLOCKS,
} from './lip-image-prompts';

import {
  buildMascaraImagePrompt,
  buildMascaraSectionPrompts,
  type MascaraDetailSectionType,
  type MascaraImagePromptOptions,
  MASCARA_SECTION_BLOCKS,
} from './mascara-image-prompts';

import {
  buildMaskPackImagePrompt,
  buildMaskPackSectionPrompts,
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
  switch (subCategory) {
    case 'skincare':
      return Object.keys(SKINCARE_SECTION_BLOCKS);
    case 'suncare':
      return Object.keys(SUNCARE_SECTION_BLOCKS);
    case 'lip':
      return Object.keys(LIP_SECTION_BLOCKS);
    case 'mascara':
      return Object.keys(MASCARA_SECTION_BLOCKS);
    case 'maskpack':
      return Object.keys(MASKPACK_SECTION_BLOCKS);
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
 */
export function buildUnifiedImagePrompt(
  section: string,
  options: UnifiedPromptOptions,
  blockIndex: number = 0
): string | null {
  const { subCategory, productName, keyFeatures, brandStyle } = options;

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
        section as SkincareDetailSectionType,
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
        section as SuncareDetailSectionType,
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
        section as LipDetailSectionType,
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
        section as MascaraDetailSectionType,
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
        section as MaskPackDetailSectionType,
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
 * 통합 섹션별 프롬프트 목록 생성
 */
export function buildUnifiedSectionPrompts(
  section: string,
  options: UnifiedPromptOptions
): { blockIndex: number; conceptType: string; aspectRatio: string; prompt: string }[] | null {
  const { subCategory, productName, keyFeatures, brandStyle } = options;

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
      return buildSkincareSectionPrompts(section as SkincareDetailSectionType, skincareOpts);
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
      return buildSuncareSectionPrompts(section as SuncareDetailSectionType, suncareOpts);
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
      return buildLipSectionPrompts(section as LipDetailSectionType, lipOpts);
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
      return buildMascaraSectionPrompts(section as MascaraDetailSectionType, mascaraOpts);
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
      return buildMaskPackSectionPrompts(section as MaskPackDetailSectionType, maskpackOpts);
    }

    default:
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
