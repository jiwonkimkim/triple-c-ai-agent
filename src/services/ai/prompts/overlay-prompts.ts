/**
 * 오버레이 텍스트 프롬프트 빌더
 * 실제 올리브영 상세페이지 OCR 분석 기반 고도화
 * ★ 섹션별 실제 패턴 반영
 * ★ 2차 고도화: 넘버링, 컬러차트, 감각 표현 추가
 */

import type { SectionType } from './types';
import { getCategoryPattern, SECTION_STORY_GUIDE } from './category-patterns';

// ============================================
// [대기 프롬프트] 필요 시 다시 활성화
// ============================================
// ## ⛔ Forbidden Words (Section Type Names)
// (절대 금지 단어 - 섹션 타입명)
//
// NEVER use these words in text:
// (다음 단어들은 절대로 텍스트에 포함하지 마세요)
// - FEATURES, HERO, SOCIAL_PROOF, HOW_TO_USE, FAQ, MAIN
//
// Instead use: HYALURONIC, VITAMIN C, CLINICAL TEST, PROVEN, etc.
// (대신 사용: 실제 성분/효능 관련 영문)
// ============================================

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
// 섹션별 실제 오버레이 텍스트 예시 (x, y, fontSize는 AI가 자유롭게 결정)
// ============================================

