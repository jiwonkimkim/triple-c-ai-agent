/**
 * 카테고리별 패턴 데이터
 * 올리브영 상세페이지 패턴 분석 기반 (398개 제품, 12,470개 이미지)
 */

import type {
  CategoryPattern,
  SectionPosition,
  SectionStoryGuide,
  SectionCompositionGuide,
  CategoryColorGuide,
  ExtendedCategoryPattern,
} from './types';

// ============================================
// 카피 길이 설정
// ============================================

export const COPY_LENGTH_CONFIG = {
  short: {
    hookLength: 50,
    sectionTitleLength: 15,
    sectionBodyLength: 100,
    description: '임팩트 있고 간결한',
    bulletPoints: 3,
    // 이미지 생성 설정
    maxTotalImages: 8,           // 전체 최대 이미지 수
    sectionImageMultiplier: 0.5, // suggestedImageCount에 곱할 배수
    minImagesPerSection: 1,      // 섹션당 최소 이미지 수
  },
  medium: {
    hookLength: 100,
    sectionTitleLength: 25,
    sectionBodyLength: 200,
    description: '균형 잡힌 정보 전달',
    bulletPoints: 4,
    // 이미지 생성 설정
    maxTotalImages: 12,
    sectionImageMultiplier: 0.7,
    minImagesPerSection: 1,
  },
  long: {
    hookLength: 150,
    sectionTitleLength: 35,
    sectionBodyLength: 400,
    description: '상세하고 설득력 있는',
    bulletPoints: 5,
    // 이미지 생성 설정
    maxTotalImages: 15,
    sectionImageMultiplier: 1.0,
    minImagesPerSection: 1,
  },
};

// ============================================
// 섹션별 위치 패턴
// ============================================

