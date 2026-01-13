/**
 * 프롬프트 관련 타입 정의
 */

// ============================================
// 브랜드 스타일 가이드 (웹사이트 크롤링에서 추출)
// ============================================

export interface BrandStyleGuide {
  colors?: {
    primary?: string;      // 주요 브랜드 색상 (HEX)
    secondary?: string;    // 보조 색상 (HEX)
    palette?: string[];    // 전체 색상 팔레트
    themeColor?: string;   // meta theme-color
  };
  images?: {
    logo?: string;         // 로고 URL
    favicon?: string;      // 파비콘 URL
    ogImage?: string;      // OG 이미지 URL
    hero?: string;         // 히어로 이미지 URL
  };
  fonts?: {
    primary?: string;      // 주요 폰트
    all?: string[];        // 사용된 폰트 목록
  };
  extractedAt?: string;    // 추출 일시
}

// ============================================
// 브랜드 컨텍스트
// ============================================

export interface BrandContext {
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  ragContext?: string;
  styleGuide?: BrandStyleGuide;  // ★ 크롤링에서 추출한 브랜드 자산
}

// ============================================
// 상세페이지 생성 입력
// ============================================

export interface GenerateDetailPageInput {
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
// 제품 시각 참조 (이미지 일관성용)
// ============================================

export interface ProductVisualReference {
  /** 제품 외형 상세 설명 (예: "원형 블랙 케이스의 쿠션 파운데이션, 금색 로고 각인") */
  appearance?: string;
  /** 제품 색상 (예: "black case with gold accents") */
  colorScheme?: string;
  /** 패키지 형태 (예: "circular compact case") */
  packageShape?: string;
  /** 브랜드 시각 요소 (예: "minimalist luxury") */
  brandVisual?: string;
}

// ============================================
// 오버레이 텍스트 콘텐츠 (위치 + 스타일 포함)
// ============================================

/** 텍스트 항목 스타일 (위치, 폰트, 색상 등) */
export interface OverlayTextItem {
  text: string;
  x: number;           // 위치 (% 기준, 0-100)
  y: number;           // 위치 (% 기준, 0-100)
  fontSize: number;    // px 단위
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: string; // 폰트 패밀리 (예: "Pretendard, sans-serif")
  color: string;       // hex color (예: "#ffffff")
  textAlign?: 'left' | 'center' | 'right';
}

/** 통계 항목 (숫자 강조용) */
export interface OverlayStatisticItem {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: string; // 폰트 패밀리
  color: string;
}

export interface OverlayTextContent {
  /** 대제목 (5-10자) - 위치와 스타일 포함 */
  headline?: OverlayTextItem | string;  // 하위 호환성을 위해 string도 허용
  /** 부제목 (10-20자) */
  subheadline?: OverlayTextItem | string;
  /** 본문 (20-50자) */
  body?: OverlayTextItem | string;
  /** 수치/통계 (예: "92%", "3.5배") */
  statistics?: OverlayStatisticItem[] | string[];
  /** 행동 유도 문구 (5-10자) */
  cta?: OverlayTextItem | string;
  /** ★ 브랜드 폰트 (크롤링에서 추출, 전체 텍스트에 적용) */
  brandFont?: string;
  /** ★ 브랜드 로고 URL (크롤링에서 추출, 오버레이에 표시 가능) */
  brandLogoUrl?: string;
}

/** 헬퍼: OverlayTextItem에서 텍스트만 추출 */
export function getOverlayText(item: OverlayTextItem | string | undefined): string | undefined {
  if (!item) return undefined;
  if (typeof item === 'string') return item;
  return item.text;
}

/** 헬퍼: 통계 배열에서 텍스트만 추출 */
export function getOverlayStatistics(items: OverlayStatisticItem[] | string[] | undefined): string[] | undefined {
  if (!items || items.length === 0) return undefined;
  return items.map(item => typeof item === 'string' ? item : item.text);
}

// ============================================
// 이미지 분석 결과 (오버레이 스타일 결정용)
// ============================================

/** 이미지 분석 결과 - 오버레이 텍스트 스타일 결정에 사용 */
export interface ImageAnalysisResult {
  /** 배경 밝기 (light/dark/mixed) */
  backgroundBrightness: 'light' | 'dark' | 'mixed';

