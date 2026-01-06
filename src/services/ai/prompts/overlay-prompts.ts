/**
 * 오버레이 텍스트 프롬프트 빌더
 * 이미지 위에 올라갈 텍스트를 별도로 생성
 * ★ 위치와 스타일 정보도 함께 생성
 */

import type { SectionType } from './types';
import { getCategoryPattern, SECTION_STORY_GUIDE } from './category-patterns';

// ============================================
// 섹션별 기본 레이아웃 가이드
// ============================================

const SECTION_LAYOUT_GUIDE: Record<string, {
  headline: { x: number; y: number; align: 'left' | 'center' | 'right'; fontSize: number };
  subheadline: { x: number; y: number; align: 'left' | 'center' | 'right'; fontSize: number };
  body: { x: number; y: number; align: 'left' | 'center' | 'right'; fontSize: number };
  statistics: { x: number; y: number; fontSize: number };
  cta: { x: number; y: number; fontSize: number };
  productArea: string;  // 제품이 배치되는 영역 설명
  safeArea: string;     // 텍스트 배치 안전 영역
}> = {
  MAIN: {
    headline: { x: 5, y: 8, align: 'left', fontSize: 32 },
    subheadline: { x: 5, y: 20, align: 'left', fontSize: 18 },
    body: { x: 5, y: 35, align: 'left', fontSize: 14 },
    statistics: { x: 15, y: 75, fontSize: 48 },
    cta: { x: 15, y: 90, fontSize: 14 },
    productArea: '오른쪽 중앙 (40-95%, 15-85%)',
    safeArea: '왼쪽 상단 영역 (0-35%, 5-45%)',
  },
  HERO: {
    headline: { x: 50, y: 10, align: 'center', fontSize: 36 },
    subheadline: { x: 50, y: 22, align: 'center', fontSize: 20 },
    body: { x: 50, y: 85, align: 'center', fontSize: 14 },
    statistics: { x: 50, y: 50, fontSize: 56 },
    cta: { x: 50, y: 92, fontSize: 16 },
    productArea: '중앙 (25-75%, 30-70%)',
    safeArea: '상단/하단 가장자리',
  },
  FEATURES: {
    headline: { x: 50, y: 8, align: 'center', fontSize: 28 },
    subheadline: { x: 50, y: 18, align: 'center', fontSize: 16 },
    body: { x: 50, y: 88, align: 'center', fontSize: 14 },
    statistics: { x: 50, y: 45, fontSize: 48 },
    cta: { x: 50, y: 92, fontSize: 14 },
    productArea: '중앙 (20-80%, 25-75%)',
    safeArea: '상단/하단',
  },
  SOCIAL_PROOF: {
    headline: { x: 50, y: 8, align: 'center', fontSize: 24 },
    subheadline: { x: 50, y: 18, align: 'center', fontSize: 16 },
    body: { x: 50, y: 85, align: 'center', fontSize: 14 },
    statistics: { x: 50, y: 45, fontSize: 64 },
    cta: { x: 50, y: 92, fontSize: 14 },
    productArea: '중앙 영역',
    safeArea: '상단/하단',
  },
  HOW_TO_USE: {
    headline: { x: 50, y: 5, align: 'center', fontSize: 24 },
    subheadline: { x: 50, y: 15, align: 'center', fontSize: 16 },
    body: { x: 50, y: 90, align: 'center', fontSize: 14 },
    statistics: { x: 50, y: 50, fontSize: 32 },
    cta: { x: 50, y: 95, fontSize: 14 },
    productArea: '중앙 (사용법 이미지)',
    safeArea: '상단/하단',
  },
  FAQ: {
    headline: { x: 50, y: 8, align: 'center', fontSize: 24 },
    subheadline: { x: 50, y: 18, align: 'center', fontSize: 16 },
    body: { x: 50, y: 50, align: 'center', fontSize: 16 },
    statistics: { x: 50, y: 70, fontSize: 36 },
    cta: { x: 50, y: 88, fontSize: 18 },
    productArea: '하단 제품 배치',
    safeArea: '상단/중앙',
  },
};

// ============================================
// 오버레이 텍스트 프롬프트 빌더
// ============================================

