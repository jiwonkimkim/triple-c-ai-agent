/**
 * Flux Schnell 모델 설정
 */

import type { ModelConfig } from '../../types';

export const FLUX_CONFIG: ModelConfig = {
  name: 'flux-schnell',
  displayName: 'Flux Schnell',
  steps: 4,
  cfg: 1,
  sampler: 'euler',
  scheduler: 'simple',
  supportsNegative: false,  // Flux는 네거티브 미지원
  estimatedTime: 30, // 약 30초
};
