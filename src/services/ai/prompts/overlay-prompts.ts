/**
 * 오버레이 텍스트 프롬프트 빌더
 * 실제 올리브영 상세페이지 OCR 분석 기반 고도화
 * ★ 섹션별 실제 패턴 반영
 * ★ 2차 고도화: 넘버링, 컬러차트, 감각 표현 추가
 */

import type { SectionType } from './types';
import { getCategoryPattern, SECTION_STORY_GUIDE } from './category-patterns';

// ============================================
// 감각적 표현 키워드 (카테고리별)
// ============================================

const SENSORY_KEYWORDS: Record<string, {
  texture: string[];       // 텍스처 표현
  visual: string[];        // 시각적 표현
  feeling: string[];       // 감촉/느낌
  result: string[];        // 결과 표현
}> = {
  skincare: {
    texture: ['촉촉한', '쫀쫀한', '탱글탱글', '부드러운', '실키한', '산뜻한'],
    visual: ['맑은', '투명한', '광채', '윤기', '글로우', '생기'],
    feeling: ['진정되는', '편안한', '가벼운', '흡수 빠른', '끈적임 없는'],
    result: ['탄탄한', '매끈한', '건강한', '차오르는', '살아나는'],
  },
  makeup: {
    texture: ['탱글', '영롱', '글로시', '매트', '벨벳', '새틴'],
    visual: ['맑은', '선명한', '고급스러운', '영롱한', '반짝이는', '투명한'],
    feeling: ['가벼운', '밀착되는', '부드러운', '매끄러운', '편안한'],
    result: ['선명한', '또렷한', '생생한', '오래가는', '번짐없는'],
  },
  suncare: {
    texture: ['가벼운', '산뜻한', '촉촉한', '에센스', '수분감'],
    visual: ['투명한', '맑은', '톤업', '자연스러운', '뽀얀'],
    feeling: ['끈적임 없는', '상쾌한', '시원한', '산뜻한'],
    result: ['보호되는', '차단되는', '지속되는', '케어되는'],
  },
  cleansing: {
    texture: ['부드러운', '폼', '젤', '오일', '밀크', '크리미'],
    visual: ['맑은', '깨끗한', '투명한', '촉촉한'],
    feeling: ['상쾌한', '개운한', '순한', '자극없는', '부드러운'],
    result: ['깨끗한', '말끔한', '산뜻한', '촉촉한', '건강한'],
  },
};

// ============================================
// 넘버링/포인트 패턴 (피처 강조용)
// ============================================

const NUMBERING_PATTERNS = {
  point: ['Point 01', 'Point 02', 'Point 03'],
  number: ['01', '02', '03', '04'],
  step: ['STEP 1', 'STEP 2', 'STEP 3', 'STEP 4'],
  english: ['1. {Feature}', '2. {Feature}', '3. {Feature}'],
  korean: ['{기능} 01', '{기능} 02', '{기능} 03'],
};

// ============================================
// 세대/진화/NEW 표현 패턴
// ============================================

const GENERATION_EXPRESSIONS = {
  new: ['NEW', 'NEW ARRIVAL', '신제품', '새로운'],
  generation: ['{X}세대', '진화된', '업그레이드된', '새로워진'],
  version: ['Ver.{X}', 'v{X}', '리뉴얼'],
  improved: ['더 강력해진', '더 촉촉해진', '더 오래가는', '더 선명해진'],
};

// ============================================
// 컬러차트 패턴 (메이크업용)
// ============================================

const COLOR_CHART_PATTERNS = {
  format: '{영문명} {한글명}',  // "PINK FLAKE 핑크 플레이크"
  lipColors: [
    { en: 'PINK FLAKE', ko: '핑크 플레이크' },
    { en: 'SUNLIT CORAL', ko: '선릿 코랄' },
    { en: 'ROSY NUDE', ko: '로지 누드' },
    { en: 'BERRY BLOOM', ko: '베리 블룸' },
  ],
  eyeColors: [
    { en: 'CHAMPAGNE', ko: '샴페인' },
    { en: 'ROSE GOLD', ko: '로즈 골드' },
    { en: 'MINK BROWN', ko: '밍크 브라운' },
  ],
  sectionHeaders: ['Color Chart', 'COLORS', 'SHADES', '컬러 라인업'],
};

// ============================================
// ★ 실제 상세페이지 텍스트 스타일 가이드 (이미지 분석 기반)
// ============================================

