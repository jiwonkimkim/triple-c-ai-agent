/**
 * 고도화된 상세페이지 생성 프롬프트
 * 올리브영 상세페이지 패턴 분석 기반 (398개 제품, 12,470개 이미지)
 *
 * 사용법:
 * import { buildEnhancedSystemPrompt, buildEnhancedUserPrompt, ENHANCED_COPY_LENGTH_CONFIG } from './enhanced-prompts';
 *
 * 기존 buildSystemPrompt, buildUserPrompt를 대체하여 사용
 */

// ============================================
// 타입 정의
// ============================================

interface BrandContext {
  name: string;
  identity: string;
  toneAndManner: string;
  imageKeywords: string[];
  ragContext?: string;
}

interface GenerateDetailPageInput {
  productImages: string[];
  productName: string;
  category: string;
  keyFeatures: string[];
  targetAudience: string;
  copyLength: 'short' | 'medium' | 'long';
  brandContext?: BrandContext | null;
  generateImages?: boolean;
}

// ============================================
// 카피 길이 설정 (고도화)
// ============================================

export const ENHANCED_COPY_LENGTH_CONFIG = {
  short: {
    hookLength: 50,
    sectionTitleLength: 15,
    sectionBodyLength: 100,
    description: '임팩트 있고 간결한',
    bulletPoints: 3,
  },
  medium: {
    hookLength: 100,
    sectionTitleLength: 25,
    sectionBodyLength: 200,
    description: '균형 잡힌 정보 전달',
    bulletPoints: 4,
  },
  long: {
    hookLength: 150,
    sectionTitleLength: 35,
    sectionBodyLength: 400,
    description: '상세하고 설득력 있는',
    bulletPoints: 5,
  },
};

// ============================================
// 카테고리별 특화 패턴
// ============================================

