/**
 * ComfyUI 프롬프트 시스템
 * 확장 가능한 모델별 프롬프트 관리
 */

// 타입
export * from './types';

// 베이스 템플릿
export * from './base-templates';

// 레지스트리
export * from './registry';

// 번역기
export * from './translator';

// 모델별 모듈
export * from './models';

// ============================================
// 모델 자동 등록
// ============================================

import { registerModel } from './registry';
import { sd35Builder } from './models/sd35';
import { fluxBuilder } from './models/flux';
import { sdxlBuilder } from './models/sdxl';

// 앱 시작 시 모델 등록
registerModel(sd35Builder);
registerModel(fluxBuilder);
registerModel(sdxlBuilder);

console.log('[Prompts] Model builders initialized');