export const TEXT_STYLE_GUIDE = {
  // 폰트 스타일
  fonts: {
    brand: {
      style: 'serif',           // 브랜드명은 세리프체
      letterSpacing: 'wide',    // 자간 넓게 (0.1em~0.2em)
      textTransform: 'uppercase',
    },
    headline: {
      korean: 'sans-serif',     // 한글 헤드라인은 산세리프 (고딕)
      english: 'serif',         // 영문 헤드라인은 세리프 가능
      fontWeight: 'bold',       // 700
    },
    sectionTitle: {
      style: 'serif',           // 섹션 타이틀 (BENEFIT, TEXTURE 등)
      decoration: 'underline',  // 언더라인 장식
      letterSpacing: 'wide',
    },
    body: {
      style: 'sans-serif',
      fontWeight: 'normal',     // 400
      lineHeight: 1.6,
    },
    statistics: {
      style: 'sans-serif',
      fontWeight: 'bold',       // 숫자는 항상 bold
    },
  },

  // 밝은 배경 (핑크, 베이지, 화이트) 색상 팔레트
  lightBackground: {
    headline: '#333333',        // 진한 회색/검정
    subheadline: '#666666',     // 중간 회색
    body: '#888888',            // 밝은 회색
    sectionTitle: '#d4a5a5',    // 로즈골드/핑크 (포인트)
    statistics: '#333333',      // 숫자는 진한색
    hashtag: '#d4a5a5',         // 해시태그는 포인트색
    accent: '#e8b4b8',          // 강조색
  },

  // 어두운 배경 (네이비, 블랙) 색상 팔레트
  darkBackground: {
    headline: '#ffffff',        // 흰색
    subheadline: '#e0e0e0',     // 밝은 회색
    body: '#cccccc',            // 중간 밝기
    sectionTitle: '#ffffff',    // 흰색
    statistics: '#ffffff',      // 숫자는 흰색
    hashtag: '#87ceeb',         // 하늘색 계열 (어두운 배경용)
    accent: '#4a90d9',          // 블루 강조
  },

  // 텍스트 크기 비율 (기준: 이미지 높이 대비)
  fontSize: {
    brand: { min: 12, max: 16, typical: 14 },           // 브랜드명
    productLine: { min: 24, max: 36, typical: 28 },     // 제품라인명 (가장 큼)
    headline: { min: 20, max: 28, typical: 24 },        // 한글 헤드라인
    sectionTitle: { min: 12, max: 16, typical: 14 },    // 영문 섹션타이틀
    subheadline: { min: 14, max: 20, typical: 16 },     // 서브헤드라인
    body: { min: 12, max: 16, typical: 14 },            // 본문
    statistics: { min: 28, max: 48, typical: 36 },      // 통계 숫자
    statisticsLabel: { min: 10, max: 14, typical: 12 }, // 통계 라벨
    hashtag: { min: 10, max: 14, typical: 12 },         // 해시태그
    footnote: { min: 8, max: 10, typical: 9 },          // 주석/출처
  },

  // 위치 패턴 (y 좌표 %, 이미지 상단 기준)
  position: {
    // MAIN 섹션 패턴
    main: {
      brand: { y: 3, align: 'center' },
      productLine: { y: 10, align: 'center' },
      korean: { y: 18, align: 'center' },
      tagline: { y: 85, align: 'center' },
    },
    // FEATURES 섹션 패턴
    features: {
      description: { y: 3, align: 'center' },
      hashtags: { y: 8, align: 'center' },
      sectionTitle: { y: 55, align: 'center' },
      statistics: { y: 65, align: 'center' },
    },
    // SOCIAL_PROOF 섹션 패턴
    socialProof: {
      sectionTitle: { y: 55, align: 'center' },
      headline: { y: 62, align: 'center' },
      statistics: { y: 75, align: 'center' },  // 가로 배열 또는 방사형
    },
    // TEXTURE 섹션 패턴
    texture: {
      sectionTitle: { y: 15, align: 'center' },
      headline: { y: 25, align: 'center' },
      body: { y: 35, align: 'center' },
    },
  },

  // 특수 스타일 효과
  effects: {
    sectionTitleUnderline: true,    // 섹션 타이틀에 언더라인
    statisticsInCircle: true,       // 통계 숫자를 원형 배지 안에
    hashtagWithSymbol: true,        // # 기호 포함
    newBadge: {                     // NEW 배지 스타일
      background: '#e8b4b8',
      color: '#ffffff',
      padding: '2px 8px',
    },
  },

  // 통계 배치 패턴
  statisticsLayout: {
    horizontal: {                   // 가로 배열 (3개)
      spacing: 25,                  // % 간격
      yNumber: 75,
      yLabel: 83,
    },
    radial: {                       // 방사형 배열 (제품 중심)
      radius: 35,                   // 중심에서 % 거리
      positions: 8,                 // 최대 8개 위치
    },
    vertical: {                     // 세로 배열
      spacing: 15,
      x: 50,
    },
  },
};

// ============================================
// 배경 밝기 감지 헬퍼
// ============================================

export type BackgroundType = 'light' | 'dark';

export function getColorSchemeForBackground(backgroundType: BackgroundType) {
  return backgroundType === 'dark'
    ? TEXT_STYLE_GUIDE.darkBackground
    : TEXT_STYLE_GUIDE.lightBackground;
}

// ============================================
// 섹션별 레이아웃 가이드 (실제 상세페이지 분석 기반)
// ============================================

