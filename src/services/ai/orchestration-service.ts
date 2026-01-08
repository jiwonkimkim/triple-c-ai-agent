/**
 * 상세페이지 생성 오케스트레이션 서비스
 *
 * 메인 감독 역할:
 * 1. 전체 생성 흐름 관리
 * 2. 각 섹션별 개별 이미지 프롬프트 생성
 * 3. 패턴 분석 + 사용자 입력 + OCR 참조 데이터 통합
 *
 * 핵심 원칙:
 * - 이미지에는 텍스트 없이 제품만 생성
 * - 텍스트는 별도로 생성하여 이미지 위에 오버레이
 */

import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import {
  getVisualStyleKeywords,
  mapSectionTypeToPosition,
  SECTION_COMPOSITION_GUIDE,
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  buildOverlayTextPrompt,
  type BlockOverlayOptions,
  // 비주얼 테마 시스템
  autoSelectTheme,
  getVisualTheme,
  // 섹션 템플릿 시스템
  getSectionTemplate,
  mapToExtendedSectionType,
  buildSectionTemplatePrompt,
  // 네거티브 프롬프트
  buildNegativePrompt,
  // 이미지 개수 관련
  COPY_LENGTH_CONFIG,
  getSectionImagePrompt,
  getReferencePrompts, // regenerateSectionImagePrompt에서 사용
  // ★ 섹션별 다양한 배경색 팔레트 시스템
  autoSelectPalette,
  getColorPalette,
  buildPaletteHarmonyPrompt,
  buildCategoryPromptWithPalette,
  generatePageBackgroundMap,
  // ★ 인덱스 기반 이미지 프롬프트 시스템 (NEW!)
  getSectionImagePromptByIndex,
  hasIndexedPrompts,
  // ★★★ 뷰티 서브 카테고리 통합 프롬프트 시스템 (NEW!)
  buildUnifiedImagePrompt,
  hasAdvancedPromptSystem,
  isBeautyCategory,
  getSubCategorySections,  // ★ 서브카테고리별 동적 섹션 목록
  type BeautySubCategory,
  type UnifiedPromptOptions,
  type PaletteTheme,
  type ColorPalette,
  type SectionPosition,
  type OverlayTextContent,
  type ProductVisualReference,
  type VisualTheme,
  type ExtendedSectionType,
  type ImageAnalysisResult,
} from './prompts';

// ============================================
// 타입 정의
// ============================================

export interface BrandContext {
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  ragContext?: string;
}

export interface GenerationInput {
  productImages: string[];
  productName: string;
  category: string;
  subCategory?: BeautySubCategory;  // ★ 뷰티 서브 카테고리 (스킨케어, 선케어, 립, 마스카라, 마스크팩 등)
  keyFeatures: string[];
  targetAudience: string;
  copyLength: 'short' | 'medium' | 'long';
  brandContext?: BrandContext | null;
  generateImages?: boolean;
}

export interface SectionImagePrompt {
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
  position: SectionPosition;
  imagePrompt: string;
  overlayText?: OverlayTextContent;
  compositionGuide: typeof SECTION_COMPOSITION_GUIDE[SectionPosition];
  imageIndex?: number;        // 다중 이미지일 때 인덱스 (0부터 시작)
  totalImagesInSection?: number; // 해당 섹션의 총 이미지 수
  variationHint?: string;     // 이미지 변형 힌트 (예: "shade #21", "step 1")
}

export interface OrchestrationResult {
  hookMessage: string;
  sections: {
    id: string;
    type: string;
    title?: string;
    body: string;
    order: number;
    imagePrompt: SectionImagePrompt;      // 기존 호환성 유지 (첫 번째 이미지)
    imagePrompts?: SectionImagePrompt[];  // 다중 이미지 프롬프트 배열
  }[];
}

// ============================================
// 이미지 개수 계산 유틸리티
// ============================================

/**
 * copyLength와 suggestedImageCount를 기반으로 실제 생성할 이미지 수 계산
 */
function calculateImageCount(
  copyLength: 'short' | 'medium' | 'long',
  suggestedImageCount: number,
  sectionType: string
): number {
  const config = COPY_LENGTH_CONFIG[copyLength];

  // MAIN과 HERO는 항상 1개
  if (sectionType === 'MAIN' || sectionType === 'HERO') {
    return 1;
  }

  // suggestedImageCount에 multiplier 적용
  const calculated = Math.round(suggestedImageCount * config.sectionImageMultiplier);

  // 최소 1개, 섹션당 최대 6개로 제한
  return Math.max(config.minImagesPerSection, Math.min(calculated, 6));
}

/**
 * 전체 이미지 수가 maxTotalImages를 초과하지 않도록 조정
 */
function adjustImageCountsToLimit(
  sectionImageCounts: { sectionType: string; count: number }[],
  copyLength: 'short' | 'medium' | 'long'
): Map<string, number> {
  const config = COPY_LENGTH_CONFIG[copyLength];
  const maxTotal = config.maxTotalImages;

  // 현재 총 이미지 수 계산
  let totalCount = sectionImageCounts.reduce((sum, s) => sum + s.count, 0);

  // 초과하지 않으면 그대로 반환
  if (totalCount <= maxTotal) {
    const result = new Map<string, number>();
    sectionImageCounts.forEach(s => result.set(s.sectionType, s.count));
    return result;
  }

  // 초과하면 비례 축소 (HERO는 제외하고)
  const heroCount = sectionImageCounts.find(s => s.sectionType === 'HERO')?.count || 1;
  const otherSections = sectionImageCounts.filter(s => s.sectionType !== 'HERO');
  const remainingBudget = maxTotal - heroCount;
  const otherTotal = otherSections.reduce((sum, s) => sum + s.count, 0);

  const result = new Map<string, number>();
  result.set('HERO', heroCount);

  if (otherTotal > 0) {
    const ratio = remainingBudget / otherTotal;
    otherSections.forEach(s => {
      const adjusted = Math.max(1, Math.round(s.count * ratio));
      result.set(s.sectionType, adjusted);
    });
  }

  return result;
}

/**
 * 다중 이미지 생성 시 변형 힌트 생성
 * - 카테고리와 섹션 타입에 따라 적절한 힌트 제공
 */
function generateVariationHint(
  sectionType: string,
  index: number,
  totalCount: number,
  category: string,
  _overlayTextGuide?: string // 향후 사용 예정
): string {
  // 카테고리별 특화 힌트
  const categoryLower = category.toLowerCase();

  // 쿠션/파운데이션 - 호수별 발색
  if (sectionType === 'FEATURES' && (categoryLower.includes('쿠션') || categoryLower.includes('파운데이션'))) {
    const shades = ['#13 아이보리', '#17 라이트베이지', '#21 내추럴베이지', '#23 미디엄베이지', '#25 웜베이지'];
    return shades[index] || `shade variation ${index + 1}`;
  }

  // 립 제품 - 컬러 바리에이션
  if (sectionType === 'FEATURES' && (categoryLower.includes('립') || categoryLower.includes('틴트'))) {
    const colors = ['코랄', '로즈', '레드', '누드', '피치', '버건디'];
    return colors[index] || `color ${index + 1}`;
  }

  // HOW_TO_USE - 사용 순서
  if (sectionType === 'HOW_TO_USE') {
    return `step ${index + 1} of ${totalCount}`;
  }

  // SOCIAL_PROOF - 후기 유형
  if (sectionType === 'SOCIAL_PROOF') {
    const proofTypes = ['before-after', 'real review', 'texture close-up', 'daily use'];
    return proofTypes[index] || `proof ${index + 1}`;
  }

  // 기본 변형
  return `variation ${index + 1} of ${totalCount}`;
}

// ============================================
// AI 클라이언트 초기화
// ============================================

const isPlaceholder = (key: string | undefined) =>
  !key || key.includes('your-') || key.includes('placeholder') || key.length < 20;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (isPlaceholder(apiKey)) return null;
  return new GoogleGenAI({ apiKey: apiKey! });
}

// ============================================
// 섹션별 이미지 프롬프트 생성기
// ============================================

export async function generateSectionImagePrompt(
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  brandStyle?: string,
  visualReference?: ProductVisualReference,
  visualTheme?: VisualTheme
): Promise<SectionImagePrompt> {
  const position = mapSectionTypeToPosition(sectionType);
  const visualKeywords = getVisualStyleKeywords(category);
  const compositionGuide = SECTION_COMPOSITION_GUIDE[position];

  // 텍스트 없는 이미지 프롬프트 생성
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  // 제품 일관성 지시문 (모든 섹션에서 동일한 제품 표시)
  const productConsistencyPrefix = `[CRITICAL - PRODUCT CONSISTENCY: The exact same "${productName}" must appear identically in all images with consistent design, shape, color, texture and packaging]`;

  // 섹션 템플릿 기반 프롬프트 - 직접 사용! (AI 재생성 없이)
  const extendedSectionType = mapToExtendedSectionType(sectionType);
  const sectionTemplate = getSectionTemplate(extendedSectionType);
  const baseTemplatePrompt = buildSectionTemplatePrompt(
    sectionTemplate,
    productName,
    visualTheme?.backgroundColors.gradient || 'clean gradient',
    keyFeatures[0]
  );

  // 네거티브 프롬프트
  const negativePrompt = buildNegativePrompt(['quality', 'style', 'content', 'composition'], category);

  // 비주얼 테마 지시문
  const themePrefix = visualTheme
    ? `[VISUAL THEME: ${visualTheme.consistencyPrompt}] [BACKGROUND: ${visualTheme.backgroundColors.gradient || visualTheme.backgroundColors.primary}] [LIGHTING: ${visualTheme.lighting.style}]`
    : '[VISUAL THEME: clean minimal style with soft neutral background]';

  // 제품 외형 참조
  const productAppearance = visualReference?.appearance
    ? `[PRODUCT APPEARANCE: ${visualReference.appearance}]`
    : '';
  const productColors = visualReference?.colorScheme
    ? `[COLOR SCHEME: ${visualReference.colorScheme}]`
    : '';

  // 품질 키워드
  const qualityKeywords = '8K resolution, photorealistic, professional commercial photography, high-end advertising quality, sharp focus, premium product visualization';
  const styleKeywords = visualKeywords.slice(0, 4).join(', ');

  let imagePrompt: string;

  // ===== 새로운 접근법: 템플릿 직접 사용 + AI는 오브제/분위기만 생성 =====

  // 1. AI로 제품명 기반 오브제/분위기 생성 (또는 규칙 기반 폴백)
  const brandTone = brandStyle?.includes('luxury') ? 'luxury'
    : brandStyle?.includes('natural') ? 'natural'
    : brandStyle?.includes('clean') ? 'clean'
    : brandStyle?.includes('trendy') ? 'trendy'
    : brandStyle?.includes('derma') ? 'derma'
    : undefined;

  const enhancements = await generateDecorativeEnhancements(productName, category, brandTone);
  console.log(`[Orchestration] Decorative enhancements for ${sectionType}:`, enhancements);

  // 2. 템플릿 + 오브제 + 테마 조합
  const decorativeObjectsClause = `[DECORATIVE ELEMENTS: ${enhancements.ingredientObjects}, ${enhancements.moodObjects}]`;
  const moodClause = `[MOOD: ${enhancements.moodKeywords}]`;

  // 3. 최종 프롬프트 조합 (템플릿 직접 사용!)
  // 구조: [일관성] [테마] [제품외형] [템플릿(핵심!)] [오브제] [분위기] [품질] --negative [제외]
  imagePrompt = [
    productConsistencyPrefix,
    themePrefix,
    productAppearance,
    productColors,
    baseTemplatePrompt,  // 섹션 템플릿 프롬프트 직접 사용!
    decorativeObjectsClause,
    moodClause,
    styleKeywords,
    qualityKeywords,
    noTextInstruction,
    `--negative ${negativePrompt}`
  ].filter(Boolean).join(', ');

  console.log(`[Orchestration] Generated prompt for ${sectionType} using DIRECT TEMPLATE approach`);

  return {
    sectionType,
    position,
    imagePrompt,
    compositionGuide,
  };
}

