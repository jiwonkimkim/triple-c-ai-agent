/**
 * SD 3.5 Medium 네거티브 프롬프트
 */

// ============================================
// 네거티브 프롬프트 카테고리
// ============================================

export const SD35_NEGATIVE = {
  /** 텍스트 관련 (항상 적용) */
  text: [
    'text', 'typography', 'letters', 'words', 'watermark',
    'logo', 'label', 'signature', 'caption', 'subtitle', 'writing', 'font',
  ],

  /** 품질 관련 (항상 적용) */
  quality: [
    'blurry', 'low quality', 'pixelated', 'compressed', 'artifacts',
    'noise', 'grainy', 'distorted', 'overexposed', 'underexposed',
    'out of focus', 'motion blur',
  ],

  /** 인물 제외 */
  noHuman: [
    'person', 'human', 'face', 'hand', 'hands', 'fingers',
    'body', 'model', 'portrait', 'people', 'woman', 'man', 'skin',
  ],

  /** 배경 정리 */
  cleanBackground: [
    'cluttered', 'busy background', 'messy', 'crowded', 'chaotic',
    'complex background', 'distracting elements', 'multiple objects',
  ],

  /** 스타일 제외 */
  style: [
    'amateur', 'unprofessional', 'cartoon', 'anime', 'illustration',
    'sketch', 'drawing', 'painting', 'artistic filter',
  ],

  /** 구도 문제 */
  composition: [
    'cropped', 'cut off', 'partial view', 'awkward angle',
    'tilted', 'skewed', 'unbalanced',
  ],
};

// ============================================
// 네거티브 프롬프트 빌드
// ============================================

export interface NegativeOptions {
  excludeHuman?: boolean;
  cleanBackground?: boolean;
  additional?: string[];
}

/**
 * SD 3.5 네거티브 프롬프트 빌드
 */
export function buildSD35Negative(options: NegativeOptions = {}): string {
  const {
    excludeHuman = true,
    cleanBackground = true,
    additional = [],
  } = options;

  const parts: string[] = [];

  // 항상 적용
  parts.push(...SD35_NEGATIVE.text);
  parts.push(...SD35_NEGATIVE.quality);
  parts.push(...SD35_NEGATIVE.style);

  // 옵션별 적용
  if (excludeHuman) {
    parts.push(...SD35_NEGATIVE.noHuman);
  }

  if (cleanBackground) {
    parts.push(...SD35_NEGATIVE.cleanBackground);
    parts.push(...SD35_NEGATIVE.composition);
  }

  // 추가 키워드
  if (additional.length > 0) {
    parts.push(...additional);
  }

  // 중복 제거
  const unique = Array.from(new Set(parts));
  return unique.join(', ');
}

/**
 * 기본 네거티브 프롬프트 (제품 사진용)
 */
export function getDefaultNegative(): string {
  return buildSD35Negative({
    excludeHuman: true,
    cleanBackground: true,
  });
}
