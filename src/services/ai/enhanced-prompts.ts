/**
 * 고도화된 상세페이지 생성 프롬프트
 * 올리브영 상세페이지 패턴 분석 기반 (398개 제품, 12,470개 이미지)
 *
 * 분석 데이터 출처: pattern_analysis_results.json
 * - 섹션별 위치 패턴 (intro, features, proof, usage, closing)
 * - 카테고리별 텍스트/비주얼 패턴
 */

// ============================================
// 타입 정의
// ============================================

interface BrandContext {
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  ragContext?: string;
}

interface GenerateDetailPageInput {
  productImages: string[];
  productName: string;
  category: string;
  keyFeatures: string[];
  targetAudience: string;
  copyLength: 'short' | 'medium' | 'long';
  brandContext?: BrandContext | null;
  generateImages?: boolean;
}

// ============================================
// 카피 길이 설정 (고도화)
// ============================================

export const ENHANCED_COPY_LENGTH_CONFIG = {
  short: {
    hookLength: 50,
    sectionTitleLength: 15,
    sectionBodyLength: 100,
    description: '임팩트 있고 간결한',
    bulletPoints: 3,
  },
  medium: {
    hookLength: 100,
    sectionTitleLength: 25,
    sectionBodyLength: 200,
    description: '균형 잡힌 정보 전달',
    bulletPoints: 4,
  },
  long: {
    hookLength: 150,
    sectionTitleLength: 35,
    sectionBodyLength: 400,
    description: '상세하고 설득력 있는',
    bulletPoints: 5,
  },
};

// ============================================
// 섹션별 위치 패턴 (올리브영 분석 기반)
// 실제 12,470개 이미지에서 추출한 패턴
// ============================================

const POSITION_PATTERNS = {
  intro: {
    text: ['before-after', 'moisturizing', 'statistics', 'awards', 'soothing'],
    visual: ['product-shot', 'minimalist', 'soft-lighting', 'luxury', 'clean', 'model'],
  },
  features: {
    text: ['before-after', 'statistics', 'moisturizing', 'ingredients', 'soothing', 'clinical'],
    visual: ['product-shot', 'minimalist', 'soft-lighting', 'luxury', 'clean', 'ingredient-visual', 'closeup'],
  },
  proof: {
    text: ['before-after', 'statistics', 'moisturizing', 'ingredients', 'clinical', 'how-to'],
    visual: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'luxury', 'model', 'ingredient-visual'],
  },
  usage: {
    text: ['before-after', 'statistics', 'moisturizing', 'ingredients', 'how-to', 'tips'],
    visual: ['product-shot', 'minimalist', 'clean', 'soft-lighting', 'model', 'closeup'],
  },
  closing: {
    text: ['before-after', 'statistics', 'moisturizing', 'ingredients', 'awards', 'how-to'],
    visual: ['product-shot', 'minimalist', 'model', 'soft-lighting', 'luxury', 'gradient-bg'],
  },
};

// ============================================
// 카테고리별 특화 패턴 (올리브영 분석 기반)
// ============================================

