/**
 * 섹션 프롬프트 빌드 모듈 (공통)
 *
 * 초기 생성과 섹션 재생성에서 동일한 프로세스를 사용하도록 통합
 * 이 모듈을 수정하면 초기 생성/재생성 모두에 자동 적용됨
 */

import {
  autoSelectTheme,
  getVisualTheme,
  getSectionImagePromptByIndex,
  autoSelectPalette,
  getColorPalette,
  buildPaletteHarmonyPrompt,
  generatePageBackgroundMap,
  type ExtendedSectionType,
  type PaletteTheme,
  type VisualTheme,
  type ColorPalette,
} from './prompts';
import {
  generateSectionImagePromptFromText,
  buildFullBrandStylePrompt,
  type SectionImagePrompt,
} from './orchestration-service';
import type { BrandContext } from './prompts';
import type { BeautySubCategory } from './prompts/beauty-subcategory';

// ============================================
// 타입 정의
// ============================================

export interface SectionPromptBuildInput {
  /** 섹션 타입 (MAIN, HERO, FEATURES 등) */
  sectionType: string;
  /** 섹션 인덱스 (0부터 시작) */
  sectionIndex: number;
  /** 제품명 */
  productName: string;
  /** 카테고리 */
  category: string;
  /** 서브카테고리 (뷰티: skincare, lip 등) */
  subCategory?: BeautySubCategory;
  /** 핵심 특징 배열 */
  keyFeatures: string[];
  /** 타겟 고객 */
  targetAudience: string;
  /** 브랜드 컨텍스트 (연결된 브랜드 정보) */
  brandContext?: BrandContext | null;
  /** 섹션 텍스트 내용 (title, body) - 재생성 시 기존 섹션 데이터 */
  sectionText?: {
    title?: string;
    body?: string;
  };
}

export interface SectionPromptBuildResult {
  /** 최종 시나리오 프롬프트 (오케스트레이션 + 팔레트 + 브랜드) */
  enhancedScenarioPrompt: string;
  /** 브랜드 이미지 키워드 (additionalPrompt) */
  additionalPrompt?: string;
  /** 비주얼 테마 */
  visualTheme: VisualTheme;
  /** 색상 팔레트 */
  colorPalette: ColorPalette;
  /** 배경 HEX 색상 */
  backgroundHex: string;
  /** 배경 프롬프트 */
  backgroundPrompt: string;
  /** 팔레트 배경 주입 프롬프트 */
  paletteBackgroundInjection: string;
  /** 브랜드 스타일 프롬프트 */
  brandStylePrompt: string;
  /** 오케스트레이션 프롬프트 (원본) */
  orchestrationPrompt: string;
  /** 인덱스 기반 프롬프트 정보 */
  indexBasedPrompt?: {
    hasIndexedPrompt: boolean;
    conceptType?: string;
    prompt?: string;
  };
  /** 브랜드 폰트 */
  brandFont?: string;
  /** 브랜드 로고 URL */
  brandLogoUrl?: string;
}

// 표준 섹션 타입 목록
const STANDARD_SECTIONS: ExtendedSectionType[] = [
  'MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'
];

// ============================================
// 메인 빌드 함수
// ============================================

/**
 * 섹션 이미지 프롬프트를 빌드합니다.
 * 초기 생성과 재생성 모두 이 함수를 사용하여 동일한 프로세스를 보장합니다.
 *
 * @param input 섹션 프롬프트 빌드 입력
 * @returns 빌드된 프롬프트 및 관련 정보
 */
