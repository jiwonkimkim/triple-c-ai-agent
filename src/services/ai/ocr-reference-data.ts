/**
 * OCR 참조 데이터 서비스
 * 올리브영 상세페이지 OCR 분석 결과에서 description/prompt 패턴을 활용
 *
 * 데이터 소스: crawling_oliv/oliveyoung_data/ocr_results_gemini
 */

// 섹션 위치 타입
export type SectionPosition = 'intro' | 'features' | 'proof' | 'usage' | 'closing';

// OCR 이미지 데이터 인터페이스
export interface OCRImageData {
  image: string;
  ocr_text: string;
  description: string;
  prompt: string;
}

// 카테고리별 참조 프롬프트 패턴
// 실제 올리브영 상세페이지 OCR 분석 결과에서 추출한 패턴
export const REFERENCE_PROMPT_PATTERNS: Record<string, Record<SectionPosition, string[]>> = {
  // 립 메이크업 카테고리
  '립메이크업': {
    intro: [
      'product photography of lipstick, elegant beauty product, centered hero composition, gradient background, soft diffused studio lighting, luxury beauty advertisement, premium cosmetic branding',
      'close-up shot of lip product on gradient background, surrounded by translucent gel, soft lighting, minimalist, luxury beauty ad style',
      'A luxurious beauty product advertisement, soft pink gradient background, lipsticks arranged in the center, rose gold cases, soft and diffused lighting',
    ],
    features: [
      'key ingredient visualization, fresh botanical elements with water droplets, detailed macro photography, clean background, natural soft lighting, scientific yet elegant aesthetic',
      'Close-up of lip product surrounded by transparent water droplets and rose petals on soft gradient background, floating effect, diffused lighting',
      'lipstick and container close-up, soft background with subtle waves texture and small gold particles, soft lighting, gentle highlights, minimalist',
    ],
    proof: [
      'close-up of beautiful woman applying lip product, soft background gradient, featuring statistics text in circular frames, soft lighting, clean and minimalist',
      'skin texture comparison, split screen composition showing improvement, even studio lighting, neutral background, clinical results visualization',
      'before and after lip application, professional beauty photography, natural lighting',
    ],
    usage: [
      'step by step beauty guide, model applying lip product, clear instructional composition, bright lighting, clean minimal background, how-to tutorial style',
      'close-up of lips with glossy application, clean white background, soft lighting, product color swatch beside lips',
      'two product shades on lips comparison, lipstick tubes visible, text labels below each shade, white background, soft lighting',
    ],
    closing: [
      'lip product collection showcase, complete lineup display, products arranged elegantly, gradient background, studio lighting, brand portfolio presentation',
      'multiple lip products in various angles and sizes, soft lighting, luxury beauty ad style, product arrangement',
      'beautiful model with lip product, gradient background, brand logo, award badges, soft lighting, clean and bright',
    ],
  },

  // 스킨케어 카테고리
  '스킨케어': {
    intro: [
      'elegant skincare product photography, centered hero composition, soft gradient background, diffused studio lighting, luxury beauty advertisement, premium cosmetic branding',
      'skincare bottle on minimalist background, water droplets, soft lighting, clean aesthetic, high-end beauty style',
      'premium skincare product with botanical elements, soft natural lighting, elegant composition',
    ],
    features: [
      'ingredient visualization for skincare, botanical elements, water droplets, macro photography, clean background, natural soft lighting, scientific aesthetic',
      'skincare texture close-up, cream swirl or serum drops, soft lighting, minimalist background',
      'key ingredients floating around product, transparent spheres, soft gradient background, elegant composition',
    ],
    proof: [
      'skin improvement comparison, before after visualization, clinical style, neutral background, professional lighting',
      'statistics and test results layout, circular frames with percentages, clean design, soft lighting',
      'model with glowing skin, close-up portrait, soft lighting, radiant complexion showcase',
    ],
    usage: [
      'skincare application tutorial, model applying product, step by step guide, clean background, bright lighting',
      'product amount guide, coin size reference, clean instructional layout, soft lighting',
      'skincare routine steps, numbered guide, minimalist design, clean composition',
    ],
    closing: [
      'skincare line collection, product family display, elegant arrangement, gradient background, studio lighting',
      'full skincare routine products, organized lineup, luxury presentation, soft lighting',
      'product with award badges, brand heritage display, premium positioning, elegant composition',
    ],
  },

  // 에센스 카테고리
  '에센스': {
    intro: [
      'premium essence bottle photography, glass texture highlight, soft gradient background, luxury lighting, high-end beauty aesthetic',
      'serum dropper with golden liquid, elegant product shot, minimalist composition, soft diffused lighting',
      'essence product hero shot, reflective surface, gradient background, premium cosmetic styling',
    ],
    features: [
      'essence texture visualization, liquid drops, molecular structure hint, clean background, scientific elegant style',
      'active ingredients floating, botanical extracts, water droplet effect, soft lighting, premium aesthetic',
      'serum concentration visualization, layered effect, clean design, luxury beauty style',
    ],
    proof: [
      'skin absorption comparison, before after skin texture, clinical documentation style, neutral lighting',
      'hydration test results, percentage statistics in elegant frames, clean layout, soft lighting',
      'model with hydrated glowing skin, close-up, soft lighting, radiant skin showcase',
    ],
    usage: [
      'essence application guide, dropper usage demonstration, clean instructional style, bright lighting',
      'drop amount guide, fingertip application, step by step, minimalist design',
      'layering guide with other products, skincare routine integration, clean layout',
    ],
    closing: [
      'essence product line collection, premium display, gradient background, luxury lighting',
      'product with brand signature elements, heritage display, elegant composition',
      'complete skincare set featuring essence, family shot, premium positioning',
    ],
  },

  // 선케어 카테고리
  '선케어': {
    intro: [
      'sunscreen product photography, bright and fresh composition, light gradient background, clean aesthetic, summer beauty style',
      'sun protection product hero shot, UV shield visual hint, soft lighting, premium suncare branding',
      'sunscreen tube or bottle, beach or outdoor hint in background, fresh and light mood',
    ],
    features: [
      'UV protection visualization, shield or barrier concept, clean scientific style, bright lighting',
      'lightweight texture demonstration, cream spread, non-greasy finish visualization',
      'key sun protection ingredients, molecular or scientific visualization, clean design',
    ],
    proof: [
      'SPF test results visualization, UV protection comparison, clinical style documentation',
      'no white cast demonstration, skin tone compatibility, before after application',
      'long-lasting protection test, time-based comparison, clean statistical layout',
    ],
    usage: [
      'sunscreen application guide, face and body application, step by step tutorial',
      'reapplication guide, amount reference (two-finger rule), instructional layout',
      'outdoor activity scenarios, proper sun protection usage, lifestyle integration',
    ],
    closing: [
      'suncare product line, complete sun protection range, bright fresh display',
      'product with summer lifestyle imagery, outdoor activity ready positioning',
      'sun protection collection, family or travel size options, organized display',
    ],
  },

  // 클렌징 카테고리
  '클렌징': {
    intro: [
      'cleansing product photography, pure and clean aesthetic, soft gradient background, fresh mood, gentle beauty style',
      'cleanser bottle with water splash, purity concept, soft lighting, clean composition',
      'cleansing foam or gel texture, bubble effect, minimalist background, fresh aesthetic',
    ],
    features: [
      'gentle cleansing ingredients visualization, natural botanical elements, clean scientific style',
      'foam texture close-up, rich lather demonstration, soft lighting, purity aesthetic',
      'cleansing mechanism visualization, dirt removal concept, clean educational style',
    ],
    proof: [
      'cleansing before after comparison, pore cleanliness, makeup removal demonstration',
      'skin pH balance test results, gentle formula proof, scientific visualization',
      'sensitive skin compatibility test, dermatologist tested badges, clinical style',
    ],
    usage: [
      'cleansing routine guide, double cleanse method, step by step tutorial',
      'foam creation guide, proper amount demonstration, instructional layout',
      'massage technique guide, cleansing motion instruction, clean design',
    ],
    closing: [
      'cleansing product line collection, complete cleansing routine display',
      'cleanser with complementary products, skincare routine starter, organized layout',
      'product with purity and freshness concept, clean lifestyle positioning',
    ],
  },

  // 기본 카테고리 (폴백)
  'default': {
    intro: [
      'elegant product photography, centered hero composition, soft gradient background, diffused studio lighting, luxury advertisement style',
      'premium product on minimalist background, soft lighting, clean aesthetic, high-end branding',
      'product hero shot with elegant composition, professional lighting, premium positioning',
    ],
    features: [
      'key feature visualization, clean design, soft lighting, informative yet elegant style',
      'product detail close-up, texture or quality highlight, minimalist background',
      'ingredient or technology visualization, scientific yet accessible style',
    ],
    proof: [
      'results comparison visualization, before after style, clean clinical documentation',
      'statistics and test results layout, percentage highlights, professional design',
      'customer satisfaction visualization, trust indicators, clean layout',
    ],
    usage: [
      'usage guide tutorial, step by step instruction, clear and bright lighting',
      'proper usage demonstration, amount guide, instructional design',
      'application technique guide, how-to tutorial style, clean composition',
    ],
    closing: [
      'product collection showcase, complete lineup display, elegant arrangement',
      'product family display, premium brand positioning, organized layout',
      'call to action ready composition, purchase motivation, elegant closing',
    ],
  },
};