const CATEGORY_PATTERNS: Record<string, {
  keywords: string[];
  textPatterns: string[];
  visualPatterns: string[];
  toneGuide: string;
  topStats: { text: string; visual: string }[];
}> = {
  // 스킨케어 계열
  '스킨케어': {
    keywords: ['보습', '수분', '진정', '탄력', '광채', '안티에이징'],
    textPatterns: ['before-after', 'statistics', 'moisturizing', 'anti-aging', 'soothing'],
    visualPatterns: ['product-shot', 'minimalist', 'luxury', 'soft-lighting', 'clean', 'gradient-bg'],
    toneGuide: '신뢰감 있고 과학적인 톤으로, 피부 고민 해결에 초점',
    topStats: [
      { text: 'before-after (341회)', visual: 'product-shot (1003회)' },
      { text: 'statistics (290회)', visual: 'minimalist (543회)' },
    ],
  },
  '에센스': {
    keywords: ['집중 케어', '고농축', '흡수력', '영양 공급', '탄력', '광채'],
    textPatterns: ['statistics', 'before-after', 'moisturizing', 'soothing', 'clinical', 'awards'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'luxury', 'model'],
    toneGuide: '프리미엄 스킨케어의 핵심 단계임을 강조, 수치 기반 효과 입증',
    topStats: [
      { text: 'statistics (275회)', visual: 'product-shot (768회)' },
      { text: 'before-after (250회)', visual: 'minimalist (425회)' },
    ],
  },
  '세럼': {
    keywords: ['집중 케어', '고농축', '흡수력', '영양 공급'],
    textPatterns: ['statistics', 'before-after', 'moisturizing', 'ingredients', 'clinical'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'luxury', 'clean'],
    toneGuide: '프리미엄 스킨케어의 핵심 단계임을 강조',
    topStats: [
      { text: 'statistics', visual: 'product-shot' },
    ],
  },
  '크림': {
    keywords: ['보습', '영양', '장벽 강화', '촉촉함', '진정'],
    textPatterns: ['moisturizing', 'statistics', 'before-after', 'soothing', 'ingredients'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'luxury', 'clean', 'gradient-bg'],
    toneGuide: '마무리 케어의 중요성과 지속력 강조',
    topStats: [
      { text: 'moisturizing (234회)', visual: 'product-shot (601회)' },
      { text: 'statistics (176회)', visual: 'minimalist (320회)' },
    ],
  },
  '토너': {
    keywords: ['피부결 정돈', '수분 첫 단계', '흡수 촉진', '진정'],
    textPatterns: ['statistics', 'soothing', 'before-after', 'anti-aging', 'moisturizing'],
    visualPatterns: ['product-shot', 'minimalist', 'clean', 'soft-lighting', 'model'],
    toneGuide: '스킨케어 루틴의 기초 단계임을 강조',
    topStats: [
      { text: 'statistics (25회)', visual: 'product-shot (80회)' },
    ],
  },
  '로션': {
    keywords: ['가벼운 보습', '산뜻한 마무리', '데일리 케어', '진정'],
    textPatterns: ['moisturizing', 'before-after', 'soothing', 'ingredients', 'statistics'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'ingredient-visual'],
    toneGuide: '매일 편하게 사용할 수 있는 가벼움 강조',
    topStats: [
      { text: 'moisturizing (193회)', visual: 'product-shot (462회)' },
    ],
  },
  '스킨': {
    keywords: ['수분', '피부결', '진정', '흡수'],
    textPatterns: ['moisturizing', 'before-after', 'soothing', 'statistics', 'ingredients'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'ingredient-visual'],
    toneGuide: '첫 스킨케어 단계의 중요성 강조',
    topStats: [
      { text: 'moisturizing (226회)', visual: 'product-shot (540회)' },
    ],
  },

  // 메이크업 계열
  '메이크업': {
    keywords: ['발색', '지속력', '커버력', '자연스러움'],
    textPatterns: ['before-after', 'tips', 'awards', 'how-to', 'statistics'],
    visualPatterns: ['product-shot', 'minimalist', 'clean', 'model', 'soft-lighting'],
    toneGuide: '트렌디하고 감각적인 톤, 실용적 팁 포함',
    topStats: [
      { text: 'before-after (172회)', visual: 'product-shot (644회)' },
      { text: 'tips (50회)', visual: 'minimalist (338회)' },
    ],
  },
  '립메이크업': {
    keywords: ['발색', '촉촉함', '지속력', '컬러'],
    textPatterns: ['before-after', 'cleansing', 'moisturizing', 'soothing', 'statistics'],
    visualPatterns: ['product-shot', 'minimalist', 'luxury', 'clean', 'soft-lighting', 'closeup'],
    toneGuide: '색상의 매력과 편안한 착용감 강조',
    topStats: [
      { text: 'before-after (26회)', visual: 'product-shot (167회)' },
    ],
  },
  '립틴트': {
    keywords: ['선명한 발색', '착색력', '생기', '지속력', '촉촉함'],
    textPatterns: ['before-after', 'moisturizing', 'brightening', 'statistics', 'how-to', 'tips'],
    visualPatterns: ['product-shot', 'luxury', 'soft-lighting', 'minimalist', 'closeup', 'model'],
    toneGuide: '생기 있는 입술 연출과 지속력 강조',
    topStats: [
      { text: 'before-after (89회)', visual: 'product-shot (889회)' },
      { text: 'moisturizing (52회)', visual: 'luxury (397회)' },
    ],
  },
  '립글로스': {
    keywords: ['윤기', '글로시', '촉촉', '볼륨'],
    textPatterns: ['before-after', 'statistics', 'ingredients', 'moisturizing', 'tips'],
    visualPatterns: ['product-shot', 'soft-lighting', 'model', 'closeup', 'luxury', 'minimalist'],
    toneGuide: '반짝이는 매력과 촉촉한 느낌 강조',
    topStats: [
      { text: 'before-after (97회)', visual: 'product-shot (760회)' },
    ],
  },
  '아이메이크업': {
    keywords: ['발색', '지속력', '블렌딩', '다양한 연출'],
    textPatterns: ['before-after', 'tips', 'how-to', 'statistics', 'ingredients'],
    visualPatterns: ['product-shot', 'minimalist', 'clean', 'luxury', 'soft-lighting', 'model', 'closeup'],
    toneGuide: '다양한 룩 연출법과 사용 팁 중심',
    topStats: [
      { text: 'before-after (83회)', visual: 'product-shot (459회)' },
      { text: 'tips (52회)', visual: 'minimalist (299회)' },
    ],
  },
  '마스카라': {
    keywords: ['볼륨', '길이', '컬링', '번짐 없는', '지속력'],
    textPatterns: ['before-after', 'statistics', 'ingredients', 'clinical', 'how-to', 'reviews'],
    visualPatterns: ['product-shot', 'minimalist', 'clean', 'luxury', 'soft-lighting', 'model', 'closeup'],
    toneGuide: '극적인 변화와 지속력 강조, Before/After 필수',
    topStats: [
      { text: 'before-after (235회)', visual: 'product-shot (826회)' },
      { text: 'statistics (102회)', visual: 'minimalist (474회)' },
    ],
  },
  '베이스메이크업': {
    keywords: ['커버력', '지속력', '피부 표현', '자연스러움'],
    textPatterns: ['before-after', 'how-to', 'tips', 'statistics'],
    visualPatterns: ['product-shot', 'model', 'clean', 'soft-lighting', 'closeup'],
    toneGuide: '자연스러운 피부 표현과 지속력 강조',
    topStats: [
      { text: 'before-after', visual: 'product-shot' },
    ],
  },

  // 클렌징/선케어
  '클렌징': {
    keywords: ['세정력', '순함', '저자극', '깔끔한 마무리', '진정'],
    textPatterns: ['cleansing', 'before-after', 'statistics', 'moisturizing', 'ingredients', 'soothing'],
    visualPatterns: ['product-shot', 'minimalist', 'clean', 'soft-lighting', 'ingredient-visual', 'model'],
    toneGuide: '순하면서도 확실한 클렌징력 강조',
    topStats: [
      { text: 'cleansing (350회)', visual: 'product-shot (801회)' },
      { text: 'before-after (216회)', visual: 'minimalist (473회)' },
    ],
  },
  '선케어': {
    keywords: ['자외선 차단', 'SPF/PA', '백탁 없는', '촉촉한', '진정'],
    textPatterns: ['moisturizing', 'before-after', 'statistics', 'soothing', 'ingredients', 'clinical'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'model', 'ingredient-visual'],
    toneGuide: '확실한 자외선 차단과 피부 편안함 강조',
    topStats: [
      { text: 'moisturizing (211회)', visual: 'product-shot (755회)' },
      { text: 'before-after (186회)', visual: 'minimalist (441회)' },
    ],
  },

  // 기타 케어
  '마스크팩': {
    keywords: ['집중 케어', '즉각 효과', '편리함', '수분 폭탄', '진정'],
    textPatterns: ['statistics', 'moisturizing', 'before-after', 'soothing', 'ingredients', 'clinical'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'luxury', 'clean', 'model'],
    toneGuide: '즉각적인 효과와 특별 케어 느낌 강조, 통계 수치 강조',
    topStats: [
      { text: 'statistics (255회)', visual: 'product-shot (588회)' },
      { text: 'moisturizing (199회)', visual: 'minimalist (335회)' },
    ],
  },
  '바디케어': {
    keywords: ['전신 보습', '향기', '피부결 개선', '촉촉함'],
    textPatterns: ['statistics', 'before-after', 'moisturizing', 'ingredients', 'soothing'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'model', 'clean', 'luxury'],
    toneGuide: '전신 케어의 즐거움과 효과 강조',
    topStats: [
      { text: 'statistics (169회)', visual: 'product-shot (473회)' },
    ],
  },
  '헤어케어': {
    keywords: ['모발 개선', '윤기', '두피 케어', '손상 케어'],
    textPatterns: ['before-after', 'statistics', 'ingredients', 'clinical', 'reviews', 'how-to'],
    visualPatterns: ['product-shot', 'model', 'minimalist', 'luxury', 'ingredient-visual', 'soft-lighting'],
    toneGuide: '건강한 모발로의 변화 강조, Before/After 중요',
    topStats: [
      { text: 'before-after (197회)', visual: 'product-shot (643회)' },
      { text: 'statistics (127회)', visual: 'model (307회)' },
    ],
  },
  '맨즈케어': {
    keywords: ['남성 전용', '간편함', '올인원', '피부 정돈'],
    textPatterns: ['before-after', 'statistics', 'ingredients', 'moisturizing', 'how-to'],
    visualPatterns: ['product-shot', 'minimalist', 'clean', 'luxury', 'model', 'soft-lighting'],
    toneGuide: '간편하면서도 효과적인 남성 케어 강조',
    topStats: [
      { text: 'before-after (34회)', visual: 'product-shot (156회)' },
    ],
  },

  // 럭셔리 브랜드
  '랑콤': {
    keywords: ['프리미엄', '기술력', '럭셔리', '안티에이징', '광채'],
    textPatterns: ['statistics', 'moisturizing', 'before-after', 'soothing', 'ingredients', 'brightening'],
    visualPatterns: ['product-shot', 'luxury', 'gradient-bg', 'model', 'soft-lighting'],
    toneGuide: '럭셔리 브랜드의 프리미엄 가치 강조',
    topStats: [
      { text: 'statistics (96회)', visual: 'product-shot (218회)' },
      { text: 'moisturizing (91회)', visual: 'luxury (197회)' },
    ],
  },
  '설화수': {
    keywords: ['한방', '전통', '안티에이징', '윤기', '탄력'],
    textPatterns: ['before-after', 'moisturizing', 'statistics', 'anti-aging', 'ingredients', 'cleansing'],
    visualPatterns: ['product-shot', 'luxury', 'minimalist', 'model', 'ingredient-visual'],
    toneGuide: '동양의 아름다움과 현대 과학의 조화 강조',
    topStats: [
      { text: 'before-after (86회)', visual: 'product-shot (260회)' },
      { text: 'moisturizing (77회)', visual: 'luxury (194회)' },
    ],
  },
  '에스티로더': {
    keywords: ['안티에이징', '리페어', '나이트 케어', '럭셔리'],
    textPatterns: ['statistics', 'before-after', 'moisturizing', 'anti-aging', 'awards'],
    visualPatterns: ['product-shot', 'luxury', 'soft-lighting', 'model', 'clean', 'minimalist'],
    toneGuide: '시간을 거스르는 럭셔리 안티에이징 강조',
    topStats: [
      { text: 'statistics (88회)', visual: 'product-shot (248회)' },
      { text: 'before-after (85회)', visual: 'luxury (197회)' },
    ],
  },
  '헤라': {
    keywords: ['K-뷰티', '메이크업', '모던', '세련됨'],
    textPatterns: ['before-after', 'statistics', 'ingredients', 'moisturizing', 'how-to'],
    visualPatterns: ['product-shot', 'minimalist', 'luxury', 'model', 'clean', 'soft-lighting'],
    toneGuide: '모던하고 세련된 K-뷰티 대표 브랜드 강조',
    topStats: [
      { text: 'before-after (141회)', visual: 'product-shot (506회)' },
    ],
  },
  '키엘': {
    keywords: ['자연 유래', '약국 브랜드', '효능', '순수'],
    textPatterns: ['before-after', 'statistics', 'moisturizing', 'soothing', 'ingredients'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'luxury'],
    toneGuide: '자연 유래 성분과 검증된 효능 강조',
    topStats: [
      { text: 'before-after (165회)', visual: 'product-shot (240회)' },
    ],
  },

  // 패션/라이프스타일 (일반 카테고리)
  '패션': {
    keywords: ['스타일', '트렌드', '핏', '퀄리티'],
    textPatterns: ['style', 'quality', 'versatility'],
    visualPatterns: ['product-shot', 'model', 'lifestyle'],
    toneGuide: '스타일리시하고 세련된 톤',
    topStats: [],
  },
  '가방': {
    keywords: ['디자인', '수납력', '내구성', '스타일'],
    textPatterns: ['design', 'functionality', 'quality'],
    visualPatterns: ['product-shot', 'lifestyle', 'detail'],
    toneGuide: '실용성과 디자인의 조화 강조',
    topStats: [],
  },
  '식품': {
    keywords: ['맛', '신선함', '영양', '품질'],
    textPatterns: ['quality', 'taste', 'nutrition'],
    visualPatterns: ['product-shot', 'fresh', 'appetizing'],
    toneGuide: '맛있고 건강한 느낌 강조',
    topStats: [],
  },
  '건강식품': {
    keywords: ['건강', '영양', '효능', '안전'],
    textPatterns: ['health', 'nutrition', 'clinical'],
    visualPatterns: ['product-shot', 'clean', 'scientific'],
    toneGuide: '과학적 근거와 건강 효능 강조',
    topStats: [],
  },
  '가전': {
    keywords: ['기능', '편리함', '스마트', '에너지 효율'],
    textPatterns: ['features', 'convenience', 'technology'],
    visualPatterns: ['product-shot', 'clean', 'modern'],
    toneGuide: '기술력과 편리함 강조',
    topStats: [],
  },

  // 기본값
  'default': {
    keywords: ['품질', '가치', '만족', '효과'],
    textPatterns: ['benefits', 'features', 'quality', 'statistics'],
    visualPatterns: ['product-shot', 'minimalist', 'clean', 'soft-lighting'],
    toneGuide: '제품의 핵심 가치와 효과 중심',
    topStats: [],
  },
};