const SECTION_TEXT_EXAMPLES: Record<string, {
  pattern: string;
  examples: {
    texts: {
      text: string;
      x: string;       // 0.0 - 100.0 사이 실수값
      y: string;       // 0.0 - 100.0 사이 실수값
      fontSize: string;  // 정수값
      fontWeight: 'normal' | 'bold';
      color: string;   // HEX 색상값 (예: #333333)
      textAlign: 'left' | 'center' | 'right';
    }[];
  }[];
}> = {
  MAIN: {
    pattern: '브랜드명 → 제품라인명 → 기술명/한글명 → 태그라인',
    examples: [
      {
        texts: [
          { text: '{브랜드명}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{제품라인 영문}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: 'NEW {제품명 한글}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{브랜드 슬로건}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
    ],
  },
  FEATURES: {
    pattern: '설명문 → 해시태그 → 영문 성분명/효능명 → 숫자+효과',
    examples: [
      {
        texts: [
          { text: '{핵심 효능 한 문장}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '#{키워드1} #{키워드2} #{키워드3}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: 'HYALURONIC ACID', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '48H 보습 지속', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
      {
        texts: [
          { text: 'Point 01', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{첫 번째 핵심 특징}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{특징 상세 설명}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
    ],
  },
  SOCIAL_PROOF: {
    pattern: '영문 타이틀 → 한글 설명 → 통계 숫자들',
    examples: [
      {
        texts: [
          { text: 'CLINICAL TEST', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{핵심 효과 한 문장}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '98%', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '만족도', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '24H', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '지속력', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '2.5배', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '흡수력', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
    ],
  },
  HOW_TO_USE: {
    pattern: '영문타이틀 → 단계별 안내',
    examples: [
      {
        texts: [
          { text: '3 STEP', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{간단한 사용법 요약}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
      {
        texts: [
          { text: 'STEP 1', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{동작 설명}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
    ],
  },
  PRODUCT_LINEUP: {
    pattern: '섹션타이틀 → 라인업명 → 컬러/제품 목록',
    examples: [
      {
        texts: [
          { text: 'Color Chart', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{라인업명}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: 'PINK FLAKE 핑크 플레이크', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
    ],
  },
  INGREDIENT: {
    pattern: '섹션타이틀 → 핵심 성분명 → 함량/효능',
    examples: [
      {
        texts: [
          { text: 'KEY INGREDIENT', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{핵심 성분명}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '95%', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{성분 효능 설명}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
    ],
  },
  TEXTURE: {
    pattern: '섹션타이틀 → 텍스처명 → 감각 표현',
    examples: [
      {
        texts: [
          { text: 'TEXTURE', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{텍스처 특징}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{감촉} · {발림성} · {마무리감}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
      },
    ],
  },
  CTA: {
    pattern: '구매 유도 문구 → 혜택',
    examples: [
      {
        texts: [
          { text: '{구매 유도 핵심 문구}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'bold', color: 'HEX 색상값', textAlign: 'center' },
          { text: '{한정 혜택/이벤트}', x: '0.0 - 100.0', y: '0.0 - 100.0', fontSize: '정수값', fontWeight: 'normal', color: 'HEX 색상값', textAlign: 'center' },
        ],
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
 * 이미지 분석 결과를 기반으로 텍스트 색상 팔레트를 제공합니다.
 * 모델이 자유롭게 선택할 수 있도록 여러 색상 옵션 제공
 */
export function getTextColorPalette(
  backgroundBrightness: 'light' | 'dark' | 'mixed',
  categoryKey: string
): string[] {
  const categoryStyle = CATEGORY_TEXT_STYLE[categoryKey] || CATEGORY_TEXT_STYLE.skincare;

  if (backgroundBrightness === 'dark') {
    return ['#ffffff', '#e0e0e0', '#cccccc', categoryStyle.colorScheme.accent];
  }

  return ['#333333', '#666666', '#888888', categoryStyle.colorScheme.accent];
}

/**
 * 제품 위치에 따른 텍스트 안전 영역을 결정합니다.
 * 텍스트를 배치하기 좋은 영역 힌트 제공 (모델이 자유롭게 활용)
 */
export function getTextSafeArea(
  productPosition: 'left' | 'center' | 'right' | 'scattered'
): string {
  switch (productPosition) {
    case 'left':
      return '오른쪽 영역(x: 60-90%)이 텍스트 배치에 적합';
    case 'right':
      return '왼쪽 영역(x: 10-40%)이 텍스트 배치에 적합';
    case 'center':
      return '상단(y: 5-25%) 또는 하단(y: 75-95%) 영역이 텍스트 배치에 적합';
    case 'scattered':
    default:
      return '여백을 찾아 자유롭게 배치';
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
  const colorPalette = imageAnalysis?.backgroundBrightness
    ? getTextColorPalette(imageAnalysis.backgroundBrightness, categoryKey)
    : ['#333333', '#666666', '#888888', categoryStyle.colorScheme.accent];

  const textSafeArea = imageAnalysis?.productPosition
    ? getTextSafeArea(imageAnalysis.productPosition)
    : '자유롭게 배치';

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
## ★★★ 이미지 분석 기반 힌트
- 배경 밝기: ${imageAnalysis.backgroundBrightness || 'light'}
- 주요 배경색: ${imageAnalysis.dominantColor || '#ffffff'}
- 제품 위치: ${imageAnalysis.productPosition || 'center'}
- 텍스트 배치 힌트: ${textSafeArea}
`
    : '';

  // 실제 예시 포맷팅 (여러 예시 포함)
  const examplesJson = textExamples.examples.map((ex, i) =>
    `예시 ${i + 1}:\n${JSON.stringify(ex, null, 2)}`
  ).join('\n\n');

  // 섹션별 특화 가이드
  const sectionSpecificGuide = getSectionSpecificGuide(section, categoryKey);

  return `## ★★★ Role Specification (역할 정의)

### 1st Person - Copywriter (Author)
### 1인칭 - 카피라이터 (작성자)

**You are a copywriter specializing in Korean Olive Young/Hwahae product detail pages.**
당신은 한국 올리브영/화해 상세페이지 전문 카피라이터입니다.

**"I write text that conveys the core value of this product."**
"나는 이 제품의 핵심 가치를 전달하는 텍스트를 작성한다."

- Craft messages that most effectively communicate product benefits
- 제품의 장점을 가장 효과적으로 전달하는 문구를 고민합니다
- Understand target customer needs and create empathetic messages
- 타겟 고객의 니즈를 파악하고 공감하는 메시지를 만듭니다
- Choose expressions that match the brand's tone and manner
- 브랜드 톤앤매너에 맞는 표현을 선택합니다

### 2nd Person - Detail Page/Text (Medium)
### 2인칭 - 상세페이지/텍스트 (매체)

**The text you write is part of a product detail page.**
당신이 작성하는 텍스트는 상세페이지의 일부입니다.

**"You (the text) speak directly to customers."**
"너(텍스트)는 고객에게 직접 말을 건네는 역할을 한다."

- Designed freely according to the image's mood and whitespace
- 이미지의 분위기와 여백에 따라 자유롭게 디자인됨
- Captures attention with creative layouts
- 창의적인 레이아웃으로 시선을 사로잡음
- Could be a single line, or multiple scattered pieces
- 한 줄일 수도, 여러 조각이 흩어질 수도 있음
- Typography that blends into the image without fixed templates
- 정해진 틀 없이 이미지에 녹아드는 타이포그래피

### 3rd Person - Overlay Text (Output)
### 3인칭 - 오버레이 텍스트 (결과물)

**The generated overlay text is placed on top of the image.**
생성되는 오버레이 텍스트는 이미지 위에 배치됩니다.

**"It (the overlay text) delivers the message in harmony with the image."**
"그것(오버레이 텍스트)은 이미지와 조화를 이루며 메시지를 전달한다."

- Positioned according to background image whitespace and colors
- 배경 이미지의 여백과 컬러에 맞게 배치됨
- Exists in positions that don't obscure the product image
- 제품 이미지를 가리지 않는 위치에 존재함
- Composed of concise phrases that are readable at a glance
- 한눈에 읽히는 간결한 문구로 구성됨

---

## ★★★ Design Philosophy (디자인 철학)

**You are a copywriter and typography designer specializing in Korean Olive Young/Hwahae product detail pages.**
당신은 한국 올리브영/화해 상세페이지 전문 카피라이터이자 타이포그래피 디자이너입니다.

**Design text that harmonizes with the image — freely.**
이미지에 어울리는 텍스트를 **자유롭게** 디자인하세요.

**Free Layout**: Creatively decide the number, position, size, and color of text elements.
**자유로운 레이아웃**: 텍스트 개수, 위치, 크기, 색상을 창의적으로 결정하세요.

**Typography that naturally blends with the image's whitespace and mood.**
이미지의 여백과 분위기에 맞춰 자연스럽게 녹아드는 타이포그래피를 구현하세요.

**Place text creatively without fixed templates.**
정해진 틀 없이 창의적으로 텍스트를 배치하세요.

---

## Core Principles
(핵심 원칙)

1. **Authentic detail page style**: Professional copy like Olive Young product pages
   (실제 상세페이지 스타일: 올리브영에서 볼 수 있는 전문적인 카피)
2. **Short and impactful**: Each text should be 5-25 characters
   (짧고 임팩트 있게: 각 텍스트는 5-25자 이내)
3. **Numbers build trust**: Use specific numbers and percentages
   (숫자로 신뢰감: 구체적인 수치와 퍼센트 활용)
4. **English + Korean mix**: Ingredient/benefit names in English, descriptions in Korean
   (영문+한글 믹스: 성분명/효능명은 영문, 설명은 한글)

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 타겟: ${targetAudience}
- 핵심 특징: ${keyFeatures.join(', ')}

## 이 이미지의 역할
${sectionGuide.purpose}

## 텍스트 스타일 참고
${textExamples.pattern}
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

## 색상 (Color)
이미지에 어울리는 자유로운 텍스트 색상으로 디자인하세요.
Design with free text colors that match the image.

## 절대 금지
- 이모지 사용 금지 (😊, ✨, 💕 등)
- "완전", "대박", "꿀템" 등 과장 표현 금지
- 느낌표(!) 과다 사용 금지
- HEX 색상값(#FFFFFF, #EDE6DB 등)을 text 내용으로 반환 금지 (color 필드에만 사용)

## 응답 형식
자유롭게 배치할 텍스트들을 texts 배열로 반환하세요:
★★★ 좌표는 0-100% 퍼센트입니다! (50.0=중앙, 소수점 사용) ★★★

{
  "texts": [
    {
      "text": "텍스트 내용",
      "x": (이미지에 맞는 x좌표 0.0-100.0),
      "y": (이미지에 맞는 y좌표 0.0-100.0),
      "fontSize": (내용에 맞는 크기 12-80),
      "fontWeight": "bold",
      "color": "(이미지에 어울리는 HEX 색상)",
      "textAlign": "center"
    }
  ]
}

## 텍스트 배치 가이드 (0-100% 좌표계)

### 위치 (x, y)
- x: 0.0-100.0 (가로 위치, 50.0 = 정중앙)
- y: 0.0-100.0 (세로 위치, 0.0 = 상단, 100.0 = 하단)

### 글씨 크기 (fontSize)
- Choose the size freely based on your design intent
- 디자인 의도에 맞게 자유롭게 폰트 크기를 선택하세요
- Consider visual hierarchy and readability
- 시각적 계층과 가독성을 고려하세요

### 글씨 굵기 (fontWeight)
- "normal" / "bold"

### 정렬 (textAlign)
- "left" / "center" / "right"

## 체크리스트
✅ fontSize: Choose freely (디자인 의도에 맞게 자유롭게 선택)
✅ x, y: 0-100 (소수값 허용, 자유롭게 배치)

- JSON만 반환 (설명 없이)`;
}

// ============================================
// 섹션별 특화 가이드 생성
// ============================================

function getSectionSpecificGuide(section: SectionType, categoryKey: string): string {
  switch (section) {
    case 'MAIN':
      return `## ★ 썸네일/대표 이미지 텍스트 가이드
- NEW / {X}세대 / 진화된 표현 활용 가능
- 브랜드 아이덴티티를 살리는 영문 라인명
- 태그라인은 하단에 작게 배치`;

    case 'FEATURES':
      return `## ★ 제품 특징 텍스트 가이드
- **넘버링 패턴 활용**: Point 01, Point 02, Point 03 또는 1. 2. 3. 형식
- **영문 특징명 + 한글 설명** 조합 권장
- 예: "1. Glacé Glow" + "맑고 영롱한 광채"
- 해시태그 형식도 가능: #탱글 #영롱 #지속력`;

    case 'SOCIAL_PROOF':
      return `## ★ 효과 입증/신뢰 텍스트 가이드
- BENEFIT, CLINICAL TEST, PROVEN RESULT 등 영문 타이틀
- "{X}주 테스트 완료" 형식의 신뢰성 강조
- 수치는 크게, 설명은 작게 배치`;

    case 'HOW_TO_USE':
      return `## ★ 사용법 텍스트 가이드
- "{X} STEP" 형식 권장 (예: 4 STEP)
- 각 단계는 간결한 동작 설명
- STEP 1, STEP 2... 또는 Step 1, Step 2... 형식`;

    case 'PRODUCT_LINEUP':
      return `## ★ 제품 라인업 텍스트 가이드 (${categoryKey === 'makeup' ? '메이크업' : '일반'})
${categoryKey === 'makeup' ? `- Color Chart, SHADES 등 영문 타이틀
- 컬러명: 영문 + 한글 조합 (예: "PINK FLAKE 핑크 플레이크")
- 컬러 스와치 옆에 컬러명 배치` : `- 제품 라인업 소개
- 용량/타입별 구분 표시`}`;

    case 'INGREDIENT':
      return `## ★ 성분 소개 텍스트 가이드
- KEY INGREDIENT, FORMULA 등 영문 타이틀
- 핵심 성분명은 크게 강조
- 함량 수치 (XX%, XXXppm 등) 포함`;

    case 'TEXTURE':
      return `## ★ 텍스처/질감 텍스트 가이드
- TEXTURE, DESIGN 등 영문 타이틀
- 감각적 표현 적극 활용: ${SENSORY_KEYWORDS[categoryKey]?.texture.slice(0, 3).join(', ')}
- 발림성, 마무리감 설명`;

    default:
      return '';
  }
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

// ============================================
// Export 상수들
// ============================================

export {
  SENSORY_KEYWORDS,
  SECTION_TEXT_EXAMPLES,
  CATEGORY_TEXT_STYLE,
  CATEGORY_STATISTICS_PATTERNS,
};