const SECTION_LAYOUT_GUIDE: Record<string, {
  headline: { x: number; y: number; align: 'left' | 'center' | 'right'; fontSize: number };
  subheadline: { x: number; y: number; align: 'left' | 'center' | 'right'; fontSize: number };
  body: { x: number; y: number; align: 'left' | 'center' | 'right'; fontSize: number };
  statistics: { x: number; y: number; fontSize: number };
  cta: { x: number; y: number; fontSize: number };
  productArea: string;
  safeArea: string;
}> = {
  MAIN: {
    headline: { x: 50, y: 5, align: 'center', fontSize: 14 },      // 브랜드명 (작게)
    subheadline: { x: 50, y: 12, align: 'center', fontSize: 28 },  // 제품라인명 (크게)
    body: { x: 50, y: 22, align: 'center', fontSize: 16 },         // 기술명/한글명
    statistics: { x: 50, y: 85, fontSize: 18 },                    // 태그라인
    cta: { x: 50, y: 92, fontSize: 14 },
    productArea: '중앙 (20-80%, 35-75%)',
    safeArea: '상단 (0-30%), 하단 (80-100%)',
  },
  HERO: {
    headline: { x: 50, y: 8, align: 'center', fontSize: 24 },
    subheadline: { x: 50, y: 18, align: 'center', fontSize: 16 },
    body: { x: 50, y: 28, align: 'center', fontSize: 12 },
    statistics: { x: 50, y: 50, fontSize: 56 },
    cta: { x: 50, y: 90, fontSize: 14 },
    productArea: '중앙 (25-75%, 35-70%)',
    safeArea: '상단/하단 가장자리',
  },
  FEATURES: {
    headline: { x: 50, y: 5, align: 'center', fontSize: 14 },      // 설명문
    subheadline: { x: 50, y: 12, align: 'center', fontSize: 12 },  // 해시태그
    body: { x: 50, y: 45, align: 'center', fontSize: 20 },         // 영문 섹션명
    statistics: { x: 50, y: 55, fontSize: 32 },                    // 숫자+효과
    cta: { x: 50, y: 70, fontSize: 14 },
    productArea: '중앙 (20-80%, 25-75%)',
    safeArea: '상단/하단',
  },
  SOCIAL_PROOF: {
    headline: { x: 50, y: 55, align: 'center', fontSize: 16 },     // BENEFIT 등 섹션명
    subheadline: { x: 50, y: 62, align: 'center', fontSize: 20 },  // 헤드라인
    body: { x: 50, y: 90, align: 'center', fontSize: 12 },
    statistics: { x: 50, y: 78, fontSize: 36 },                    // 79% 24H 등
    cta: { x: 50, y: 95, fontSize: 12 },
    productArea: '상단 모델/제품 영역 (0-50%)',
    safeArea: '하단 (50-100%)',
  },
  HOW_TO_USE: {
    headline: { x: 50, y: 5, align: 'center', fontSize: 16 },
    subheadline: { x: 50, y: 12, align: 'center', fontSize: 20 },
    body: { x: 50, y: 85, align: 'center', fontSize: 14 },
    statistics: { x: 50, y: 50, fontSize: 24 },
    cta: { x: 50, y: 92, fontSize: 14 },
    productArea: '중앙 (사용법 이미지)',
    safeArea: '상단/하단',
  },
  FAQ: {
    headline: { x: 50, y: 8, align: 'center', fontSize: 20 },
    subheadline: { x: 50, y: 18, align: 'center', fontSize: 14 },
    body: { x: 50, y: 50, align: 'center', fontSize: 16 },
    statistics: { x: 50, y: 70, fontSize: 28 },
    cta: { x: 50, y: 88, fontSize: 16 },
    productArea: '하단 제품 배치',
    safeArea: '상단/중앙',
  },
  // 추가 섹션들 (2차 고도화)
  PRODUCT_LINEUP: {
    headline: { x: 50, y: 5, align: 'center', fontSize: 14 },      // "Color Chart" 등
    subheadline: { x: 50, y: 12, align: 'center', fontSize: 20 },  // 라인업 제목
    body: { x: 50, y: 85, align: 'center', fontSize: 12 },         // 부가 설명
    statistics: { x: 50, y: 50, fontSize: 14 },                    // 컬러명들
    cta: { x: 50, y: 92, fontSize: 12 },
    productArea: '중앙 그리드 (컬러 스와치 배치)',
    safeArea: '상단 타이틀, 하단 설명',
  },
  INGREDIENT: {
    headline: { x: 50, y: 5, align: 'center', fontSize: 14 },      // 영문 섹션명
    subheadline: { x: 50, y: 12, align: 'center', fontSize: 22 },  // 핵심 성분명
    body: { x: 50, y: 80, align: 'center', fontSize: 14 },         // 성분 설명
    statistics: { x: 50, y: 55, fontSize: 28 },                    // 함량/수치
    cta: { x: 50, y: 90, fontSize: 12 },
    productArea: '중앙 (성분 비주얼)',
    safeArea: '상단/하단',
  },
  TEXTURE: {
    headline: { x: 50, y: 5, align: 'center', fontSize: 14 },
    subheadline: { x: 50, y: 12, align: 'center', fontSize: 20 },
    body: { x: 50, y: 85, align: 'center', fontSize: 14 },
    statistics: { x: 50, y: 50, fontSize: 24 },
    cta: { x: 50, y: 92, fontSize: 12 },
    productArea: '중앙 (텍스처 클로즈업)',
    safeArea: '상단/하단',
  },
  CTA: {
    headline: { x: 50, y: 20, align: 'center', fontSize: 24 },     // 구매 유도 문구
    subheadline: { x: 50, y: 35, align: 'center', fontSize: 16 },  // 혜택/이벤트
    body: { x: 50, y: 50, align: 'center', fontSize: 14 },
    statistics: { x: 50, y: 65, fontSize: 20 },
    cta: { x: 50, y: 80, fontSize: 18 },                           // 버튼 텍스트
    productArea: '하단 (제품 이미지)',
    safeArea: '상단/중앙 (텍스트 영역)',
  },
};

// ============================================
// 섹션별 실제 오버레이 텍스트 예시 (OCR 분석 기반)
// ============================================