export const POSITION_PATTERNS: Record<SectionPosition, { text: string[]; visual: string[] }> = {
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
// 카테고리별 특화 패턴
// ============================================

export const CATEGORY_PATTERNS: Record<string, CategoryPattern> = {
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
    topStats: [{ text: 'statistics', visual: 'product-shot' }],
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
    topStats: [{ text: 'statistics (25회)', visual: 'product-shot (80회)' }],
  },
  '로션': {
    keywords: ['가벼운 보습', '산뜻한 마무리', '데일리 케어', '진정'],
    textPatterns: ['moisturizing', 'before-after', 'soothing', 'ingredients', 'statistics'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'ingredient-visual'],
    toneGuide: '매일 편하게 사용할 수 있는 가벼움 강조',
    topStats: [{ text: 'moisturizing (193회)', visual: 'product-shot (462회)' }],
  },
  '스킨': {
    keywords: ['수분', '피부결', '진정', '흡수'],
    textPatterns: ['moisturizing', 'before-after', 'soothing', 'statistics', 'ingredients'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'ingredient-visual'],
    toneGuide: '첫 스킨케어 단계의 중요성 강조',
    topStats: [{ text: 'moisturizing (226회)', visual: 'product-shot (540회)' }],
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
    topStats: [{ text: 'before-after (26회)', visual: 'product-shot (167회)' }],
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
    topStats: [{ text: 'before-after (97회)', visual: 'product-shot (760회)' }],
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
    topStats: [{ text: 'before-after', visual: 'product-shot' }],
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
    topStats: [{ text: 'statistics (169회)', visual: 'product-shot (473회)' }],
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
    topStats: [{ text: 'before-after (34회)', visual: 'product-shot (156회)' }],
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
    topStats: [{ text: 'before-after (141회)', visual: 'product-shot (506회)' }],
  },
  '키엘': {
    keywords: ['자연 유래', '약국 브랜드', '효능', '순수'],
    textPatterns: ['before-after', 'statistics', 'moisturizing', 'soothing', 'ingredients'],
    visualPatterns: ['product-shot', 'minimalist', 'soft-lighting', 'clean', 'luxury'],
    toneGuide: '자연 유래 성분과 검증된 효능 강조',
    topStats: [{ text: 'before-after (165회)', visual: 'product-shot (240회)' }],
  },

  // 패션/라이프스타일
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
  default: {
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

export const SECTION_STORY_GUIDE: Record<string, SectionStoryGuide> = {
  // MAIN: 올리브영 메인 썸네일 - 상세페이지 진입 전 제품 슬로건 이미지
  // 온라인몰 상품 리스트에서 클릭 유도하는 눈에 띄는 제품 대표 이미지
  MAIN: {
    position: 'intro',
    purpose: '상세페이지 진입 전 제품 슬로건 이미지 - 클릭 유도하는 눈에 띄는 썸네일',
    textEmphasis: ['제품 슬로건/별명', '수상 이력', '랭킹 정보 (1등/5년연속)', '프로모션 (증정/기획)'],
    visualEmphasis: [
      '제품 패키지 2-3배 크게 중앙-오른쪽 배치',
      '15도 기울어진 다이나믹 앵글',
      '비비드 그라데이션 배경 (핑크-블루, 민트-화이트, 코랄-핑크, 블루-퍼플)',
      '왼쪽 상단 배지/리본 아이콘 영역',
      '왼쪽 하단 미니 증정품 구성',
      '반짝이 파티클/보케 효과',
      '고채도 하이콘트라스트 색감',
    ],
    textTone: '임팩트 있는 슬로건, 숫자 강조 (1등, 5년, 3개, 역대최다)',
    bestPractices: [
      '제품 패키지가 떠있는 3D 입체감 연출',
      '핫핑크-스카이블루 또는 민트-화이트 그라데이션',
      '골든 어워즈 리본, 원형 배지 아이콘으로 수상 표현',
      '미니 사이즈/트래블킷 증정품 30% 스케일로 함께',
      '축제 분위기 스파클/컨페티 효과',
      '"국민세안제", "어워즈 1등", "5년 연속 수상" 같은 강렬한 슬로건',
      '모바일 쇼핑 썸네일 최적화 (4:5 비율)',
    ],
    copyGuide: {
      headline: '제품 슬로건 또는 별명 (예: "국민세안제", "어워즈 1등 세럼", "5년 연속 1위")',
      subheadline: '수상/랭킹 + 프로모션 (예: "올영어워즈 5관왕 | 본품+미니 기획")',
    },
  },
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
// 섹션 구도 가이드
// ============================================

export const SECTION_COMPOSITION_GUIDE: Record<SectionPosition, SectionCompositionGuide> = {
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

// ============================================
// 유틸리티 함수
// ============================================

export function getCategoryPattern(category: string): CategoryPattern {
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

export function getSectionStoryGuide(sectionType: string): SectionStoryGuide | undefined {
  return SECTION_STORY_GUIDE[sectionType];
}

// ============================================
// 카테고리별 색상 가이드
// Zen Editor 스타일 참고
// ============================================

export const CATEGORY_COLOR_GUIDE: Record<string, CategoryColorGuide> = {
  // 스킨케어 - 고민별 색상
  '스킨케어': {
    primary: '소프트 블루 (#4A90D9)',
    secondary: '라이트 아쿠아 (#7EC8E3)',
    background: '아이스 블루 (#F0F8FF)',
    rationale: '수분/보습 연상, 신뢰감과 청량함',
  },
  '보습': {
    primary: '딥 블루 (#2E86AB)',
    secondary: '아쿠아 (#00CED1)',
    background: '라이트 블루 (#E6F3FF)',
    rationale: '물, 수분, 촉촉함 연상',
  },
  '진정': {
    primary: '소프트 그린 (#7CB342)',
    secondary: '민트 (#98D8C8)',
    background: '페일 그린 (#F0FFF0)',
    rationale: '자연, 안정감, 진정 효과 연상',
  },
  '안티에이징': {
    primary: '로열 퍼플 (#7B1FA2)',
    secondary: '라벤더 (#E1BEE7)',
    background: '소프트 퍼플 (#F3E5F5)',
    rationale: '고급스러움, 프리미엄, 시간 초월',
  },
  '미백': {
    primary: '피치 (#FFAB91)',
    secondary: '코랄 핑크 (#FF8A80)',
    background: '크림 화이트 (#FFFAF0)',
    rationale: '맑은 피부, 광채, 환한 이미지',
  },
  '브라이트닝': {
    primary: '골든 옐로우 (#FFD54F)',
    secondary: '피치 (#FFCC80)',
    background: '아이보리 (#FFFEF2)',
    rationale: '광채, 빛나는 피부, 환한 톤',
  },

  // 선케어 - 상황별 색상
  '선케어': {
    primary: '선샤인 옐로우 (#FFD700)',
    secondary: '오렌지 (#FFA500)',
    background: '라이트 옐로우 (#FFFACD)',
    rationale: '태양, 자외선 차단, 활력',
  },
  '데일리선케어': {
    primary: '소프트 옐로우 (#FFF59D)',
    secondary: '피치 (#FFCC80)',
    background: '크림 (#FFFDD0)',
    rationale: '일상적 사용, 가볍고 편안함',
  },
  '톤업선크림': {
    primary: '라벤더 (#E6E6FA)',
    secondary: '소프트 핑크 (#FFB6C1)',
    background: '페일 라벤더 (#F8F4FF)',
    rationale: '피부 보정, 화사함, 여성스러움',
  },
  '스포츠선케어': {
    primary: '오션 블루 (#0077B6)',
    secondary: '터쿠아즈 (#40E0D0)',
    background: '스카이 블루 (#E0F7FA)',
    rationale: '아웃도어, 강한 차단력, 활동적',
  },

  // 클렌징
  '클렌징': {
    primary: '퓨어 화이트 (#FFFFFF)',
    secondary: '소프트 블루 (#B3E5FC)',
    background: '클린 화이트 (#FAFAFA)',
    rationale: '깨끗함, 순수함, 세정',
  },

  // 마스크팩
  '마스크팩': {
    primary: '스카이 블루 (#87CEEB)',
    secondary: '민트 (#98FF98)',
    background: '아이스 블루 (#F0FFFF)',
    rationale: '집중 케어, 시원함, 수분 충전',
  },

  // 메이크업 계열
  '메이크업': {
    primary: '로즈 골드 (#B76E79)',
    secondary: '블러쉬 핑크 (#FFC0CB)',
    background: '소프트 핑크 (#FFF0F5)',
    rationale: '여성스러움, 세련됨, 아름다움',
  },
  '립메이크업': {
    primary: '레드 (#E53935)',
    secondary: '로즈 (#E91E63)',
    background: '블러쉬 (#FFF5F5)',
    rationale: '입술, 관능미, 생기',
  },
  '립틴트': {
    primary: '체리 레드 (#C62828)',
    secondary: '코랄 (#FF7043)',
    background: '피치 블러쉬 (#FFF3E0)',
    rationale: '선명한 발색, 생기, 지속력',
  },
  '아이메이크업': {
    primary: '딥 브라운 (#5D4037)',
    secondary: '골드 (#FFD700)',
    background: '누드 베이지 (#FFF8E7)',
    rationale: '깊이감, 다양한 연출, 세련됨',
  },
  '베이스메이크업': {
    primary: '누드 베이지 (#D4A574)',
    secondary: '아이보리 (#FFFFF0)',
    background: '스킨 톤 (#FFF5EE)',
    rationale: '자연스러운 피부, 커버력, 완성도',
  },

  // 헤어/바디
  '헤어케어': {
    primary: '카카오 브라운 (#6D4C41)',
    secondary: '골든 브라운 (#C9A227)',
    background: '웜 베이지 (#F5F0E1)',
    rationale: '건강한 모발, 윤기, 영양',
  },
  '바디케어': {
    primary: '소프트 코랄 (#FF8A65)',
    secondary: '피치 (#FFDAB9)',
    background: '크림 (#FFFAF0)',
    rationale: '부드러운 피부, 향기, 편안함',
  },

  // 기본값
  'default': {
    primary: '프리미엄 블랙 (#1A1A1A)',
    secondary: '실버 그레이 (#C0C0C0)',
    background: '라이트 그레이 (#F5F5F5)',
    rationale: '세련됨, 고급스러움, 범용성',
  },
};

// ============================================
// 고민별 세부 색상 매핑
// ============================================

export const CONCERN_COLORS: Record<string, string> = {
  // 피부 고민
  '보습': '#4A90D9 (블루)',
  '수분': '#00CED1 (아쿠아)',
  '진정': '#7CB342 (그린)',
  '민감': '#98D8C8 (민트)',
  '트러블': '#66BB6A (그린)',
  '안티에이징': '#7B1FA2 (퍼플)',
  '탄력': '#9C27B0 (바이올렛)',
  '주름': '#8E24AA (딥 퍼플)',
  '미백': '#FFD54F (골드)',
  '브라이트닝': '#FFAB91 (피치)',
  '광채': '#FFC107 (앰버)',
  '모공': '#78909C (블루그레이)',
  '각질': '#A1887F (토프)',
  '피지': '#90A4AE (쿨그레이)',

  // 선케어 관련
  '자외선차단': '#FFD700 (옐로우)',
  '톤업': '#E6E6FA (라벤더)',
  '워터프루프': '#0077B6 (블루)',

  // 메이크업 관련
  '지속력': '#D4AF37 (골드)',
  '발색': '#E53935 (레드)',
  '커버력': '#D4A574 (베이지)',
};

// ============================================
// 확장된 카테고리 패턴 조회 (색상 포함)
// ============================================

export function getExtendedCategoryPattern(category: string): ExtendedCategoryPattern {
  const basePattern = getCategoryPattern(category);
  const colorGuide = CATEGORY_COLOR_GUIDE[category] || CATEGORY_COLOR_GUIDE['default'];

  // 카테고리에 맞는 고민별 색상 필터링
  const concernColors: Record<string, string> = {};
  const keywords = basePattern.keywords;

  for (const concern of Object.keys(CONCERN_COLORS)) {
    if (keywords.some(k => k.includes(concern) || concern.includes(k))) {
      concernColors[concern] = CONCERN_COLORS[concern];
    }
  }

  return {
    ...basePattern,
    colorGuide,
    concernColors: Object.keys(concernColors).length > 0 ? concernColors : undefined,
  };
}

/**
 * 색상 가이드를 프롬프트 문자열로 변환
 */
export function buildColorGuidePrompt(category: string): string {
  const extended = getExtendedCategoryPattern(category);

  if (!extended.colorGuide) {
    return '';
  }

  let prompt = `
### 카테고리 색상 가이드: ${category}

**메인 컬러:** ${extended.colorGuide.primary}
**보조 컬러:** ${extended.colorGuide.secondary}
**배경 컬러:** ${extended.colorGuide.background}
**색상 컨셉:** ${extended.colorGuide.rationale}
`;

  if (extended.concernColors && Object.keys(extended.concernColors).length > 0) {
    prompt += `
**고민별 강조 색상:**
${Object.entries(extended.concernColors).map(([concern, color]) => `- ${concern}: ${color}`).join('\n')}
`;
  }

  return prompt;
}