// ============================================
// 섹션별 스토리 가이드
// ============================================

const SECTION_STORY_GUIDE = {
  HERO: {
    position: 'intro',
    purpose: '고객의 시선을 사로잡고 핵심 가치를 전달',
    textEmphasis: POSITION_PATTERNS.intro.text,
    visualEmphasis: POSITION_PATTERNS.intro.visual,
    textTone: '임팩트 있고 감성적, 핵심 키워드 강조',
    bestPractices: [
      '첫 문장에서 고객의 고민을 건드릴 것',
      '브랜드의 시그니처 톤앤매너 반영',
      '8자 이내의 강렬한 헤드라인',
      '수상 이력이나 인증 정보로 신뢰도 높이기',
    ],
    copyGuide: {
      headline: '5-10자의 감성적 한 마디 (예: "24시간 촉촉함", "윤기의 비밀")',
      subheadline: '10-20자의 구체적 정보 (예: "히알루론산 5중 복합체 함유")',
    },
  },
  FEATURES: {
    position: 'features',
    purpose: '제품의 차별점과 핵심 성분/기술 설명',
    textEmphasis: POSITION_PATTERNS.features.text,
    visualEmphasis: POSITION_PATTERNS.features.visual,
    textTone: '신뢰감 있는 정보 전달, 수치/퍼센트 활용',
    bestPractices: [
      '성분명과 함께 구체적 효능 명시',
      '경쟁 제품 대비 차별점 강조',
      '과학적 근거나 특허 정보 활용',
      '불릿 포인트로 핵심 정보 정리',
    ],
    copyGuide: {
      ingredientFormat: '성분명 + 효능 (예: "히알루론산 5중 복합체 - 깊은 보습, 피부 장벽 강화")',
      bulletStyle: '각 특징을 "~하여 ~합니다" 형식으로 효과 중심 설명',
    },
  },
  SOCIAL_PROOF: {
    position: 'proof',
    purpose: '효과 입증 및 신뢰 구축',
    textEmphasis: POSITION_PATTERNS.proof.text,
    visualEmphasis: POSITION_PATTERNS.proof.visual,
    textTone: '객관적, 수치 기반, 신뢰성 강조',
    bestPractices: [
      '구체적인 숫자와 퍼센트 사용 (예: 92% 만족도)',
      '실제 사용자의 목소리 인용',
      '테스트 조건 명시로 신뢰도 향상 (예: *20-50대 여성 100명 대상)',
      'Before/After 비교로 변화 시각화',
    ],
    copyGuide: {
      statisticFormat: '수치 + 지표 + 설명 (예: "92% - 수분량 증가, 4주 사용 후 측정")',
      reviewFormat: '"실제 후기 내용" - 리뷰어 정보(연령대/피부타입)',
    },
  },
  HOW_TO_USE: {
    position: 'usage',
    purpose: '올바른 사용법 안내 및 기대 효과 제시',
    textEmphasis: POSITION_PATTERNS.usage.text,
    visualEmphasis: POSITION_PATTERNS.usage.visual,
    textTone: '친근하고 실용적, 행동 유도',
    bestPractices: [
      '3-4단계로 간결하게 정리',
      '적정 사용량을 시각적으로 표현 (콩알, 동전 크기)',
      '함께 사용하면 좋은 제품 추천 (크로스셀링)',
      '사용 팁으로 추가 가치 제공',
    ],
    copyGuide: {
      stepFormat: 'Step N. 제목 - 설명 (예: "Step 1. 세안 후 - 토너로 피부결을 정돈해주세요")',
      tipFormat: 'TIP: 구체적인 사용 팁 (예: "밤 루틴에 사용하면 더욱 효과적!")',
    },
  },
  FAQ: {
    position: 'closing',
    purpose: '구매 장벽 해소 및 전환 유도',
    textEmphasis: POSITION_PATTERNS.closing.text,
    visualEmphasis: POSITION_PATTERNS.closing.visual,
    textTone: '행동 유도, 긴급성/희소성 활용',
    bestPractices: [
      '실제 고객이 궁금해하는 질문 선별',
      '구매 결정을 돕는 정보 제공 (용량, 사용 기간 등)',
      '명확한 Call-to-Action 포함',
      '제품 라인업 소개로 크로스셀링 유도',
    ],
    copyGuide: {
      faqFormat: 'Q: 실제 궁금할 질문\nA: 명확하고 도움되는 답변',
      ctaFormat: '행동 유도 문구 (예: "지금 만나보세요", "나만의 루틴 시작")',
    },
  },
};

