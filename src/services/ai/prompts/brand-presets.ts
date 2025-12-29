/**
 * 브랜드 톤앤매너 프리셋
 * Zen Editor 스타일 참고하여 설계
 */

import type { BrandToneType, BrandTonePreset, QualityCheckItem, RequiredFieldDefinition } from './types';

// ============================================
// 브랜드 톤 프리셋 정의
// ============================================

export const BRAND_TONE_PRESETS: Record<BrandToneType, BrandTonePreset> = {
  luxury: {
    name: '럭셔리/프리미엄',
    description: '고급스럽고 세련된 프리미엄 브랜드 이미지',
    font: {
      primary: 'Serif 계열 (Playfair Display, Cormorant, Noto Serif KR)',
      style: '우아하고 클래식한 서체',
      weight: 'Light ~ Regular',
    },
    colors: {
      primary: '골드 (#D4AF37), 블랙 (#1A1A1A)',
      secondary: '딥네이비 (#1E3A5F), 버건디 (#722F37)',
      accent: '샴페인 골드 (#F7E7CE)',
      background: '아이보리 (#FFFEF2), 소프트 그레이 (#F5F5F5)',
    },
    layout: {
      spacing: '넓고 여유로운 레이아웃, 충분한 여백',
      density: '요소 간 간격 넓게, 미니멀한 배치',
    },
    imageStyle: ['고급스러운 스튜디오 컷', '반사광 활용', '다크 배경', '제품 클로즈업'],
    copyTone: '격조 있고 절제된 표현, 품격 있는 어조, "경험하다", "누리다" 등의 동사 활용',
    exampleBrands: ['랑콤', '설화수', '에스티로더', '라메르', 'SK-II'],
  },

  clean: {
    name: '클린/미니멀',
    description: '깔끔하고 심플한 미니멀리즘 브랜드',
    font: {
      primary: 'Sans-serif 계열 (Pretendard, Noto Sans KR, Spoqa Han Sans)',
      style: '깔끔하고 현대적인 고딕체',
      weight: 'Regular ~ Medium',
    },
    colors: {
      primary: '화이트 (#FFFFFF), 블랙 (#222222)',
      secondary: '라이트 그레이 (#E5E5E5), 미디엄 그레이 (#888888)',
      accent: '포인트 컬러 1개 (브랜드 시그니처)',
      background: '퓨어 화이트 (#FFFFFF), 오프 화이트 (#FAFAFA)',
    },
    layout: {
      spacing: '극도로 절제된 요소, 넓은 여백',
      density: '핵심 정보만 노출, 정돈된 그리드',
    },
    imageStyle: ['화이트 배경 제품컷', '플랫 레이', '미니멀 구도', '정갈한 배치'],
    copyTone: '간결하고 명확한 문장, 군더더기 없는 표현, 핵심만 전달',
    exampleBrands: ['이니스프리', '아로마티카', '라운드랩', '토리든', '아누아'],
  },

  natural: {
    name: '내추럴/오가닉',
    description: '자연주의, 친환경적인 브랜드 이미지',
    font: {
      primary: '따뜻한 Sans-serif (Nunito, Quicksand, 나눔스퀘어라운드)',
      style: '부드럽고 친근한 둥근 고딕',
      weight: 'Regular',
    },
    colors: {
      primary: '어스톤 그린 (#5C7C4E), 테라코타 (#C47C5A)',
      secondary: '베이지 (#D4C4A8), 올리브 (#808000)',
      accent: '모스 그린 (#8A9A5B), 샌드 (#C2B280)',
      background: '크림 (#FFFDD0), 라이트 베이지 (#F5F5DC)',
    },
    layout: {
      spacing: '자연스러운 흐름, 유기적 배치',
      density: '여유로운 공간감, 식물/자연 요소 활용',
    },
    imageStyle: ['자연광 느낌', '보태니컬 요소', '원료 이미지', '따뜻한 톤'],
    copyTone: '자연 친화적 표현, "순수한", "청정한", "자연에서 온" 등 활용',
    exampleBrands: ['파파레서피', '아이소이', '프리메라', '비플레인', '마녀공장'],
  },

  trendy: {
    name: '영앤트렌디',
    description: 'MZ세대 타겟의 활기차고 트렌디한 브랜드',
    font: {
      primary: '볼드한 Sans-serif (Poppins, Montserrat, 에스코어드림)',
      style: '과감하고 개성 있는 서체',
      weight: 'Bold ~ Black',
    },
    colors: {
      primary: '비비드 컬러 (핫핑크 #FF69B4, 일렉트릭 블루 #7DF9FF)',
      secondary: '네온 그린 (#39FF14), 오렌지 (#FF6B35)',
      accent: '그라데이션 활용, 홀로그래픽',
      background: '퓨어 화이트 또는 네온 컬러 배경',
    },
    layout: {
      spacing: '다이나믹한 레이아웃, 비대칭 구도',
      density: '요소 풍부, 생동감 있는 배치',
    },
    imageStyle: ['라이프스타일 컷', '모델 컷', '감각적 연출', '트렌디한 소품'],
    copyTone: '친근하고 유쾌한 말투, 이모티콘 느낌, "완전", "찐", "갓생" 등 MZ 용어 활용',
    exampleBrands: ['롬앤', '클리오', '페리페라', '3CE', '투쿨포스쿨'],
  },

  derma: {
    name: '더마/클리니컬',
    description: '피부과학 기반의 신뢰감 있는 더마 브랜드',
    font: {
      primary: '신뢰감 있는 Sans-serif (IBM Plex Sans, Roboto, 본고딕)',
      style: '정돈되고 전문적인 서체',
      weight: 'Regular ~ Medium',
    },
    colors: {
      primary: '메디컬 블루 (#0066CC), 화이트 (#FFFFFF)',
      secondary: '소프트 그린 (#98D8C8), 라이트 블루 (#ADD8E6)',
      accent: '민트 (#98FF98), 라벤더 (#E6E6FA)',
      background: '클린 화이트 (#FFFFFF), 소프트 그레이 (#F8F9FA)',
    },
    layout: {
      spacing: '정돈된 그리드 시스템, 체계적 배치',
      density: '명확한 정보 계층, 데이터 중심',
    },
    imageStyle: ['클리니컬 무드', '임상 결과 시각화', '성분 다이어그램', '피부 확대 컷'],
    copyTone: '과학적이고 객관적인 표현, 수치/통계 강조, 전문 용어 설명 병행',
    exampleBrands: ['닥터지', '센텔리안24', 'CNP', '더마비', '리쥬란'],
  },
};

