/**
 * 사용자 프롬프트 빌더
 * 사용자 입력을 기반으로 AI에게 전달할 요청 프롬프트 생성
 */

import type { GenerateDetailPageInput, BrandContext } from './types';
import { COPY_LENGTH_CONFIG, getCategoryPattern } from './category-patterns';

// ============================================
// 서브카테고리별 특화 카피 가이드 (뷰티)
// ============================================

const SUBCATEGORY_COPY_GUIDES: Record<string, string> = {
  lip: `## 카테고리 특화 가이드: 립 메이크업

**강조 포인트**:
- 발색력과 지속력 (예: 선명한 발색, 12시간 유지)
- 텍스처 표현 (벨벳, 글로시, 매트, 무스 등)
- 컬러 라인업 (호수별 특징, MLBB 컬러 등)
- 보습력과 밀착력 (촉촉한 사용감, 각질 부각 없는)

**효과적인 표현**:
- "선명한 발색", "고급스러운 광택", "입술에 스며드는 컬러"
- "무너짐 없는 지속력", "촉촉한 착색"
- "데일리부터 특별한 날까지", "어떤 피부톤에도 어울리는"

**섹션별 키워드**:
- HERO: 발색, 텍스처, 럭셔리
- FEATURES: 성분, 보습, 지속력
- SOCIAL_PROOF: 누적 판매, 컬러 인기순위`,

  skincare: `## 카테고리 특화 가이드: 스킨케어

**강조 포인트**:
- 핵심 성분과 함량 (예: 히알루론산 5%, 나이아신아마이드 10%)
- 흡수력과 지속시간 (예: 빠른 흡수, 72시간 보습)
- 피부 타입 적합성 (민감성, 지성, 건성 등)
- 임상/피부과 테스트 결과

**효과적인 표현**:
- "깊은 보습", "촉촉함 유지", "피부결 개선"
- "저자극 포뮬러", "피부 장벽 강화"
- "맑고 투명한 피부톤", "탄력 케어"

**섹션별 키워드**:
- HERO: 수분, 광채, 건강한 피부
- FEATURES: 성분, 함량, 피부과학
- SOCIAL_PROOF: 임상테스트, 피부과 검증`,

  suncare: `## 카테고리 특화 가이드: 선케어

**강조 포인트**:
- SPF/PA 지수 (SPF50+ PA++++)
- 백탁/끈적임 여부 (무백탁, 산뜻한 마무리)
- 지속력과 내수성 (워터프루프, 땀/피지에 강한)
- 피부 부담감 (가벼운 사용감, 저자극)

**효과적인 표현**:
- "강력한 자외선 차단", "투명하게 발리는"
- "산뜻한 마무리", "메이크업 베이스로도 완벽"
- "민감한 피부도 안심", "데일리 선케어"

**섹션별 키워드**:
- HERO: 자외선 차단, 투명한 피부
- FEATURES: SPF/PA, 무기/유기 자차, 블루라이트 차단
- HOW_TO_USE: 2시간마다 덧바름, 적정량`,

  mascara: `## 카테고리 특화 가이드: 마스카라

**강조 포인트**:
- 볼륨/컬링/롱래쉬 효과
- 지속력과 번짐 방지 (스머지프루프, 워터프루프)
- 브러시 형태와 사용감
- 클렌징 용이성

**효과적인 표현**:
- "극강 볼륨", "올리면 내려오지 않는 컬링"
- "속눈썹 한 올 한 올 선명하게", "뭉침 없는 세퍼레이팅"
- "판다눈 걱정 없는", "미온수 클렌징"

**섹션별 키워드**:
- HERO: 속눈썹, 눈매, 드라마틱
- FEATURES: 브러시 형태, 포뮬러, 섬유
- SOCIAL_PROOF: 지속력 테스트, 번짐 테스트`,

  maskpack: `## 카테고리 특화 가이드: 마스크팩

**강조 포인트**:
- 시트 소재와 밀착력 (텐셀, 순면, 바이오셀룰로오스)
- 에센스 함량과 성분 (앰플 30ml 함유 등)
- 사용 시간과 효과 지속
- 피부 고민별 라인업

**효과적인 표현**:
- "에센스 팩 한 통을 얼굴에", "촘촘한 밀착"
- "피부에 꽉 차는 수분감", "다음날까지 지속되는 촉촉함"
- "주 2-3회 스페셜 케어", "피부 컨디션 끌어올리는"

**섹션별 키워드**:
- HERO: 집중 케어, 스페셜 케어, 에센스
- FEATURES: 시트 소재, 에센스 함량, 성분
- HOW_TO_USE: 사용 시간, 밀착 팁, 잔여 에센스 활용`,
};