export async function buildSectionPrompt(
  input: SectionPromptBuildInput
): Promise<SectionPromptBuildResult> {
  const {
    sectionType,
    sectionIndex,
    productName,
    category,
    subCategory,
    keyFeatures,
    targetAudience,
    brandContext,
    sectionText,
  } = input;

  console.log(`[SectionPromptBuilder] ★ Building prompt for ${sectionType} (index: ${sectionIndex})`);

  // ============================================
  // 1. 비주얼 테마 선택
  // ============================================
  const brandTone = brandContext?.toneAndManner;
  const selectedThemeStyle = autoSelectTheme(category, brandTone);
  const visualTheme = getVisualTheme(selectedThemeStyle);
  console.log(`[SectionPromptBuilder] Visual theme: ${visualTheme.name} (${selectedThemeStyle})`);

  // ============================================
  // 2. 팔레트 배경색 시스템
  // ============================================
  const brandPrimaryColor = brandContext?.styleGuide?.colors?.primary;
  const selectedPaletteTheme = autoSelectPalette(
    category,
    brandTone,
    brandPrimaryColor
  ) as PaletteTheme;
  const colorPalette = getColorPalette(selectedPaletteTheme);
  const paletteHarmonyPrompt = buildPaletteHarmonyPrompt(colorPalette);

  // 섹션별 배경색 매핑 생성
  const backgroundMap = generatePageBackgroundMap(STANDARD_SECTIONS, selectedPaletteTheme);

  // 현재 섹션의 배경색 가져오기
  const normalizedSectionType = sectionType.toUpperCase() as ExtendedSectionType;
  const backgroundInfo = backgroundMap.get(normalizedSectionType) || backgroundMap.get('FEATURES');
  const backgroundHex = backgroundInfo?.hex || colorPalette.colors[0]?.hex || '#f5f5f5';
  const backgroundPrompt = backgroundInfo?.prompt || `solid ${colorPalette.name} palette background color (${backgroundHex})`;

  console.log(`[SectionPromptBuilder] Palette: ${colorPalette.name}, Background: ${backgroundHex}`);

  // ============================================
  // 3. 인덱스 기반 프롬프트
  // ============================================
  const indexBasedPromptResult = getSectionImagePromptByIndex(
    normalizedSectionType,
    category,
    sectionIndex,
    productName
  );
  const indexBasedPrompt = indexBasedPromptResult.hasIndexedPrompt
    ? indexBasedPromptResult.prompt
    : undefined;

  if (indexBasedPromptResult.hasIndexedPrompt) {
    console.log(`[SectionPromptBuilder] Index-based prompt: ${indexBasedPromptResult.conceptType}`);
  }

  // ============================================
  // 4. 브랜드 스타일 프롬프트
  // ============================================
  const brandStylePrompt = buildFullBrandStylePrompt(brandContext);
  if (brandStylePrompt) {
    console.log(`[SectionPromptBuilder] Brand style prompt: ${brandStylePrompt.substring(0, 80)}...`);
  }

  // ============================================
  // 5. 오케스트레이션 프롬프트 생성
  // ============================================
  const additionalPrompt = brandContext?.imageKeywords?.join(', ');

  const sectionPrompt = await generateSectionImagePromptFromText(
    {
      type: sectionType,
      title: sectionText?.title || sectionType,
      body: sectionText?.body || '',
    },
    productName,
    category,
    keyFeatures,
    targetAudience,
    additionalPrompt,  // brandStyle
    undefined,         // visualReference (I2I 모드에서는 제품 이미지로 대체)
    visualTheme,
    indexBasedPrompt,
    subCategory,
    sectionIndex
  );

  console.log(`[SectionPromptBuilder] Orchestration prompt: ${sectionPrompt.imagePrompt.substring(0, 100)}...`);

  // ============================================
  // 6. 팔레트 배경색 주입 프롬프트 생성
  // ============================================
  const paletteBackgroundInjection = `

[★ SECTION-SPECIFIC BACKGROUND - ${colorPalette.name} PALETTE]
BACKGROUND FOR THIS SECTION: ${backgroundPrompt}
BACKGROUND HEX: ${backgroundHex}
${paletteHarmonyPrompt}

CRITICAL INSTRUCTION FOR DIVERSE BACKGROUNDS:
- This section MUST use: ${backgroundPrompt}
- DO NOT use the same background as other sections
- Each section in this detail page has a DIFFERENT background color from the ${colorPalette.name} palette
- Maintain visual HARMONY while ensuring VARIETY between sections
- The overall mood should be: ${colorPalette.moodKeywords.join(', ')}
`;

  // ============================================
  // 7. 최종 프롬프트 조합
  // ============================================
  const enhancedScenarioPrompt = sectionPrompt.imagePrompt + paletteBackgroundInjection + (brandStylePrompt ? `\n${brandStylePrompt}` : '');
  console.log(`[SectionPromptBuilder] ★ Final prompt built (palette: ${colorPalette.name}, brand: ${brandContext?.name || 'none'})`);

  return {
    enhancedScenarioPrompt,
    additionalPrompt,
    visualTheme,
    colorPalette,
    backgroundHex,
    backgroundPrompt,
    paletteBackgroundInjection,
    brandStylePrompt,
    orchestrationPrompt: sectionPrompt.imagePrompt,
    indexBasedPrompt: {
      hasIndexedPrompt: indexBasedPromptResult.hasIndexedPrompt,
      conceptType: indexBasedPromptResult.conceptType,
      prompt: indexBasedPrompt,
    },
    brandFont: brandContext?.styleGuide?.fonts?.primary,
    brandLogoUrl: brandContext?.styleGuide?.images?.logo,
  };
}

/**
 * 여러 섹션의 프롬프트를 일괄 빌드합니다.
 * 초기 생성 시 전체 섹션 프롬프트를 한 번에 생성할 때 사용합니다.
 *
 * @param sections 섹션 타입 배열
 * @param baseInput 공통 입력 정보
 * @returns 섹션별 프롬프트 빌드 결과 맵
 */
export async function buildAllSectionPrompts(
  sections: string[],
  baseInput: Omit<SectionPromptBuildInput, 'sectionType' | 'sectionIndex' | 'sectionText'>
): Promise<Map<string, SectionPromptBuildResult>> {
  const results = new Map<string, SectionPromptBuildResult>();

  for (let i = 0; i < sections.length; i++) {
    const sectionType = sections[i];
    const result = await buildSectionPrompt({
      ...baseInput,
      sectionType,
      sectionIndex: i,
    });
    results.set(sectionType, result);
  }

  return results;
}
