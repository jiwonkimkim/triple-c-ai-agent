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
    // ★ OCR 데이터 기반 고도화 (랑콤 클라리피끄, 키엘 칼렌듈라)
    texture: ['부드러운', '폼', '젤', '오일', '밀크', '크리미', '촘촘한 거품', '미세한 거품', '크리미한 젤'],
    visual: ['맑은', '깨끗한', '투명한', '촉촉한', '브라이트닝', '광채', '매끄러운'],
    feeling: ['상쾌한', '개운한', '순한', '자극없는', '부드러운', '당기지 않는', '피부 밸런스'],
    result: ['깨끗한', '말끔한', '산뜻한', '촉촉한', '건강한', '노폐물 제거', '각질 케어', '모공 케어'],
  },
  // ★ 추가 카테고리: 헤어
  hair: {
    texture: ['부드러운', '실키한', '촉촉한', '가벼운', '윤기나는'],
    visual: ['윤기', '광택', '풍성한', '건강한', '찰랑거리는'],
    feeling: ['가벼운', '부드러운', '산뜻한', '청량한', '시원한'],
    result: ['탄력있는', '건강한', '윤기나는', '손상케어', '두피케어'],
  },
  // ★ 추가 카테고리: 바디
  body: {
    texture: ['부드러운', '촉촉한', '크리미', '젤', '로션'],
    visual: ['매끈한', '건강한', '촉촉한', '윤기나는'],
    feeling: ['부드러운', '산뜻한', '시원한', '보습감'],
    result: ['탄탄한', '매끈한', '촉촉한', '건강한', '탄력있는'],
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
// ★ 카테고리별 실제 통계 패턴 (OCR 데이터 분석 기반)
// ============================================

const CATEGORY_STATISTICS_PATTERNS: Record<string, {
  formats: string[];           // 통계 표시 형식
  ranges: Record<string, { min: number; max: number; unit: string }>;  // 현실적 수치 범위
  examples: { value: string; label: string }[];  // 실제 예시
  testPeriod?: string;         // 테스트 기간 표시
}> = {
  cleansing: {
    // ★ 랑콤 클라리피끄, 키엘 칼렌듈라 OCR 기반
    formats: ['{XX}%', '{XX}H', '+{XX}%', '{X.X}배'],
    ranges: {
      satisfaction: { min: 85, max: 98, unit: '%' },
      hydration: { min: 24, max: 72, unit: 'H' },
      improvement: { min: 30, max: 50, unit: '%' },
    },
    examples: [
      { value: '79%', label: '립케어 성분' },
      { value: '24H', label: '지속되는 보습감' },
      { value: '37.6%', label: '건조함 개선' },
      { value: '98%', label: '피부 톤이 균일해진 것 같다' },
      { value: '94%', label: '다크 스팟이 감소된 것 같다' },
    ],
    testPeriod: '*{XX}세 여성 {XX}명 대상 {X}주간 진행된 자가 평가 결과',
  },
  skincare: {
    formats: ['{XX}%', '+{XX}%', '{X.X}배', '{XX}H'],
    ranges: {
      hydration: { min: 24, max: 72, unit: 'H' },
      elasticity: { min: 20, max: 50, unit: '%' },
      brightness: { min: 30, max: 60, unit: '%' },
    },
    examples: [
      { value: '48H', label: '보습 지속' },
      { value: '+32%', label: '탄력 개선' },
      { value: '2.5배', label: '흡수력' },
      { value: '89%', label: '피부결 개선' },
    ],
    testPeriod: '*인체적용시험 결과',
  },
  makeup: {
    formats: ['{XX}H', '{XX}%', '{XX}.{X}%'],
    ranges: {
      lasting: { min: 12, max: 36, unit: 'H' },
      coverage: { min: 70, max: 95, unit: '%' },
      satisfaction: { min: 85, max: 98, unit: '%' },
    },
    examples: [
      { value: '24H', label: '지속력' },
      { value: '92%', label: '밀착력 만족' },
      { value: '87.5%', label: '커버력 만족' },
    ],
  },
  suncare: {
    formats: ['SPF {XX}+', 'PA++++', '{XX}H', '{XX}%'],
    ranges: {
      protection: { min: 30, max: 50, unit: 'SPF' },
      lasting: { min: 8, max: 12, unit: 'H' },
    },
    examples: [
      { value: 'SPF50+', label: '자외선 차단' },
      { value: 'PA++++', label: '최고 등급' },
      { value: '12H', label: '지속 보호' },
    ],
  },
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
    // ★ OCR 데이터 기반 고도화 (랑콤 클라리피끄, 키엘 칼렌듈라)
    tone: '깨끗한, 순수한, 부드러운, 피부 밸런스',
    colorScheme: { primary: '#ffffff', secondary: '#e6f3f5', accent: '#7ec8e3' },
    keywords: ['클렌징', '모공', '각질', '저자극', '약산성', '딥클렌징', '노폐물', '피부 밸런스', '순한 포뮬러', '거품'],
    statFormats: ['XX%', 'XXH', '+XX%', 'pH X.X'],
    // NOTE: sectionTitles, pointPatterns 패턴은 CATEGORY_STATISTICS_PATTERNS에서 관리
  },
  // ★ 추가 카테고리: 헤어
  hair: {
    tone: '건강한, 윤기나는, 부드러운',
    colorScheme: { primary: '#ffffff', secondary: '#f5f0e8', accent: '#8b7355' },
    keywords: ['윤기', '손상케어', '두피', '탈모', '볼륨', '영양'],
    statFormats: ['XX%', '+XX%', 'XXH'],
  },
  // ★ 추가 카테고리: 바디
  body: {
    tone: '편안한, 촉촉한, 건강한',
    colorScheme: { primary: '#ffffff', secondary: '#f0f5e8', accent: '#8fbc8f' },
    keywords: ['보습', '탄력', '영양', '산뜻', '시원한', '릴랙싱'],
    statFormats: ['XX%', 'XXH', '+XX%'],
  },
};