// ============================================
// 품질 체크리스트
// ============================================

export const QUALITY_CHECKLIST: QualityCheckItem[] = [
  // 콘텐츠 관련
  {
    id: 'all_sections_included',
    category: 'content',
    description: '모든 필수 섹션(HERO, FEATURES, SOCIAL_PROOF, HOW_TO_USE, FAQ)이 포함되었는가?',
    required: true,
  },
  {
    id: 'hook_message_compelling',
    category: 'content',
    description: '훅 메시지가 고객의 관심을 끌 수 있는 임팩트 있는 문구인가?',
    required: true,
  },
  {
    id: 'features_specific',
    category: 'content',
    description: '제품 특징이 구체적인 효능/성분과 함께 설명되었는가?',
    required: true,
  },
  {
    id: 'social_proof_credible',
    category: 'content',
    description: '신뢰할 수 있는 통계/후기가 구체적인 수치와 함께 포함되었는가?',
    required: true,
  },
  {
    id: 'cta_clear',
    category: 'content',
    description: 'CTA(행동 유도) 문구가 명확하고 눈에 띄는가?',
    required: true,
  },

  // 브랜드 관련
  {
    id: 'brand_tone_consistent',
    category: 'brand',
    description: '브랜드 톤앤매너가 전체 콘텐츠에서 일관되게 적용되었는가?',
    required: true,
  },
  {
    id: 'brand_keywords_used',
    category: 'brand',
    description: '브랜드의 핵심 키워드가 적절히 반영되었는가?',
    required: false,
  },
  {
    id: 'target_audience_language',
    category: 'brand',
    description: '타겟 고객층의 언어와 관심사에 맞는 표현을 사용했는가?',
    required: true,
  },

  // UX 관련
  {
    id: 'mobile_friendly',
    category: 'ux',
    description: '모바일 환경에서 읽기 쉬운 길이와 구조인가?',
    required: true,
  },
  {
    id: 'scannable_content',
    category: 'ux',
    description: '스캔하기 쉽게 불릿 포인트, 소제목 등으로 구조화되었는가?',
    required: true,
  },
  {
    id: 'scroll_stopping',
    category: 'ux',
    description: 'HERO 섹션이 3초 안에 스크롤을 멈추게 할 만큼 임팩트 있는가?',
    required: false,
  },

  // 접근성 관련
  {
    id: 'no_emoji_overuse',
    category: 'accessibility',
    description: '이모지 없이 순수 텍스트로 작성되었는가?',
    required: true,
  },
  {
    id: 'clear_hierarchy',
    category: 'accessibility',
    description: '제목-부제목-본문의 계층 구조가 명확한가?',
    required: true,
  },
];

// ============================================
// 필수 입력 필드 정의
// ============================================