// ============================================
// 카테고리별 특화 카피 가이드
// ============================================

function buildCategorySpecificCopyGuide(category: string, subCategory?: string): string {
  // ★ 서브카테고리가 있으면 해당 가이드 우선 반환
  if (subCategory && SUBCATEGORY_COPY_GUIDES[subCategory]) {
    console.log(`[UserPrompt] Using subcategory copy guide: ${subCategory}`);
    return SUBCATEGORY_COPY_GUIDES[subCategory];
  }

  const lowerCategory = category.toLowerCase();

  // 스킨케어 카테고리
  if (lowerCategory.includes('스킨케어') || lowerCategory.includes('세럼') ||
      lowerCategory.includes('에센스') || lowerCategory.includes('크림') ||
      lowerCategory.includes('토너') || lowerCategory.includes('앰플')) {
    return `## 카테고리 특화 가이드: 스킨케어

**강조 포인트**:
- 성분과 함량 (예: 히알루론산 5%, 나이아신아마이드 10%)
- 흡수력과 지속시간 (예: 빠른 흡수, 72시간 보습)
- 피부 타입 적합성 (민감성, 지성, 건성 등)
- 임상/피부과 테스트 결과

**효과적인 표현**:
- "깊은 보습", "촉촉함 유지", "피부결 개선"
- "저자극 포뮬러", "피부 장벽 강화"
- "맑고 투명한 피부톤", "탄력 케어"

**피해야 할 표현**:
- "완벽한 피부", "기적의 세럼", "모든 피부 문제 해결"`;
  }

  // 메이크업 카테고리
  if (lowerCategory.includes('립') || lowerCategory.includes('틴트') ||
      lowerCategory.includes('쿠션') || lowerCategory.includes('파운데이션') ||
      lowerCategory.includes('메이크업') || lowerCategory.includes('아이')) {
    return `## 카테고리 특화 가이드: 메이크업

**강조 포인트**:
- 발색력과 지속력 (예: 선명한 발색, 12시간 유지)
- 커버력과 피부 표현력 (예: 자연스러운 커버, 피부결 보정)
- 제형 특징 (무스 텍스처, 워터리 등)
- 색상 라인업 (호수별 특징)

**효과적인 표현**:
- "선명한 발색", "고급스러운 광택"
- "무너짐 없는 지속력", "자연스러운 피부 표현"
- "촉촉한 사용감", "가벼운 밀착력"

**피해야 할 표현**:
- "완벽한 메이크업", "하루종일 무너짐 제로"`;
  }

  // 선케어 카테고리
  if (lowerCategory.includes('선크림') || lowerCategory.includes('선케어') ||
      lowerCategory.includes('자외선') || lowerCategory.includes('spf')) {
    return `## 카테고리 특화 가이드: 선케어

**강조 포인트**:
- SPF/PA 지수 (SPF50+ PA++++)
- 백탁/끈적임 여부 (무백탁, 산뜻한 마무리)
- 지속력과 내수성 (워터프루프, 땀/피지에 강한)
- 피부 부담감 (가벼운 사용감, 저자극)

**효과적인 표현**:
- "강력한 자외선 차단", "투명하게 발리는"
- "산뜻한 마무리", "메이크업 베이스로도 완벽"
- "민감한 피부도 안심", "데일리 선케어"

**피해야 할 표현**:
- "100% 자외선 차단", "절대 타지 않는"`;
  }

  // 클렌징 카테고리
  if (lowerCategory.includes('클렌징') || lowerCategory.includes('세안') ||
      lowerCategory.includes('폼') || lowerCategory.includes('오일')) {
    return `## 카테고리 특화 가이드: 클렌징

**강조 포인트**:
- 세정력 (메이크업/선크림 클렌징력)
- 자극도 (저자극, 약산성)
- 세안 후 피부 상태 (촉촉함, 당김 없는)
- pH 수치 (pH 5.5 약산성)

**효과적인 표현**:
- "깔끔한 세정력", "당김 없는 촉촉한 마무리"
- "피부 장벽을 지키는", "저자극 약산성"
- "모공 속 노폐물까지", "부드러운 거품"

**피해야 할 표현**:
- "완벽한 클렌징", "모든 노폐물 제거"`;
  }

  // 헤어케어 카테고리
  if (lowerCategory.includes('헤어') || lowerCategory.includes('샴푸') ||
      lowerCategory.includes('트리트먼트') || lowerCategory.includes('두피')) {
    return `## 카테고리 특화 가이드: 헤어케어

**강조 포인트**:
- 두피/모발 타입 (지성 두피, 손상모, 염색모)
- 핵심 성분 (케라틴, 아르간오일 등)
- 효과 (볼륨, 윤기, 두피 진정)
- 향과 지속력

**효과적인 표현**:
- "건강한 두피", "윤기 나는 모발"
- "손상 케어", "두피 진정"
- "풍성한 볼륨", "부드러운 결"

**피해야 할 표현**:
- "탈모 치료", "완벽한 복구"`;
  }

  // 기본 가이드
  return `## 카테고리 특화 가이드: ${category}

**일반 작성 원칙**:
- 제품의 핵심 기능을 구체적으로 설명
- 수치와 객관적 근거 활용
- 타겟 고객의 니즈에 맞춘 표현
- 신뢰감 있는 전문적 톤 유지`;
}