const CATEGORY_PATTERNS: Record<string, {
  keywords: string[];
  textFocus: string[];
  toneGuide: string;
}> = {
  // 스킨케어 계열
  '스킨케어': {
    keywords: ['보습', '수분', '진정', '탄력', '광채'],
    textFocus: ['moisturizing', 'soothing', 'ingredients', 'clinical'],
    toneGuide: '신뢰감 있고 과학적인 톤으로, 피부 고민 해결에 초점',
  },
  '에센스': {
    keywords: ['집중 케어', '고농축', '흡수력', '영양 공급'],
    textFocus: ['statistics', 'ingredients', 'anti-aging', 'clinical'],
    toneGuide: '프리미엄 스킨케어의 핵심 단계임을 강조',
  },
  '세럼': {
    keywords: ['집중 케어', '고농축', '흡수력', '영양 공급'],
    textFocus: ['statistics', 'ingredients', 'anti-aging', 'clinical'],
    toneGuide: '프리미엄 스킨케어의 핵심 단계임을 강조',
  },
  '크림': {
    keywords: ['보습', '영양', '장벽 강화', '촉촉함'],
    textFocus: ['moisturizing', 'soothing', 'anti-aging'],
    toneGuide: '마무리 케어의 중요성과 지속력 강조',
  },
  '토너': {
    keywords: ['피부결 정돈', '수분 첫 단계', '흡수 촉진'],
    textFocus: ['soothing', 'moisturizing', 'ingredients'],
    toneGuide: '스킨케어 루틴의 기초 단계임을 강조',
  },
  '로션': {
    keywords: ['가벼운 보습', '산뜻한 마무리', '데일리 케어'],
    textFocus: ['moisturizing', 'soothing', 'lightweight'],
    toneGuide: '매일 편하게 사용할 수 있는 가벼움 강조',
  },

  // 메이크업 계열
  '메이크업': {
    keywords: ['발색', '지속력', '커버력', '자연스러움'],
    textFocus: ['tips', 'how-to', 'before-after', 'model'],
    toneGuide: '트렌디하고 감각적인 톤, 실용적 팁 포함',
  },
  '립메이크업': {
    keywords: ['발색', '촉촉함', '지속력', '컬러'],
    textFocus: ['moisturizing', 'tips', 'before-after'],
    toneGuide: '색상의 매력과 편안한 착용감 강조',
  },
  '아이메이크업': {
    keywords: ['발색', '지속력', '블렌딩', '다양한 연출'],
    textFocus: ['tips', 'how-to', 'before-after'],
    toneGuide: '다양한 룩 연출법과 사용 팁 중심',
  },
  '베이스메이크업': {
    keywords: ['커버력', '지속력', '피부 표현', '자연스러움'],
    textFocus: ['before-after', 'how-to', 'tips'],
    toneGuide: '자연스러운 피부 표현과 지속력 강조',
  },

  // 클렌징/선케어
  '클렌징': {
    keywords: ['세정력', '순함', '저자극', '깔끔한 마무리'],
    textFocus: ['cleansing', 'soothing', 'before-after'],
    toneGuide: '순하면서도 확실한 클렌징력 강조',
  },
  '선케어': {
    keywords: ['자외선 차단', 'SPF/PA', '백탁 없는', '촉촉한'],
    textFocus: ['moisturizing', 'soothing', 'statistics', 'clinical'],
    toneGuide: '확실한 자외선 차단과 피부 편안함 강조',
  },

  // 기타 케어
  '마스크팩': {
    keywords: ['집중 케어', '즉각 효과', '편리함', '수분 폭탄'],
    textFocus: ['statistics', 'moisturizing', 'soothing', 'clinical'],
    toneGuide: '즉각적인 효과와 특별 케어 느낌 강조',
  },
  '바디케어': {
    keywords: ['전신 보습', '향기', '피부결 개선'],
    textFocus: ['moisturizing', 'ingredients', 'soothing'],
    toneGuide: '전신 케어의 즐거움과 효과 강조',
  },
  '헤어케어': {
    keywords: ['모발 개선', '윤기', '두피 케어', '손상 케어'],
    textFocus: ['before-after', 'ingredients', 'clinical'],
    toneGuide: '건강한 모발로의 변화 강조',
  },

  // 패션/라이프스타일
  '패션': {
    keywords: ['스타일', '트렌드', '핏', '퀄리티'],
    textFocus: ['style', 'quality', 'versatility'],
    toneGuide: '스타일리시하고 세련된 톤',
  },
  '가방': {
    keywords: ['디자인', '수납력', '내구성', '스타일'],
    textFocus: ['design', 'functionality', 'quality'],
    toneGuide: '실용성과 디자인의 조화 강조',
  },
  '신발': {
    keywords: ['편안함', '디자인', '내구성', '착용감'],
    textFocus: ['comfort', 'style', 'durability'],
    toneGuide: '편안함과 스타일의 균형 강조',
  },
  '액세서리': {
    keywords: ['포인트', '스타일', '퀄리티', '디테일'],
    textFocus: ['style', 'quality', 'detail'],
    toneGuide: '스타일링 완성의 포인트로서 강조',
  },

  // 식품
  '식품': {
    keywords: ['맛', '신선함', '영양', '품질'],
    textFocus: ['quality', 'taste', 'nutrition'],
    toneGuide: '맛있고 건강한 느낌 강조',
  },
  '건강식품': {
    keywords: ['건강', '영양', '효능', '안전'],
    textFocus: ['health', 'nutrition', 'clinical'],
    toneGuide: '과학적 근거와 건강 효능 강조',
  },

  // 기타
  '가전': {
    keywords: ['기능', '편리함', '스마트', '에너지 효율'],
    textFocus: ['features', 'convenience', 'technology'],
    toneGuide: '기술력과 편리함 강조',
  },
  '생활용품': {
    keywords: ['편리함', '실용성', '품질', '가성비'],
    textFocus: ['convenience', 'quality', 'value'],
    toneGuide: '일상의 편리함과 실용성 강조',
  },

  // 기본값
  'default': {
    keywords: ['품질', '가치', '만족'],
    textFocus: ['benefits', 'features', 'quality'],
    toneGuide: '제품의 핵심 가치와 효과 중심',
  },
};

// ============================================
// 섹션별 스토리 가이드
// ============================================

const SECTION_STORY_GUIDE = {
  HERO: {
    purpose: '고객의 시선을 사로잡고 핵심 가치를 전달',
    textTone: '임팩트 있고 감성적, 핵심 키워드 강조',
    bestPractices: [
      '첫 문장에서 고객의 고민을 건드릴 것',
      '브랜드의 시그니처 톤앤매너 반영',
      '8자 이내의 강렬한 헤드라인',
    ],
  },
  FEATURES: {
    purpose: '제품의 차별점과 핵심 성분/기술 설명',
    textTone: '신뢰감 있는 정보 전달, 수치/퍼센트 활용',
    bestPractices: [
      '성분명과 함께 구체적 효능 명시',
      '경쟁 제품 대비 차별점 강조',
      '과학적 근거나 특허 정보 활용',
    ],
  },
  SOCIAL_PROOF: {
    purpose: '효과 입증 및 신뢰 구축',
    textTone: '객관적, 수치 기반, 신뢰성 강조',
    bestPractices: [
      '구체적인 숫자와 퍼센트 사용',
      '실제 사용자의 목소리 인용',
      '테스트 조건 명시로 신뢰도 향상',
    ],
  },
  HOW_TO_USE: {
    purpose: '올바른 사용법 안내 및 기대 효과 제시',
    textTone: '친근하고 실용적, 행동 유도',
    bestPractices: [
      '3-4단계로 간결하게 정리',
      '적정 사용량을 시각적으로 표현',
      '함께 사용하면 좋은 제품 추천',
    ],
  },
  FAQ: {
    purpose: '구매 장벽 해소 및 전환 유도',
    textTone: '행동 유도, 긴급성/희소성 활용',
    bestPractices: [
      '실제 고객이 궁금해하는 질문 선별',
      '구매 결정을 돕는 정보 제공',
      '명확한 Call-to-Action 포함',
    ],
  },
};

