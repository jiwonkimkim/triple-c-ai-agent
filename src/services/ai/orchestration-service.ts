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
  getReferencePrompts,
  getVisualStyleKeywords,
  mapSectionTypeToPosition,
  SECTION_COMPOSITION_GUIDE,
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  buildOverlayTextPrompt,
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
  type SectionPosition,
  type OverlayTextContent,
  type ProductVisualReference,
  type VisualTheme,
  type ExtendedSectionType,
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
  const referencePrompts = getReferencePrompts(category, position);
  const visualKeywords = getVisualStyleKeywords(category);
  const compositionGuide = SECTION_COMPOSITION_GUIDE[position];

  // 텍스트 없는 이미지 프롬프트 생성
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  // 제품 일관성 지시문 (모든 섹션에서 동일한 제품 표시)
  const productConsistencyInstruction = buildProductConsistencyText(productName, category, visualReference);

  // 섹션 템플릿 기반 프롬프트
  const extendedSectionType = mapToExtendedSectionType(sectionType);
  const sectionTemplate = getSectionTemplate(extendedSectionType);
  const templatePrompt = buildSectionTemplatePrompt(
    sectionTemplate,
    productName,
    visualTheme?.backgroundColors.gradient || 'clean gradient',
    keyFeatures[0]
  );

  // 네거티브 프롬프트
  const negativePrompt = buildNegativePrompt(['quality', 'style', 'content', 'composition'], category);

  // 참조 프롬프트에서 영감을 받아 새 프롬프트 생성
  const gemini = getGeminiClient();

  let imagePrompt: string;

  // MAIN 섹션 전용: 제품명 기반 맞춤 오브제 + 분위기 오브제 가이드
  const mainSectionGuide = sectionType === 'MAIN' ? `
## 🎨 MAIN 썸네일 특별 지시 (매우 중요!)
이 섹션은 상세페이지 진입 전 첫인상을 결정하는 메인 썸네일입니다.

### 1. 실제 재료 오브제 (INGREDIENT OBJECTS) - 15-20%, 베이스/전면
제품명 "${productName}" 분석하여 실제 성분/재료 배치:
- "로즈/rose/장미" → 장미 꽃잎
- "베리/berry" → 딸기, 라즈베리, 블루베리
- "허니/꿀" → 꿀, 벌집
- "그린티/녹차" → 녹차잎
- "시트러스/레몬/오렌지" → 과일 슬라이스
- "라벤더" → 라벤더
- "민트" → 민트잎
- "알로에" → 알로에 젤/잎
- "진주/pearl" → 진주
- 해당 없으면 → ${category} 관련 재료

### 2. 분위기 오브제 (MOOD OBJECTS) - 10-15%, 배경/측면
제품 무드에 맞는 1-2개 분위기 요소:
- 로맨틱/페미닌: 실크 패브릭, 드라이플라워, 리본
- 프레시/내추럴: 물방울, 이슬, 녹색 잎
- 럭셔리/프리미엄: 벨벳, 크리스탈, 메탈릭
- 클린/미니멀: 흰 돌, 기하학적 형태
- 따뜻한/아늑한: 따뜻한 톤 패브릭, 우드
- 시원한/상쾌한: 얼음, 물 스플래시

### 3. 구성
- 제품 = 주인공 (50-60%, 중앙, 선명)
- 재료 오브제 (15-20%, 베이스/전면)
- 분위기 오브제 (10-15%, 배경/측면)
` : '';

  if (gemini) {
    // AI를 사용하여 맞춤형 프롬프트 생성
    const promptGenerationRequest = `
당신은 AI 이미지 생성(Gemini Imagen, DALL-E) 전문 프롬프트 엔지니어입니다.
상업용 제품 상세페이지에 사용될 고품질 이미지 생성 프롬프트를 작성해주세요.
${mainSectionGuide}
## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 핵심 특징: ${keyFeatures.join(', ')}
- 타겟 고객: ${targetAudience}
${brandStyle ? `- 브랜드 스타일: ${brandStyle}` : ''}
${visualReference?.appearance ? `- 제품 외형 상세: ${visualReference.appearance}` : ''}
${visualReference?.colorScheme ? `- 색상 구성: ${visualReference.colorScheme}` : ''}
${visualReference?.packageShape ? `- 패키지/용기 형태: ${visualReference.packageShape}` : ''}

## ⚠️ 중요: 제품 일관성 (CRITICAL)
${productConsistencyInstruction}

## 🎨 비주얼 테마 (모든 섹션에 동일하게 적용)
${visualTheme ? `
- 테마명: ${visualTheme.name}
- 배경색: ${visualTheme.backgroundColors.primary} (주), ${visualTheme.backgroundColors.secondary} (보조)
- 그라데이션: ${visualTheme.backgroundColors.gradient || '없음'}
- 조명: ${visualTheme.lighting.style}
- 분위기: ${visualTheme.moodKeywords.slice(0, 5).join(', ')}
- 일관성 지시: ${visualTheme.consistencyPrompt}
` : '기본 클린 미니멀 스타일'}

## 섹션 정보 (${sectionType})
- 위치/역할: ${position}
- 레이아웃 가이드: ${compositionGuide.layout}
- 제품 배치: ${compositionGuide.productPlacement}
- 텍스트 배치 (텍스트는 별도 오버레이): ${compositionGuide.textPlacement}
- 라이팅: ${compositionGuide.lighting}
- 분위기: ${compositionGuide.mood}

## 섹션 템플릿 참조
${templatePrompt}

## 참조 프롬프트 예시 (올리브영 베스트셀러 기반)
${referencePrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## 비주얼 스타일 키워드
${visualKeywords.join(', ')}

## Gemini Imagen 최적화 프롬프트 작성 가이드라인
1. **구체적인 시각적 묘사**: 제품의 외형, 질감, 재질, 광택을 상세히 기술
2. **조명과 그림자**: 스튜디오 조명, 자연광, 림 라이팅, 소프트박스 등 구체적 조명 설정
3. **구도와 앵글**: 카메라 앵글(eye-level, bird's eye, low angle), 구도(rule of thirds, centered) 명시
4. **배경과 환경**: 그라데이션 배경, 스튜디오 세팅, 미니멀 배경 등 상세 설명 (비주얼 테마와 일치시킬 것)
5. **분위기와 스타일**: luxury, premium, minimalist, clean, elegant 등 스타일 키워드
6. **기술적 품질**: 8K, photorealistic, professional photography, commercial quality 등 품질 키워드
7. **색상 팔레트**: 제품과 조화로운 배경 색상, 비주얼 테마의 색상 가이드 활용

## 네거티브 프롬프트 (제외할 요소)
${negativePrompt}

## 필수 규칙
1. 이미지에 텍스트, 글자, 로고, 워터마크가 절대 포함되면 안 됩니다 (텍스트는 별도 오버레이)
2. 텍스트가 들어갈 영역은 깨끗하게 비워두세요 (상단 30%, 하단 20% 등)
3. 영어로 작성해주세요 (Gemini Imagen 최적화)
4. 150-300 단어 사이의 상세한 프롬프트를 작성해주세요
5. **모든 섹션에서 동일한 제품이 일관되게 표시되어야 합니다**
6. **모든 섹션에서 동일한 배경색과 조명 스타일(비주얼 테마)을 유지해야 합니다**

## 출력 형식
- 프롬프트만 반환 (설명이나 마크다운 없이)
- 프롬프트 구조: [제품 일관성 지시] [테마/배경 지시] [섹션 콘텐츠] [품질/스타일 키워드] --negative [제외 요소]
- 콤마로 구분된 키워드/구문 형식
`;

    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptGenerationRequest,
      });

      imagePrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      // 제품 일관성 지시가 없으면 추가
      if (!imagePrompt.toLowerCase().includes('same product') && !imagePrompt.toLowerCase().includes('consistent product')) {
        imagePrompt = `[PRODUCT CONSISTENCY: Same exact "${productName}" product throughout all images] ${imagePrompt}`;
      }

      // 텍스트 제외 지시가 없으면 추가
      if (!imagePrompt.toLowerCase().includes('no text')) {
        imagePrompt = `${imagePrompt}, ${noTextInstruction}`;
      }
    } catch (error) {
      console.error('[Orchestration] Failed to generate prompt with AI, using fallback:', error);
      imagePrompt = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords, visualReference, visualTheme);
    }
  } else {
    // AI 없이 규칙 기반 프롬프트 생성
    imagePrompt = buildFallbackImagePrompt(sectionType, productName, category, keyFeatures, brandStyle, position, visualKeywords, visualReference, visualTheme);
  }

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
// 오버레이 텍스트 생성기
// ============================================