// ============================================
// 브랜드 컨텍스트 프롬프트 빌더
// ============================================

function buildBrandContextPrompt(brandContext: BrandContext): string {
  let prompt = `
## 브랜드 정보 (반드시 반영)

**브랜드명:** ${brandContext.name}

**브랜드 아이덴티티:**
${brandContext.identity}

**톤앤매너:**
${brandContext.toneAndManner}
- 이 톤앤매너를 모든 카피에 일관되게 적용해주세요.
- 브랜드의 목소리와 스타일을 유지해주세요.

**비주얼 키워드:** ${brandContext.imageKeywords.join(', ')}
- 이 키워드들이 텍스트 톤에도 반영되어야 합니다.
`;

  if (brandContext.ragContext) {
    prompt += `
**브랜드 참고 자료 (RAG):**
${brandContext.ragContext}
- 위 참고 자료의 스타일과 표현을 참조하여 카피를 작성해주세요.
`;
  }

  return prompt;
}

// ============================================
// 상세페이지 생성 프롬프트
// ============================================

export function buildUserPrompt(input: GenerateDetailPageInput): string {
  const categoryPattern = getCategoryPattern(input.category);
  const lengthConfig = COPY_LENGTH_CONFIG[input.copyLength];

  // 브랜드 컨텍스트 섹션 (있는 경우만)
  const brandSection = input.brandContext
    ? buildBrandContextPrompt(input.brandContext)
    : '';

  // 카테고리별 특화 가이드 (★ subCategory 우선 적용)
  const categorySpecificGuide = buildCategorySpecificCopyGuide(input.category, input.subCategory);

  return `[필수 규칙] 이모지, 특수문자, 기호 사용 절대 금지. 순수 한글/영문 텍스트만 사용하세요.

다음 제품의 상세페이지 콘텐츠를 생성해주세요.
${brandSection}
## 제품 정보

**제품명:** ${input.productName}
**카테고리:** ${input.category}
**타겟 고객:** ${input.targetAudience}
${input.brandContext ? `**브랜드:** ${input.brandContext.name}` : ''}

**주요 특징:**
${input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

${categorySpecificGuide}

## 생성 요청

아래 JSON 형식으로 콘텐츠를 생성해주세요:

{
  "hookMessage": "고객의 시선을 사로잡는 핵심 메시지 (${lengthConfig.hookLength}자 내외)",
  "sections": [
    {
      "type": "MAIN",
      "title": "제품 슬로건 (짧고 강렬하게)",
      "body": "수상/랭킹 정보 | 프로모션 (짧게)"
    },
    {
      "type": "HERO",
      "title": "감성적이고 신뢰감 있는 제목",
      "body": "타겟 고객의 고민 공감 + 해결책 암시"
    },
    {
      "type": "FEATURES",
      "title": "핵심 성분/기술력 강조 제목",
      "body": "구체적 성분명과 수치를 포함한 기능 설명"
    },
    {
      "type": "SOCIAL_PROOF",
      "title": "신뢰 구축 제목 (임상/테스트 결과)",
      "body": "구체적 수치 + 실제 사용자 목소리"
    },
    {
      "type": "HOW_TO_USE",
      "title": "사용법 안내",
      "body": "STEP 1, 2, 3 + 적정 사용량 + TIP"
    },
    {
      "type": "FAQ",
      "title": "자주 묻는 질문",
      "body": "Q&A 2-3개 + 구매 유도 CTA"
    }
  ]
}

## 섹션별 작성 가이드 (실제 올리브영 베스트셀러 패턴)

### 1. MAIN 섹션 (메인 썸네일 슬로건)
상품 리스트에서 클릭을 유도하는 강렬한 한마디

**title 작성법** - 다음 패턴 중 선택:
- 별명형: "국민세안제", "피부 식빵템", "갓성비 세럼"
- 순위형: "5년 연속 1위", "올영어워즈 대상", "누적 판매 100만개"
- 권위형: "피부과 전문의 추천", "더마 테스트 완료"
- 기능형: "24시간 지속력", "72시간 수분 충전"

**body 작성법**:
- 짧게 | 로 구분: "올영어워즈 5년 연속 | 본품+미니 기획"
- 숫자 강조 필수

### 2. HERO 섹션 (도입부)
타겟 고객(${input.targetAudience})의 마음을 사로잡는 첫인상

**title 작성법**:
- 고민 공감형: "건조함에 지친 피부를 위해"
- 해결책 제시형: "촉촉함이 오래 가는 비결"
- 가치 제안형: "매일 아침, 건강한 피부로 시작하세요"

**body 작성법**:
- 1-2문장으로 핵심 가치 전달
- 감성적이되 과장 없이
- 예: "하루 종일 당기는 피부, 이제 걱정하지 마세요. 깊은 보습이 촉촉함을 오래 유지해드립니다."

### 3. FEATURES 섹션 (특징/성분)
제품의 핵심 기능을 구체적으로 설명

**title 작성법**:
- 성분 강조: "히알루론산 3중 복합체의 힘"
- 기술 강조: "특허받은 리포좀 기술"
- 효과 강조: "깊은 보습, 오래 가는 촉촉함"

**body 작성법** - 제공된 특징(${input.keyFeatures.join(', ')})을 다음 형식으로:
- "성분명 + 함량 + 효과" 형식
- 예: "나이아신아마이드 5% 함유로 칙칙한 피부톤을 환하게 케어합니다"
- 예: "저분자 히알루론산이 피부 깊숙이 침투하여 72시간 수분을 유지합니다"

### 4. SOCIAL_PROOF 섹션 (신뢰/후기)
객관적 데이터로 신뢰 구축

**title 작성법**:
- "피부과 임상 테스트 결과"
- "사용자 92%가 인정한 효과"
- "실제 사용자들의 생생한 후기"

**body 작성법**:
- 구체적 수치 필수: "사용자 92%가 2주 내 피부결 개선 체감"
- 테스트 결과: "피부과 임상 테스트 완료, 피부 자극 지수 0.00"
- 실제 후기 톤: "민감한 제 피부에도 자극 없이 촉촉하게 흡수되어요 - 30대 직장인"

### 5. HOW_TO_USE 섹션 (사용법)
쉽게 따라할 수 있는 사용 가이드

**body 작성법**:
- STEP 1. 세안 후 토너로 피부결을 정돈합니다
- STEP 2. 적당량(콩알 크기)을 손에 덜어 얼굴 전체에 펴 바릅니다
- STEP 3. 손바닥으로 감싸듯 가볍게 눌러 흡수시킵니다
- TIP. 건조한 부위에는 한 번 더 덧발라주세요

### 6. FAQ 섹션 (질문/마무리)
구매 결정을 돕는 정보 + 행동 유도

**body 작성법**:
- Q. 민감성 피부도 사용 가능한가요?
- A. 네, 피부과 테스트를 완료한 저자극 제품입니다.
- Q. 개봉 후 사용 기한은 어떻게 되나요?
- A. 개봉 후 12개월 이내 사용을 권장합니다.
- CTA: "지금 바로 건강한 피부를 시작하세요"

## 절대 금지 사항

1. **이모지/특수문자**: 하트, 별, 반짝이 등 모든 이모지 금지
2. **과대광고**: "기적의", "완벽한", "100% 효과" 등 금지
3. **비전문적 표현**: "대박", "짱", "완전 좋아요" 등 금지
4. **느낌표 남발**: 문장당 1개 이하
5. **번역체**: "당신의 피부를 위하여" → "건강한 피부를 위해"
${input.brandContext ? `
## 필수: 브랜드 일관성 유지
- 브랜드(${input.brandContext.name})의 톤앤매너를 모든 카피에 일관되게 반영
- 브랜드 키워드: ${input.brandContext.imageKeywords?.join(', ') || '프리미엄, 신뢰'}
` : ''}
JSON 객체만 반환하고, 추가 설명은 포함하지 마세요.`;
}

// 하위 호환성을 위한 별칭
export const buildEnhancedUserPrompt = buildUserPrompt;