// ============================================
// 카테고리 패턴 조회 함수
// ============================================

function getCategoryPattern(category: string) {
  // 정확히 일치하는 카테고리 찾기
  if (CATEGORY_PATTERNS[category]) {
    return CATEGORY_PATTERNS[category];
  }

  // 부분 일치 찾기
  const lowerCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_PATTERNS)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return value;
    }
  }

  // 기본값 반환
  return CATEGORY_PATTERNS['default'];
}

// ============================================
// 고도화된 시스템 프롬프트 빌더
// ============================================

export function buildEnhancedSystemPrompt(
  copyLength: 'short' | 'medium' | 'long',
  brandContext?: BrandContext | null,
  category?: string
): string {
  const lengthConfig = ENHANCED_COPY_LENGTH_CONFIG[copyLength];
  const categoryPattern = getCategoryPattern(category || 'default');

  let systemPrompt = `당신은 한국 이커머스 상세페이지 전문 마케팅 카피라이터입니다.
올리브영, 무신사, 쿠팡 등 주요 플랫폼에서 검증된 상세페이지 패턴을 기반으로 작성합니다.

## 올리브영 패턴 분석 기반 인사이트 (398개 제품, 12,470개 이미지 분석)

### 섹션별 효과적인 텍스트 패턴

**도입부 (HERO)**
- 주요 패턴: ${POSITION_PATTERNS.intro.text.slice(0, 3).join(', ')}
- 시각적 스타일: ${POSITION_PATTERNS.intro.visual.slice(0, 4).join(', ')}

**특징부 (FEATURES)**
- 주요 패턴: ${POSITION_PATTERNS.features.text.slice(0, 3).join(', ')}
- 시각적 스타일: ${POSITION_PATTERNS.features.visual.slice(0, 4).join(', ')}

**증명부 (SOCIAL_PROOF)**
- 주요 패턴: ${POSITION_PATTERNS.proof.text.slice(0, 3).join(', ')}
- 시각적 스타일: ${POSITION_PATTERNS.proof.visual.slice(0, 4).join(', ')}

**사용법 (HOW_TO_USE)**
- 주요 패턴: ${POSITION_PATTERNS.usage.text.slice(0, 3).join(', ')}
- 시각적 스타일: ${POSITION_PATTERNS.usage.visual.slice(0, 4).join(', ')}

**마무리 (FAQ/CTA)**
- 주요 패턴: ${POSITION_PATTERNS.closing.text.slice(0, 3).join(', ')}
- 시각적 스타일: ${POSITION_PATTERNS.closing.visual.slice(0, 4).join(', ')}

## 핵심 원칙

### 1. 스토리텔링 구조
상세페이지는 단순한 제품 설명이 아닌, 고객의 구매 여정을 설계하는 것입니다:
고객의 고민 공감 → 해결책 제시 → 신뢰 구축 → 구매 전환

### 2. 섹션별 역할

**[HERO] 도입부**
- 목적: ${SECTION_STORY_GUIDE.HERO.purpose}
- 스타일: ${SECTION_STORY_GUIDE.HERO.textTone}
- 핵심: 첫 3초 안에 스크롤을 멈추게 할 것
- 카피 가이드: ${SECTION_STORY_GUIDE.HERO.copyGuide.headline}

**[FEATURES] 특징부**
- 목적: ${SECTION_STORY_GUIDE.FEATURES.purpose}
- 스타일: ${SECTION_STORY_GUIDE.FEATURES.textTone}
- 핵심: "왜 이 제품이어야 하는가"에 답할 것
- 카피 가이드: ${SECTION_STORY_GUIDE.FEATURES.copyGuide.bulletStyle}

**[SOCIAL_PROOF] 증명부**
- 목적: ${SECTION_STORY_GUIDE.SOCIAL_PROOF.purpose}
- 스타일: ${SECTION_STORY_GUIDE.SOCIAL_PROOF.textTone}
- 핵심: 숫자와 실제 후기로 신뢰 구축
- 카피 가이드: ${SECTION_STORY_GUIDE.SOCIAL_PROOF.copyGuide.statisticFormat}

**[HOW_TO_USE] 사용법**
- 목적: ${SECTION_STORY_GUIDE.HOW_TO_USE.purpose}
- 스타일: ${SECTION_STORY_GUIDE.HOW_TO_USE.textTone}
- 핵심: "나도 쉽게 따라할 수 있겠다" 느낌
- 카피 가이드: ${SECTION_STORY_GUIDE.HOW_TO_USE.copyGuide.stepFormat}

**[FAQ] 마무리**
- 목적: ${SECTION_STORY_GUIDE.FAQ.purpose}
- 스타일: ${SECTION_STORY_GUIDE.FAQ.textTone}
- 핵심: 구매 망설임 해소, 행동 유도
- 카피 가이드: ${SECTION_STORY_GUIDE.FAQ.copyGuide.ctaFormat}

### 3. 카피 작성 가이드라인

**길이 설정: ${lengthConfig.description}**
- 훅 메시지: 약 ${lengthConfig.hookLength}자
- 섹션 제목: 약 ${lengthConfig.sectionTitleLength}자
- 섹션 본문: 약 ${lengthConfig.sectionBodyLength}자
- 불릿 포인트: ${lengthConfig.bulletPoints}개 이내

${category ? `**카테고리 특화: ${category}**
- 강조 키워드: ${categoryPattern.keywords.join(', ')}
- 텍스트 패턴: ${categoryPattern.textPatterns.slice(0, 4).join(', ')}
- 톤 가이드: ${categoryPattern.toneGuide}
${categoryPattern.topStats.length > 0 ? `- 분석 기반 인사이트: ${categoryPattern.topStats.map(s => s.text).join(', ')}` : ''}` : ''}

### 4. 작성 시 주의사항
- 모든 텍스트는 한국어로 작성
- 과장된 표현 자제, 신뢰할 수 있는 표현 사용
- 타겟 고객의 언어로 작성
- 감성적 어필과 기능적 정보의 균형 유지
- 통계 수치는 구체적으로 (예: "많은 사람들" → "92% 사용자")
- **이모지(😊, ✨, 💕 등) 절대 사용 금지** - 순수 텍스트만 작성
`;

  // 브랜드 컨텍스트 추가
  if (brandContext) {
    systemPrompt += `
### 5. 브랜드 가이드라인

**브랜드명:** ${brandContext.name}

**브랜드 아이덴티티:**
${brandContext.identity}

**톤앤매너:**
${brandContext.toneAndManner}

**비주얼 키워드:** ${brandContext.imageKeywords.join(', ')}

※ 모든 카피는 위 브랜드 가이드라인을 철저히 준수해야 합니다.
`;

    if (brandContext.ragContext) {
      systemPrompt += `
**브랜드 참고 자료:**
${brandContext.ragContext}
`;
    }
  }

  return systemPrompt;
}