// ============================================
// 카테고리 패턴 조회 함수
// ============================================

function getCategoryPattern(category: string) {
  // 정확히 일치하는 카테고리 찾기
  if (CATEGORY_PATTERNS[category]) {
    return CATEGORY_PATTERNS[category];
  }

  // 부분 일치 찾기
  const lowerCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_PATTERNS)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return value;
    }
  }

  // 기본값 반환
  return CATEGORY_PATTERNS['default'];
}

// ============================================
// 고도화된 시스템 프롬프트 빌더
// ============================================

export function buildEnhancedSystemPrompt(
  copyLength: 'short' | 'medium' | 'long',
  brandContext?: BrandContext | null,
  category?: string
): string {
  const lengthConfig = ENHANCED_COPY_LENGTH_CONFIG[copyLength];
  const categoryPattern = getCategoryPattern(category || 'default');

  let systemPrompt = `당신은 한국 이커머스 상세페이지 전문 마케팅 카피라이터입니다.
올리브영, 무신사, 쿠팡 등 주요 플랫폼에서 검증된 상세페이지 패턴을 기반으로 작성합니다.

## 핵심 원칙

### 1. 스토리텔링 구조
상세페이지는 단순한 제품 설명이 아닌, 고객의 구매 여정을 설계하는 것입니다:
고객의 고민 공감 → 해결책 제시 → 신뢰 구축 → 구매 전환

### 2. 섹션별 역할

**[HERO] 도입부**
- 목적: ${SECTION_STORY_GUIDE.HERO.purpose}
- 스타일: ${SECTION_STORY_GUIDE.HERO.textTone}
- 핵심: 첫 3초 안에 스크롤을 멈추게 할 것

**[FEATURES] 특징부**
- 목적: ${SECTION_STORY_GUIDE.FEATURES.purpose}
- 스타일: ${SECTION_STORY_GUIDE.FEATURES.textTone}
- 핵심: "왜 이 제품이어야 하는가"에 답할 것

**[SOCIAL_PROOF] 증명부**
- 목적: ${SECTION_STORY_GUIDE.SOCIAL_PROOF.purpose}
- 스타일: ${SECTION_STORY_GUIDE.SOCIAL_PROOF.textTone}
- 핵심: 숫자와 실제 후기로 신뢰 구축

**[HOW_TO_USE] 사용법**
- 목적: ${SECTION_STORY_GUIDE.HOW_TO_USE.purpose}
- 스타일: ${SECTION_STORY_GUIDE.HOW_TO_USE.textTone}
- 핵심: "나도 쉽게 따라할 수 있겠다" 느낌

**[FAQ] 마무리**
- 목적: ${SECTION_STORY_GUIDE.FAQ.purpose}
- 스타일: ${SECTION_STORY_GUIDE.FAQ.textTone}
- 핵심: 구매 망설임 해소, 행동 유도

### 3. 카피 작성 가이드라인

**길이 설정: ${lengthConfig.description}**
- 훅 메시지: 약 ${lengthConfig.hookLength}자
- 섹션 제목: 약 ${lengthConfig.sectionTitleLength}자
- 섹션 본문: 약 ${lengthConfig.sectionBodyLength}자
- 불릿 포인트: ${lengthConfig.bulletPoints}개 이내

${category ? `**카테고리 특화: ${category}**
- 강조 키워드: ${categoryPattern.keywords.join(', ')}
- 톤 가이드: ${categoryPattern.toneGuide}` : ''}

### 4. 작성 시 주의사항
- 모든 텍스트는 한국어로 작성
- 과장된 표현 자제, 신뢰할 수 있는 표현 사용
- 타겟 고객의 언어로 작성
- 감성적 어필과 기능적 정보의 균형 유지
`;

  // 브랜드 컨텍스트 추가
  if (brandContext) {
    systemPrompt += `
### 5. 브랜드 가이드라인

**브랜드명:** ${brandContext.name}

**브랜드 아이덴티티:**
${brandContext.identity}

**톤앤매너:**
${brandContext.toneAndManner}

**비주얼 키워드:** ${brandContext.imageKeywords.join(', ')}

※ 모든 카피는 위 브랜드 가이드라인을 철저히 준수해야 합니다.
`;

    if (brandContext.ragContext) {
      systemPrompt += `
**브랜드 참고 자료:**
${brandContext.ragContext}
`;
    }
  }

  return systemPrompt;
}