// 제품 일관성 지시문 생성 헬퍼
function buildProductConsistencyText(
  productName: string,
  _category: string,
  visualReference?: ProductVisualReference
): string {
  let instruction = `모든 섹션 이미지에서 "${productName}" 제품이 동일하게 표시되어야 합니다.
제품의 디자인, 색상, 형태, 패키지가 섹션마다 달라지면 안 됩니다.
마치 같은 제품을 다른 각도와 상황에서 촬영한 것처럼 일관성을 유지해야 합니다.`;

  if (visualReference) {
    if (visualReference.appearance) {
      instruction += `\n- 제품 외형: ${visualReference.appearance}`;
    }
    if (visualReference.colorScheme) {
      instruction += `\n- 색상: ${visualReference.colorScheme}`;
    }
    if (visualReference.packageShape) {
      instruction += `\n- 패키지 형태: ${visualReference.packageShape}`;
    }
  }

  return instruction;
}

// ============================================
// 오브제/분위기 생성기 (AI 보조)
// AI는 전체 프롬프트가 아닌 추가 요소만 생성
// ============================================

interface DecorativeEnhancements {
  ingredientObjects: string;  // 제품명 기반 재료 오브제
  moodObjects: string;        // 분위기 오브제
  moodKeywords: string;       // 분위기 키워드
}

/**
 * 제품명과 카테고리를 분석하여 오브제/분위기 요소만 생성
 * 전체 프롬프트 재생성 없이 보조 요소만 AI가 추천
 */
async function generateDecorativeEnhancements(
  productName: string,
  category: string,
  brandTone?: string
): Promise<DecorativeEnhancements> {
  const gemini = getGeminiClient();

  // AI가 없으면 규칙 기반으로 생성
  if (!gemini) {
    return generateRuleBasedEnhancements(productName, category, brandTone);
  }

  const prompt = `제품명 "${productName}" (카테고리: ${category})을 분석하여 이미지에 추가할 오브제와 분위기 요소를 추천해주세요.
${brandTone ? `브랜드 톤: ${brandTone}` : ''}

다음 JSON 형식으로만 응답하세요:
{
  "ingredientObjects": "제품 성분/재료 관련 오브제 (영어, 2-3개, 예: fresh rose petals, honey drip)",
  "moodObjects": "분위기 오브제 (영어, 1-2개, 예: soft silk fabric, water droplets)",
  "moodKeywords": "분위기 키워드 (영어, 3-4개, 예: romantic, feminine, luxurious)"
}

규칙:
- 제품명에서 성분을 추출하여 관련 오브제 추천 (예: 로즈→장미꽃잎, 허니→꿀)
- 브랜드 톤에 맞는 분위기 오브제 추천
- 반드시 영어로 작성
- JSON만 반환`;

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

    const result = JSON.parse(jsonStr) as DecorativeEnhancements;
    console.log('[Orchestration] AI generated decorative enhancements:', result);
    return result;
  } catch (error) {
    console.error('[Orchestration] Failed to generate decorative enhancements, using fallback:', error);
    return generateRuleBasedEnhancements(productName, category, brandTone);
  }
}

/**
 * 규칙 기반 오브제/분위기 생성 (AI 없을 때 폴백)
 */
function generateRuleBasedEnhancements(
  productName: string,
  category: string,
  brandTone?: string
): DecorativeEnhancements {
  // 제품명에서 성분 키워드 추출
  const ingredientMap: Record<string, string> = {
    '로즈': 'fresh rose petals, pink rose buds',
    'rose': 'fresh rose petals, pink rose buds',
    '장미': 'fresh rose petals, pink rose buds',
    '베리': 'fresh berries (strawberry, raspberry)',
    'berry': 'fresh berries (strawberry, raspberry)',
    '허니': 'golden honey drip, honeycomb',
    'honey': 'golden honey drip, honeycomb',
    '꿀': 'golden honey drip, honeycomb',
    '그린티': 'fresh green tea leaves',
    'green tea': 'fresh green tea leaves',
    '녹차': 'fresh green tea leaves',
    '시트러스': 'citrus slices with water droplets',
    'citrus': 'citrus slices with water droplets',
    '레몬': 'fresh lemon slices',
    '오렌지': 'orange slices with zest',
    '라벤더': 'lavender sprigs',
    'lavender': 'lavender sprigs',
    '민트': 'fresh mint leaves',
    'mint': 'fresh mint leaves',
    '알로에': 'aloe vera gel, fresh aloe leaves',
    'aloe': 'aloe vera gel, fresh aloe leaves',
    '진주': 'pearl beads, iridescent pearls',
    'pearl': 'pearl beads, iridescent pearls',
    '골드': 'gold leaf flakes, golden accents',
    'gold': 'gold leaf flakes, golden accents',
    '히알루론': 'crystal clear water droplets, hydrating gel texture',
    '세라마이드': 'smooth creamy texture, barrier visualization',
    '비타민': 'citrus elements, bright fresh ingredients',
    '콜라겐': 'bouncy gel texture, plump skin visualization',
  };

  // 브랜드 톤에 따른 분위기 오브제
  const moodMap: Record<string, { objects: string; keywords: string }> = {
    luxury: { objects: 'velvet fabric, crystal accents, gold elements', keywords: 'luxurious, sophisticated, premium, elegant' },
    clean: { objects: 'white pebbles, geometric shapes, minimal props', keywords: 'clean, minimal, pure, simple' },
    natural: { objects: 'wooden elements, green leaves, natural textures', keywords: 'natural, organic, fresh, earthy' },
    trendy: { objects: 'holographic elements, bold colors, modern props', keywords: 'trendy, youthful, bold, dynamic' },
    derma: { objects: 'clinical white surface, scientific elements', keywords: 'clinical, professional, trustworthy, scientific' },
  };

  // 제품명에서 성분 찾기
  let ingredientObjects = '';
  const productLower = productName.toLowerCase();
  for (const [key, value] of Object.entries(ingredientMap)) {
    if (productLower.includes(key.toLowerCase())) {
      ingredientObjects = value;
      break;
    }
  }

  // 성분을 못 찾으면 카테고리 기반 기본값
  if (!ingredientObjects) {
    const categoryDefaults: Record<string, string> = {
      '스킨케어': 'water droplets, botanical elements',
      '에센스': 'serum drops, glass texture',
      '크림': 'creamy swirl texture, soft elements',
      '토너': 'water splash, fresh droplets',
      '선케어': 'sunlight rays, summer elements',
      '립': 'glossy texture, color pigments',
      '쿠션': 'soft puff, cushion texture',
      '메이크업': 'makeup brushes, color palette',
    };
    ingredientObjects = categoryDefaults[category] || 'premium cosmetic elements';
  }

  // 브랜드 톤에 따른 분위기
  const mood = moodMap[brandTone || 'clean'] || moodMap.clean;

  return {
    ingredientObjects,
    moodObjects: mood.objects,
    moodKeywords: mood.keywords,
  };
}

// ============================================
// 카테고리별 동적 오브제 선택 시스템
// ============================================

interface DecorativeObjectSet {
  primary: string[];      // 주요 오브제 (2-3개 선택)
  secondary: string[];    // 보조 오브제 (1-2개 선택)
  base: string[];         // 베이스/플랫폼 (1개 선택)
  effects: string[];      // 조명/효과 (1개 선택)
}