// 카테고리별 비주얼 스타일 키워드 (description 분석 기반)
export const VISUAL_STYLE_KEYWORDS: Record<string, string[]> = {
  '립메이크업': ['soft pink gradient', 'rose gold', 'glossy texture', 'luxury beauty ad', 'minimalist', 'soft lighting', 'feminine'],
  '스킨케어': ['clean white', 'soft blue gradient', 'water droplets', 'fresh', 'hydrating', 'scientific', 'premium'],
  '에센스': ['golden liquid', 'glass texture', 'luxury', 'serum drops', 'premium aesthetic', 'elegant'],
  '선케어': ['bright', 'fresh', 'light blue', 'UV protection', 'summer', 'outdoor', 'clean'],
  '클렌징': ['pure', 'water splash', 'bubbles', 'fresh', 'gentle', 'soft', 'clean aesthetic'],
  '마스크팩': ['sheet mask', 'hydration', 'glow', 'relaxation', 'spa-like', 'soft'],
  '크림': ['rich texture', 'cream swirl', 'luxurious', 'nourishing', 'soft gradient', 'premium'],
  '토너': ['water texture', 'splash', 'refreshing', 'light', 'hydrating', 'clean'],
  '로션': ['light texture', 'smooth', 'hydrating', 'daily care', 'soft', 'fresh'],
  '헤어케어': ['hair flow', 'shine', 'healthy', 'natural', 'botanical', 'luxury'],
  '바디케어': ['body silhouette', 'smooth skin', 'relaxation', 'spa', 'natural', 'soft'],
  'default': ['minimalist', 'soft lighting', 'clean', 'elegant', 'professional', 'premium'],
};