// ============================================
// 고도화된 사용자 프롬프트 빌더
// ============================================

export function buildEnhancedUserPrompt(input: GenerateDetailPageInput): string {
  const categoryPattern = getCategoryPattern(input.category);
  const lengthConfig = ENHANCED_COPY_LENGTH_CONFIG[input.copyLength];

  return `다음 제품의 상세페이지 콘텐츠를 생성해주세요.

## 제품 정보

**제품명:** ${input.productName}
**카테고리:** ${input.category}
**타겟 고객:** ${input.targetAudience}

**주요 특징:**
${input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 카테고리 특화 가이드 (올리브영 패턴 분석 기반)

이 제품은 "${input.category}" 카테고리입니다.
- 강조 키워드: ${categoryPattern.keywords.join(', ')}
- 효과적인 텍스트 패턴: ${categoryPattern.textPatterns.slice(0, 4).join(', ')}
- 톤 가이드: ${categoryPattern.toneGuide}
${categoryPattern.topStats.length > 0 ? `- 인사이트: ${categoryPattern.topStats[0].text}가 가장 효과적` : ''}

## 생성 요청

아래 JSON 형식으로 콘텐츠를 생성해주세요:

{
  "hookMessage": "고객의 시선을 사로잡는 핵심 메시지 (${lengthConfig.hookLength}자 내외)",
  "sections": [
    {
      "type": "HERO",
      "title": "감성적이고 임팩트 있는 제목 (5-10자)",
      "body": "브랜드 아이덴티티와 제품의 핵심 가치를 전달하는 도입부. 고객의 고민에 공감하며 시작."
    },
    {
      "type": "FEATURES",
      "title": "핵심 성분/기술력을 강조하는 제목",
      "body": "주요 특징을 불릿 포인트로 정리. 각 특징에 대한 구체적인 효과 설명. '~하여 ~합니다' 형식 사용."
    },
    {
      "type": "SOCIAL_PROOF",
      "title": "신뢰를 구축하는 제목 (예: 임상 테스트 결과)",
      "body": "구체적인 수치와 통계 (예: 92% 만족도). 실제 사용자 후기 톤. Before/After 효과 언급."
    },
    {
      "type": "HOW_TO_USE",
      "title": "사용법 안내 제목",
      "body": "Step 1, 2, 3 형식의 간결한 사용법. 적정 사용량 (예: 콩알 크기). 사용 팁 포함."
    },
    {
      "type": "FAQ",
      "title": "자주 묻는 질문",
      "body": "Q&A 형식 또는 구매 결정을 돕는 추가 정보. '지금 만나보세요' 같은 CTA로 마무리."
    }
  ]
}

## 작성 지침 (올리브영 베스트셀러 패턴 기반)

1. **HERO 섹션**
   - 타겟 고객(${input.targetAudience})의 고민에 공감하는 문장으로 시작
   - 제품이 해결해주는 핵심 가치 1가지에 집중
   - before-after, moisturizing 패턴 활용

2. **FEATURES 섹션**
   - 주요 특징 ${input.keyFeatures.length}가지를 각각 구체적으로 설명
   - statistics, ingredients 패턴 활용
   - "~하여 ~합니다" 형식의 효과 중심 문장

3. **SOCIAL_PROOF 섹션**
   - 구체적인 수치 필수 사용 (예: 92% 만족도, 3.5배 수분 증가)
   - 실제 사용자 톤의 후기 (예: "민감한 제 피부에도 자극 없이 촉촉해요!")
   - before-after, statistics, clinical 패턴 활용

4. **HOW_TO_USE 섹션**
   - 3-4단계로 간결하게 정리
   - 적정 사용량 필수 언급 (예: 콩알 크기, 500원 동전)
   - how-to, tips 패턴 활용

5. **FAQ 섹션**
   - 실제 궁금할 질문 2-3개
   - 구매 결정에 도움되는 정보
   - "지금 만나보세요" 같은 명확한 CTA로 마무리

## ⚠️ 중요: 이모지 사용 금지
- 이모지(😊, ✨, 💕, 🌟, ❤️ 등)를 절대 사용하지 마세요
- 순수 텍스트만 작성해주세요
- 특수문자나 기호로 꾸미지 마세요

JSON 객체만 반환하고, 추가 설명은 포함하지 마세요.`;
}

