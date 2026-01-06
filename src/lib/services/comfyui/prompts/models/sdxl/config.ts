/**
 * SDXL Base 모델 설정
 */

import type { ModelConfig } from '../../types';

export const SDXL_CONFIG: ModelConfig = {
  name: 'sdxl-base',
  displayName: 'SDXL Base 1.0',

  // 생성 파라미터
  steps: 25,
  cfg: 7.0,
  sampler: 'euler_ancestral',
  scheduler: 'normal',

  // 모델 특성
  supportsNegative: true,
  estimatedTime: 90, // 약 1-2분 (Mac MPS)

  // 체크포인트 경로
  checkpoint: 'sd_xl_base_1.0.safetensors',
};