const CATEGORY_DECORATIVE_OBJECTS: Record<string, DecorativeObjectSet> = {
  // 뷰티/화장품
  beauty: {
    primary: [
      'fresh rose petals scattered artfully',
      'delicate peony blooms',
      'cherry blossom branches',
      'orchid flowers',
      'dried lavender sprigs',
      'eucalyptus leaves',
      'small seashells',
      'crystal clusters',
      'pearl beads scattered',
    ],
    secondary: [
      'silk fabric draping in soft blush tones',
      'velvet ribbon curling elegantly',
      'sheer organza fabric flowing',
      'satin cloth with gentle folds',
      'tulle fabric wisps',
    ],
    base: [
      'polished marble slab',
      'rose gold metallic tray',
      'frosted glass platform',
      'white ceramic pedestal',
      'acrylic display block',
      'natural stone surface',
    ],
    effects: [
      'crystal prism creating rainbow light refraction',
      'water droplets glistening on surface',
      'soft bokeh light orbs in background',
      'golden hour warm lighting',
      'mirror reflection beneath',
    ],
  },
  // 스킨케어
  skincare: {
    primary: [
      'fresh aloe vera slices',
      'cucumber slices with water droplets',
      'honey dripping from honeycomb',
      'green tea leaves',
      'citrus fruit slices (lemon/orange)',
      'fresh mint leaves',
      'chamomile flowers',
      'rice grains scattered',
      'vitamin C oranges',
    ],
    secondary: [
      'water splash frozen in motion',
      'ice cubes melting',
      'clear gel texture swirls',
      'bubbles floating',
      'morning dew droplets',
    ],
    base: [
      'wet stone surface',
      'bamboo mat',
      'leaf-shaped ceramic plate',
      'natural wood slice',
      'smooth river stones',
      'glass shelf with water underneath',
    ],
    effects: [
      'water ripples reflecting light',
      'misty spa atmosphere',
      'soft diffused natural light',
      'clean clinical lighting',
      'fresh morning sunlight through window',
    ],
  },
  // 패션/의류
  fashion: {
    primary: [
      'vintage sunglasses',
      'luxury watch',
      'designer jewelry pieces',
      'leather accessories',
      'silk scarf draped',
      'fashion magazine pages',
      'elegant perfume bottle',
      'designer handbag corner',
    ],
    secondary: [
      'cashmere fabric texture',
      'tweed material swatch',
      'leather texture sample',
      'denim fabric fold',
      'linen cloth wrinkled naturally',
    ],
    base: [
      'marble countertop',
      'vintage wooden trunk',
      'brass tray',
      'velvet display cushion',
      'fashion runway floor texture',
      'boutique shelf',
    ],
    effects: [
      'studio spotlight creating dramatic shadows',
      'window light with venetian blind shadows',
      'golden hour warmth',
      'high fashion editorial lighting',
      'backstage mirror lights',
    ],
  },
  // 음식/식품
  food: {
    primary: [
      'fresh herbs (basil, rosemary, thyme)',
      'seasonal fruits arrangement',
      'artisan bread slices',
      'honey jar with dipper',
      'spice powder sprinkled',
      'nuts and seeds scattered',
      'fresh vegetables',
      'cheese wedge',
      'olive oil drizzle',
    ],
    secondary: [
      'linen napkin folded',
      'burlap cloth texture',
      'woven basket edge',
      'kitchen towel striped',
      'parchment paper crinkled',
    ],
    base: [
      'rustic wooden cutting board',
      'marble pastry slab',
      'vintage ceramic plate',
      'cast iron skillet edge',
      'butcher block surface',
      'slate serving board',
    ],
    effects: [
      'steam rising naturally',
      'morning kitchen sunlight',
      'warm bistro lighting',
      'food photography top-down light',
      'cozy ambient glow',
    ],
  },
  // 테크/전자기기
  tech: {
    primary: [
      'geometric metal shapes',
      'glass spheres',
      'minimal concrete blocks',
      'aluminum cubes',
      'chrome rings',
      'abstract metal sculptures',
      'LED light strips (off)',
      'wireless earbuds case',
    ],
    secondary: [
      'carbon fiber texture sample',
      'brushed aluminum sheet',
      'matte black fabric',
      'mesh material',
      'premium leather edge',
    ],
    base: [
      'matte black surface',
      'brushed steel platform',
      'tempered glass desk',
      'concrete slab',
      'dark wood desk surface',
      'white minimalist shelf',
    ],
    effects: [
      'neon accent glow',
      'clean white studio light',
      'blue tech ambient light',
      'dramatic side lighting',
      'futuristic gradient background',
    ],
  },
  // 건강/웰니스
  wellness: {
    primary: [
      'zen stacking stones',
      'yoga mat rolled edge',
      'meditation singing bowl',
      'natural crystals (amethyst, quartz)',
      'dried sage bundle',
      'essential oil bottles',
      'bamboo elements',
      'incense stick (unlit)',
    ],
    secondary: [
      'organic cotton towel',
      'natural hemp rope',
      'cork material',
      'recycled paper texture',
      'woven seagrass mat',
    ],
    base: [
      'natural teak wood surface',
      'smooth river stone slab',
      'woven jute mat',
      'bamboo platform',
      'recycled wood plank',
      'natural slate',
    ],
    effects: [
      'soft morning zen light',
      'candle glow warmth',
      'natural sunlight through plants',
      'peaceful spa atmosphere',
      'serene minimalist lighting',
    ],
  },
  // 주방/홈
  home: {
    primary: [
      'fresh flowers in vase',
      'candles (unlit)',
      'coffee beans scattered',
      'houseplant leaves',
      'books stacked',
      'ceramic pottery',
      'woven basket',
      'vintage clock',
    ],
    secondary: [
      'cotton throw blanket',
      'linen curtain edge',
      'knit texture',
      'natural cotton fabric',
      'soft wool material',
    ],
    base: [
      'oak wood table surface',
      'white marble countertop',
      'natural stone tile',
      'vintage wooden tray',
      'rattan placemat',
      'terrazzo surface',
    ],
    effects: [
      'cozy window light',
      'warm living room ambiance',
      'soft afternoon sunlight',
      'hygge candlelit mood',
      'clean scandinavian light',
    ],
  },
  // 기본 (매칭 안될 때)
  default: {
    primary: [
      'elegant flower petals',
      'natural botanical elements',
      'crystal accents',
      'minimalist geometric shapes',
      'natural textures',
      'premium material samples',
    ],
    secondary: [
      'soft fabric draping',
      'natural fiber texture',
      'premium material edge',
      'subtle color accent',
    ],
    base: [
      'marble surface',
      'natural wood platform',
      'premium display stand',
      'elegant stone slab',
      'glass shelf',
    ],
    effects: [
      'soft studio lighting',
      'natural window light',
      'elegant highlight effects',
      'professional product lighting',
    ],
  },
};

/**
 * 카테고리에 맞는 오브제 세트 선택
 */
function getCategoryDecorativeObjects(category: string): DecorativeObjectSet {
  const lowerCategory = category.toLowerCase();

  // 카테고리 매칭
  if (lowerCategory.includes('화장품') || lowerCategory.includes('뷰티') ||
      lowerCategory.includes('메이크업') || lowerCategory.includes('립') ||
      lowerCategory.includes('cosmetic') || lowerCategory.includes('beauty') ||
      lowerCategory.includes('makeup')) {
    return CATEGORY_DECORATIVE_OBJECTS.beauty;
  }
  if (lowerCategory.includes('스킨케어') || lowerCategory.includes('피부') ||
      lowerCategory.includes('세럼') || lowerCategory.includes('크림') ||
      lowerCategory.includes('skincare') || lowerCategory.includes('serum')) {
    return CATEGORY_DECORATIVE_OBJECTS.skincare;
  }
  if (lowerCategory.includes('패션') || lowerCategory.includes('의류') ||
      lowerCategory.includes('옷') || lowerCategory.includes('가방') ||
      lowerCategory.includes('fashion') || lowerCategory.includes('clothing')) {
    return CATEGORY_DECORATIVE_OBJECTS.fashion;
  }
  if (lowerCategory.includes('음식') || lowerCategory.includes('식품') ||
      lowerCategory.includes('푸드') || lowerCategory.includes('요리') ||
      lowerCategory.includes('food') || lowerCategory.includes('beverage')) {
    return CATEGORY_DECORATIVE_OBJECTS.food;
  }
  if (lowerCategory.includes('전자') || lowerCategory.includes('테크') ||
      lowerCategory.includes('기기') || lowerCategory.includes('디지털') ||
      lowerCategory.includes('tech') || lowerCategory.includes('electronic')) {
    return CATEGORY_DECORATIVE_OBJECTS.tech;
  }
  if (lowerCategory.includes('건강') || lowerCategory.includes('웰니스') ||
      lowerCategory.includes('헬스') || lowerCategory.includes('영양') ||
      lowerCategory.includes('wellness') || lowerCategory.includes('health')) {
    return CATEGORY_DECORATIVE_OBJECTS.wellness;
  }
  if (lowerCategory.includes('홈') || lowerCategory.includes('주방') ||
      lowerCategory.includes('인테리어') || lowerCategory.includes('리빙') ||
      lowerCategory.includes('home') || lowerCategory.includes('kitchen')) {
    return CATEGORY_DECORATIVE_OBJECTS.home;
  }

  return CATEGORY_DECORATIVE_OBJECTS.default;
}

/**
 * 랜덤하게 오브제 선택 (매번 다른 조합)
 */
function selectRandomObjects(objects: DecorativeObjectSet): string {
  const shuffle = <T>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);

  // 각 카테고리에서 랜덤 선택
  const primarySelected = shuffle([...objects.primary]).slice(0, 2 + Math.floor(Math.random() * 2)); // 2-3개
  const secondarySelected = shuffle([...objects.secondary]).slice(0, 1 + Math.floor(Math.random() * 2)); // 1-2개
  const baseSelected = shuffle([...objects.base])[0]; // 1개
  const effectSelected = shuffle([...objects.effects])[0]; // 1개

  return `[DECORATIVE OBJECTS - dynamically selected for ${objects === CATEGORY_DECORATIVE_OBJECTS.default ? 'general' : 'category'} styling:
    PRIMARY PROPS (subtle, small scale): ${primarySelected.join(', ')},
    SUPPORTING ELEMENTS: ${secondarySelected.join(', ')},
    BASE/PLATFORM: ${baseSelected},
    LIGHTING EFFECT: ${effectSelected}]`;
}

/**
 * MAIN 섹션용 동적 오브제 프롬프트 생성 (카테고리 기반 폴백)
 */
function buildDynamicDecorativePrompt(category: string): string {
  const objects = getCategoryDecorativeObjects(category);
  return selectRandomObjects(objects);
}

