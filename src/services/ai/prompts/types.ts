/**
 * 프롬프트 관련 타입 정의
 */

// ============================================
// 브랜드 컨텍스트
// ============================================

export interface BrandContext {
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  ragContext?: string;
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
// 오버레이 텍스트 콘텐츠
// ============================================

export interface OverlayTextContent {
  /** 대제목 (5-10자) */
  headline?: string;
  /** 부제목 (10-20자) */
  subheadline?: string;
  /** 본문 (20-50자) */
  body?: string;
  /** 수치/통계 (예: "92%", "3.5배") */
  statistics?: string[];
  /** 행동 유도 문구 (5-10자) */
  cta?: string;
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

export type SectionType = 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ' | 'CUSTOM';

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
