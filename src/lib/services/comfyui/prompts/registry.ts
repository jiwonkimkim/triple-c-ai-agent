/**
 * ComfyUI 프롬프트 시스템 - 모델 레지스트리
 * 모델 등록 및 조회를 위한 팩토리 패턴
 */

import type { ModelPromptBuilder, ModelConfig, PromptInput, PromptOutput } from './types';
import { translateProductName } from './translator';

// ============================================
// 모델 레지스트리
// ============================================

const modelBuilders: Map<string, ModelPromptBuilder> = new Map();

/**
 * 모델 빌더 등록
 * @param builder 모델 프롬프트 빌더
 */
export function registerModel(builder: ModelPromptBuilder): void {
  modelBuilders.set(builder.config.name, builder);
  console.log(`[Registry] Model registered: ${builder.config.name}`);
}

/**
 * 모델 빌더 가져오기
 * @param modelName 모델 이름 (예: 'sd35-medium', 'sdxl-base')
 * @returns 모델 프롬프트 빌더
 * @throws 등록되지 않은 모델일 경우 에러
 */
export function getModelBuilder(modelName: string): ModelPromptBuilder {
  const builder = modelBuilders.get(modelName);
  if (!builder) {
    throw new Error(`[Registry] Unknown model: ${modelName}. Available models: ${getAvailableModels().join(', ')}`);
  }
  return builder;
}

/**
 * 모델 설정 가져오기
 * @param modelName 모델 이름
 * @returns 모델 설정
 */
export function getModelConfig(modelName: string): ModelConfig {
  return getModelBuilder(modelName).config;
}

/**
 * 등록된 모든 모델 목록
 * @returns 모델 이름 배열
 */
export function getAvailableModels(): string[] {
  return Array.from(modelBuilders.keys());
}

/**
 * 등록된 모든 모델 설정 목록
 * @returns 모델 설정 배열
 */
export function getAllModelConfigs(): ModelConfig[] {
  return Array.from(modelBuilders.values()).map(builder => builder.config);
}

/**
 * 모델이 등록되어 있는지 확인
 * @param modelName 모델 이름
 * @returns 등록 여부
 */
export function isModelRegistered(modelName: string): boolean {
  return modelBuilders.has(modelName);
}

/**
 * 네거티브 프롬프트 지원 모델인지 확인
 * @param modelName 모델 이름
 * @returns 네거티브 프롬프트 지원 여부
 */
export function supportsNegativePrompt(modelName: string): boolean {
  const builder = modelBuilders.get(modelName);
  return builder?.config.supportsNegative ?? false;
}

// ============================================
// 편의 함수
// ============================================

/**
 * 프롬프트 빌드 (모델 자동 선택)
 * @param modelName 모델 이름
 * @param input 프롬프트 입력
 * @returns 프롬프트 출력
 */
export function buildPrompt(modelName: string, input: PromptInput): PromptOutput {
  const builder = getModelBuilder(modelName);

  // MAIN 섹션이고 buildMainPrompt가 있으면 사용
  if (input.sectionType === 'MAIN' && builder.buildMainPrompt) {
    return builder.buildMainPrompt(input);
  }

  return builder.buildPrompt(input);
}

/**
 * SD 계열 모델인지 확인
 * @param modelName 모델 이름
 * @returns SD 모델 여부
 */
export function isLocalModel(modelName: string): boolean {
  const localModels = ['sd35-medium', 'sdxl-base'];
  return localModels.includes(modelName);
}

/**
 * 프롬프트 빌드 (번역 포함, 비동기)
 * 한글 제품명을 영어로 번역 후 프롬프트 생성
 * @param modelName 모델 이름
 * @param input 프롬프트 입력 (한글 가능)
 * @returns 프롬프트 출력 (영어)
 */
export async function buildPromptAsync(modelName: string, input: PromptInput): Promise<PromptOutput> {
  // 제품명 번역
  const translationResult = await translateProductName(input.productName);

  // 번역된 입력으로 교체
  const translatedInput: PromptInput = {
    ...input,
    productName: translationResult.translated,
  };

  // keyFeatures도 번역 (있으면)
  if (input.keyFeatures && input.keyFeatures.length > 0) {
    const translatedFeatures: string[] = [];
    for (const feature of input.keyFeatures) {
      const featureResult = await translateProductName(feature);
      translatedFeatures.push(featureResult.translated);
    }
    translatedInput.keyFeatures = translatedFeatures;
  }

  console.log(`[Registry] Translated: "${input.productName}" → "${translatedInput.productName}"`);

  // 빌드
  const builder = getModelBuilder(modelName);
  if (input.sectionType === 'MAIN' && builder.buildMainPrompt) {
    return builder.buildMainPrompt(translatedInput);
  }
  return builder.buildPrompt(translatedInput);
}
