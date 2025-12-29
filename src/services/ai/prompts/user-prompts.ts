/**
 * 사용자 프롬프트 빌더
 * 사용자 입력을 기반으로 AI에게 전달할 요청 프롬프트 생성
 */

import type { GenerateDetailPageInput } from './types';
import { COPY_LENGTH_CONFIG, getCategoryPattern } from './category-patterns';

// ============================================
// 상세페이지 생성 프롬프트
// ============================================

export function buildUserPrompt(input: GenerateDetailPageInput): string {
  const categoryPattern = getCategoryPattern(input.category);
  const lengthConfig = COPY_LENGTH_CONFIG[input.copyLength];

  return `다음 제품의 상세페이지 콘텐츠를 생성해주세요.

## 제품 정보

**제품명:** ${input.productName}
**카테고리:** ${input.category}
**타겟 고객:** ${input.targetAudience}

**주요 특징:**
${input.keyFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 카테고리 특화 가이드 (올리브영 패턴 분석 기반)

이 제품은 "${input.category}" 카테고리입니다.
- 강조 키워드: ${categoryPattern.keywords.join(', ')}
- 효과적인 텍스트 패턴: ${categoryPattern.textPatterns.slice(0, 4).join(', ')}
- 톤 가이드: ${categoryPattern.toneGuide}
${categoryPattern.topStats.length > 0 ? `- 인사이트: ${categoryPattern.topStats[0].text}가 가장 효과적` : ''}

## 생성 요청

아래 JSON 형식으로 콘텐츠를 생성해주세요:

{
  "hookMessage": "고객의 시선을 사로잡는 핵심 메시지 (${lengthConfig.hookLength}자 내외)",
  "sections": [
    {
      "type": "HERO",
      "title": "감성적이고 임팩트 있는 제목 (5-10자)",
      "body": "브랜드 아이덴티티와 제품의 핵심 가치를 전달하는 도입부. 고객의 고민에 공감하며 시작."
    },
    {
      "type": "FEATURES",
      "title": "핵심 성분/기술력을 강조하는 제목",
      "body": "주요 특징을 불릿 포인트로 정리. 각 특징에 대한 구체적인 효과 설명. '~하여 ~합니다' 형식 사용."
    },
    {
      "type": "SOCIAL_PROOF",
      "title": "신뢰를 구축하는 제목 (예: 임상 테스트 결과)",
      "body": "구체적인 수치와 통계 (예: 92% 만족도). 실제 사용자 후기 톤. Before/After 효과 언급."
    },
    {
      "type": "HOW_TO_USE",
      "title": "사용법 안내 제목",
      "body": "Step 1, 2, 3 형식의 간결한 사용법. 적정 사용량 (예: 콩알 크기). 사용 팁 포함."
    },
    {
      "type": "FAQ",
      "title": "자주 묻는 질문",
      "body": "Q&A 형식 또는 구매 결정을 돕는 추가 정보. '지금 만나보세요' 같은 CTA로 마무리."
    }
  ]
}

## 작성 지침 (올리브영 베스트셀러 패턴 기반)

1. **HERO 섹션**
   - 타겟 고객(${input.targetAudience})의 고민에 공감하는 문장으로 시작
   - 제품이 해결해주는 핵심 가치 1가지에 집중
   - before-after, moisturizing 패턴 활용

2. **FEATURES 섹션**
   - 주요 특징 ${input.keyFeatures.length}가지를 각각 구체적으로 설명
   - statistics, ingredients 패턴 활용
   - "~하여 ~합니다" 형식의 효과 중심 문장

3. **SOCIAL_PROOF 섹션**
   - 구체적인 수치 필수 사용 (예: 92% 만족도, 3.5배 수분 증가)
   - 실제 사용자 톤의 후기 (예: "민감한 제 피부에도 자극 없이 촉촉해요!")
   - before-after, statistics, clinical 패턴 활용

4. **HOW_TO_USE 섹션**
   - 3-4단계로 간결하게 정리
   - 적정 사용량 필수 언급 (예: 콩알 크기, 500원 동전)
   - how-to, tips 패턴 활용

5. **FAQ 섹션**
   - 실제 궁금할 질문 2-3개
   - 구매 결정에 도움되는 정보
   - "지금 만나보세요" 같은 명확한 CTA로 마무리

## ⚠️ 중요: 이모지 사용 금지
- 이모지(😊, ✨, 💕, 🌟, ❤️ 등)를 절대 사용하지 마세요
- 순수 텍스트만 작성해주세요
- 특수문자나 기호로 꾸미지 마세요

JSON 객체만 반환하고, 추가 설명은 포함하지 마세요.`;
}

// 하위 호환성을 위한 별칭
export const buildEnhancedUserPrompt = buildUserPrompt;
