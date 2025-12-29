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
