/**
 * 오버레이 텍스트 프롬프트 빌더
 * 이미지 위에 올라갈 텍스트를 별도로 생성
 */

import type { SectionType } from './types';
import { getCategoryPattern, SECTION_STORY_GUIDE } from './category-patterns';

// ============================================
// 오버레이 텍스트 프롬프트 빌더
// ============================================

/**
 * 섹션별 오버레이 텍스트 생성 프롬프트 빌더
 */
export function buildOverlayTextPrompt(
  section: SectionType,
  productName: string,
  category: string,
  keyFeatures: string[],
  targetAudience: string
): string {
  const categoryPattern = getCategoryPattern(category);
  const sectionGuide = SECTION_STORY_GUIDE[section as keyof typeof SECTION_STORY_GUIDE];

  if (!sectionGuide) {
    // CUSTOM 섹션이나 알 수 없는 섹션의 경우 FEATURES 가이드 사용
    return buildOverlayTextPrompt('FEATURES', productName, category, keyFeatures, targetAudience);
  }

  const textPatterns = categoryPattern.textPatterns.slice(0, 3).join(', ');

  return `당신은 한국 뷰티/화장품 브랜드의 시니어 카피라이터입니다.
상세페이지 이미지에 오버레이될 텍스트를 작성합니다.

## 작성 원칙
1. **간결함**: 이미지에서 빠르게 읽힐 수 있도록 최대한 짧게
2. **임팩트**: 핵심 메시지가 즉각 전달되도록
3. **감성+기능**: 감성적 어필과 기능적 정보의 균형
4. **행동 유도**: 다음 이미지로 스크롤하거나 구매하도록 유도

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 타겟: ${targetAudience}
- 핵심 특징: ${keyFeatures.join(', ')}

## 섹션: ${section}
- 목적: ${sectionGuide.purpose}
- 톤: ${sectionGuide.textTone}
- 권장 패턴: ${textPatterns}

## 카피 유형별 가이드

### 헤드라인 (대제목)
- 글자 수: 5-10자
- 역할: 핵심 베네핏 한 마디로 전달
- 예시: "24시간 촉촉함", "윤기의 비밀", "피부가 달라진다"

### 서브헤드라인 (부제목)
- 글자 수: 10-20자
- 역할: 헤드라인 보완, 구체적 정보 추가
- 예시: "히알루론산 5중 복합체 함유", "임상 테스트 완료"

### 본문 텍스트
- 글자 수: 20-50자
- 역할: 상세 설명, 성분/효능 정보

### 숫자/통계
- 형식: XX% 또는 X배
- 역할: 신뢰도 증가, 효과 수치화
- 예시: "92% 만족", "수분 3.5배 증가"

### CTA (행동 유도)
- 글자 수: 5-10자
- 역할: 구매/행동 유도
- 예시: "지금 만나보세요", "나만의 루틴 시작"

## 중요: 이모지 사용 금지
- 이모지(😊, ✨, 💕, 🌟, ❤️ 등)를 절대 사용하지 마세요
- 순수 텍스트만 작성해주세요

## 요청
${section} 섹션에 적합한 오버레이 텍스트를 JSON 형식으로 생성해주세요:

{
  "headline": "대제목 (5-10자)",
  "subheadline": "부제목 (10-20자)",
  "body": "본문 텍스트 (필요시)",
  "statistics": ["수치1", "수치2"],
  "cta": "행동 유도 문구 (필요시)"
}

JSON만 반환하세요. 이모지 없이 순수 텍스트만 포함해야 합니다.`;
}