// ============================================
// 고도화된 사용자 프롬프트 빌더
// ============================================

export function buildEnhancedUserPrompt(input: GenerateDetailPageInput): string {
  const categoryPattern = getCategoryPattern(input.category);
  const lengthConfig = ENHANCED_COPY_LENGTH_CONFIG[input.copyLength];

  return `다음 제품의 상세페이지 콘텐츠를 생성해주세요.

## 제품 정보

**제품명:** ${input.productName}
**카테고리:** ${input.category}
**타겟 고객:** ${input.targetAudience}

**주요 특징:**
${input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 카테고리 특화 가이드

이 제품은 "${input.category}" 카테고리입니다.
- 강조 키워드: ${categoryPattern.keywords.join(', ')}
- 톤 가이드: ${categoryPattern.toneGuide}

## 생성 요청

아래 JSON 형식으로 콘텐츠를 생성해주세요:

{
  "hookMessage": "고객의 시선을 사로잡는 핵심 메시지 (${lengthConfig.hookLength}자 내외)",
  "sections": [
    {
      "type": "HERO",
      "title": "감성적이고 임팩트 있는 제목",
      "body": "브랜드 아이덴티티와 제품의 핵심 가치를 전달하는 도입부"
    },
    {
      "type": "FEATURES",
      "title": "핵심 성분/기술력을 강조하는 제목",
      "body": "주요 특징을 불릿 포인트로 정리. 각 특징에 대한 구체적인 효과 설명."
    },
    {
      "type": "SOCIAL_PROOF",
      "title": "신뢰를 구축하는 제목",
      "body": "구체적인 수치와 통계, 실제 사용자 후기. Before/After 효과."
    },
    {
      "type": "HOW_TO_USE",
      "title": "사용법 안내 제목",
      "body": "Step 1, 2, 3 형식의 간결한 사용법. 사용량과 팁 포함."
    },
    {
      "type": "FAQ",
      "title": "자주 묻는 질문",
      "body": "Q&A 형식 또는 구매 결정을 돕는 추가 정보. CTA 포함."
    }
  ]
}

## 작성 지침

1. **HERO 섹션**: 타겟 고객(${input.targetAudience})의 고민에 공감, 제품이 해결해주는 핵심 가치 1가지에 집중

2. **FEATURES 섹션**: 주요 특징 ${input.keyFeatures.length}가지를 각각 구체적으로 설명, "~하여 ~합니다" 형식

3. **SOCIAL_PROOF 섹션**: 구체적인 수치 사용 (예: 92% 만족도), 실제 사용자 톤의 후기

4. **HOW_TO_USE 섹션**: 3-4단계로 간결하게, 사용량 언급 (예: 콩알 크기)

5. **FAQ 섹션**: 실제 궁금할 질문 2-3개, "지금 만나보세요" 같은 CTA로 마무리

JSON 객체만 반환하고, 추가 설명은 포함하지 마세요.`;
}

// ============================================
// 이미지 생성 프롬프트 빌더
// ============================================

export function buildEnhancedImagePrompt(
  section: 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ',
  productName: string,
  category: string,
  keyFeatures: string[],
  brandStyle?: string
): string {
  const basePrompts = {
    HERO: `product photography of ${productName}, elegant ${category} product, centered hero composition, gradient background, soft diffused studio lighting, subtle reflection, luxury advertisement, premium branding, high-end minimalist aesthetic, 8k resolution`,

    FEATURES: `key ingredient visualization for ${category}, ${keyFeatures[0] || 'product features'}, detailed macro photography, clean background, natural soft lighting, scientific yet elegant aesthetic, ingredient showcase`,

    SOCIAL_PROOF: `before and after comparison for ${category}, split screen composition, improvement visualization, even studio lighting, neutral background, professional results documentation`,

    HOW_TO_USE: `step by step guide, person using ${category} product, clear instructional composition, bright lighting, clean minimal background, tutorial style, easy to follow`,

    FAQ: `${category} product showcase, complete collection display, products arranged elegantly, gradient background, studio lighting, brand portfolio presentation`,
  };

  const basePrompt = basePrompts[section];
  const styleAddition = brandStyle ? `, ${brandStyle}` : ', modern, clean, professional';

  return `${basePrompt}${styleAddition} --ar 3:4 --v 5 --stylize 350`;
}

// ============================================
// 기존 함수와의 호환성을 위한 래퍼
// ============================================

// 기존 buildSystemPrompt 대체용
export function buildSystemPrompt(
  copyLength: 'short' | 'medium' | 'long',
  brandContext?: BrandContext | null
): string {
  return buildEnhancedSystemPrompt(copyLength, brandContext);
}

// 기존 buildUserPrompt 대체용
export function buildUserPrompt(input: GenerateDetailPageInput): string {
  return buildEnhancedUserPrompt(input);
}
