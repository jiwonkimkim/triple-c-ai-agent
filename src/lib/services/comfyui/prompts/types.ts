/**
 * ComfyUI 프롬프트 시스템 - 공통 타입 정의
 * 모든 모델이 공유하는 인터페이스
 */

// ============================================
// 섹션 타입
// ============================================

export type SectionType = 'MAIN' | 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ';

// ============================================
// 모델 설정
// ============================================

export interface ModelConfig {
  /** 모델 식별자 */
  name: string;
  /** 표시 이름 */
  displayName: string;
  /** 기본 스텝 수 */
  steps: number;
  /** CFG 스케일 */
  cfg: number;
  /** 샘플러 */
  sampler: string;
  /** 스케줄러 */
  scheduler: string;
  /** 네거티브 프롬프트 지원 여부 */
  supportsNegative: boolean;
  /** 예상 생성 시간 (초) */
  estimatedTime: number;
  /** 체크포인트 파일명 (선택) */
  checkpoint?: string;
}

// ============================================
// 프롬프트 입력/출력
// ============================================

export interface PromptInput {
  /** 섹션 타입 */
  sectionType: SectionType;
  /** 제품명 */
  productName: string;
  /** 카테고리 */
  category: string;
  /** 배경 스타일 */
  background?: string;
  /** 핵심 특징 */
  keyFeatures?: string[];
  /** 타겟 고객 */
  targetAudience?: string;
  /** 추가 키워드 */
  additionalKeywords?: string[];
  /** 사람 포함 여부 */
  includeHuman?: boolean;
}

export interface PromptOutput {
  /** 포지티브 프롬프트 */
  positive: string;
  /** 네거티브 프롬프트 (미지원 모델은 빈 문자열) */
  negative: string;
}

// ============================================
// 모델 프롬프트 빌더 인터페이스
// ============================================

export interface ModelPromptBuilder {
  /** 모델 설정 */
  config: ModelConfig;

  /**
   * 프롬프트 빌드
   * @param input 프롬프트 입력
   * @returns 포지티브/네거티브 프롬프트
   */
  buildPrompt(input: PromptInput): PromptOutput;

  /**
   * MAIN 섹션 전용 프롬프트 빌드 (재료 오브제 포함)
   * @param input 프롬프트 입력
   * @returns 포지티브/네거티브 프롬프트
   */
  buildMainPrompt?(input: PromptInput): PromptOutput;
}

// ============================================
// 베이스 템플릿 타입
// ============================================

export interface BaseSectionTemplate {
  /** 섹션 목적 */
  purpose: string;
  /** 구도 가이드 */
  composition: string;
  /** 텍스트 오버레이 영역 */
  textSpace: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  /** 조명 스타일 */
  lighting: string;
  /** 분위기 키워드 */
  mood: string[];
}

// ============================================
// 카테고리 타입
// ============================================

export type CategoryType =
  | 'beauty'
  | 'skincare'
  | 'makeup'
  | 'lip'
  | 'haircare'
  | 'food'
  | 'fashion'
  | 'electronics'
  | 'default';

// ============================================
// 배경 스타일
// ============================================

export type BackgroundStyle =
  | 'neutral'
  | 'white'
  | 'cream'
  | 'pink'
  | 'gray'
  | 'gradient'
  | 'custom';
