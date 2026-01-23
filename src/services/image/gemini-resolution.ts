/**
 * ★ Gemini 이미지 해상도/비율 관리 모듈
 * - 원본: gemini-image-generator.ts에서 분리
 * - 모델별 해상도 매핑, 비율 결정 유틸리티
 */

import type { ImageAspectRatio } from './gemini-types';

// ============================================
// ★ 모델별 해상도 매핑 상수
// ============================================

/**
 * ★★★ 모델별 비율별 실제 해상도 매핑 ★★★
 * 참조: https://ai.google.dev/gemini-api/docs/image-generation
 * 오버레이 텍스트 좌표 계산 및 fontSize 기준에 사용
 */

/** Gemini 2.5 Flash Image (nanobanana) 해상도 */
export const FLASH_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 832, height: 1248 },
  '3:2': { width: 1248, height: 832 },
  '3:4': { width: 864, height: 1184 },
  '4:3': { width: 1184, height: 864 },
  '4:5': { width: 896, height: 1152 },
  '5:4': { width: 1152, height: 896 },
  '9:16': { width: 768, height: 1344 },
  '16:9': { width: 1344, height: 768 },
  '21:9': { width: 1536, height: 672 },
};

/** Gemini 3 Pro Image Preview (nanobanana-pro) 해상도 (1K 기준) */
export const PRO_RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 848, height: 1264 },
  '3:2': { width: 1264, height: 848 },
  '3:4': { width: 896, height: 1200 },
  '4:3': { width: 1200, height: 896 },
  '4:5': { width: 928, height: 1152 },
  '5:4': { width: 1152, height: 928 },
  '9:16': { width: 768, height: 1376 },
  '16:9': { width: 1376, height: 768 },
  '21:9': { width: 1584, height: 672 },
};

/** 기본 해상도 (비율이 지정되지 않은 경우 - 3:4 상세페이지 기본) */
export const DEFAULT_FLASH_RESOLUTION = { width: 864, height: 1184 };
export const DEFAULT_PRO_RESOLUTION = { width: 896, height: 1200 };

// ============================================
// ★ 해상도/비율 유틸리티 함수
// ============================================

/**
 * 모델과 비율에 해당하는 실제 해상도 반환
 * @param aspectRatio - 이미지 비율 (1:1, 3:4 등)
 * @param model - 사용 모델 (flash 또는 pro 포함 문자열)
 */
export function getResolutionForAspectRatio(
  aspectRatio?: string,
  model?: string
): { width: number; height: number } {
  const isProModel = model?.toLowerCase().includes('pro');
  const resolutions = isProModel ? PRO_RESOLUTIONS : FLASH_RESOLUTIONS;
  const defaultRes = isProModel ? DEFAULT_PRO_RESOLUTION : DEFAULT_FLASH_RESOLUTION;

  if (!aspectRatio) return defaultRes;
  return resolutions[aspectRatio] || defaultRes;
}

/**
 * 모델명으로 Pro 모델 여부 확인
 */
export function isProImageModel(model?: string): boolean {
  return model?.toLowerCase().includes('pro') ?? false;
}

/**
 * 섹션 타입별 aspectRatio 결정
 * - MAIN: 1:1 (정사각형 썸네일)
 * - TEXT_BANNER, DIVIDER_VISUAL, KEY_MESSAGE 등 텍스트 배경: 16:9 (가로 배너)
 * - 나머지: 3:4 (상세페이지 기본)
 */
export function getSectionAspectRatio(sectionType: string): ImageAspectRatio | undefined {
  const upperType = sectionType.toUpperCase();

  // MAIN 섹션: 1:1 정사각형
  if (/^MAIN|THUMBNAIL/.test(upperType)) {
    return '1:1';
  }

  // 텍스트 배경 섹션: 16:9 가로 비율
  if (/TEXT_BANNER|KEY_MESSAGE|BENEFIT_HIGHLIGHT|DIVIDER_VISUAL|BRAND_HEADER/.test(upperType)) {
    return '16:9';
  }

  // 나머지: 3:4 상세페이지 기본 비율
  return '3:4';
}