/**
 * AI 기반 맞춤 오브제 제안 (제품 정보 기반)
 * - 제품명, 특징, 브랜드 스타일, 타겟 고객 등을 분석하여 최적의 오브제 조합 생성
 */
async function generateAIDecorativeObjects(
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  brandStyle?: string,
  visualReference?: ProductVisualReference
): Promise<string> {
  const gemini = getGeminiClient();

  if (!gemini) {
    // AI 없으면 카테고리 기반 폴백
    return buildDynamicDecorativePrompt(category);
  }

  const prompt = `당신은 프리미엄 상품 사진 스타일리스트입니다.
제품 정보를 분석하여 이 제품의 썸네일 이미지에 어울리는 고급스러운 장식 오브제를 제안해주세요.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
- 타겟 고객: ${targetAudience}
${brandStyle ? `- 브랜드 스타일: ${brandStyle}` : ''}
${visualReference?.colorScheme ? `- 제품 색상: ${visualReference.colorScheme}` : ''}

## 중요 규칙
1. 제품이 주인공! 오브제는 작고 미묘하게 배치
2. 제품의 특징/컬러/분위기와 조화로운 오브제 선택
3. 구매 욕구를 자극하는 감각적인 스타일링
4. 고급스럽고 세련된 잡지 화보 느낌

## 제안 형식 (JSON)
{
  "concept": "전체 컨셉 (예: 로맨틱 로즈가든, 미니멀 럭셔리, 내추럴 보타닉 등)",
  "primary_objects": ["메인 오브제 2-3개 - 작은 스케일로"],
  "secondary_elements": ["보조 소품 1-2개"],
  "base_surface": "베이스/플랫폼 1개",
  "lighting_mood": "조명/분위기 효과"
}

JSON만 반환하세요. 영어로 작성하세요.`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const suggestion = JSON.parse(jsonStr);

    console.log(`[Orchestration] AI suggested decorative objects for "${productName}":`, suggestion);

    return `[DECORATIVE OBJECTS - AI-curated for "${productName}" (${suggestion.concept}):
    PRIMARY PROPS (subtle, small scale): ${suggestion.primary_objects.join(', ')},
    SUPPORTING ELEMENTS: ${suggestion.secondary_elements.join(', ')},
    BASE/PLATFORM: ${suggestion.base_surface},
    LIGHTING EFFECT: ${suggestion.lighting_mood}]`;
  } catch (error) {
    console.error('[Orchestration] Failed to generate AI decorative objects, using fallback:', error);
    return buildDynamicDecorativePrompt(category);
  }
}