// ============================================
// 이미지 생성 프롬프트 빌더 (올리브영 패턴 기반)
// 중요: 이미지에는 텍스트를 포함하지 않음 (텍스트는 별도 오버레이)
// ============================================

/**
 * 제품 일관성을 위한 참조 인터페이스
 * 모든 섹션에서 동일한 제품 외형을 유지하기 위해 사용
 */
export interface ProductVisualReference {
  // 제품 외형 상세 설명 (예: "원형 블랙 케이스의 쿠션 파운데이션, 금색 로고 각인")
  appearance?: string;
  // 제품 색상 (예: "black case with gold accents")
  colorScheme?: string;
  // 패키지 형태 (예: "circular compact case")
  packageShape?: string;
  // 브랜드 시각 요소 (예: "minimalist luxury")
  brandVisual?: string;
}

/**
 * 제품 일관성 지시문 생성
 * 모든 섹션 이미지에서 동일한 제품이 표시되도록 강제
 */
function buildProductConsistencyInstruction(
  productName: string,
  _category: string,
  visualReference?: ProductVisualReference
): string {
  const baseInstruction = `CRITICAL - PRODUCT CONSISTENCY: The exact same "${productName}" product must appear identically across all images. Maintain consistent product design, shape, color, packaging, and branding elements throughout all sections.`;

  if (visualReference) {
    const details = [
      visualReference.appearance && `Product appearance: ${visualReference.appearance}`,
      visualReference.colorScheme && `Color scheme: ${visualReference.colorScheme}`,
      visualReference.packageShape && `Package shape: ${visualReference.packageShape}`,
      visualReference.brandVisual && `Brand visual style: ${visualReference.brandVisual}`,
    ].filter(Boolean).join('. ');

    return `${baseInstruction} ${details}`;
  }

  return `${baseInstruction} Use identical product rendering in every shot - same angles show same details, consistent lighting on product surface, uniform product proportions.`;
}