  /** 주요 배경색 (hex) */
  dominantColor: string;

  /** 텍스트 안전 영역 (제품이 없는 빈 공간) */
  safeZones: {
    position: 'top-left' | 'top-center' | 'top-right' |
              'center-left' | 'center' | 'center-right' |
              'bottom-left' | 'bottom-center' | 'bottom-right';
    /** 영역 크기 (small/medium/large) */
    size: 'small' | 'medium' | 'large';
    /** 해당 영역의 밝기 */
    brightness: 'light' | 'dark';
  }[];

  /** 추천 텍스트 색상 (밝은 배경 → 어두운 텍스트, 어두운 배경 → 밝은 텍스트) */
  recommendedTextColors: {
    headline: string;      // hex color
    subheadline: string;
    body: string;
    cta: string;
  };

  /** 제품 위치 (텍스트 배치 피하기 위함) */
  productPosition: 'left' | 'center' | 'right' | 'scattered';

  /** 전체적인 분위기 */
  mood: 'premium' | 'natural' | 'vibrant' | 'clinical' | 'minimal';
}

// ============================================
// 카피 길이 설정
// ============================================

export interface CopyLengthConfig {
  hookLength: number;
  sectionTitleLength: number;
  sectionBodyLength: number;
  description: string;
  bulletPoints: number;
}

// ============================================
// 섹션 타입
// ============================================

export type SectionType =
  | 'MAIN'           // 메인 히어로 섹션
  | 'HERO'           // 히어로 (메인과 유사)
  | 'FEATURES'       // 특징/기능 섹션
  | 'SOCIAL_PROOF'   // 소셜 프루프 (리뷰, 테스트 결과)
  | 'HOW_TO_USE'     // 사용법
  | 'FAQ'            // FAQ
  | 'CUSTOM'         // 커스텀 섹션
  // 2차 고도화: 추가 섹션 타입
  | 'PRODUCT_LINEUP' // 제품 라인업/컬러차트
  | 'INGREDIENT'     // 성분 강조
  | 'TEXTURE'        // 텍스처/제형
  | 'CTA'            // 구매 유도 (Call to Action)
  | 'MODEL_SHOT'     // 모델 샷
  | 'SKIN_RESULT'    // 피부 결과
  | 'MATERIAL'       // 소재/원료
  | 'LIFESTYLE'      // 라이프스타일
  | 'SPECS'          // 스펙/사양
  | 'INFO_TABLE';    // 정보 테이블

export type SectionPosition = 'intro' | 'features' | 'proof' | 'usage' | 'closing';

// ============================================
// 카테고리 패턴
// ============================================

export interface CategoryPattern {
  keywords: string[];
  textPatterns: string[];
  visualPatterns: string[];
  toneGuide: string;
  topStats: { text: string; visual: string }[];
}

// ============================================
// 섹션 스토리 가이드
// ============================================

export interface SectionStoryGuide {
  position: SectionPosition;
  purpose: string;
  textEmphasis: string[];
  visualEmphasis: string[];
  textTone: string;
  bestPractices: string[];
  copyGuide: Record<string, string>;
}

// ============================================
// 섹션 구도 가이드
// ============================================

export interface SectionCompositionGuide {
  layout: string;
  productPlacement: string;
  textPlacement: string;
  lighting: string;
  mood: string;
}

// ============================================
// 브랜드 톤 프리셋
// ============================================

export type BrandToneType = 'luxury' | 'clean' | 'natural' | 'trendy' | 'derma';

export interface BrandTonePreset {
  /** 프리셋 이름 (한글) */
  name: string;
  /** 프리셋 설명 */
  description: string;
  /** 폰트 스타일 가이드 */
  font: {
    primary: string;
    style: string;
    weight: string;
  };
  /** 색상 팔레트 */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  /** 레이아웃 스타일 */
  layout: {
    spacing: string;
    density: string;
  };
  /** 이미지 스타일 */
  imageStyle: string[];
  /** 카피 톤 가이드 */
  copyTone: string;
  /** 예시 브랜드 */
  exampleBrands: string[];
}

// ============================================
// 카테고리 색상 가이드
// ============================================

export interface CategoryColorGuide {
  /** 메인 강조 색상 */
  primary: string;
  /** 보조 색상 */
  secondary: string;
  /** 배경 색상 계열 */
  background: string;
  /** 색상 선택 이유/연상 */
  rationale: string;
}

// ============================================
// 확장된 카테고리 패턴 (색상 가이드 포함)
// ============================================

export interface ExtendedCategoryPattern extends CategoryPattern {
  /** 카테고리별 색상 가이드 */
  colorGuide?: CategoryColorGuide;
  /** 고민별 세부 색상 */
  concernColors?: Record<string, string>;
}

// ============================================
// 품질 체크리스트 항목
// ============================================

export interface QualityCheckItem {
  id: string;
  category: 'content' | 'brand' | 'ux' | 'accessibility';
  description: string;
  required: boolean;
}

// ============================================
// 필수 입력 필드 정의
// ============================================

export interface RequiredFieldDefinition {
  field: string;
  label: string;
  required: boolean;
  description: string;
  example?: string;
}

// ============================================
// 이미지 레이아웃 프리셋
// ============================================

export type LayoutStyle =
  | 'hero-centered'      // 제품 중앙, 상하 여백
  | 'hero-bottom'        // 제품 하단, 상단 텍스트 영역
  | 'split-left'         // 제품 좌측, 우측 텍스트 영역
  | 'split-right'        // 제품 우측, 좌측 텍스트 영역
  | 'floating'           // 제품 부유, 배경 전체 활용
  | 'grid'               // 그리드 배치 (성분, 라인업)
  | 'comparison'         // 비교 레이아웃 (Before/After)
  | 'step-sequence'      // 단계별 시퀀스
  | 'lifestyle';         // 라이프스타일 컨텍스트

export interface DetailPageLayoutPreset {
  /** 레이아웃 스타일 ID */
  style: LayoutStyle;
  /** 레이아웃 설명 */
  description: string;
  /** 제품 배치 지시 (영문 프롬프트) */
  productPlacement: string;
  /** 구도 지시 (영문 프롬프트) */
  composition: string;
  /** 권장 비율 */
  aspectRatio: string;
  /** 적합한 섹션 타입 */
  suitableFor: SectionType[];
}

// ============================================
// Text Safe Zone (텍스트 오버레이 영역)
// ============================================

export type SafeZonePosition =
  | 'top-full'           // 상단 전체 (헤드라인용)
  | 'top-left'           // 좌상단
  | 'top-right'          // 우상단
  | 'center-left'        // 좌측 중앙
  | 'center-right'       // 우측 중앙
  | 'bottom-full'        // 하단 전체 (CTA용)
  | 'bottom-left'        // 좌하단
  | 'bottom-right'       // 우하단
  | 'overlay-center';    // 중앙 오버레이

export interface TextSafeZone {
  /** 영역 위치 */
  position: SafeZonePosition;
  /** 영역 설명 */
  description: string;
  /** 이미지 생성 시 해당 영역 비워두기 지시 (영문) */
  clearanceInstruction: string;
  /** 권장 텍스트 타입 */
  recommendedContent: ('headline' | 'subheadline' | 'body' | 'statistics' | 'cta')[];
  /** 권장 텍스트 정렬 */
  textAlign: 'left' | 'center' | 'right';
}

// ============================================
// 네거티브 프롬프트 설정
// ============================================

export type NegativePromptCategory =
  | 'quality'            // 품질 관련
  | 'style'              // 스타일 관련
  | 'content'            // 콘텐츠 관련
  | 'composition'        // 구도 관련
  | 'brand';             // 브랜드 관련

export interface NegativePromptConfig {
  /** 카테고리 */
  category: NegativePromptCategory;
  /** 제외할 요소들 (영문) */
  excludeTerms: string[];
  /** 설명 */
  description: string;
}

// ============================================
// 이미지 구도 통합 설정
// ============================================

export interface ImageCompositionConfig {
  /** 레이아웃 프리셋 */
  layout: DetailPageLayoutPreset;
  /** 텍스트 안전 영역 */
  textSafeZones: TextSafeZone[];
  /** 네거티브 프롬프트 */
  negativePrompts: NegativePromptConfig[];
  /** 추가 스타일 지시 */
  additionalStyle?: string;
}