// 폴백 이미지 프롬프트 생성 (AI 없을 때) - Gemini Imagen 최적화
function buildFallbackImagePrompt(
  sectionType: string,
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle: string | undefined,
  _position: SectionPosition,
  visualKeywords: string[],
  visualReference?: ProductVisualReference,
  visualTheme?: VisualTheme
): string {
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, no logos, text-free commercial photography only';
  const qualityKeywords = '8K resolution, photorealistic, professional commercial photography, high-end advertising quality, sharp focus, premium product visualization';
  const styleKeywords = visualKeywords.slice(0, 4).join(', ');
  const brandAddition = brandStyle ? `, brand aesthetic: ${brandStyle}` : '';

  // 제품 일관성 지시문
  const consistencyPrefix = `[CRITICAL - PRODUCT CONSISTENCY: The exact same "${productName}" must appear identically in all images with consistent design, shape, color, texture and packaging throughout the entire product detail page]`;

  // 비주얼 테마 지시문
  const themePrefix = visualTheme
    ? `[VISUAL THEME: ${visualTheme.consistencyPrompt}] [BACKGROUND: ${visualTheme.backgroundColors.gradient || visualTheme.backgroundColors.primary}] [LIGHTING: ${visualTheme.lighting.style}]`
    : '[VISUAL THEME: clean minimal style with soft neutral background]';

  // 제품 외형 참조 (있으면 사용)
  const productDesc = visualReference?.appearance
    ? `${productName} (${visualReference.appearance})`
    : productName;

  const colorNote = visualReference?.colorScheme
    ? `, product color scheme: ${visualReference.colorScheme}`
    : '';

  const packageNote = visualReference?.packageShape
    ? `, package design: ${visualReference.packageShape}`
    : '';

  // 테마 무드 키워드
  const themeMood = visualTheme ? visualTheme.moodKeywords.slice(0, 3).join(', ') : 'modern, clean, professional';

  // 제품명 기반 맞춤 오브제 + 분위기 오브제 지시
  const productSpecificObjects = `[THUMBNAIL STYLING for "${productName}"]

[1. INGREDIENT OBJECTS - 실제 재료 오브제 (15-20%, base/front)]
Analyze product name and add REAL ingredients:
- "로즈/rose/장미" → fresh roses, rose petals
- "베리/berry" → fresh berries (strawberry, raspberry, blueberry)
- "허니/honey/꿀" → golden honey drip, honeycomb
- "그린티/녹차" → fresh green tea leaves
- "시트러스/레몬/오렌지" → citrus slices with water droplets
- "라벤더/lavender" → lavender sprigs
- "민트/mint" → fresh mint leaves
- "코코넛/coconut" → coconut pieces
- "아보카도/avocado" → avocado slices
- "알로에/aloe" → aloe vera gel/leaves
- "진주/pearl" → pearl beads
- "골드/gold" → gold flakes
- Otherwise → ${category} relevant ingredients

[2. MOOD OBJECTS - 분위기 오브제 (10-15%, background/sides)]
Add 1-2 mood elements matching product vibe:
- Romantic/Feminine: soft silk, dried flowers, ribbon
- Fresh/Natural: water droplets, green leaves, dew
- Luxurious: velvet, crystal, metallic accents
- Clean/Minimal: white stones, geometric shapes
- Warm/Cozy: warm fabric, natural wood
- Refreshing: ice, water splash`;

  const basePrompts: Record<string, string> = {
    // MAIN: 제품명 맞춤 썸네일 - 제품이 돋보이고 관련 오브제로 스타일링
    MAIN: `${consistencyPrefix} ${themePrefix} Stunning product photography of ${productDesc}, [CRITICAL: ${category} product must be THE DOMINANT HERO - largest element taking 50-60% of frame, centered or slightly off-center, sharp focus with product details clearly visible], ${productSpecificObjects}, [HIERARCHY: Product = 100% focus, Objects = subtle supporting role], clean gradient or textured background matching product colors, professional studio lighting emphasizing product, high-end product photography that makes viewers want to purchase, aspirational mood, space for slogan text at top 20% area, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    HERO: `${consistencyPrefix} ${themePrefix} Ultra-premium product photography of ${productDesc}, elegant ${category} product hero shot, perfectly centered composition with rule of thirds, space for text overlay at top and bottom, sophisticated gradient background (${visualTheme?.backgroundColors.gradient || 'soft white to subtle warm tones'}), professional studio softbox lighting with gentle rim light creating elegant product silhouette, subtle surface reflection on glossy base, luxury beauty advertisement aesthetic, premium cosmetic brand campaign quality, ${themeMood}, high-end minimalist design${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    FEATURES: `${consistencyPrefix} ${themePrefix} The IDENTICAL ${productDesc} from HERO section showcased with key ingredient visualization for ${category}, featuring ${keyFeatures[0] || 'natural premium ingredients'}, same exact product displayed at slight angle alongside fresh botanical elements with crystal-clear water droplets, detailed macro photography with shallow depth of field, space for feature icons and text, clean minimalist background with soft gradient, natural window-style soft lighting with catchlights, scientific yet elegant aesthetic conveying innovation and quality, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    SOCIAL_PROOF: `${consistencyPrefix} ${themePrefix} The SAME ${productDesc} from previous sections presented with before-after skin texture comparison for ${category}, professional split-screen composition showing clear improvement, identical product prominently visible in frame, space for statistics and percentage badges, even diffused studio lighting for accurate skin tone representation, clinical dermatology results visualization, medical-grade professional photography style, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    HOW_TO_USE: `${consistencyPrefix} ${themePrefix} Step-by-step beauty application tutorial featuring the EXACT SAME ${productDesc} from previous sections, elegant model hand gently applying the IDENTICAL ${category} product with proper technique demonstration, clear instructional composition with clean negative space, space for numbered steps and guide text, bright even lighting with soft shadows, professional how-to tutorial photography style, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,

    FAQ: `${consistencyPrefix} ${themePrefix} The SAME ${productDesc} as hero item elegantly displayed in ${category} product collection showcase, complete brand lineup arranged in harmonious composition with IDENTICAL main product as focal point, space for Q&A text and product information table, products arranged with precise symmetry on premium surface, sophisticated gradient background, professional studio lighting with accent highlights, luxury brand portfolio presentation, ${themeMood}${colorNote}${packageNote}, ${styleKeywords}${brandAddition}, ${qualityKeywords}, ${noTextInstruction}`,
  };

  return basePrompts[sectionType] || basePrompts['FEATURES'];
}

// ============================================
// 텍스트 기반 이미지 프롬프트 생성기 (스토리 → 이미지)
// ============================================

interface SectionTextContent {
  type: string;
  title?: string;
  body: string;
}

interface ExtractedKeyMessages {
  mainMessage: string;        // 핵심 메시지 (예: "72시간 보습")
  emotionalTone: string;      // 감성 톤 (예: "신뢰감", "프리미엄", "자연친화적")
  visualKeywords: string[];   // 시각화할 키워드 (예: ["물방울", "촉촉한", "윤기"])
  targetScene: string;        // 연출 장면 (예: "스파 분위기", "클리니컬", "일상")
}

/**
 * 섹션 텍스트에서 핵심 메시지와 시각화 키워드 추출
 */
async function extractKeyMessagesFromText(
  sectionText: SectionTextContent,
  productName: string,
  category: string,
  brandTone?: string
): Promise<ExtractedKeyMessages> {
  const gemini = getGeminiClient();

  // 기본값 (AI 없을 때)
  const defaultMessages: ExtractedKeyMessages = {
    mainMessage: sectionText.title || productName,
    emotionalTone: 'professional, trustworthy',
    visualKeywords: ['clean', 'premium', 'elegant'],
    targetScene: 'professional studio setting',
  };

  if (!gemini) {
    return defaultMessages;
  }

  const prompt = `텍스트를 분석하여 이미지로 표현할 핵심 요소를 추출하세요.

## 섹션 텍스트
- 타입: ${sectionText.type}
- 제목: ${sectionText.title || '없음'}
- 본문: ${sectionText.body}

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
${brandTone ? `- 브랜드 톤: ${brandTone}` : ''}

## 추출 요청 (JSON)
{
  "mainMessage": "핵심 메시지 1개 (영어, 예: 72-hour hydration, dermatologist tested)",
  "emotionalTone": "감성 톤 (영어, 예: luxurious, clinical, natural, youthful)",
  "visualKeywords": ["시각화할 키워드 3-5개 (영어, 예: water droplets, dewy skin, fresh glow)"],
  "targetScene": "연출 장면 (영어, 예: spa atmosphere, clinical laboratory, morning routine)"
}

텍스트에서 언급된 수치, 효과, 감성을 시각적 요소로 변환해주세요.
JSON만 반환하세요.`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr) as ExtractedKeyMessages;
    console.log(`[Orchestration] Extracted key messages for ${sectionText.type}:`, result);
    return result;
  } catch (error) {
    console.error('[Orchestration] Failed to extract key messages:', error);
    return defaultMessages;
  }
}

/**
 * 텍스트 내용을 기반으로 이미지 프롬프트 생성
 * 스토리(텍스트)가 먼저, 그에 맞는 이미지 생성
 */
export async function generateSectionImagePromptFromText(
  sectionText: SectionTextContent,
  productName: string,
  category: string,
  keyFeatures: string[],
  _targetAudience: string,
  brandStyle?: string,
  visualReference?: ProductVisualReference,
  visualTheme?: VisualTheme,
  indexBasedPrompt?: string,  // ★ 인덱스별 특화 프롬프트
  subCategory?: BeautySubCategory,  // ★★★ 뷰티 서브 카테고리 (NEW!)
  blockIndex: number = 0  // ★ 블록 인덱스 (서브 카테고리 프롬프트용)
): Promise<SectionImagePrompt> {
  const sectionType = sectionText.type as 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
  const position = mapSectionTypeToPosition(sectionType);
  const compositionGuide = SECTION_COMPOSITION_GUIDE[position];

  // ★★★ 뷰티 서브 카테고리 고도화 프롬프트 시스템 적용 (NEW!) ★★★
  // 서브 카테고리가 지정되고, 고도화된 프롬프트 시스템이 있으면 해당 시스템 사용
  if (subCategory && hasAdvancedPromptSystem(subCategory) && isBeautyCategory(category)) {
    console.log(`[Orchestration] ★★★ Using ADVANCED prompt system for ${subCategory} (${sectionType}, block ${blockIndex})`);

    // 통합 프롬프트 빌더 옵션 구성
    const unifiedOptions: UnifiedPromptOptions = {
      productName,
      subCategory,
      keyFeatures,
      brandStyle,
    };

    // 서브 카테고리별 고도화 프롬프트 생성
    const advancedPrompt = buildUnifiedImagePrompt(sectionType, unifiedOptions, blockIndex);

    if (advancedPrompt) {
      // 기본 품질 및 일관성 지시문
      const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';
      const productConsistencyPrefix = `[CRITICAL - PRODUCT CONSISTENCY: The exact same "${productName}" must appear identically in all images]`;
      const qualityKeywords = '8K resolution, photorealistic, professional commercial photography, high-end advertising quality';
      const negativePrompt = buildNegativePrompt(['quality', 'style', 'content', 'composition'], category);

      // 비주얼 테마 지시문
      const themePrefix = visualTheme
        ? `[VISUAL THEME: ${visualTheme.consistencyPrompt}] [BACKGROUND: ${visualTheme.backgroundColors.gradient || visualTheme.backgroundColors.primary}]`
        : '';

      // 최종 프롬프트 조합
      const finalPrompt = [
        productConsistencyPrefix,
        themePrefix,
        `[★★★ ADVANCED ${subCategory.toUpperCase()} PROMPT ★★★]`,
        advancedPrompt,
        qualityKeywords,
        noTextInstruction,
        `--negative ${negativePrompt}`
      ].filter(Boolean).join(', ');

      console.log(`[Orchestration] ★ Generated ADVANCED prompt for ${subCategory}/${sectionType}/block${blockIndex}`);

      return {
        sectionType,
        position,
        imagePrompt: finalPrompt,
        compositionGuide,
      };
    }
  }

  // ===== 기존 프롬프트 생성 로직 (서브 카테고리 없거나 지원 안 되는 경우) =====

  // 1. 텍스트에서 핵심 메시지 추출
  const keyMessages = await extractKeyMessagesFromText(
    sectionText,
    productName,
    category,
    brandStyle
  );

  console.log(`[Orchestration] Building image prompt from text for ${sectionType}`);
  console.log(`[Orchestration] Main message: ${keyMessages.mainMessage}`);
  console.log(`[Orchestration] Visual keywords: ${keyMessages.visualKeywords.join(', ')}`);

  // 2. 기본 지시문
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';
  const productConsistencyPrefix = `[CRITICAL - PRODUCT CONSISTENCY: The exact same "${productName}" must appear identically in all images with consistent design, shape, color, texture and packaging]`;
  const qualityKeywords = '8K resolution, photorealistic, professional commercial photography, high-end advertising quality, sharp focus, premium product visualization';

  // 3. 비주얼 테마 지시문
  const themePrefix = visualTheme
    ? `[VISUAL THEME: ${visualTheme.consistencyPrompt}] [BACKGROUND: ${visualTheme.backgroundColors.gradient || visualTheme.backgroundColors.primary}] [LIGHTING: ${visualTheme.lighting.style}]`
    : '[VISUAL THEME: clean minimal style with soft neutral background]';

  // 4. 제품 외형 참조
  const productAppearance = visualReference?.appearance
    ? `[PRODUCT APPEARANCE: ${visualReference.appearance}]`
    : '';
  const productColors = visualReference?.colorScheme
    ? `[COLOR SCHEME: ${visualReference.colorScheme}]`
    : '';

  // 5. 섹션 템플릿 기반 프롬프트
  const extendedSectionType = mapToExtendedSectionType(sectionType);
  const sectionTemplate = getSectionTemplate(extendedSectionType);
  const baseTemplatePrompt = buildSectionTemplatePrompt(
    sectionTemplate,
    productName,
    visualTheme?.backgroundColors.gradient || 'clean gradient',
    keyFeatures[0]
  );

  // 6. 네거티브 프롬프트
  const negativePrompt = buildNegativePrompt(['quality', 'style', 'content', 'composition'], category);

  // 7. ★ 텍스트 기반 핵심 메시지 시각화 지시 ★
  // 중요: 텍스트를 이미지에 렌더링하지 않고, 시각적 메타포로만 표현
  const textBasedVisualization = `[TEXT-DRIVEN VISUALIZATION - NO TEXT RENDERING, ONLY VISUAL METAPHORS:
    CONCEPT TO VISUALIZE (NOT as text, but as visual elements): "${keyMessages.mainMessage}"
    EMOTIONAL ATMOSPHERE: ${keyMessages.emotionalTone}
    VISUAL ELEMENTS & PROPS: ${keyMessages.visualKeywords.join(', ')}
    SCENE SETTING: ${keyMessages.targetScene}

    CRITICAL RULES:
    - DO NOT render any text, words, letters, or typography in the image
    - Instead, EXPRESS the message through visual metaphors only
    - Example: "72-hour hydration" → show water droplets, dewy surface, moisture texture
    - Example: "clinical tested" → show clean laboratory setting, medical aesthetic
    - Example: "natural ingredients" → show fresh botanicals, organic elements
    - The viewer should FEEL the message through imagery, not READ it]`;

  // 8. 섹션별 특화 연출
  const sectionVisualization = buildSectionVisualizationGuide(sectionType, keyMessages);

  // ★★★ 9. 인덱스 기반 프롬프트 적용 (NEW!) ★★★
  // indexBasedPrompt가 있으면 해당 프롬프트를 최우선으로 사용
  // "ONE IMAGE = ONE FOCUS" 원칙을 강제하는 핵심 부분
  const indexedPromptSection = indexBasedPrompt
    ? `[★★★ INDEX-SPECIFIC PROMPT - HIGHEST PRIORITY ★★★]
${indexBasedPrompt}

[CRITICAL: SINGLE FOCUS RULE]
- This image MUST show ONLY ONE concept as specified above
- Do NOT combine multiple shots/steps/comparisons in one image
- Each image block is for ONE specific concept only
`
    : '';

  // 10. 최종 프롬프트 조합
  const imagePrompt = [
    productConsistencyPrefix,
    themePrefix,
    productAppearance,
    productColors,
    indexedPromptSection,     // ★★★ 인덱스별 프롬프트 (최우선!)
    textBasedVisualization,   // 텍스트 기반 시각화 지시
    sectionVisualization,     // 섹션별 특화 연출
    baseTemplatePrompt,
    qualityKeywords,
    noTextInstruction,
    `--negative ${negativePrompt}`
  ].filter(Boolean).join(', ');

  console.log(`[Orchestration] Generated TEXT-DRIVEN prompt for ${sectionType}${indexBasedPrompt ? ' (with INDEXED prompt)' : ''}`);

  return {
    sectionType,
    position,
    imagePrompt,
    compositionGuide,
  };
}

/**
 * 섹션별 텍스트 시각화 가이드
 */
function buildSectionVisualizationGuide(
  sectionType: string,
  keyMessages: ExtractedKeyMessages
): string {
  const visualElements = keyMessages.visualKeywords.join(', ');

  switch (sectionType) {
    case 'MAIN':
      return `[MAIN THUMBNAIL VISUALIZATION: Hero product shot with ${visualElements}, conveying "${keyMessages.mainMessage}", ${keyMessages.emotionalTone} mood, eye-catching composition for product listing thumbnail]`;

    case 'HERO':
      return `[HERO SECTION VISUALIZATION: Emotional product introduction with ${visualElements}, atmosphere: ${keyMessages.targetScene}, tone: ${keyMessages.emotionalTone}, large product hero with aspirational styling]`;

    case 'FEATURES':
      return `[FEATURES VISUALIZATION: Technical showcase with ${visualElements}, visualizing "${keyMessages.mainMessage}", ingredient/technology highlight, scientific yet elegant composition]`;

    case 'SOCIAL_PROOF':
      return `[SOCIAL PROOF VISUALIZATION: Trust-building imagery with ${visualElements}, clinical/professional setting: ${keyMessages.targetScene}, before-after or test result visualization, ${keyMessages.emotionalTone} credibility]`;

    case 'HOW_TO_USE':
      return `[USAGE VISUALIZATION: Step-by-step tutorial with ${visualElements}, scene: ${keyMessages.targetScene}, clear application demonstration, instructional yet aesthetically pleasing]`;

    case 'FAQ':
      return `[FAQ/CTA VISUALIZATION: Product collection with ${visualElements}, final impression: ${keyMessages.emotionalTone}, purchase-encouraging composition, brand lineup or gift set arrangement]`;

    default:
      return `[SECTION VISUALIZATION: ${visualElements}, mood: ${keyMessages.emotionalTone}]`;
  }
}

// ============================================
// 오버레이 텍스트 생성기
// ============================================

export async function generateOverlayText(
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  blockOptions?: BlockOverlayOptions,
  indexedOverlayGuide?: string  // ★ 인덱스별 오버레이 가이드 (NEW!)
): Promise<OverlayTextContent | undefined> {
  const gemini = getGeminiClient();
  if (!gemini) return undefined;

  // ★ blockOptions와 indexedOverlayGuide 모두 지원
  const basePrompt = buildOverlayTextPrompt(sectionType, productName, category, keyFeatures, targetAudience, blockOptions);
  const prompt = indexedOverlayGuide
    ? `${basePrompt}\n\n[★ INDEX-SPECIFIC OVERLAY GUIDE - USE THIS AS PRIMARY REFERENCE]\nRecommended text for this specific image: "${indexedOverlayGuide}"\nIncorporate this message into the overlay text structure.`
    : basePrompt;

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

    return JSON.parse(jsonStr) as OverlayTextContent;
  } catch (error) {
    console.error('[Orchestration] Failed to generate overlay text:', error);
    return undefined;
  }
}

// ============================================
// 이미지 분석 함수 (오버레이 스타일 결정용)
// ============================================

/**
 * 생성된 이미지를 분석하여 오버레이 텍스트 스타일 결정에 필요한 정보 추출
 * - 배경 밝기 분석 → 텍스트 색상 결정
 * - 안전 영역 탐지 → 텍스트 위치 결정
 * - 제품 위치 파악 → 텍스트 배치 피하기
 */
export async function analyzeImageForOverlay(
  imageData: string | Buffer  // base64 또는 Buffer
): Promise<ImageAnalysisResult | undefined> {
  const gemini = getGeminiClient();
  if (!gemini) return undefined;

  // base64 문자열로 변환
  const base64Image = Buffer.isBuffer(imageData)
    ? imageData.toString('base64')
    : imageData.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `당신은 이미지 분석 전문가입니다. 이 상세페이지 이미지를 분석하여 오버레이 텍스트 스타일을 결정하세요.

분석 항목:
1. 배경 밝기: 전체적으로 밝은지(light), 어두운지(dark), 혼합인지(mixed)
2. 주요 배경색: hex 색상 코드
3. 텍스트 안전 영역: 제품이 없어서 텍스트를 배치할 수 있는 빈 공간들
   - 위치: top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right
   - 크기: small, medium, large
   - 해당 영역의 밝기
4. 제품 위치: left, center, right, scattered 중 하나
5. 전체 분위기: premium, natural, vibrant, clinical, minimal 중 하나

JSON 형식으로 응답:
{
  "backgroundBrightness": "light" | "dark" | "mixed",
  "dominantColor": "#ffffff",
  "safeZones": [
    {"position": "top-left", "size": "medium", "brightness": "light"},
    {"position": "bottom-center", "size": "large", "brightness": "dark"}
  ],
  "recommendedTextColors": {
    "headline": "#333333",
    "subheadline": "#666666",
    "body": "#888888",
    "cta": "#d4a5a5"
  },
  "productPosition": "center",
  "mood": "premium"
}`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // JSON 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr) as ImageAnalysisResult;
    console.log('[Orchestration] Image analysis result:', result);
    return result;
  } catch (error) {
    console.error('[Orchestration] Failed to analyze image:', error);
    // 기본값 반환 (분석 실패 시)
    return {
      backgroundBrightness: 'light',
      dominantColor: '#ffffff',
      safeZones: [
        { position: 'top-center', size: 'medium', brightness: 'light' },
        { position: 'bottom-center', size: 'medium', brightness: 'light' }
      ],
      recommendedTextColors: {
        headline: '#333333',
        subheadline: '#666666',
        body: '#888888',
        cta: '#d4a5a5'
      },
      productPosition: 'center',
      mood: 'premium'
    };
  }
}

/**
 * 이미지 분석 결과를 기반으로 오버레이 텍스트 생성 (개선 버전)
 */
export async function generateOverlayTextWithAnalysis(
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  imageAnalysis: ImageAnalysisResult
): Promise<OverlayTextContent | undefined> {
  const gemini = getGeminiClient();
  if (!gemini) return undefined;

  // 분석 결과에서 안전 영역과 색상 추출
  const primarySafeZone = imageAnalysis.safeZones[0];
  const secondarySafeZone = imageAnalysis.safeZones[1];

  // 위치를 x, y 좌표로 변환
  const positionToCoords = (pos: string): { x: number; y: number } => {
    const map: Record<string, { x: number; y: number }> = {
      'top-left': { x: 15, y: 10 },
      'top-center': { x: 50, y: 10 },
      'top-right': { x: 85, y: 10 },
      'center-left': { x: 15, y: 50 },
      'center': { x: 50, y: 50 },
      'center-right': { x: 85, y: 50 },
      'bottom-left': { x: 15, y: 85 },
      'bottom-center': { x: 50, y: 85 },
      'bottom-right': { x: 85, y: 85 },
    };
    return map[pos] || { x: 50, y: 50 };
  };

  const headlinePos = positionToCoords(primarySafeZone?.position || 'top-center');
  const subheadlinePos = positionToCoords(secondarySafeZone?.position || primarySafeZone?.position || 'top-center');

  const prompt = `당신은 한국 이커머스 상세페이지 카피라이터입니다.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
- 타겟 고객: ${targetAudience}
- 섹션 타입: ${sectionType}

## 이미지 분석 결과 (스타일 적용 필수!)
- 배경 밝기: ${imageAnalysis.backgroundBrightness}
- 배경색: ${imageAnalysis.dominantColor}
- 분위기: ${imageAnalysis.mood}
- 텍스트 추천 색상:
  - 헤드라인: ${imageAnalysis.recommendedTextColors.headline}
  - 서브헤드: ${imageAnalysis.recommendedTextColors.subheadline}
  - 본문: ${imageAnalysis.recommendedTextColors.body}
  - CTA: ${imageAnalysis.recommendedTextColors.cta}
- 안전 영역: ${imageAnalysis.safeZones.map(z => z.position).join(', ')}

## 작성 규칙
1. 텍스트 색상은 반드시 위 분석 결과의 추천 색상 사용
2. 텍스트 위치는 안전 영역 내에 배치
3. 한국 이커머스 상세페이지 스타일 (올리브영 참조)

JSON 형식으로 응답:
{
  "headline": {
    "text": "헤드라인 텍스트 (5-10자)",
    "x": ${headlinePos.x},
    "y": ${headlinePos.y},
    "fontSize": 48,
    "fontWeight": "bold",
    "color": "${imageAnalysis.recommendedTextColors.headline}",
    "textAlign": "center"
  },
  "subheadline": {
    "text": "서브헤드 (10-20자)",
    "x": ${subheadlinePos.x},
    "y": ${subheadlinePos.y + 8},
    "fontSize": 24,
    "fontWeight": "medium",
    "color": "${imageAnalysis.recommendedTextColors.subheadline}",
    "textAlign": "center"
  },
  "statistics": [
    {
      "text": "92%",
      "x": 50,
      "y": 70,
      "fontSize": 56,
      "fontWeight": "bold",
      "color": "${imageAnalysis.recommendedTextColors.headline}"
    }
  ],
  "cta": {
    "text": "CTA 문구 (5-10자)",
    "x": 50,
    "y": 90,
    "fontSize": 20,
    "fontWeight": "semibold",
    "color": "${imageAnalysis.recommendedTextColors.cta}",
    "textAlign": "center"
  }
}`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    return JSON.parse(jsonStr) as OverlayTextContent;
  } catch (error) {
    console.error('[Orchestration] Failed to generate overlay text with analysis:', error);
    return undefined;
  }
}

// ============================================
// 제품 외형 설명 생성기 (일관성을 위해)
// ============================================

async function generateProductVisualReference(
  productName: string,
  category: string,
  keyFeatures: string[],
  brandContext?: BrandContext | null
): Promise<ProductVisualReference> {
  const gemini = getGeminiClient();

  if (!gemini) {
    // 기본값 반환
    return {
      appearance: `${category} product in elegant packaging`,
      colorScheme: 'premium neutral tones',
      packageShape: 'sleek modern design',
      brandVisual: brandContext?.imageKeywords?.join(', ') || 'minimalist luxury',
    };
  }

  const prompt = `
당신은 제품 시각화 전문가입니다.
다음 제품의 외형을 구체적으로 설명해주세요. 이 설명은 AI 이미지 생성에서 제품 일관성을 유지하는 데 사용됩니다.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
${brandContext ? `- 브랜드: ${brandContext.name}` : ''}
${brandContext?.imageKeywords ? `- 브랜드 스타일: ${brandContext.imageKeywords.join(', ')}` : ''}

## 요청
아래 JSON 형식으로 제품 외형을 설명해주세요:

{
  "appearance": "제품의 전체적인 외형 설명 (영어, 예: circular black compact case with embossed gold logo, sleek matte finish)",
  "colorScheme": "주요 색상 구성 (영어, 예: black case with rose gold accents)",
  "packageShape": "패키지/용기 형태 (영어, 예: round compact cushion case with mirror inside)",
  "brandVisual": "브랜드 시각 스타일 (영어, 예: minimalist luxury, modern elegance)"
}

카테고리 "${category}"에 맞는 일반적인 제품 형태를 상상하여 구체적으로 설명해주세요.
JSON만 반환하세요.
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr) as ProductVisualReference;
    console.log('[Orchestration] Generated product visual reference:', result);
    return result;
  } catch (error) {
    console.error('[Orchestration] Failed to generate visual reference:', error);
    return {
      appearance: `${category} product in elegant packaging`,
      colorScheme: 'premium neutral tones',
      packageShape: 'sleek modern design',
      brandVisual: brandContext?.imageKeywords?.join(', ') || 'minimalist luxury',
    };
  }
}