const SECTION_TEXT_EXAMPLES: Record<string, {
  pattern: string;
  examples: {
    headline: string;
    subheadline: string;
    body?: string;
    statistics?: string[];
    hashtags?: string;
    points?: string[];       // 넘버링 포인트
    colorNames?: string[];   // 컬러명 (메이크업)
  }[];
}> = {
  MAIN: {
    pattern: '브랜드명 → 제품라인명 → 기술명/한글명 → 태그라인',
    examples: [
      {
        headline: '{브랜드명}',
        subheadline: '{제품라인 영문}',
        body: 'NEW {제품명 한글}',
        statistics: ['{브랜드 슬로건}'],
      },
      {
        headline: '{브랜드명}',
        subheadline: '{기술명 영문}',
        body: '{X}세대 {제품명}',  // 세대 표현 패턴
        statistics: ['진화된 {핵심 효능}'],
      },
    ],
  },
  FEATURES: {
    pattern: '설명문 → 해시태그 → 영문섹션명 → 숫자+효과 / Point 넘버링',
    examples: [
      {
        headline: '{제품의 핵심 효능을 설명하는 한 문장}',
        subheadline: '',
        hashtags: '#{핵심키워드1} #{핵심키워드2} #{핵심키워드3}',
        body: '{영문 섹션 타이틀}',
        statistics: ['{XX}% {효능 설명}', '{XX}시간 {지속 효과}'],
      },
      {
        // Point 넘버링 패턴 (메이크업/스킨케어 공통)
        headline: 'Point 01',
        subheadline: '{첫 번째 핵심 특징}',
        body: '{특징 상세 설명}',
        points: ['Point 01 {특징1}', 'Point 02 {특징2}', 'Point 03 {특징3}'],
      },
      {
        // 영문 넘버링 패턴
        headline: '1. {영문 특징명}',
        subheadline: '{한글 설명}',
        body: '{감각적 표현 + 효과}',
        points: ['1. {특징1}', '2. {특징2}', '3. {특징3}'],
      },
    ],
  },
  SOCIAL_PROOF: {
    pattern: '영문섹션명 → 한글헤드라인 → 통계숫자들 → 설명',
    examples: [
      {
        headline: 'BENEFIT',
        subheadline: '{핵심 효과 한 문장}',
        statistics: ['{XX}%', '{XX}H', '{X.X}배'],
        body: '{효과1} | {효과2} | {효과3}',
      },
      {
        headline: 'CLINICAL TEST',
        subheadline: '{X}주 테스트 완료',  // 테스트 기간 패턴
        statistics: ['{XX}%', '+{XX}%', '{X.X}배'],
        body: '{지표1} | {지표2} | {지표3}',
      },
    ],
  },
  HOW_TO_USE: {
    pattern: '영문타이틀 → 한글설명 → 단계별 안내 / {X} STEP',
    examples: [
      {
        headline: 'HOW TO USE',
        subheadline: '{사용법 요약}',
        body: 'STEP 1 → STEP 2 → STEP 3',
        statistics: ['{단계1}', '{단계2}', '{단계3}'],
      },
      {
        // {X} STEP 패턴
        headline: '{X} STEP',
        subheadline: '{간단한 사용법}',
        body: '',
        points: ['Step 1 {동작1}', 'Step 2 {동작2}', 'Step 3 {동작3}'],
      },
    ],
  },
  // 2차 고도화: 추가 섹션들
  PRODUCT_LINEUP: {
    pattern: '섹션타이틀 → 라인업명 → 컬러/제품 목록',
    examples: [
      {
        headline: 'Color Chart',
        subheadline: '{라인업명}',
        body: '{컬러 특징 설명}',
        colorNames: ['{영문} {한글}', '{영문} {한글}', '{영문} {한글}'],
      },
      {
        headline: 'SHADES',
        subheadline: '{쉐이드 컬렉션명}',
        body: 'Find your perfect shade',
        colorNames: ['01 {컬러명}', '02 {컬러명}', '03 {컬러명}'],
      },
    ],
  },
  INGREDIENT: {
    pattern: '섹션타이틀 → 핵심 성분명 → 함량/효능 → 설명',
    examples: [
      {
        headline: 'KEY INGREDIENT',
        subheadline: '{핵심 성분명}',
        statistics: ['{XX}%', '{XXXX}ppm', '{X}배'],
        body: '{성분 효능 설명}',
      },
      {
        headline: 'FORMULA',
        subheadline: '{기술/성분 영문명}',
        statistics: ['{함량}'],
        body: '{성분이 주는 효과}',
      },
    ],
  },
  TEXTURE: {
    pattern: '섹션타이틀 → 텍스처명 → 감각 표현',
    examples: [
      {
        headline: 'TEXTURE',
        subheadline: '{텍스처 특징}',
        body: '{감촉} + {발림성} + {마무리감}',
      },
      {
        headline: 'DESIGN',  // 디자인 섹션도 같은 레이아웃
        subheadline: '{디자인 특징}',
        body: '{외형} + {소재} + {사용감}',
      },
    ],
  },
  CTA: {
    pattern: '구매 유도 문구 → 혜택 → 버튼',
    examples: [
      {
        headline: '{구매 유도 핵심 문구}',
        subheadline: '{한정 혜택/이벤트}',
        body: '{추가 정보}',
        statistics: ['{할인율}', '{증정품}'],
      },
    ],
  },
};

// ============================================
// 카테고리별 텍스트 스타일 가이드
// ============================================

const CATEGORY_TEXT_STYLE: Record<string, {
  tone: string;
  colorScheme: { primary: string; secondary: string; accent: string };
  keywords: string[];
  statFormats: string[];
}> = {
  skincare: {
    tone: '과학적, 신뢰감, 전문적',
    colorScheme: { primary: '#ffffff', secondary: '#e8e8e8', accent: '#4a90d9' },
    keywords: ['수분', '탄력', '광채', '리페어', '진정', '장벽'],
    statFormats: ['+XX%', 'X.X배', 'XX시간', 'XX%'],
  },
  makeup: {
    tone: '세련된, 트렌디, 감각적',
    colorScheme: { primary: '#ffffff', secondary: '#f5e6e8', accent: '#d4a5a5' },
    keywords: ['발색', '지속력', '밀착', '커버', '광택', '보습'],
    statFormats: ['XXH', 'XX%', 'XX.X%', 'XXX%'],
  },
  suncare: {
    tone: '활동적, 신뢰감, 보호',
    colorScheme: { primary: '#ffffff', secondary: '#fff5e6', accent: '#f4a460' },
    keywords: ['차단', '보호', '지속', '산뜻', '무기자차', '톤업'],
    statFormats: ['SPF XX+', 'PA++++', 'XX시간', 'XX.X%'],
  },
  cleansing: {
    tone: '깨끗한, 순수한, 부드러운',
    colorScheme: { primary: '#ffffff', secondary: '#e6f3f5', accent: '#7ec8e3' },
    keywords: ['클렌징', '모공', '각질', '저자극', '약산성', '딥클렌징'],
    statFormats: ['XX%', 'pH X.X', 'X중', 'XXX%'],
  },
};