// ============================================
// 메인 프롬프트 빌더
// ============================================

// ============================================
// 카테고리 키 결정 헬퍼
// ============================================

export function getCategoryKey(category: string): string {
  const lowerCategory = category.toLowerCase();

  // ★ 클렌징 우선 체크 (스킨케어 > 클렌징 경로 대응)
  if (lowerCategory.includes('클렌') || lowerCategory.includes('세안') ||
      lowerCategory.includes('폼') || lowerCategory.includes('워시') ||
      lowerCategory.includes('클렌저') || lowerCategory.includes('리무버')) {
    return 'cleansing';
  }

  // 스킨케어
  if (lowerCategory.includes('스킨케어') || lowerCategory.includes('세럼') ||
      lowerCategory.includes('로션') || lowerCategory.includes('크림') ||
      lowerCategory.includes('에센스') || lowerCategory.includes('토너') ||
      lowerCategory.includes('앰플') || lowerCategory.includes('마스크')) {
    return 'skincare';
  }

  // 메이크업
  if (lowerCategory.includes('립') || lowerCategory.includes('메이크업') ||
      lowerCategory.includes('파운데이션') || lowerCategory.includes('쿠션') ||
      lowerCategory.includes('아이') || lowerCategory.includes('블러셔') ||
      lowerCategory.includes('틴트') || lowerCategory.includes('팔레트')) {
    return 'makeup';
  }

  // 선케어
  if (lowerCategory.includes('선') || lowerCategory.includes('자외선') ||
      lowerCategory.includes('썬') || lowerCategory.includes('spf')) {
    return 'suncare';
  }

  // ★ 헤어 (신규)
  if (lowerCategory.includes('헤어') || lowerCategory.includes('샴푸') ||
      lowerCategory.includes('트리트먼트') || lowerCategory.includes('린스') ||
      lowerCategory.includes('두피') || lowerCategory.includes('탈모')) {
    return 'hair';
  }

  // ★ 바디 (신규)
  if (lowerCategory.includes('바디') || lowerCategory.includes('핸드') ||
      lowerCategory.includes('풋') || lowerCategory.includes('보디')) {
    return 'body';
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
  /** 이미지 분석 결과 (선택) */
  imageAnalysis?: {
    backgroundBrightness?: 'light' | 'dark' | 'mixed';
    dominantColor?: string;
    productPosition?: 'left' | 'center' | 'right';
  };
}

// ============================================
// ★ 통계 수치 자동 생성 헬퍼 (OCR 데이터 기반)
// ============================================

/**
 * 카테고리에 맞는 현실적인 통계 수치를 생성합니다.
 * @param categoryKey 카테고리 키 (cleansing, skincare, etc.)
 * @param count 생성할 통계 개수 (기본 3개)
 */
export function generateRealisticStatistics(
  categoryKey: string,
  count: number = 3
): { value: string; label: string }[] {
  const patterns = CATEGORY_STATISTICS_PATTERNS[categoryKey] || CATEGORY_STATISTICS_PATTERNS.skincare;

  // 실제 예시에서 랜덤하게 선택
  const shuffled = [...patterns.examples].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 이미지 분석 결과를 기반으로 텍스트 색상을 결정합니다.
 * @param backgroundBrightness 배경 밝기
 * @param categoryKey 카테고리 키
 */
export function getTextColorsFromImageAnalysis(
  backgroundBrightness: 'light' | 'dark' | 'mixed',
  categoryKey: string
): {
  headline: string;
  subheadline: string;
  body: string;
  accent: string;
} {
  const categoryStyle = CATEGORY_TEXT_STYLE[categoryKey] || CATEGORY_TEXT_STYLE.skincare;

  if (backgroundBrightness === 'dark') {
    return {
      headline: '#ffffff',
      subheadline: '#e0e0e0',
      body: '#cccccc',
      accent: categoryStyle.colorScheme.accent,
    };
  }

  // light or mixed
  return {
    headline: '#333333',
    subheadline: '#666666',
    body: '#888888',
    accent: categoryStyle.colorScheme.accent,
  };
}

/**
 * 제품 위치에 따른 텍스트 안전 영역을 결정합니다.
 * @param productPosition 제품 위치
 */
export function getTextSafeAreaFromProductPosition(
  productPosition: 'left' | 'center' | 'right' | 'scattered'
): {
  headlinePosition: { x: number; align: 'left' | 'center' | 'right' };
  bodyPosition: { x: number; align: 'left' | 'center' | 'right' };
} {
  switch (productPosition) {
    case 'left':
      return {
        headlinePosition: { x: 70, align: 'right' },
        bodyPosition: { x: 70, align: 'right' },
      };
    case 'right':
      return {
        headlinePosition: { x: 30, align: 'left' },
        bodyPosition: { x: 30, align: 'left' },
      };
    case 'center':
    case 'scattered':
    default:
      return {
        headlinePosition: { x: 50, align: 'center' },
        bodyPosition: { x: 50, align: 'center' },
      };
  }
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

  // ★ 이미지 분석 기반 스타일 결정
  const imageAnalysis = blockOptions?.imageAnalysis;
  const textColors = imageAnalysis?.backgroundBrightness
    ? getTextColorsFromImageAnalysis(imageAnalysis.backgroundBrightness, categoryKey)
    : { headline: '#333333', subheadline: '#666666', body: '#888888', accent: categoryStyle.colorScheme.accent };

  const textPosition = imageAnalysis?.productPosition
    ? getTextSafeAreaFromProductPosition(imageAnalysis.productPosition)
    : { headlinePosition: { x: 50, align: 'center' as const }, bodyPosition: { x: 50, align: 'center' as const } };

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

  // ★ 이미지 분석 컨텍스트 (이미지가 분석된 경우)
  const imageAnalysisContext = imageAnalysis
    ? `
## ★★★ 이미지 분석 기반 스타일 (자동 결정됨)
- 배경 밝기: ${imageAnalysis.backgroundBrightness || 'light'}
- 주요 배경색: ${imageAnalysis.dominantColor || '#ffffff'}
- 제품 위치: ${imageAnalysis.productPosition || 'center'}
- 추천 헤드라인 색상: ${textColors.headline}
- 추천 본문 색상: ${textColors.body}
- 텍스트 배치: x=${textPosition.headlinePosition.x}%, align=${textPosition.headlinePosition.align}
`
    : '';

  // 실제 예시 포맷팅 (여러 예시 포함)
  const examplesJson = textExamples.examples.map((ex, i) =>
    `예시 ${i + 1}:\n${JSON.stringify(ex, null, 2)}`
  ).join('\n\n');

  // 섹션별 특화 가이드
  const sectionSpecificGuide = getSectionSpecificGuide(section, categoryKey);

  return `## ★★★ 역할 정의 (Role Specification)

### 1인칭 - 카피라이터 (작성자)
당신은 한국 올리브영/화해 상세페이지 전문 카피라이터입니다.
"나는 이 제품의 핵심 가치를 전달하는 텍스트를 작성한다."
- 제품의 장점을 가장 효과적으로 전달하는 문구를 고민합니다
- 타겟 고객의 니즈를 파악하고 공감하는 메시지를 만듭니다
- 브랜드 톤앤매너에 맞는 표현을 선택합니다

### 2인칭 - 상세페이지/텍스트 (매체)
당신이 작성하는 텍스트는 상세페이지의 일부입니다.
"너(텍스트)는 고객에게 직접 말을 건네는 역할을 한다."
- 이미지의 분위기와 여백에 따라 자유롭게 디자인됨
- 창의적인 레이아웃으로 시선을 사로잡음
- 한 줄일 수도, 여러 조각이 흩어질 수도 있음
- 정해진 틀 없이 이미지에 녹아드는 타이포그래피

### 3인칭 - 오버레이 텍스트 (결과물)
생성되는 오버레이 텍스트는 이미지 위에 배치됩니다.
"그것(오버레이 텍스트)은 이미지와 조화를 이루며 메시지를 전달한다."
- 배경 이미지의 여백과 컬러에 맞게 배치됨
- 제품 이미지를 가리지 않는 위치에 존재함
- 한눈에 읽히는 간결한 문구로 구성됨

---

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
${blockContext}${imageAnalysisContext}
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

## ★★★ 창의적 텍스트 디자인 (핵심!)

당신은 타이포그래피 디자이너입니다. 이미지에 어울리는 텍스트를 **창의적으로** 디자인하세요.
- 텍스트의 개수, 위치, 크기를 자유롭게 결정
- 이미지의 여백과 분위기를 읽고 텍스트를 배치
- 대담한 한 줄도 좋고, 여러 조각이 흩어진 레이아웃도 좋음
- 상세페이지 디자인의 창의성을 보여주세요

## 색상 참고
- 주요 텍스트: "${textColors.headline}"
- 보조 텍스트: "${textColors.subheadline}"
- 설명 텍스트: "${textColors.body}"
- 강조색: "${textColors.accent}"

## 절대 금지
- 이모지 사용 금지 (😊, ✨, 💕 등)
- "완전", "대박", "꿀템" 등 과장 표현 금지
- 느낌표(!) 과다 사용 금지

## 응답 형식
자유롭게 배치할 텍스트들을 texts 배열로 반환하세요:

{
  "texts": [
    {
      "text": "첫 번째 텍스트 (가장 중요한 메시지)",
      "x": 50,
      "y": 20,
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "${textColors.headline}",
      "textAlign": "center"
    },
    {
      "text": "두 번째 텍스트 (필요하면 추가)",
      "x": 50,
      "y": 35,
      "fontSize": 18,
      "fontWeight": "normal",
      "color": "${textColors.subheadline}",
      "textAlign": "center"
    }
  ]
}

## ★★★ 텍스트 배치 가이드 (정확한 수치 사용!) ★★★

### 위치 (x, y) - 퍼센트 기준
- x: 0-100 (가로 위치)
  - 0-20: 왼쪽 영역
  - 40-60: 중앙 영역 (가장 일반적)
  - 80-100: 오른쪽 영역
- y: 0-100 (세로 위치)
  - 5-15: 상단 (브랜드명, 섹션 타이틀)
  - 20-40: 상단-중앙 (헤드라인)
  - 45-65: 중앙 (핵심 메시지, 통계)
  - 70-85: 하단-중앙 (본문, 설명)
  - 88-95: 하단 (CTA, 태그라인)

### 글씨 크기 (fontSize) - 정확한 픽셀값 사용!
- 브랜드명/섹션명: 12-16px (작고 절제된)
- 헤드라인: 24-36px (눈에 띄는 핵심 메시지)
- 서브헤드라인: 16-22px (보조 설명)
- 본문: 12-16px (상세 설명)
- 통계 숫자: 32-48px (강조되는 수치)
- CTA/버튼: 14-18px (행동 유도)

### 글씨 굵기 (fontWeight)
- "normal": 일반 설명, 본문
- "medium": 서브헤드라인, 중요 정보
- "bold": 헤드라인, 통계 숫자, 강조

### 정렬 (textAlign)
- "center": 대부분의 상세페이지 텍스트 (기본)
- "left": 스텝별 설명, 목록형 콘텐츠
- "right": 특수한 디자인 의도

## 섹션별 권장 레이아웃 (${section})
헤드라인: x=${layoutGuide.headline.x}, y=${layoutGuide.headline.y}, fontSize=${layoutGuide.headline.fontSize}px, align=${layoutGuide.headline.align}
서브헤드라인: x=${layoutGuide.subheadline.x}, y=${layoutGuide.subheadline.y}, fontSize=${layoutGuide.subheadline.fontSize}px
통계: x=${layoutGuide.statistics.x}, y=${layoutGuide.statistics.y}, fontSize=${layoutGuide.statistics.fontSize}px
CTA: x=${layoutGuide.cta.x}, y=${layoutGuide.cta.y}, fontSize=${layoutGuide.cta.fontSize}px

## 중요: 정확도 체크리스트
✅ fontSize는 반드시 12-48 범위의 정수값 사용
✅ x, y는 0-100 범위의 정수값 사용
✅ 텍스트가 겹치지 않도록 y값을 최소 10 이상 간격 유지
✅ 제품 이미지가 있는 중앙(y: 30-70) 영역은 텍스트 최소화
✅ 섹션별 권장 레이아웃을 기준으로 ±10% 이내에서 조정

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
// ★★★ 3차 고도화: 블록별 변형 로직 강화
// ============================================

/**
 * 섹션과 블록 인덱스에 따른 자동 변형 힌트 생성
 * OCR 데이터 기반: 올리브영 상세페이지에서 관찰된 패턴 적용
 */
export function generateBlockVariationHint(
  section: SectionType,
  blockIndex: number,
  totalBlocks: number,
  productFeatures?: string[],
  categoryKey?: string
): string {
  const featureIndex = Math.min(blockIndex, (productFeatures?.length || 1) - 1);
  const feature = productFeatures?.[featureIndex] || '';

  switch (section) {
    case 'FEATURES':
      // OCR 패턴: Point 01, Point 02, Point 03 또는 1. Glacé Glow, 2. Long-wear 형식
      const featurePatterns = [
        `Point ${String(blockIndex + 1).padStart(2, '0')} - ${feature || '핵심 효능'}`,
        `${blockIndex + 1}. ${feature || 'Key Feature'} 포인트`,
        `BENEFIT ${blockIndex + 1}: ${feature || '주요 효과'}`,
      ];
      return featurePatterns[blockIndex % featurePatterns.length];

    case 'HOW_TO_USE':
      // OCR 패턴: Step 1, Step 2, Step 3, Step 4
      const stepActions = ['세안 후', '적당량 덜어', '얼굴 전체에', '가볍게 두드려'];
      const action = stepActions[blockIndex] || `${blockIndex + 1}단계`;
      return `STEP ${blockIndex + 1} - ${action}`;

    case 'SOCIAL_PROOF':
      // OCR 패턴: 만족도, 지속력, 개선도, 추천의향
      const proofTypes = [
        '만족도 테스트',
        '지속력 임상',
        '피부 개선도',
        '재구매 의향',
      ];
      return proofTypes[blockIndex % proofTypes.length];

    case 'PRODUCT_LINEUP':
      // OCR 패턴: 컬러별 또는 용량별 라인업
      if (categoryKey === 'makeup') {
        const colorPatterns = ['웜톤 추천', '쿨톤 추천', '뉴트럴', '시즌 한정'];
        return `COLOR ${blockIndex + 1} - ${colorPatterns[blockIndex % colorPatterns.length]}`;
      }
      return `LINEUP ${blockIndex + 1}`;

    case 'INGREDIENT':
      // OCR 패턴: 핵심 성분 1, 2, 3
      const ingredientPatterns = ['주요 성분', '부스팅 성분', '보습 성분', '진정 성분'];
      return `KEY INGREDIENT ${blockIndex + 1} - ${ingredientPatterns[blockIndex % ingredientPatterns.length]}`;

    case 'TEXTURE':
      // OCR 패턴: 텍스처 특성
      const texturePatterns = ['발림성', '흡수력', '마무리감', '지속력'];
      return `TEXTURE ${blockIndex + 1} - ${texturePatterns[blockIndex % texturePatterns.length]}`;

    default:
      return `블록 ${blockIndex + 1}/${totalBlocks}`;
  }
}

/**
 * 블록별 스타일 변형 생성
 * 블록 순서에 따라 레이아웃, 폰트 크기, 색상 강도 등 미세 조정
 */
export interface BlockStyleVariation {
  fontSize: { headline: number; subheadline: number; body: number };
  position: { headlineY: number; subheadlineY: number };
  emphasis: 'high' | 'medium' | 'low';
  colorIntensity: number; // 0.0 ~ 1.0
}

export function getBlockStyleVariation(
  blockIndex: number,
  totalBlocks: number,
  section: SectionType
): BlockStyleVariation {
  // 첫 번째 블록은 가장 강조, 이후 블록은 점점 부드러운 스타일
  const emphasisLevels: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
  const emphasisIndex = Math.min(blockIndex, emphasisLevels.length - 1);
  const emphasis = emphasisLevels[emphasisIndex];

  // 섹션별 기본 스타일
  const baseStyles: Record<SectionType, { headline: number; subheadline: number; body: number }> = {
    MAIN: { headline: 28, subheadline: 20, body: 14 },
    HERO: { headline: 24, subheadline: 18, body: 14 },
    FEATURES: { headline: 20, subheadline: 16, body: 12 },
    SOCIAL_PROOF: { headline: 18, subheadline: 36, body: 12 },
    HOW_TO_USE: { headline: 14, subheadline: 20, body: 12 },
    PRODUCT_LINEUP: { headline: 16, subheadline: 14, body: 11 },
    FAQ: { headline: 16, subheadline: 14, body: 12 },
    TEXTURE: { headline: 18, subheadline: 22, body: 14 },
    INGREDIENT: { headline: 14, subheadline: 28, body: 12 },
    MODEL_SHOT: { headline: 16, subheadline: 14, body: 12 },
    SKIN_RESULT: { headline: 18, subheadline: 16, body: 14 },
    MATERIAL: { headline: 16, subheadline: 20, body: 12 },
    LIFESTYLE: { headline: 18, subheadline: 16, body: 12 },
    SPECS: { headline: 14, subheadline: 12, body: 11 },
    INFO_TABLE: { headline: 14, subheadline: 12, body: 11 },
    CTA: { headline: 20, subheadline: 16, body: 14 },
    CUSTOM: { headline: 18, subheadline: 16, body: 12 },
  };

  const baseFontSize = baseStyles[section] || baseStyles.FEATURES;

  // 블록 인덱스에 따른 미세 조정 (첫 블록이 가장 크게, 이후 약간씩 감소)
  const sizeReduction = blockIndex * 2;

  return {
    fontSize: {
      headline: Math.max(baseFontSize.headline - sizeReduction, 12),
      subheadline: Math.max(baseFontSize.subheadline - sizeReduction, 11),
      body: Math.max(baseFontSize.body - sizeReduction / 2, 10),
    },
    position: {
      headlineY: 5 + (blockIndex * 2), // 블록마다 약간 아래로
      subheadlineY: 15 + (blockIndex * 2),
    },
    emphasis,
    colorIntensity: 1.0 - (blockIndex * 0.1), // 첫 블록 100%, 이후 점점 감소
  };
}

/**
 * 블록별 통계 분배
 * 전체 통계를 블록 수에 맞게 분배하여 각 블록에 고유한 통계 제공
 */
export function distributeStatisticsToBlocks(
  categoryKey: string,
  totalBlocks: number,
  totalStats: number = 6
): { value: string; label: string }[][] {
  // 카테고리별 전체 통계 생성
  const allStats = generateRealisticStatistics(categoryKey, totalStats);

  // 블록별로 분배 (각 블록에 1-2개씩)
  const statsPerBlock = Math.max(1, Math.floor(totalStats / totalBlocks));
  const result: { value: string; label: string }[][] = [];

  for (let i = 0; i < totalBlocks; i++) {
    const startIdx = i * statsPerBlock;
    const endIdx = Math.min(startIdx + statsPerBlock, allStats.length);
    result.push(allStats.slice(startIdx, endIdx));
  }

  return result;
}

/**
 * 완전한 블록 오버레이 옵션 생성
 * 블록 인덱스만으로 모든 변형 정보를 자동 생성
 */
export function buildCompleteBlockOptions(
  blockIndex: number,
  totalBlocks: number,
  section: SectionType,
  productFeatures?: string[],
  categoryKey?: string,
  imageAnalysis?: BlockOverlayOptions['imageAnalysis']
): BlockOverlayOptions {
  const variationHint = generateBlockVariationHint(
    section,
    blockIndex,
    totalBlocks,
    productFeatures,
    categoryKey
  );

  return {
    blockIndex,
    totalBlocks,
    variationHint,
    imageAnalysis,
  };
}

/**
 * 블록별 강조 포인트 생성 (OCR 패턴 기반)
 * 섹션과 블록 순서에 따른 강조 요소 결정
 */
export function getBlockEmphasisPoint(
  section: SectionType,
  blockIndex: number,
  categoryKey: string
): { emphasisType: 'statistic' | 'headline' | 'visual' | 'action'; value?: string } {
  // OCR 분석 결과: 섹션별 강조 패턴
  const emphasisPatterns: Record<SectionType, ('statistic' | 'headline' | 'visual' | 'action')[]> = {
    MAIN: ['headline', 'visual', 'headline'],
    HERO: ['headline', 'statistic', 'visual'],
    FEATURES: ['statistic', 'headline', 'statistic'],
    SOCIAL_PROOF: ['statistic', 'statistic', 'statistic'],
    HOW_TO_USE: ['action', 'action', 'action', 'action'],
    PRODUCT_LINEUP: ['visual', 'visual', 'visual'],
    FAQ: ['headline', 'headline', 'headline'],
    TEXTURE: ['visual', 'headline', 'visual'],
    INGREDIENT: ['statistic', 'headline', 'statistic'],
    MODEL_SHOT: ['visual', 'visual', 'visual'],
    SKIN_RESULT: ['statistic', 'visual', 'statistic'],
    MATERIAL: ['headline', 'visual', 'headline'],
    LIFESTYLE: ['visual', 'headline', 'visual'],
    SPECS: ['statistic', 'statistic', 'statistic'],
    INFO_TABLE: ['headline', 'headline', 'headline'],
    CTA: ['action', 'headline', 'action'],
    CUSTOM: ['headline', 'visual', 'headline'],
  };

  const patterns = emphasisPatterns[section] || ['headline', 'headline', 'headline'];
  const emphasisType = patterns[blockIndex % patterns.length];

  // 통계 강조인 경우 샘플 값 생성
  if (emphasisType === 'statistic') {
    const stats = generateRealisticStatistics(categoryKey, 1);
    return { emphasisType, value: stats[0]?.value };
  }

  return { emphasisType };
}

// ============================================
// Export 상수들
// NOTE: 함수들은 이미 export function으로 선언되어 있으므로
//       여기서는 상수들만 export합니다
// ============================================

export {
  SENSORY_KEYWORDS,
  NUMBERING_PATTERNS,
  GENERATION_EXPRESSIONS,
  COLOR_CHART_PATTERNS,
  SECTION_LAYOUT_GUIDE,
  SECTION_TEXT_EXAMPLES,
  CATEGORY_TEXT_STYLE,
  // ★ OCR 데이터 기반 통계 패턴 (신규)
  CATEGORY_STATISTICS_PATTERNS,
};

// 함수들은 위에서 export function으로 이미 export됨:
// - getCategoryKey
// - generateRealisticStatistics
// - getTextColorsFromImageAnalysis
// - getTextSafeAreaFromProductPosition
// - generateBlockVariationHint
// - getBlockStyleVariation
// - distributeStatisticsToBlocks
// - buildCompleteBlockOptions
// - getBlockEmphasisPoint