// ============================================
// 메인 오케스트레이션 함수
// ============================================

export async function orchestrateDetailPageGeneration(
  input: GenerationInput
): Promise<OrchestrationResult[]> {
  console.log('[Orchestration] Starting detail page generation...');
  console.log(`[Orchestration] Product: ${input.productName}, Category: ${input.category}`);

  const gemini = getGeminiClient();

  // 0-1. 비주얼 테마 자동 선택 (전체 상세페이지에 일관된 스타일 적용)
  const brandTone = input.brandContext?.toneAndManner;
  const selectedThemeStyle = autoSelectTheme(input.category, brandTone);
  const visualTheme = getVisualTheme(selectedThemeStyle);
  console.log(`[Orchestration] Selected visual theme: ${visualTheme.name} (${selectedThemeStyle})`);
  console.log(`[Orchestration] Theme colors: ${visualTheme.backgroundColors.primary}, ${visualTheme.backgroundColors.secondary}`);

  // ★ 0-1-2. 섹션별 다양한 배경색 팔레트 선택 (NEW!)
  // 올리브영 상세페이지처럼 섹션마다 다른 배경색, 하지만 전체적으로 조화로운 팔레트
  const selectedPaletteTheme = autoSelectPalette(input.category, input.productName, brandTone);
  const colorPalette = getColorPalette(selectedPaletteTheme);
  console.log(`[Orchestration] ★ Selected color palette: ${colorPalette.name} (${selectedPaletteTheme})`);
  console.log(`[Orchestration] ★ Palette colors: ${colorPalette.colors.map(c => c.hex).join(', ')}`);
  console.log(`[Orchestration] ★ Palette mood: ${colorPalette.moodKeywords.join(', ')}`);

  // 0-2. 제품 외형 참조 생성 (모든 섹션에서 동일한 제품 표시를 위해)
  console.log('[Orchestration] Generating product visual reference for consistency...');
  const visualReference = await generateProductVisualReference(
    input.productName,
    input.category,
    input.keyFeatures,
    input.brandContext
  );

  // 1. 텍스트 콘텐츠 생성 (훅 메시지 + 섹션 카피)
  const systemPrompt = buildEnhancedSystemPrompt(input.copyLength, input.brandContext, input.category);
  const userPrompt = buildEnhancedUserPrompt(input);

  const generateTextContent = async (versionIndex: number) => {
    const variationPrompt = versionIndex === 1
      ? '\n\nIMPORTANT: Create a distinctly different version with alternative messaging approach, different tone, or unique angle.'
      : '';

    if (!gemini) {
      // Mock 데이터 반환 (브랜드 컨텍스트 반영)
      const brandName = input.brandContext?.name || '';
      const brandTone = input.brandContext?.toneAndManner || '';
      const brandPrefix = brandName ? `${brandName} ` : '';

      const keyFeatures = input.keyFeatures || ['프리미엄 품질'];
      return {
        hookMessage: brandName
          ? `${brandPrefix}${input.productName} - ${input.targetAudience || '고객'}를 위한 ${brandTone || '완벽한'} 선택`
          : `${input.productName} - ${input.targetAudience || '고객'}를 위한 완벽한 선택`,
        sections: [
          { type: 'MAIN', title: `${brandPrefix}${input.productName}`, body: keyFeatures[0] || '프리미엄 품질' },
          { type: 'HERO', title: `${brandPrefix}${input.productName} 소개`, body: `${input.targetAudience || '고객'}를 위해 설계된 ${brandPrefix}${input.productName}입니다.${brandTone ? ` ${brandTone}의 철학을 담았습니다.` : ''}` },
          { type: 'FEATURES', title: '주요 특징', body: keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n') },
          { type: 'SOCIAL_PROOF', title: '고객 후기', body: `"${brandPrefix}${input.productName}을 사용한 후 정말 만족합니다!" - 실제 사용자` },
          { type: 'HOW_TO_USE', title: '사용 방법', body: `1. ${brandPrefix}${input.productName}을 준비합니다.\n2. 설정을 완료합니다.\n3. 사용을 시작하세요!` },
          { type: 'FAQ', title: '자주 묻는 질문', body: `Q: ${brandPrefix}${input.productName}의 주요 특징은?\nA: ${keyFeatures[0] || '뛰어난 품질'}입니다.` },
        ],
      };
    }

    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\n${userPrompt}${variationPrompt}\n\nCRITICAL: Do NOT use any emojis (😊, ✨, 💕, 🌟, ❤️, etc.). Write plain text only.\n\nReturn only the JSON object, no additional text or markdown.`,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // JSON 파싱
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
      console.error('[Orchestration] Failed to parse text content, using fallback');
      return null;
    }
  };

  // 2. 텍스트 콘텐츠 생성 (1버전만 - UI에서 버전 선택 기능 없으므로)
  console.log('[Orchestration] Generating text content...');
  const textContent1 = await generateTextContent(0);

  // 3. ★ 텍스트 기반 이미지 프롬프트 생성 (NEW: 스토리 → 이미지)
  // 텍스트 콘텐츠를 먼저 분석하여 그에 맞는 이미지 생성
  console.log('[Orchestration] ★ TEXT-DRIVEN IMAGE GENERATION: Analyzing text content to generate matching images...');

  // ★★★ 서브카테고리별 동적 섹션 사용 (NEW!) ★★★
  // 뷰티 서브카테고리가 있고 고급 프롬프트 시스템이 있으면 해당 카테고리의 전체 섹션 사용
  const DEFAULT_SECTIONS: string[] = ['MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'];

  let sectionTypes: string[];

  if (input.subCategory && hasAdvancedPromptSystem(input.subCategory) && isBeautyCategory(input.category)) {
    // 뷰티 서브카테고리의 모든 섹션 사용 (예: 립은 14개, 마스크팩은 17개)
    sectionTypes = getSubCategorySections(input.subCategory);
    console.log(`[Orchestration] ★★★ Using DYNAMIC sections for ${input.subCategory}: ${sectionTypes.length} sections`);
    console.log(`[Orchestration]   Sections: ${sectionTypes.join(', ')}`);
  } else {
    // 기본 6개 섹션 사용
    sectionTypes = DEFAULT_SECTIONS;
    console.log(`[Orchestration] Using DEFAULT 6 sections`);
  }

  const brandStyle = input.brandContext?.imageKeywords?.join(', ');

  // ★★★ 표준 섹션 타입 (기존 함수 호환용)
  type StandardSectionType = 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
  const STANDARD_SECTIONS: StandardSectionType[] = ['MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'];

  // ★★★ 서브카테고리 섹션인지 확인하는 헬퍼 함수
  const isStandardSection = (section: string): section is StandardSectionType => {
    return STANDARD_SECTIONS.includes(section as StandardSectionType);
  };

  // 3-1. 각 섹션별 권장 이미지 수 계산
  // ★★★ 서브카테고리 섹션의 경우 각 섹션당 이미지 1개로 설정 (14~17개 섹션이므로)
  const sectionImageCounts = sectionTypes.map(sectionType => {
    // 서브카테고리 섹션인 경우 (예: HERO_LIP, TEXTURE_VISUAL 등)
    if (!isStandardSection(sectionType)) {
      // 서브카테고리 섹션은 각각 1개의 이미지 생성
      return { sectionType, count: 1, overlayTextGuide: '' };
    }

    // 표준 섹션인 경우 기존 로직 사용
    const extendedType = mapToExtendedSectionType(sectionType) as ExtendedSectionType;
    const sectionImageInfo = getSectionImagePrompt(
      extendedType,
      input.category,
      input.productName,
      visualTheme?.backgroundColors.gradient || 'soft gradient'
    );
    const count = calculateImageCount(
      input.copyLength,
      sectionImageInfo.suggestedImageCount,
      sectionType
    );
    return { sectionType, count, overlayTextGuide: sectionImageInfo.overlayTextGuide };
  });

  // 3-2. 전체 이미지 수가 maxTotalImages를 초과하지 않도록 조정
  const adjustedCounts = adjustImageCountsToLimit(sectionImageCounts, input.copyLength);

  const totalImages = Array.from(adjustedCounts.values()).reduce((sum, c) => sum + c, 0);
  console.log(`[Orchestration] Image counts by section (total: ${totalImages}):`, Object.fromEntries(adjustedCounts));

  // 3-3. ★ 텍스트 기반 이미지 프롬프트 생성 (NEW!)
  // - 첫 번째 버전 텍스트를 기반으로 이미지 프롬프트 생성
  // - 텍스트 내용을 분석하여 해당 메시지에 맞는 이미지 생성
  const imagePromptsMap = new Map<string, SectionImagePrompt[]>();

  // 기준 텍스트: 첫 번째 버전 (또는 폴백)
  const referenceTextContent = textContent1 || {
    hookMessage: `${input.productName} - 최고의 선택`,
    sections: sectionTypes.map(type => ({
      type,
      title: type,
      body: `${input.productName} ${type} 섹션`,
    })),
  };

  console.log('[Orchestration] Reference text for image generation:', referenceTextContent.hookMessage);

  // ★ 3-3-1. 섹션별 배경색 맵 생성 (각 섹션마다 다른 배경색!)
  // ★★★ 서브카테고리 섹션은 기본값 'FEATURES'로 매핑 (배경색 생성용)
  const extendedSectionTypes = sectionTypes.map(s => {
    if (isStandardSection(s)) {
      return mapToExtendedSectionType(s);
    }
    // 서브카테고리 섹션은 FEATURES로 기본 매핑 (배경색 생성용)
    return mapToExtendedSectionType('FEATURES');
  });
  const sectionBackgroundMap = generatePageBackgroundMap(extendedSectionTypes, selectedPaletteTheme);

  console.log('[Orchestration] ★ Section background colors:');
  sectionBackgroundMap.forEach((bg, section) => {
    console.log(`  - ${section}: ${bg.hex} (${bg.role})`);
  });

  // 전체 페이지 팔레트 조화 프롬프트
  const paletteHarmonyPrompt = buildPaletteHarmonyPrompt(colorPalette);

  await Promise.all(
    sectionTypes.map(async (sectionType) => {
      const imageCount = adjustedCounts.get(sectionType) || 1;
      const sectionInfo = sectionImageCounts.find(s => s.sectionType === sectionType);

      // 해당 섹션의 텍스트 내용 찾기
      const sectionText = referenceTextContent.sections.find(
        (s: SectionTextContent) => s.type === sectionType
      ) || { type: sectionType, title: sectionType, body: '' };

      console.log(`[Orchestration] Generating image for ${sectionType} based on text: "${sectionText.title}"`);

      // ★ 해당 섹션의 배경색 가져오기 (팔레트에서)
      // ★★★ 서브카테고리 섹션은 'FEATURES'로 기본 매핑
      const extendedType = isStandardSection(sectionType)
        ? mapToExtendedSectionType(sectionType)
        : mapToExtendedSectionType('FEATURES');
      const sectionBackground = sectionBackgroundMap.get(extendedType);
      const backgroundPrompt = sectionBackground?.prompt || 'clean gradient background';
      const backgroundHex = sectionBackground?.hex || '#FFFFFF';

      // ★★★ 서브카테고리 섹션인지 확인 (overlayText 및 indexed prompts 처리용)
      const isSubcategorySection = !isStandardSection(sectionType);

      // ★ 인덱스 기반 프롬프트 사용 여부 확인 (NEW!)
      // 서브카테고리 섹션은 자체 프롬프트 시스템 사용
      const useIndexedPrompts = !isSubcategorySection && hasIndexedPrompts(extendedType, input.category);
      if (useIndexedPrompts) {
        console.log(`[Orchestration] ★ Using INDEXED prompts for ${sectionType} (category: ${input.category})`);
      }

      // 해당 섹션에 대해 imageCount만큼 프롬프트 생성
      const prompts: SectionImagePrompt[] = await Promise.all(
        Array.from({ length: imageCount }, async (_, index) => {
          // 변형 힌트 생성 (예: "variation 1 of 3", "shade #21")
          const variationHint = imageCount > 1
            ? generateVariationHint(sectionType, index, imageCount, input.category, sectionInfo?.overlayTextGuide)
            : undefined;

          // ★★★ 인덱스 기반 프롬프트 시스템 적용 (NEW!) ★★★
          // indexedPrompts가 있는 섹션은 각 이미지별로 다른 컨셉의 프롬프트 사용
          let indexBasedPromptInfo: { prompt: string; overlayGuide: string; conceptType: string } | null = null;
          if (useIndexedPrompts) {
            const indexed = getSectionImagePromptByIndex(
              extendedType,
              input.category,
              index,
              input.productName
            );
            if (indexed.hasIndexedPrompt) {
              indexBasedPromptInfo = {
                prompt: indexed.prompt,
                overlayGuide: indexed.overlayGuide,
                conceptType: indexed.conceptType,
              };
              console.log(`[Orchestration]   → Image ${index}: ${indexed.conceptType}`);
            }
          }

          // ★ 텍스트 기반 이미지 프롬프트 생성 + overlayText 항상 생성
          // overlayText는 generateImages와 관계없이 항상 생성 (텍스트와 함께 제공)
          // ★★★ 블록별 다른 오버레이 텍스트 생성 (variationHint 전달!)
          const [imagePrompt, overlayText] = await Promise.all([
            generateSectionImagePromptFromText(
              sectionText,           // ★ 텍스트 내용 전달!
              input.productName,
              input.category,
              input.keyFeatures,
              input.targetAudience,
              brandStyle,
              visualReference,
              visualTheme,
              indexBasedPromptInfo?.prompt,  // ★ 인덱스별 프롬프트 전달
              input.subCategory,             // ★★★ 뷰티 서브 카테고리 (NEW!)
              index                          // ★ 블록 인덱스
            ),
            // ★ overlayText는 블록별로 다르게 생성 (variationHint 반영!)
            // ★★★ 서브카테고리 섹션은 'FEATURES'로 기본 매핑 (overlayText 생성용)
            generateOverlayText(
              isSubcategorySection ? 'FEATURES' : sectionType as 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
              input.productName,
              input.category,
              input.keyFeatures,
              input.targetAudience,
              {
                blockIndex: index,
                totalBlocks: imageCount,
                variationHint,
              },
              indexBasedPromptInfo?.overlayGuide  // ★ 인덱스별 오버레이 가이드 전달 (NEW!)
            ),
          ]);

          // ★★★ 섹션별 다양한 배경색 주입 (핵심!)
          // 팔레트에서 해당 섹션에 할당된 배경색으로 프롬프트 강화
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

          // 기존 프롬프트에 팔레트 배경색 정보 주입
          const enhancedImagePrompt = imagePrompt.imagePrompt + paletteBackgroundInjection;

          return {
            ...imagePrompt,
            imagePrompt: enhancedImagePrompt,  // ★ 배경색 강화된 프롬프트
            overlayText,
            imageIndex: index,
            totalImagesInSection: imageCount,
            variationHint,
          };
        })
      );

      imagePromptsMap.set(sectionType, prompts);
    })
  );

  // 각 섹션별 생성된 프롬프트 수 로그
  const promptCounts: Record<string, number> = {};
  imagePromptsMap.forEach((prompts, sectionType) => {
    promptCounts[sectionType] = prompts.length;
  });
  console.log('[Orchestration] ★★★ TEXT-DRIVEN image prompts per section:', JSON.stringify(promptCounts));

  // 4. 결과 조합 (다중 이미지 프롬프트 포함)
  const buildResult = (textContent: { hookMessage: string; sections: Array<{ type: string; title?: string; body: string }> } | null): OrchestrationResult => {
    if (!textContent) {
      // 폴백 결과
      return {
        hookMessage: `${input.productName} - 최고의 선택`,
        sections: sectionTypes.map((type, index) => {
          const sectionPrompts = imagePromptsMap.get(type) || [];
          const firstPrompt = sectionPrompts[0];
          return {
            id: uuidv4(),
            type,
            title: type,
            body: `${input.productName} ${type} 섹션`,
            order: index,
            imagePrompt: firstPrompt,                    // 기존 호환성
            imagePrompts: sectionPrompts,                 // 항상 배열 전달
          };
        }),
      };
    }

    return {
      hookMessage: textContent.hookMessage,
      sections: textContent.sections.map((section, index) => {
        const sectionType = section.type as 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';
        const sectionPrompts = imagePromptsMap.get(sectionType) || imagePromptsMap.get('HERO') || [];
        const firstPrompt = sectionPrompts[0];

        return {
          id: uuidv4(),
          type: section.type,
          title: section.title,
          body: section.body,
          order: index,
          imagePrompt: firstPrompt,                      // 기존 호환성
          imagePrompts: sectionPrompts,                   // 항상 배열 전달
        };
      }),
    };
  };

  // 1버전만 반환 (UI에서 버전 선택 기능 없으므로)
  const results = [buildResult(textContent1)];

  console.log('[Orchestration] Detail page generation completed');

  return results;
}

// ============================================
// 단일 섹션 재생성 함수
// ============================================

export async function regenerateSectionImagePrompt(
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  brandStyle?: string,
  userFeedback?: string
): Promise<SectionImagePrompt> {
  console.log(`[Orchestration] Regenerating image prompt for ${sectionType}...`);

  const position = mapSectionTypeToPosition(sectionType);
  const referencePrompts = getReferencePrompts(category, position);
  const visualKeywords = getVisualStyleKeywords(category);
  const compositionGuide = SECTION_COMPOSITION_GUIDE[position];

  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  const gemini = getGeminiClient();

  if (!gemini) {
    return {
      sectionType,
      position,
      imagePrompt: buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords),
      compositionGuide,
    };
  }

  const promptGenerationRequest = `
당신은 상세페이지 이미지 프롬프트 전문가입니다.
기존 프롬프트를 개선하여 새로운 버전을 만들어주세요.

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
- 타겟: ${targetAudience}
${brandStyle ? `- 브랜드 스타일: ${brandStyle}` : ''}

## 섹션: ${sectionType} (${position})
- 레이아웃: ${compositionGuide.layout}
- 분위기: ${compositionGuide.mood}

## 참조 프롬프트 (올리브영 베스트셀러)
${referencePrompts.slice(0, 2).join('\n')}

${userFeedback ? `## 사용자 피드백\n${userFeedback}` : ''}

## 규칙
1. 텍스트 없이 제품만 포함
2. 영어로 작성
3. 이전과 다른 새로운 접근

프롬프트만 반환하세요.
`;

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptGenerationRequest,
    });

    let imagePrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!imagePrompt.toLowerCase().includes('no text')) {
      imagePrompt = `${imagePrompt}, ${noTextInstruction}`;
    }

    return {
      sectionType,
      position,
      imagePrompt,
      compositionGuide,
    };
  } catch (error) {
    console.error('[Orchestration] Regeneration failed:', error);
    const fallback = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords);
    return {
      sectionType,
      position,
      imagePrompt: fallback,
      compositionGuide,
    };
  }
}