// ============================================
// 메인 프롬프트 빌더
// ============================================

// ============================================
// 카테고리 키 결정 헬퍼
// ============================================

function getCategoryKey(category: string): string {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('스킨케어') || lowerCategory.includes('세럼') ||
      lowerCategory.includes('로션') || lowerCategory.includes('크림') ||
      lowerCategory.includes('에센스') || lowerCategory.includes('토너')) {
    return 'skincare';
  }
  if (lowerCategory.includes('립') || lowerCategory.includes('메이크업') ||
      lowerCategory.includes('파운데이션') || lowerCategory.includes('쿠션') ||
      lowerCategory.includes('아이') || lowerCategory.includes('블러셔')) {
    return 'makeup';
  }
  if (lowerCategory.includes('선') || lowerCategory.includes('자외선') ||
      lowerCategory.includes('썬')) {
    return 'suncare';
  }
  if (lowerCategory.includes('클렌') || lowerCategory.includes('세안') ||
      lowerCategory.includes('폼')) {
    return 'cleansing';
  }
  return 'skincare';
}

/** 블록별 오버레이 옵션 */
export interface BlockOverlayOptions {
  /** 블록 인덱스 (0부터 시작) */
  blockIndex?: number;
  /** 해당 섹션의 총 블록 수 */
  totalBlocks?: number;
  /** 변형 힌트 (예: "step 1 of 3", "#21 내추럴베이지") */
  variationHint?: string;
}

