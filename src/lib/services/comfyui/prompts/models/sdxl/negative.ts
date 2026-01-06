/**
 * SDXL 네거티브 프롬프트
 */

// ============================================
// 네거티브 프롬프트 카테고리
// ============================================

export const SDXL_NEGATIVE_PROMPTS = {
  // 텍스트/워터마크 관련
  text: [
    'text',
    'typography',
    'letters',
    'words',
    'watermark',
    'logo',
    'signature',
    'label',
    'caption',
    'title',
  ],

  // 품질 저하 요소
  quality: [
    'blurry',
    'low quality',
    'low resolution',
    'pixelated',
    'jpeg artifacts',
    'compression artifacts',
    'noise',
    'grain',
    'overexposed',
    'underexposed',
    'out of focus',
  ],

  // 사람 관련 (제품 이미지에서 제외)
  noHuman: [
    'person',
    'human',
    'people',
    'face',
    'hand',
    'finger',
    'body',
    'model',
    'portrait',
    'selfie',
  ],

  // 배경 관련
  cleanBackground: [
    'cluttered',
    'busy background',
    'messy',
    'distracting elements',
    'multiple objects',
    'crowded',
  ],

  // 스타일 관련
  style: [
    'amateur',
    'unprofessional',
    'cartoon',
    'anime',
    'illustration',
    'drawing',
    'sketch',
    'painting',
    '3d render',
    'cgi',
  ],

  // SDXL 특화 (일반적인 문제 방지)
  sdxlCommon: [
    'deformed',
    'distorted',
    'disfigured',
    'bad anatomy',
    'wrong proportions',
    'ugly',
    'duplicate',
    'mutated',
    'extra limbs',
    'poorly drawn',
  ],
};

// ============================================
// 네거티브 프롬프트 빌더
// ============================================

export interface SDXLNegativeOptions {
  excludeHuman?: boolean;
  cleanBackground?: boolean;
  additional?: string[];
}

/**
 * SDXL 네거티브 프롬프트 빌드
 */
export function buildSDXLNegative(options: SDXLNegativeOptions = {}): string {
  const {
    excludeHuman = true,
    cleanBackground = true,
    additional = [],
  } = options;

  const parts: string[] = [];

  // 기본 품질 네거티브
  parts.push(...SDXL_NEGATIVE_PROMPTS.quality);

  // 텍스트 제외
  parts.push(...SDXL_NEGATIVE_PROMPTS.text);

  // 스타일 네거티브
  parts.push(...SDXL_NEGATIVE_PROMPTS.style);

  // SDXL 공통 네거티브
  parts.push(...SDXL_NEGATIVE_PROMPTS.sdxlCommon);

  // 사람 제외 (옵션)
  if (excludeHuman) {
    parts.push(...SDXL_NEGATIVE_PROMPTS.noHuman);
  }

  // 깔끔한 배경 (옵션)
  if (cleanBackground) {
    parts.push(...SDXL_NEGATIVE_PROMPTS.cleanBackground);
  }

  // 추가 키워드
  if (additional.length > 0) {
    parts.push(...additional);
  }

  // 중복 제거 후 조합
  const unique = Array.from(new Set(parts));
  return unique.join(', ');
}
