/**
 * ★ Gemini 이미지 생성 타입/인터페이스 모듈
 * - 원본: gemini-image-generator.ts에서 분리
 * - 모든 Gemini 관련 타입 정의
 */

import type { OverlayTextContent } from '@/services/ai/prompts/types';

// ============================================
// ★ 타입 정의
// ============================================

/**
 * Gemini 이미지 생성 지원 모델
 * - gemini-2.5-flash-image: Image-to-Image 지원 (Nano Banana), 빠른 속도, 1024px
 * - gemini-3-pro-image-preview: Image-to-Image 지원 (Nano Banana Pro), 고품질, 4K
 * - gemini-2.0-flash-exp: Text/Vision 모델 (Image-to-Image 미지원)
 */
export type GeminiImageModel =
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.5-flash-preview-05-20'
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';

/** Image-to-Image를 지원하는 모델 (기본값으로 사용) */
export const DEFAULT_IMAGE_MODEL: GeminiImageModel = 'gemini-2.5-flash-image';

/** 지원 이미지 비율 */
export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

// ============================================
// ★ 인터페이스 정의
// ============================================

/** T2I 이미지 생성 옵션 */
export interface GeminiGenerateImageOptions {
  prompt: string;
  model?: GeminiImageModel;
  aspectRatio?: ImageAspectRatio;
  numberOfImages?: number;
}

/** 생성된 이미지 결과 (프롬프트 구성요소 포함) */
export interface GeminiGeneratedImage {
  base64Data: string;
  mimeType: string;
  revisedPrompt?: string;
  /** 이미지 모델이 함께 리턴한 오버레이 텍스트 */
  overlayText?: OverlayTextContent;
  /** ★★★ 개발자 모드용 개별 프롬프트 구성요소 (분류별) ★★★ */
  promptComponents?: {
    // [0] 메타 정보 (UI 태그 표시용)
    generationMode?: 'T2I' | 'I2I';    // 생성 모드 (Text-to-Image / Image-to-Image)
    sectionTypeOriginal?: string;      // 원본 섹션 타입 (예: FEATURES_01)
    sectionTypeMapped?: string;        // 매핑된 섹션 타입 (예: FEATURES)
    // ★ 핵심 지침 (미션 프롬프트)
    missionPrompt?: string;            // 이미지 디자인 + 오버레이 JSON 반환 2단계 미션
    // [1] 섹션별 프롬프트
    sectionBasePrompt?: string;        // 섹션별 기본 프롬프트 (buildSharedSectionPrompt - MAIN, HERO, FEATURES 등)
    orchestrationPrompt?: string;      // 오케스트레이션 AI가 생성한 시나리오
    categoryTemplatePrompt?: string;   // (deprecated) 섹션별 카테고리 템플릿 - sectionBasePrompt 사용
    i2iSystemPrompt?: string;          // I2I 시스템 프롬프트 (제품 재배치 규칙)
    // [2] 카테고리별 프롬프트 (뷰티 서브카테고리)
    categoryPrompt?: string;           // 카테고리별 고도화 프롬프트 (스킨케어/립/선케어 등)
    subCategory?: string;              // 서브카테고리명 (skincare, lip, suncare 등)
    // [3] 오버레이 텍스트 관련 프롬프트
    overlayTextPrompt?: string;        // 섹션별 오버레이 텍스트 프롬프트 (buildOverlayTextPrompt)
    overlayGuidePrompt?: string;       // 오버레이 디자인 가이드 (buildCreativeOverlayGuide - 공통)
    overlayOutputRequirements?: string; // 오버레이 출력 요구사항 (buildOverlayTextRequest - 공통)
    // [4] 공통 프롬프트 (Flash 모델 전용)
    noTextReinforcement?: string;      // Flash 모델용 텍스트 금지 강화 프롬프트 (NO_TEXT_IN_IMAGE_REINFORCEMENT)
  };
}

/** 배경 제거 옵션 */
export interface RemoveBackgroundOptions {
  /** 원본 이미지 (base64 또는 data URL) */
  sourceImage: string;
  /** 모델 선택 */
  model?: GeminiImageModel;
  /** 투명 배경 여부 (true: 투명, false: 흰색 배경) */
  transparent?: boolean;
}

/** I2I 이미지 생성 옵션 */
export interface ImageToImageOptions {
  /** 원본 이미지 (base64 또는 data URL) */
  sourceImage: string;
  /** 변환 프롬프트 */
  prompt: string;
  /** 모델 선택 */
  model?: GeminiImageModel;
  /** 원본 이미지 유지 강도 (0.0 ~ 1.0, 높을수록 원본 유지) */
  preserveStrength?: number;
  /** 출력 이미지 비율 (기본: 3:4 상세페이지용) */
  aspectRatio?: ImageAspectRatio;
}

/** 이미지 + 오버레이 텍스트 통합 결과 */
export interface ImageWithOverlayResult {
  image: GeminiGeneratedImage;
  overlayText: OverlayTextContent;
  overlayPrompt?: string; // 개발자 모드용
}

/** 섹션 프롬프트 파라미터 (내부용) */
export interface SectionPromptParams {
  productName: string;
  category: string;
  ingredientObjects: string[];
  moodSelection: string[];
  audienceStyle: string;
  featureHighlight: string;
  isI2I?: boolean;  // I2I 모드면 "USE THE PROVIDED PRODUCT IMAGE" 추가
}