export function buildEnhancedImagePrompt(
  section: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle?: string,
  visualReference?: ProductVisualReference
): string {
  const categoryPattern = getCategoryPattern(category);
  const sectionGuide = SECTION_STORY_GUIDE[section];

  // 올리브영 분석 기반 비주얼 키워드
  const visualKeywords = sectionGuide.visualEmphasis.slice(0, 4).join(', ');
  const categoryVisual = categoryPattern.visualPatterns.slice(0, 3).join(', ');

  // 텍스트 제외 지시 (이미지에는 제품만, 텍스트는 별도 오버레이)
  const noTextInstruction = 'absolutely no text, no typography, no letters, no words, no labels, no watermarks, text-free image only';

  // 제품 일관성 지시문
  const consistencyInstruction = buildProductConsistencyInstruction(productName, category, visualReference);

  // 제품 외형 참조 (있으면 사용)
  const productAppearance = visualReference?.appearance
    ? `${productName} (${visualReference.appearance})`
    : productName;

  const basePrompts: Record<string, string> = {
    HERO: `[${consistencyInstruction}] product photography of ${productAppearance}, elegant ${category} product, centered hero composition, gradient background, soft diffused studio lighting, subtle reflection, luxury beauty advertisement, premium cosmetic branding, high-end minimalist aesthetic, ${visualKeywords}, ${categoryVisual}, 8k resolution, ${noTextInstruction}`,

    FEATURES: `[${consistencyInstruction}] ${productAppearance} with key ingredient visualization for ${category}, ${keyFeatures[0] || 'natural ingredients'}, the SAME product from HERO section displayed alongside fresh botanical elements with water droplets, detailed macro photography, clean background, natural soft lighting, scientific yet elegant aesthetic, ingredient showcase, ${visualKeywords}, ${categoryVisual}, high detail, ${noTextInstruction}`,

    SOCIAL_PROOF: `[${consistencyInstruction}] ${productAppearance} shown with skin texture comparison for ${category}, the SAME product from previous sections, split screen composition showing skin improvement with product visible, even studio lighting, neutral background, clinical results visualization, professional dermatology style, ${visualKeywords}, ${categoryVisual}, trust-building imagery, ${noTextInstruction}`,

    HOW_TO_USE: `[${consistencyInstruction}] beauty application tutorial featuring ${productAppearance}, the SAME product from previous sections, korean model applying the IDENTICAL ${category} product, clear instructional composition, bright lighting, clean minimal background, how-to tutorial style, easy to follow visual guide, ${visualKeywords}, ${categoryVisual}, aspirational lifestyle, ${noTextInstruction}`,

    FAQ: `[${consistencyInstruction}] ${productAppearance} collection showcase, the SAME product from all previous sections as the hero item, complete lineup display with IDENTICAL main product, products arranged elegantly, gradient background, studio lighting, brand portfolio presentation, premium product range, ${visualKeywords}, ${categoryVisual}, ${noTextInstruction}`,
  };

  const styleAddition = brandStyle ? `, brand style: ${brandStyle}` : ', modern, clean, professional';

  return `${basePrompts[section]}${styleAddition}`;
}