// 섹션 위치별 권장 구도 (description 분석 기반)
export const SECTION_COMPOSITION_GUIDE: Record<SectionPosition, {
  layout: string;
  productPlacement: string;
  textPlacement: string;
  lighting: string;
  mood: string;
}> = {
  intro: {
    layout: '제품 중앙 배치, 상하 여백 충분',
    productPlacement: '화면 중앙 또는 중앙 상단, 45도 각도',
    textPlacement: '상단에 브랜드/제품명, 하단에 슬로건',
    lighting: '부드러운 스튜디오 조명, 그림자 최소화',
    mood: '고급스럽고 세련된, 첫인상 강조',
  },
  features: {
    layout: '제품과 성분/기술 요소 함께 배치',
    productPlacement: '한쪽에 제품, 반대쪽에 성분 시각화',
    textPlacement: '성분명과 효능 텍스트 분산 배치',
    lighting: '자연광 느낌, 성분에 하이라이트',
    mood: '과학적이면서 신뢰감 있는',
  },
  proof: {
    layout: 'Before/After 분할 또는 통계 원형 프레임',
    productPlacement: '결과 시각화 중심, 제품은 보조',
    textPlacement: '수치와 퍼센트 강조, 원형 프레임 활용',
    lighting: '균일하고 객관적인 조명',
    mood: '신뢰감과 객관성, 과학적 입증',
  },
  usage: {
    layout: 'Step-by-step 가이드 형식',
    productPlacement: '사용 중인 모습 또는 사용량 시각화',
    textPlacement: '단계별 번호와 설명, 팁 강조',
    lighting: '밝고 선명한 조명',
    mood: '친근하고 따라하기 쉬운',
  },
  closing: {
    layout: '제품 라인업 또는 CTA 강조',
    productPlacement: '여러 제품 정렬 또는 단일 제품 강조',
    textPlacement: '하단에 CTA 문구, 구매 유도',
    lighting: '고급스러운 스튜디오 조명',
    mood: '완성된 느낌, 구매 욕구 자극',
  },
};

// 카테고리에 맞는 참조 프롬프트 가져오기
export function getReferencePrompts(category: string, section: SectionPosition): string[] {
  // 정확히 일치하는 카테고리 찾기
  if (REFERENCE_PROMPT_PATTERNS[category]) {
    return REFERENCE_PROMPT_PATTERNS[category][section];
  }

  // 부분 일치 찾기
  const lowerCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(REFERENCE_PROMPT_PATTERNS)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return value[section];
    }
  }

  // 기본값 반환
  return REFERENCE_PROMPT_PATTERNS['default'][section];
}

// 카테고리에 맞는 비주얼 스타일 키워드 가져오기
export function getVisualStyleKeywords(category: string): string[] {
  if (VISUAL_STYLE_KEYWORDS[category]) {
    return VISUAL_STYLE_KEYWORDS[category];
  }

  const lowerCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(VISUAL_STYLE_KEYWORDS)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return value;
    }
  }

  return VISUAL_STYLE_KEYWORDS['default'];
}

// 섹션 타입을 위치로 매핑
export function mapSectionTypeToPosition(sectionType: string): SectionPosition {
  const mapping: Record<string, SectionPosition> = {
    'HERO': 'intro',
    'FEATURES': 'features',
    'SOCIAL_PROOF': 'proof',
    'HOW_TO_USE': 'usage',
    'FAQ': 'closing',
    'CUSTOM': 'features',
  };
  return mapping[sectionType] || 'features';
}

// Midjourney 스타일 파라미터
export const MIDJOURNEY_PARAMS = {
  aspectRatio: '--ar 3:4',
  version: '--v 5',
  stylize: '--stylize 300',
};

// 프롬프트에 Midjourney 파라미터 추가
export function addMidjourneyParams(prompt: string): string {
  return `${prompt} ${MIDJOURNEY_PARAMS.aspectRatio} ${MIDJOURNEY_PARAMS.version} ${MIDJOURNEY_PARAMS.stylize}`;
}