export function buildOverlayTextPrompt(
  section: SectionType,
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string,
  blockOptions?: BlockOverlayOptions
): string {
  const categoryPattern = getCategoryPattern(category);
  const sectionGuide = SECTION_STORY_GUIDE[section as keyof typeof SECTION_STORY_GUIDE];
  const layoutGuide = SECTION_LAYOUT_GUIDE[section] || SECTION_LAYOUT_GUIDE.HERO;
  const textExamples = SECTION_TEXT_EXAMPLES[section] || SECTION_TEXT_EXAMPLES.FEATURES;

  // 카테고리 스타일 결정 (개선된 로직)
  const categoryKey = getCategoryKey(category);
  const categoryStyle = CATEGORY_TEXT_STYLE[categoryKey];
  const sensoryWords = SENSORY_KEYWORDS[categoryKey];

  if (!sectionGuide) {
    return buildOverlayTextPrompt('FEATURES', productName, category, keyFeatures, targetAudience, blockOptions);
  }

  // 블록별 컨텍스트 생성
  const blockContext = blockOptions?.variationHint
    ? `
## ★★★ 블록별 컨텍스트 (중요!)
이 이미지는 섹션 내 ${blockOptions.totalBlocks || 1}개 블록 중 ${(blockOptions.blockIndex || 0) + 1}번째입니다.
블록 특성: ${blockOptions.variationHint}

이 블록에 맞는 고유한 오버레이 텍스트를 작성하세요:
${section === 'HOW_TO_USE' ? `- 사용 순서에 맞는 단계별 설명 (예: "STEP ${(blockOptions.blockIndex || 0) + 1}", "${blockOptions.variationHint}")` : ''}
${section === 'FEATURES' && blockOptions.variationHint.includes('#') ? `- 해당 호수/컬러에 맞는 설명 (예: "${blockOptions.variationHint}")` : ''}
${section === 'FEATURES' && !blockOptions.variationHint.includes('#') ? `- 해당 컬러 특성 설명 (예: "${blockOptions.variationHint}")` : ''}
${section === 'SOCIAL_PROOF' ? `- 해당 증거 유형에 맞는 텍스트 (예: "${blockOptions.variationHint}")` : ''}
`
    : '';

  // 실제 예시 포맷팅 (여러 예시 포함)
  const examplesJson = textExamples.examples.map((ex, i) =>
    `예시 ${i + 1}:\n${JSON.stringify(ex, null, 2)}`
  ).join('\n\n');

  // 섹션별 특화 가이드
  const sectionSpecificGuide = getSectionSpecificGuide(section, categoryKey);

  return `당신은 한국 올리브영/화해 상세페이지 전문 카피라이터입니다.
실제 브랜드 상세페이지에서 사용되는 오버레이 텍스트를 작성합니다.

## 핵심 원칙
1. **실제 상세페이지 스타일**: 올리브영에서 볼 수 있는 전문적인 카피
2. **짧고 임팩트 있게**: 헤드라인 5-15자, 서브헤드라인 10-25자
3. **숫자로 신뢰감**: 구체적인 수치와 퍼센트 활용
4. **영문+한글 믹스**: 섹션명은 영문, 설명은 한글

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 타겟: ${targetAudience}
- 핵심 특징: ${keyFeatures.join(', ')}

## 섹션: ${section}
- 목적: ${sectionGuide.purpose}
- 텍스트 패턴: ${textExamples.pattern}
${blockContext}
## 카테고리 스타일 (${categoryKey})
- 톤: ${categoryStyle.tone}
- 키워드 참고: ${categoryStyle.keywords.join(', ')}
- 통계 포맷 참고: ${categoryStyle.statFormats.join(', ')}

## ★ 감각적 표현 가이드 (${categoryKey})
- 텍스처: ${sensoryWords.texture.join(', ')}
- 시각적: ${sensoryWords.visual.join(', ')}
- 감촉: ${sensoryWords.feeling.join(', ')}
- 결과: ${sensoryWords.result.join(', ')}

${sectionSpecificGuide}

## ★ 실제 상세페이지 텍스트 예시
${examplesJson}

## 텍스트 작성 규칙

### 1. 헤드라인 (headline)
- ${section === 'MAIN' ? '브랜드명 또는 영문 제품라인' : section === 'SOCIAL_PROOF' ? 'BENEFIT, CLINICAL TEST 등 영문 섹션명' : section === 'FEATURES' ? 'Point 01 또는 1. {영문특징} 형식 가능' : '제품의 핵심 가치를 담은 한 문장'}
- 5-15자 이내

### 2. 서브헤드라인 (subheadline)
- ${section === 'MAIN' ? '제품 라인명 (영문, 크고 임팩트 있게) 또는 {X}세대 표현' : section === 'FEATURES' ? '해시태그 (#키워드1 #키워드2) 또는 Point 설명' : section === 'PRODUCT_LINEUP' ? '컬러 라인업 제목' : '헤드라인 보조 설명'}
- 10-25자 이내

### 3. 통계 (statistics)
- 구체적 숫자: 79%, 24H, 2.8배, +32% 형식
- 숫자 뒤에 짧은 설명: "79% 만족도", "24시간 지속"
- 2-3개가 적당

### 4. 본문 (body)
- 필요시에만 작성
- 통계 설명 또는 추가 정보

## 색상 가이드
- 밝은 배경: "${categoryStyle.colorScheme.primary}" (흰색) 또는 "#333333" (진한 회색)
- 어두운 배경: "#ffffff" (흰색)
- 강조색: "${categoryStyle.colorScheme.accent}"

## 절대 금지
- 이모지 사용 금지 (😊, ✨, 💕 등)
- "완전", "대박", "꿀템" 등 과장 표현 금지
- 느낌표(!) 과다 사용 금지

## 응답 형식
${section} 섹션에 맞는 오버레이 텍스트를 JSON으로 반환하세요:

{
  "headline": {
    "text": "${section === 'MAIN' ? '{브랜드명}' : section === 'SOCIAL_PROOF' ? 'BENEFIT' : section === 'FEATURES' ? 'Point 01 또는 핵심문장' : '{핵심 가치 한 문장}'}",
    "x": ${layoutGuide.headline.x},
    "y": ${layoutGuide.headline.y},
    "fontSize": ${layoutGuide.headline.fontSize},
    "fontWeight": "bold",
    "color": "#ffffff",
    "textAlign": "${layoutGuide.headline.align}"
  },
  "subheadline": {
    "text": "${section === 'FEATURES' ? '#{키워드1} #{키워드2} #{키워드3}' : '{서브 설명}'}",
    "x": ${layoutGuide.subheadline.x},
    "y": ${layoutGuide.subheadline.y},
    "fontSize": ${layoutGuide.subheadline.fontSize},
    "fontWeight": "medium",
    "color": "#ffffff",
    "textAlign": "${layoutGuide.subheadline.align}"
  },
  "statistics": [
    {
      "text": "{XX}%",
      "x": ${layoutGuide.statistics.x - 25},
      "y": ${layoutGuide.statistics.y},
      "fontSize": ${layoutGuide.statistics.fontSize},
      "fontWeight": "bold",
      "color": "#ffffff"
    },
    {
      "text": "{효과 설명}",
      "x": ${layoutGuide.statistics.x - 25},
      "y": ${layoutGuide.statistics.y + 8},
      "fontSize": 14,
      "fontWeight": "normal",
      "color": "#ffffff"
    }
  ],
  "body": null,
  "cta": null
}

## 숫자 생성 규칙
- 제품 특징에 맞는 현실적인 숫자 생성 (예: 보습 → XX%, 지속력 → XXH)
- 과장하지 않고 신뢰감 있는 범위의 숫자 사용
- {XX}는 실제 숫자로 대체하여 반환

- 해당 섹션에 불필요한 항목은 null로 설정
- statistics는 숫자와 설명을 분리하여 배열로 구성
- JSON만 반환 (설명 없이)`;
}

// ============================================
// 섹션별 특화 가이드 생성
// ============================================

function getSectionSpecificGuide(section: SectionType, categoryKey: string): string {
  switch (section) {
    case 'MAIN':
      return `## ★ MAIN 섹션 특화 가이드
- NEW / {X}세대 / 진화된 표현 활용 가능
- 브랜드 아이덴티티를 살리는 영문 라인명
- 태그라인은 하단에 작게 배치`;

    case 'FEATURES':
      return `## ★ FEATURES 섹션 특화 가이드
- **넘버링 패턴 활용**: Point 01, Point 02, Point 03 또는 1. 2. 3. 형식
- **영문 특징명 + 한글 설명** 조합 권장
- 예: "1. Glacé Glow" + "맑고 영롱한 광채"
- 해시태그 형식도 가능: #탱글 #영롱 #지속력`;

    case 'SOCIAL_PROOF':
      return `## ★ SOCIAL_PROOF 섹션 특화 가이드
- BENEFIT, CLINICAL TEST, PROVEN RESULT 등 영문 타이틀
- "{X}주 테스트 완료" 형식의 신뢰성 강조
- 수치는 크게, 설명은 작게 배치`;

    case 'HOW_TO_USE':
      return `## ★ HOW TO USE 섹션 특화 가이드
- "{X} STEP" 형식 권장 (예: 4 STEP)
- 각 단계는 간결한 동작 설명
- STEP 1, STEP 2... 또는 Step 1, Step 2... 형식`;

    case 'PRODUCT_LINEUP':
      return `## ★ PRODUCT_LINEUP 섹션 특화 가이드 (${categoryKey === 'makeup' ? '메이크업' : '일반'})
${categoryKey === 'makeup' ? `- Color Chart, SHADES 등 영문 타이틀
- 컬러명: 영문 + 한글 조합 (예: "PINK FLAKE 핑크 플레이크")
- 컬러 스와치 옆에 컬러명 배치` : `- 제품 라인업 소개
- 용량/타입별 구분 표시`}`;

    case 'INGREDIENT':
      return `## ★ INGREDIENT 섹션 특화 가이드
- KEY INGREDIENT, FORMULA 등 영문 타이틀
- 핵심 성분명은 크게 강조
- 함량 수치 (XX%, XXXppm 등) 포함`;

    case 'TEXTURE':
      return `## ★ TEXTURE 섹션 특화 가이드
- TEXTURE, DESIGN 등 영문 타이틀
- 감각적 표현 적극 활용: ${SENSORY_KEYWORDS[categoryKey]?.texture.slice(0, 3).join(', ')}
- 발림성, 마무리감 설명`;

    default:
      return '';
  }
}