// ============================================
// 이미지 오버레이용 텍스트 생성 프롬프트 빌더
// 이미지 위에 올라갈 텍스트를 별도로 생성
// ============================================

export interface OverlayTextContent {
  headline?: string;        // 대제목 (5-10자)
  subheadline?: string;     // 부제목 (10-20자)
  body?: string;            // 본문 (20-50자)
  statistics?: string[];    // 수치/통계 (예: "92%", "3.5배")
  cta?: string;             // 행동 유도 문구 (5-10자)
}

export function buildOverlayTextPrompt(
  section: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string
): string {
  const categoryPattern = getCategoryPattern(category);
  const sectionGuide = SECTION_STORY_GUIDE[section];

  const textPatterns = categoryPattern.textPatterns.slice(0, 3).join(', ');

  return `당신은 한국 뷰티/화장품 브랜드의 시니어 카피라이터입니다.
상세페이지 이미지에 오버레이될 텍스트를 작성합니다.

## 작성 원칙
1. **간결함**: 이미지에서 빠르게 읽힐 수 있도록 최대한 짧게
2. **임팩트**: 핵심 메시지가 즉각 전달되도록
3. **감성+기능**: 감성적 어필과 기능적 정보의 균형
4. **행동 유도**: 다음 이미지로 스크롤하거나 구매하도록 유도

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 타겟: ${targetAudience}
- 핵심 특징: ${keyFeatures.join(', ')}

## 섹션: ${section}
- 목적: ${sectionGuide.purpose}
- 톤: ${sectionGuide.textTone}
- 권장 패턴: ${textPatterns}

## 카피 유형별 가이드

### 헤드라인 (대제목)
- 글자 수: 5-10자
- 역할: 핵심 베네핏 한 마디로 전달
- 예시: "24시간 촉촉함", "윤기의 비밀", "피부가 달라진다"

### 서브헤드라인 (부제목)
- 글자 수: 10-20자
- 역할: 헤드라인 보완, 구체적 정보 추가
- 예시: "히알루론산 5중 복합체 함유", "임상 테스트 완료"

### 본문 텍스트
- 글자 수: 20-50자
- 역할: 상세 설명, 성분/효능 정보

### 숫자/통계
- 형식: XX% 또는 X배
- 역할: 신뢰도 증가, 효과 수치화
- 예시: "92% 만족", "수분 3.5배 증가"

### CTA (행동 유도)
- 글자 수: 5-10자
- 역할: 구매/행동 유도
- 예시: "지금 만나보세요", "나만의 루틴 시작"

## ⚠️ 중요: 이모지 사용 금지
- 이모지(😊, ✨, 💕, 🌟, ❤️ 등)를 절대 사용하지 마세요
- 순수 텍스트만 작성해주세요

## 요청
${section} 섹션에 적합한 오버레이 텍스트를 JSON 형식으로 생성해주세요:

{
  "headline": "대제목 (5-10자)",
  "subheadline": "부제목 (10-20자)",
  "body": "본문 텍스트 (필요시)",
  "statistics": ["수치1", "수치2"],
  "cta": "행동 유도 문구 (필요시)"
}

JSON만 반환하세요. 이모지 없이 순수 텍스트만 포함해야 합니다.`;
}

// ============================================
// 기존 함수와의 호환성을 위한 래퍼
// ============================================

// 기존 buildSystemPrompt 대체용
export function buildSystemPrompt(
  copyLength: 'short' | 'medium' | 'long',
  brandContext?: BrandContext | null
): string {
  return buildEnhancedSystemPrompt(copyLength, brandContext);
}

// 기존 buildUserPrompt 대체용
export function buildUserPrompt(input: GenerateDetailPageInput): string {
  return buildEnhancedUserPrompt(input);
}
