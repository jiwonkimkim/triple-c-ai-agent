/**
 * SD 3.5 Medium 모델 설정
 */

import type { ModelConfig } from '../../types';

export const SD35_CONFIG: ModelConfig = {
  name: 'sd35-medium',
  displayName: 'Stable Diffusion 3.5 Medium',
  steps: 20,
  cfg: 4.5,
  sampler: 'euler',
  scheduler: 'normal',
  supportsNegative: true,
  estimatedTime: 240, // 약 4분
};