// ============================================
// 섹션별 특화 프롬프트 빌더
// ============================================

export function buildMainSectionOverlay(
  brandName: string,
  productLineName: string,
  productNameKr: string,
  tagline?: string
): string {
  return `{
  "headline": {
    "text": "${brandName.toUpperCase()}",
    "x": 50, "y": 5,
    "fontSize": 14, "fontWeight": "normal",
    "color": "#333333", "textAlign": "center"
  },
  "subheadline": {
    "text": "${productLineName.toUpperCase()}",
    "x": 50, "y": 12,
    "fontSize": 28, "fontWeight": "bold",
    "color": "#333333", "textAlign": "center"
  },
  "body": {
    "text": "NEW ${productNameKr}",
    "x": 50, "y": 22,
    "fontSize": 16, "fontWeight": "medium",
    "color": "#333333", "textAlign": "center"
  },
  "statistics": ${tagline ? `[{"text": "${tagline}", "x": 50, "y": 88, "fontSize": 18, "fontWeight": "normal", "color": "#999999"}]` : '[]'},
  "cta": null
}`;
}

export function buildSocialProofOverlay(
  sectionTitle: string,
  headline: string,
  stats: { value: string; label: string }[]
): string {
  const statsJson = stats.map((stat, idx) => {
    const xOffset = (idx - (stats.length - 1) / 2) * 30;
    return `{
      "text": "${stat.value}",
      "x": ${50 + xOffset}, "y": 75,
      "fontSize": 36, "fontWeight": "bold",
      "color": "#ffffff"
    },
    {
      "text": "${stat.label}",
      "x": ${50 + xOffset}, "y": 83,
      "fontSize": 12, "fontWeight": "normal",
      "color": "#ffffff"
    }`;
  }).join(',\n    ');

  return `{
  "headline": {
    "text": "${sectionTitle}",
    "x": 50, "y": 55,
    "fontSize": 14, "fontWeight": "medium",
    "color": "#ffffff", "textAlign": "center"
  },
  "subheadline": {
    "text": "${headline}",
    "x": 50, "y": 62,
    "fontSize": 20, "fontWeight": "bold",
    "color": "#ffffff", "textAlign": "center"
  },
  "statistics": [
    ${statsJson}
  ],
  "body": null,
  "cta": null
}`;
}

export function buildFeaturesOverlay(
  description: string,
  hashtags: string[],
  englishTitle: string,
  mainStat: { value: string; description: string }
): string {
  const hashtagText = hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ');

  return `{
  "headline": {
    "text": "${description}",
    "x": 50, "y": 5,
    "fontSize": 14, "fontWeight": "normal",
    "color": "#333333", "textAlign": "center"
  },
  "subheadline": {
    "text": "${hashtagText}",
    "x": 50, "y": 12,
    "fontSize": 12, "fontWeight": "normal",
    "color": "#d4a5a5", "textAlign": "center"
  },
  "body": {
    "text": "${englishTitle}",
    "x": 50, "y": 50,
    "fontSize": 16, "fontWeight": "medium",
    "color": "#333333", "textAlign": "center"
  },
  "statistics": [
    {
      "text": "${mainStat.value}",
      "x": 50, "y": 58,
      "fontSize": 32, "fontWeight": "bold",
      "color": "#333333"
    },
    {
      "text": "${mainStat.description}",
      "x": 50, "y": 68,
      "fontSize": 14, "fontWeight": "normal",
      "color": "#666666"
    }
  ],
  "cta": null
}`;
}

// ============================================
// 2차 고도화: 추가 헬퍼 함수들
// ============================================

/**
 * Point 넘버링 피처 오버레이 (Point 01, Point 02 형식)
 */
export function buildPointFeatureOverlay(
  pointNumber: number,
  featureName: string,
  featureDescription: string
): string {
  const pointText = `Point ${String(pointNumber).padStart(2, '0')}`;

  return `{
  "headline": {
    "text": "${pointText}",
    "x": 50, "y": 8,
    "fontSize": 12, "fontWeight": "medium",
    "color": "#999999", "textAlign": "center"
  },
  "subheadline": {
    "text": "${featureName}",
    "x": 50, "y": 18,
    "fontSize": 24, "fontWeight": "bold",
    "color": "#333333", "textAlign": "center"
  },
  "body": {
    "text": "${featureDescription}",
    "x": 50, "y": 28,
    "fontSize": 14, "fontWeight": "normal",
    "color": "#666666", "textAlign": "center"
  },
  "statistics": [],
  "cta": null
}`;
}

/**
 * 영문 넘버링 피처 오버레이 (1. Feature Name 형식)
 */