export const REQUIRED_FIELDS: RequiredFieldDefinition[] = [
  {
    field: 'productName',
    label: '제품명',
    required: true,
    description: '상세페이지를 생성할 제품의 이름',
    example: '아쿠아 수분 크림',
  },
  {
    field: 'category',
    label: '카테고리',
    required: true,
    description: '제품 카테고리 (스킨케어, 선케어, 메이크업 등)',
    example: '스킨케어',
  },
  {
    field: 'keyFeatures',
    label: '주요 특징',
    required: true,
    description: '제품의 핵심 특징 (최소 3가지)',
    example: '히알루론산 5중 복합체, 48시간 보습 지속, 저자극 포뮬러',
  },
  {
    field: 'targetAudience',
    label: '타겟 고객',
    required: true,
    description: '제품의 주요 타겟 고객층',
    example: '건조함을 고민하는 20-30대 여성',
  },
  {
    field: 'brandContext.name',
    label: '브랜드명',
    required: false,
    description: '브랜드 이름 (브랜드 가이드라인 적용 시 필요)',
    example: '아쿠아랩',
  },
  {
    field: 'brandContext.toneAndManner',
    label: '브랜드 톤앤매너',
    required: false,
    description: '브랜드의 성격과 말투 (또는 프리셋: luxury/clean/natural/trendy/derma)',
    example: 'clean',
  },
  {
    field: 'copyLength',
    label: '카피 길이',
    required: false,
    description: '생성할 카피의 길이 (short/medium/long)',
    example: 'medium',
  },
];

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 브랜드 톤 프리셋 조회
 */
export function getBrandTonePreset(tone: string): BrandTonePreset | null {
  const normalizedTone = tone.toLowerCase().trim();

  // 한글 이름으로도 검색 가능
  const toneMapping: Record<string, BrandToneType> = {
    'luxury': 'luxury',
    '럭셔리': 'luxury',
    '프리미엄': 'luxury',
    'clean': 'clean',
    '클린': 'clean',
    '미니멀': 'clean',
    'natural': 'natural',
    '내추럴': 'natural',
    '오가닉': 'natural',
    '자연주의': 'natural',
    'trendy': 'trendy',
    '트렌디': 'trendy',
    '영앤트렌디': 'trendy',
    'derma': 'derma',
    '더마': 'derma',
    '클리니컬': 'derma',
  };

  const mappedTone = toneMapping[normalizedTone];
  if (mappedTone) {
    return BRAND_TONE_PRESETS[mappedTone];
  }

  return null;
}

/**
 * 브랜드 톤 프리셋을 프롬프트 문자열로 변환
 */
export function buildBrandTonePrompt(preset: BrandTonePreset): string {
  return `
### 브랜드 톤앤매너: ${preset.name}

**스타일 가이드:**
- 폰트: ${preset.font.primary} (${preset.font.style}, ${preset.font.weight})
- 메인 컬러: ${preset.colors.primary}
- 보조 컬러: ${preset.colors.secondary}
- 강조 컬러: ${preset.colors.accent}
- 배경: ${preset.colors.background}

**레이아웃:**
- 여백: ${preset.layout.spacing}
- 밀도: ${preset.layout.density}

**이미지 스타일:**
${preset.imageStyle.map(s => `- ${s}`).join('\n')}

**카피 톤:**
${preset.copyTone}

**참고 브랜드:** ${preset.exampleBrands.join(', ')}
`;
}

/**
 * 품질 체크리스트를 프롬프트 문자열로 변환
 */
export function buildQualityChecklistPrompt(): string {
  const requiredItems = QUALITY_CHECKLIST.filter(item => item.required);
  const optionalItems = QUALITY_CHECKLIST.filter(item => !item.required);

  return `
## 품질 체크리스트

생성 완료 전 다음 항목을 확인하세요:

### 필수 확인 사항
${requiredItems.map(item => `- [ ] ${item.description}`).join('\n')}

### 권장 확인 사항
${optionalItems.map(item => `- [ ] ${item.description}`).join('\n')}
`;
}

/**
 * 필수 입력 필드 검증 프롬프트 생성
 */
export function buildRequiredFieldsPrompt(): string {
  const requiredFields = REQUIRED_FIELDS.filter(f => f.required);
  const optionalFields = REQUIRED_FIELDS.filter(f => !f.required);

  return `
## 입력 정보 검증

상세페이지 생성 전 다음 정보가 모두 제공되었는지 확인하세요:

### 필수 정보
| 필드 | 설명 | 예시 |
|------|------|------|
${requiredFields.map(f => `| ${f.label} | ${f.description} | ${f.example || '-'} |`).join('\n')}

### 선택 정보
| 필드 | 설명 | 예시 |
|------|------|------|
${optionalFields.map(f => `| ${f.label} | ${f.description} | ${f.example || '-'} |`).join('\n')}

**중요:** 필수 정보가 누락된 경우, 콘텐츠 생성 전에 사용자에게 해당 정보를 요청하세요.
`;
}

/**
 * 누락된 필수 정보 확인
 */
export function checkMissingRequiredFields(input: Record<string, unknown>): string[] {
  const missing: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!field.required) continue;

    const fieldPath = field.field.split('.');
    let value: unknown = input;

    for (const key of fieldPath) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[key];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0)) {
      missing.push(field.label);
    }
  }

  return missing;
}