/**
 * 섹션별 오버레이 텍스트 생성 프롬프트 빌더
 * ★ 위치와 스타일 정보도 함께 반환
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
  const layoutGuide = SECTION_LAYOUT_GUIDE[section] || SECTION_LAYOUT_GUIDE.HERO;

  if (!sectionGuide) {
    // CUSTOM 섹션이나 알 수 없는 섹션의 경우 FEATURES 가이드 사용
    return buildOverlayTextPrompt('FEATURES', productName, category, keyFeatures, targetAudience);
  }

  const textPatterns = categoryPattern.textPatterns.slice(0, 3).join(', ');

  return `당신은 한국 뷰티/화장품 브랜드의 시니어 UI/카피 디자이너입니다.
상세페이지 이미지에 오버레이될 **텍스트, 위치, 스타일**을 함께 디자인합니다.

## 작성 원칙
1. **간결함**: 이미지에서 빠르게 읽힐 수 있도록 최대한 짧게
2. **임팩트**: 핵심 메시지가 즉각 전달되도록
3. **가독성**: 텍스트가 제품 영역과 겹치지 않도록 배치
4. **일관성**: 브랜드 톤에 맞는 폰트, 색상, 정렬

## 제품 정보
- 제품명: ${productName}
- 카테고리: ${category}
- 타겟: ${targetAudience}
- 핵심 특징: ${keyFeatures.join(', ')}

## 섹션: ${section}
- 목적: ${sectionGuide.purpose}
- 톤: ${sectionGuide.textTone}
- 권장 패턴: ${textPatterns}

## ★ 레이아웃 가이드 (${section} 섹션)
- 제품 영역: ${layoutGuide.productArea}
- 텍스트 안전 영역: ${layoutGuide.safeArea}
- 헤드라인 기본 위치: x=${layoutGuide.headline.x}%, y=${layoutGuide.headline.y}%
- 서브헤드라인 기본 위치: x=${layoutGuide.subheadline.x}%, y=${layoutGuide.subheadline.y}%

## 스타일 옵션

### 색상 (color)
- 밝은 배경: "#333333" (진한 회색) 또는 "#000000" (검정)
- 어두운/컬러 배경: "#ffffff" (흰색)
- 강조: 브랜드 컬러 (예: "#e74c3c" 레드, "#3498db" 블루, "#27ae60" 그린)

### 폰트 크기 (fontSize, px 단위)
- 헤드라인: 28-48px (MAIN은 더 크게)
- 서브헤드라인: 16-24px
- 본문: 12-16px
- 통계 숫자: 36-64px (큰 임팩트)
- CTA: 14-18px

### 폰트 굵기 (fontWeight)
- "normal" | "medium" | "semibold" | "bold"

### 텍스트 정렬 (textAlign)
- "left" | "center" | "right"

## 중요: 이모지 사용 금지
- 이모지(😊, ✨, 💕, 🌟, ❤️ 등)를 절대 사용하지 마세요

## 요청
${section} 섹션에 적합한 오버레이 텍스트를 **내용 + 위치 + 스타일** 포함하여 JSON 형식으로 생성해주세요:

{
  "headline": {
    "text": "대제목 (5-10자)",
    "x": ${layoutGuide.headline.x},
    "y": ${layoutGuide.headline.y},
    "fontSize": ${layoutGuide.headline.fontSize},
    "fontWeight": "bold",
    "color": "#ffffff",
    "textAlign": "${layoutGuide.headline.align}"
  },
  "subheadline": {
    "text": "부제목 (10-20자)",
    "x": ${layoutGuide.subheadline.x},
    "y": ${layoutGuide.subheadline.y},
    "fontSize": ${layoutGuide.subheadline.fontSize},
    "fontWeight": "medium",
    "color": "#ffffff",
    "textAlign": "${layoutGuide.subheadline.align}"
  },
  "body": {
    "text": "본문 텍스트 (필요시, 없으면 null)",
    "x": ${layoutGuide.body.x},
    "y": ${layoutGuide.body.y},
    "fontSize": ${layoutGuide.body.fontSize},
    "fontWeight": "normal",
    "color": "#ffffff",
    "textAlign": "${layoutGuide.body.align}"
  },
  "statistics": [
    {
      "text": "92%",
      "x": ${layoutGuide.statistics.x},
      "y": ${layoutGuide.statistics.y},
      "fontSize": ${layoutGuide.statistics.fontSize},
      "fontWeight": "bold",
      "color": "#ffffff"
    }
  ],
  "cta": {
    "text": "지금 만나보세요",
    "x": ${layoutGuide.cta.x},
    "y": ${layoutGuide.cta.y},
    "fontSize": ${layoutGuide.cta.fontSize},
    "fontWeight": "semibold",
    "color": "#ffffff"
  }
}

- 필요 없는 항목은 null 또는 빈 배열로 설정
- JSON만 반환하세요
- 이모지 없이 순수 텍스트만 포함`;
}