export function buildNumberedFeatureOverlay(
  number: number,
  englishFeature: string,
  koreanDescription: string,
  sensoryExpression?: string
): string {
  return `{
  "headline": {
    "text": "${number}. ${englishFeature}",
    "x": 50, "y": 10,
    "fontSize": 20, "fontWeight": "bold",
    "color": "#333333", "textAlign": "center"
  },
  "subheadline": {
    "text": "${koreanDescription}",
    "x": 50, "y": 22,
    "fontSize": 16, "fontWeight": "medium",
    "color": "#666666", "textAlign": "center"
  },
  ${sensoryExpression ? `"body": {
    "text": "${sensoryExpression}",
    "x": 50, "y": 32,
    "fontSize": 14, "fontWeight": "normal",
    "color": "#999999", "textAlign": "center"
  },` : '"body": null,'}
  "statistics": [],
  "cta": null
}`;
}

/**
 * 컬러차트 오버레이 (메이크업용)
 */
export function buildColorChartOverlay(
  title: string,
  colors: { english: string; korean: string }[]
): string {
  const colorStats = colors.map((color, idx) => {
    const xOffset = ((idx % 3) - 1) * 30;
    const yOffset = Math.floor(idx / 3) * 15;
    return `{
      "text": "${color.english}",
      "x": ${50 + xOffset}, "y": ${45 + yOffset},
      "fontSize": 12, "fontWeight": "bold",
      "color": "#333333"
    },
    {
      "text": "${color.korean}",
      "x": ${50 + xOffset}, "y": ${52 + yOffset},
      "fontSize": 10, "fontWeight": "normal",
      "color": "#666666"
    }`;
  }).join(',\n    ');

  return `{
  "headline": {
    "text": "Color Chart",
    "x": 50, "y": 5,
    "fontSize": 12, "fontWeight": "normal",
    "color": "#999999", "textAlign": "center"
  },
  "subheadline": {
    "text": "${title}",
    "x": 50, "y": 14,
    "fontSize": 20, "fontWeight": "bold",
    "color": "#333333", "textAlign": "center"
  },
  "body": null,
  "statistics": [
    ${colorStats}
  ],
  "cta": null
}`;
}

/**
 * HOW TO USE 스텝 오버레이
 */
export function buildHowToUseOverlay(
  totalSteps: number,
  steps: { action: string; description?: string }[]
): string {
  const stepStats = steps.map((step, idx) => {
    const yPosition = 40 + idx * 18;
    return `{
      "text": "Step ${idx + 1}",
      "x": 20, "y": ${yPosition},
      "fontSize": 12, "fontWeight": "bold",
      "color": "#333333"
    },
    {
      "text": "${step.action}",
      "x": 35, "y": ${yPosition},
      "fontSize": 14, "fontWeight": "normal",
      "color": "#666666"
    }`;
  }).join(',\n    ');

  return `{
  "headline": {
    "text": "HOW TO USE",
    "x": 50, "y": 5,
    "fontSize": 12, "fontWeight": "normal",
    "color": "#999999", "textAlign": "center"
  },
  "subheadline": {
    "text": "${totalSteps} STEP",
    "x": 50, "y": 15,
    "fontSize": 24, "fontWeight": "bold",
    "color": "#333333", "textAlign": "center"
  },
  "body": null,
  "statistics": [
    ${stepStats}
  ],
  "cta": null
}`;
}

/**
 * 성분 강조 오버레이
 */
export function buildIngredientOverlay(
  ingredientName: string,
  amount: string,
  benefit: string
): string {
  return `{
  "headline": {
    "text": "KEY INGREDIENT",
    "x": 50, "y": 5,
    "fontSize": 12, "fontWeight": "normal",
    "color": "#999999", "textAlign": "center"
  },
  "subheadline": {
    "text": "${ingredientName}",
    "x": 50, "y": 18,
    "fontSize": 28, "fontWeight": "bold",
    "color": "#333333", "textAlign": "center"
  },
  "body": {
    "text": "${benefit}",
    "x": 50, "y": 80,
    "fontSize": 14, "fontWeight": "normal",
    "color": "#666666", "textAlign": "center"
  },
  "statistics": [
    {
      "text": "${amount}",
      "x": 50, "y": 50,
      "fontSize": 36, "fontWeight": "bold",
      "color": "#333333"
    }
  ],
  "cta": null
}`;
}

/**
 * 텍스처/디자인 오버레이
 */
export function buildTextureOverlay(
  sectionTitle: 'TEXTURE' | 'DESIGN',
  mainFeature: string,
  descriptions: string[]
): string {
  const descText = descriptions.join(' · ');

  return `{
  "headline": {
    "text": "${sectionTitle}",
    "x": 50, "y": 5,
    "fontSize": 12, "fontWeight": "normal",
    "color": "#999999", "textAlign": "center"
  },
  "subheadline": {
    "text": "${mainFeature}",
    "x": 50, "y": 18,
    "fontSize": 22, "fontWeight": "bold",
    "color": "#333333", "textAlign": "center"
  },
  "body": {
    "text": "${descText}",
    "x": 50, "y": 85,
    "fontSize": 14, "fontWeight": "normal",
    "color": "#666666", "textAlign": "center"
  },
  "statistics": [],
  "cta": null
}`;
}

// ============================================
// Export 상수들
// ============================================

export {
  SENSORY_KEYWORDS,
  NUMBERING_PATTERNS,
  GENERATION_EXPRESSIONS,
  COLOR_CHART_PATTERNS,
  SECTION_LAYOUT_GUIDE,
  SECTION_TEXT_EXAMPLES,
  CATEGORY_TEXT_STYLE,
  getCategoryKey,
  // TEXT_STYLE_GUIDE와 getColorSchemeForBackground는 이미 위에서 export됨
};