export async function generateOverlayText(
  sectionType: 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string
): Promise<OverlayTextContent | undefined> {
  const gemini = getGeminiClient();
  if (!gemini) return undefined;

  const prompt = buildOverlayTextPrompt(sectionType, productName, category, keyFeatures, targetAudience);

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

      return {
        hookMessage: brandName
          ? `${brandPrefix}${input.productName} - ${input.targetAudience}를 위한 ${brandTone || '완벽한'} 선택`
          : `${input.productName} - ${input.targetAudience}를 위한 완벽한 선택`,
        sections: [
          { type: 'MAIN', title: `${brandPrefix}${input.productName}`, body: input.keyFeatures[0] || '프리미엄 품질' },
          { type: 'HERO', title: `${brandPrefix}${input.productName} 소개`, body: `${input.targetAudience}를 위해 설계된 ${brandPrefix}${input.productName}입니다.${brandTone ? ` ${brandTone}의 철학을 담았습니다.` : ''}` },
          { type: 'FEATURES', title: '주요 특징', body: input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n') },
          { type: 'SOCIAL_PROOF', title: '고객 후기', body: `"${brandPrefix}${input.productName}을 사용한 후 정말 만족합니다!" - 실제 사용자` },
          { type: 'HOW_TO_USE', title: '사용 방법', body: `1. ${brandPrefix}${input.productName}을 준비합니다.\n2. 설정을 완료합니다.\n3. 사용을 시작하세요!` },
          { type: 'FAQ', title: '자주 묻는 질문', body: `Q: ${brandPrefix}${input.productName}의 주요 특징은?\nA: ${input.keyFeatures[0] || '뛰어난 품질'}입니다.` },
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

  // 2. 두 버전의 텍스트 콘텐츠 생성
  console.log('[Orchestration] Generating text content for 2 versions...');
  const [textContent1, textContent2] = await Promise.all([
    generateTextContent(0),
    generateTextContent(1),
  ]);

  // 3. 각 섹션별 다중 이미지 프롬프트 생성
  // MAIN: 메인 썸네일 (올리브영 스타일 - 상세페이지 진입 전 제품 슬로건 이미지)
  // HERO: 상세페이지 첫 번째 섹션
  console.log('[Orchestration] Generating section image prompts with copyLength-based counts...');
  const sectionTypes: Array<'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ'> = [
    'MAIN', 'HERO', 'FEATURES', 'SOCIAL_PROOF', 'HOW_TO_USE', 'FAQ'
  ];

  const brandStyle = input.brandContext?.imageKeywords?.join(', ');

  // 3-1. 각 섹션별 권장 이미지 수 계산
  const sectionImageCounts = sectionTypes.map(sectionType => {
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

  // 3-3. 각 섹션별 다중 이미지 프롬프트 생성
  // - 동일한 visualReference 전달로 제품 일관성 유지
  // - 동일한 visualTheme 전달로 배경/조명/분위기 일관성 유지
  const imagePromptsMap = new Map<string, SectionImagePrompt[]>();

  await Promise.all(
    sectionTypes.map(async (sectionType) => {
      const imageCount = adjustedCounts.get(sectionType) || 1;
      const sectionInfo = sectionImageCounts.find(s => s.sectionType === sectionType);

      // 해당 섹션에 대해 imageCount만큼 프롬프트 생성
      const prompts: SectionImagePrompt[] = await Promise.all(
        Array.from({ length: imageCount }, async (_, index) => {
          // 변형 힌트 생성 (예: "variation 1 of 3", "shade #21")
          const variationHint = imageCount > 1
            ? generateVariationHint(sectionType, index, imageCount, input.category, sectionInfo?.overlayTextGuide)
            : undefined;

          const [imagePrompt, overlayText] = await Promise.all([
            generateSectionImagePrompt(
              sectionType,
              input.productName,
              input.category,
              input.keyFeatures,
              input.targetAudience,
              brandStyle,
              visualReference,
              visualTheme
            ),
            input.generateImages ? generateOverlayText(
              sectionType,
              input.productName,
              input.category,
              input.keyFeatures,
              input.targetAudience
            ) : undefined,
          ]);

          return {
            ...imagePrompt,
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
  console.log('[Orchestration] ★★★ Multi-image prompts per section:', JSON.stringify(promptCounts));

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

  const results = [
    buildResult(textContent1),
    buildResult(textContent2),
  ];

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
