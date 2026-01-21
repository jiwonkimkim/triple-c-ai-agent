/**
 * Planner Agent
 * 수집된 정보를 바탕으로 콘텐츠 구조 기획
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import { ChatMessage, PlannedSection, generateMessageId, validateGoogleAIApiKey, BeautySubCategory } from '../types';
import {
  getSubCategorySections,
  hasAdvancedPromptSystem,
  isBeautyCategory,
  BEAUTY_SUBCATEGORY_META,
} from '@/services/ai/prompts';

// Lazy initialization to avoid build-time API key requirement
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    const apiKey = validateGoogleAIApiKey();
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.4,
      apiKey,
    });
  }
  return _model;
}

const PLANNER_SYSTEM_PROMPT = `당신은 마케팅 콘텐츠 기획 전문가입니다.
수집된 제품 정보를 바탕으로 효과적인 상세페이지 구조를 기획합니다.

## 사용 가능한 섹션 타입:
- HERO: 메인 비주얼, 제품 대표 이미지
- KEY_MESSAGE: 핵심 메시지, 슬로건
- TEXT_ONLY: 텍스트만 있는 섹션 (후킹 메시지, 강조 문구 등)
- HOOK_MESSAGE: 후킹 메시지 (짧고 임팩트 있는 문구)
- FEATURES: 제품 특징 및 장점 설명
- BENEFIT_HIGHLIGHT: 혜택 강조
- HOW_TO_USE: 사용 방법
- SOCIAL_PROOF: 리뷰, 평점, 추천
- FAQ: 자주 묻는 질문
- DIVIDER_VISUAL: 구분 비주얼

## 응답 형식:
{
  "sections": [
    { "type": "HERO", "name": "메인 비주얼", "description": "제품 대표 이미지와 핵심 카피" },
    { "type": "KEY_MESSAGE", "name": "핵심 메시지", "description": "..." }
  ],
  "visualTheme": "추천 비주얼 테마",
  "toneAndManner": "추천 톤앤매너",
  "colorPalette": ["#색상1", "#색상2", "#색상3"]
}

## 카테고리별 권장 구성:
- BEAUTY: HERO → KEY_MESSAGE → FEATURES (성분/효능) → HOW_TO_USE → SOCIAL_PROOF
- FASHION: HERO → KEY_MESSAGE → FEATURES (소재/디자인) → SOCIAL_PROOF
- FOOD: HERO → KEY_MESSAGE → FEATURES (재료/맛) → HOW_TO_USE → FAQ
- ELECTRONICS: HERO → FEATURES (스펙/기능) → HOW_TO_USE → FAQ → SOCIAL_PROOF`;

// 섹션 수정용 시스템 프롬프트
const SECTION_MODIFICATION_PROMPT = `당신은 상세페이지 섹션 기획 전문가입니다.
사용자의 수정 요청에 따라 기존 섹션 구성을 수정합니다.

## 사용 가능한 섹션 타입:
- HERO: 메인 비주얼, 제품 대표 이미지
- KEY_MESSAGE: 핵심 메시지, 슬로건
- TEXT_ONLY: 텍스트만 있는 섹션 (후킹 메시지, 강조 문구 등)
- HOOK_MESSAGE: 후킹 메시지 (짧고 임팩트 있는 문구)
- FEATURES: 제품 특징 및 장점 설명
- BENEFIT_HIGHLIGHT: 혜택 강조
- HOW_TO_USE: 사용 방법
- SOCIAL_PROOF: 리뷰, 평점, 추천
- FAQ: 자주 묻는 질문
- DIVIDER_VISUAL: 구분 비주얼

## 응답 형식 (JSON):
{
  "modifiedSections": [
    { "type": "HERO", "name": "메인 비주얼", "description": "제품 대표 이미지와 핵심 카피" },
    { "type": "TEXT_ONLY", "name": "후킹 메시지", "description": "주목도를 높이는 임팩트 문구" }
  ],
  "explanation": "섹션을 어떻게 수정했는지 설명"
}

## 규칙:
1. 사용자 요청을 정확히 반영하세요
2. "텍스트만", "문구만", "후킹 메시지" 등의 요청은 TEXT_ONLY 또는 HOOK_MESSAGE 타입으로 추가
3. 기존 섹션의 순서와 구성을 존중하되, 요청에 따라 추가/삭제/수정
4. 섹션은 5-8개가 적당합니다`;

interface PlannerResponse {
  sections: PlannedSection[];
  visualTheme: string;
  toneAndManner: string;
  colorPalette: string[];
}

// ★ 뷰티 서브카테고리별 기본 섹션 생성
function getDefaultSectionsForSubCategory(
  subCategory: BeautySubCategory | undefined,
  category: string | undefined
): PlannedSection[] {
  // 뷰티 서브카테고리가 있고, 고도화된 프롬프트 시스템이 있는 경우
  if (subCategory && hasAdvancedPromptSystem(subCategory) && category && isBeautyCategory(category)) {
    const sections = getSubCategorySections(subCategory);
    const subCategoryMeta = BEAUTY_SUBCATEGORY_META.find(m => m.value === subCategory);
    const subCategoryLabel = subCategoryMeta?.label || subCategory;

    // 섹션 타입을 PlannedSection 형태로 변환 (주요 섹션만 미리보기로 표시)
    const sectionDescriptions: Record<string, { name: string; description: string }> = {
      'MAIN': { name: '메인 썸네일', description: '제품 대표 이미지' },
      'HERO': { name: '히어로 섹션', description: '메인 비주얼과 핵심 카피' },
      'HERO_SPLASH': { name: '스플래시 비주얼', description: '제품의 수분감/질감 강조' },
      'HERO_LIP': { name: '립 히어로', description: '립 제품 메인 비주얼' },
      'KEY_MESSAGE': { name: '핵심 메시지', description: '제품의 핵심 가치 전달' },
      'EFFICACY_VISUAL': { name: '효능 비주얼', description: '제품 효능을 시각적으로 표현' },
      'TEXTURE_VISUAL': { name: '텍스처 비주얼', description: '제품 질감과 텍스처 표현' },
      'COLOR_SWATCHES': { name: '컬러 스와치', description: '컬러 라인업 표시' },
      'INGREDIENT_FOCUS': { name: '성분 포커스', description: '핵심 성분 강조' },
      'STEP_GUIDE': { name: '사용 가이드', description: '단계별 사용 방법' },
      'HOW_TO_USE': { name: '사용 방법', description: '제품 사용법 안내' },
      'REVIEW_SHOWCASE': { name: '리뷰 쇼케이스', description: '고객 후기 및 평점' },
      'SOCIAL_PROOF': { name: '소셜 프루프', description: '리뷰, 평점, 추천' },
      'FEATURES': { name: '제품 특징', description: '주요 특징 및 장점' },
      'TEXT_BANNER_1': { name: '텍스트 배너', description: '강조 문구 배너' },
      'TEXT_BANNER_2': { name: '텍스트 배너', description: '추가 강조 문구' },
      'SIZE_OPTIONS': { name: '사이즈 옵션', description: '용량/사이즈 정보' },
      'LONGEVITY_INFO': { name: '지속력 정보', description: '제품 지속력 표현' },
    };

    // 주요 섹션만 미리보기로 표시 (전체 섹션은 너무 많으므로)
    const previewSections = sections.slice(0, 8).map(sectionType => {
      const info = sectionDescriptions[sectionType] || {
        name: sectionType,
        description: `${subCategoryLabel} 전용 섹션`
      };
      return {
        type: sectionType,
        name: info.name,
        description: info.description,
      };
    });

    console.log(`[Planner] ★ Using ${subCategory} subcategory sections: ${sections.length} total, showing ${previewSections.length} in preview`);
    return previewSections;
  }

  // 기본 섹션
  return [
    { type: 'HERO', name: '메인 비주얼', description: '제품 대표 이미지와 핵심 카피' },
    { type: 'KEY_MESSAGE', name: '핵심 메시지', description: '제품의 핵심 가치 전달' },
    { type: 'FEATURES', name: '제품 특징', description: '주요 특징 및 장점 설명' },
    { type: 'HOW_TO_USE', name: '사용 방법', description: '제품 사용법 안내' },
    { type: 'SOCIAL_PROOF', name: '고객 후기', description: '리뷰 및 평점' },
  ];
}

export async function plannerAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { collectedData, brandContext } = state;

  // 섹션 수정 요청이 있는 경우 - LLM으로 기존 섹션 수정
  if (collectedData.sectionModificationRequest && collectedData.plannedSections) {
    return handleSectionModification(state);
  }

  // ★ 뷰티 서브카테고리가 있으면 해당 섹션 사용
  const subCategory = collectedData.subCategory;
  const category = collectedData.category;

  // 고도화된 프롬프트 시스템이 있는 뷰티 서브카테고리인 경우 LLM 없이 바로 섹션 반환
  if (subCategory && hasAdvancedPromptSystem(subCategory) && category && isBeautyCategory(category)) {
    console.log(`[Planner] ★★★ Using advanced prompt system for ${subCategory}`);

    const sections = getDefaultSectionsForSubCategory(subCategory, category);
    const fullSectionCount = getSubCategorySections(subCategory).length;
    const subCategoryMeta = BEAUTY_SUBCATEGORY_META.find(m => m.value === subCategory);
    const subCategoryLabel = subCategoryMeta?.label || subCategory;

    // 톤앤매너 및 테마 결정
    const toneMap: Record<string, string> = {
      'lip': '생동감 있고 트렌디한',
      'skincare': '차분하고 신뢰감 있는',
      'suncare': '밝고 활기찬',
      'mascara': '세련되고 임팩트 있는',
      'maskpack': '편안하고 감성적인',
    };

    const themeMap: Record<string, string> = {
      'lip': '비비드 & 글로시',
      'skincare': '미니멀 & 클린',
      'suncare': '프레시 & 브라이트',
      'mascara': '드라마틱 & 볼드',
      'maskpack': '소프트 & 힐링',
    };

    const colorMap: Record<string, string[]> = {
      'lip': ['#E91E63', '#FF4081', '#FCE4EC'],
      'skincare': ['#4CAF50', '#81C784', '#E8F5E9'],
      'suncare': ['#FF9800', '#FFB74D', '#FFF3E0'],
      'mascara': ['#212121', '#424242', '#F5F5F5'],
      'maskpack': ['#9C27B0', '#CE93D8', '#F3E5F5'],
    };

    const visualTheme = themeMap[subCategory] || '모던 & 클린';
    const toneAndManner = toneMap[subCategory] || '친근하고 전문적인';
    const colorPalette = colorMap[subCategory] || ['#333333', '#666666', '#F5F5F5'];

    const sectionsPreview = sections
      .map((s, idx) => `${idx + 1}. **${s.name}** (${s.type})\n   ${s.description}`)
      .join('\n');

    const assistantMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `${subCategoryLabel} 전용 상세페이지 기획이 완료되었어요! 🎨\n\n` +
        `## 📋 섹션 구성 (총 ${fullSectionCount}개 섹션)\n${sectionsPreview}\n` +
        `_...외 ${fullSectionCount - sections.length}개 섹션이 더 있어요!_\n\n` +
        `## 🎨 스타일\n` +
        `- 테마: ${visualTheme}\n` +
        `- 톤앤매너: ${toneAndManner}\n` +
        `- 컬러: ${colorPalette.join(', ')}\n\n` +
        `이대로 생성을 시작할까요?`,
      agentType: 'PLANNER',
      metadata: {
        uiType: 'options',
        askingField: 'planAction',
        options: [
          { id: 'generate', label: '이대로 생성하기', value: 'generate', description: '상세페이지 생성 시작' },
          { id: 'modify_sections', label: '섹션 수정', value: 'modify_sections', description: '섹션 구성 변경' },
          { id: 'modify_style', label: '스타일 변경', value: 'modify_style', description: '테마/톤 변경' },
        ],
        planPreview: {
          sections,
          theme: visualTheme,
          tone: toneAndManner,
        },
      },
      createdAt: new Date(),
    };

    return {
      messages: [assistantMessage],
      collectedData: {
        plannedSections: sections,
        visualTheme,
        toneAndManner,
        colorPalette,
      },
      currentAgent: 'PLANNER',
      nextAction: { type: 'await_input' },
    };
  }

  // 기획에 필요한 정보 조합 (일반 카테고리용)
  const planningContext = `
## 제품 정보
- 제품명: ${collectedData.productName}
- 카테고리: ${collectedData.category}${collectedData.subCategory ? ` > ${collectedData.subCategory}` : ''}
- 주요 특징: ${collectedData.keyFeatures?.join(', ')}
- 타겟 고객: ${collectedData.targetAudience || '일반 소비자'}
- 카피 길이: ${collectedData.copyLength}

${brandContext ? `
## 브랜드 정보
- 브랜드명: ${brandContext.name}
- 브랜드 아이덴티티: ${brandContext.identity}
- 톤앤매너: ${brandContext.toneAndManner}
- 이미지 키워드: ${brandContext.imageKeywords.join(', ')}
` : ''}

위 정보를 바탕으로 효과적인 상세페이지 구조를 기획해주세요.
`;

  try {
    const response = await getModel().invoke([
      { role: 'system', content: PLANNER_SYSTEM_PROMPT },
      { role: 'user', content: planningContext },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plannerResponse: PlannerResponse = JSON.parse(jsonMatch[0]);

      // 기획 미리보기 메시지 생성
      const sectionsPreview = plannerResponse.sections
        .map((s, idx) => `${idx + 1}. **${s.name}** (${s.type})\n   ${s.description}`)
        .join('\n');

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `상세페이지 기획이 완료되었어요! 아래 구성으로 진행할까요?\n\n` +
          `## 📋 섹션 구성\n${sectionsPreview}\n\n` +
          `## 🎨 스타일\n` +
          `- 테마: ${plannerResponse.visualTheme}\n` +
          `- 톤앤매너: ${plannerResponse.toneAndManner}\n` +
          `- 컬러: ${plannerResponse.colorPalette.join(', ')}\n\n` +
          `이대로 생성을 시작할까요?`,
        agentType: 'PLANNER',
        metadata: {
          uiType: 'options',
          askingField: 'planAction', // 플랜 액션 선택
          options: [
            { id: 'generate', label: '이대로 생성하기', value: 'generate', description: '상세페이지 생성 시작' },
            { id: 'modify_sections', label: '섹션 수정', value: 'modify_sections', description: '섹션 구성 변경' },
            { id: 'modify_style', label: '스타일 변경', value: 'modify_style', description: '테마/톤 변경' },
          ],
          planPreview: {
            sections: plannerResponse.sections,
            theme: plannerResponse.visualTheme,
            tone: plannerResponse.toneAndManner,
          },
        },
        createdAt: new Date(),
      };

      return {
        messages: [assistantMessage],
        collectedData: {
          plannedSections: plannerResponse.sections,
          visualTheme: plannerResponse.visualTheme,
          toneAndManner: plannerResponse.toneAndManner,
          colorPalette: plannerResponse.colorPalette,
        },
        currentAgent: 'PLANNER',
        nextAction: { type: 'await_input' },
      };
    }
  } catch (error) {
    console.error('[Planner] Error:', error);
  }

  // 기본 기획 (에러 시 폴백)
  const defaultSections: PlannedSection[] = [
    { type: 'HERO', name: '메인 비주얼', description: '제품 대표 이미지와 핵심 카피' },
    { type: 'KEY_MESSAGE', name: '핵심 메시지', description: '제품의 핵심 가치 전달' },
    { type: 'FEATURES', name: '제품 특징', description: '주요 특징 및 장점 설명' },
    { type: 'HOW_TO_USE', name: '사용 방법', description: '제품 사용법 안내' },
    { type: 'SOCIAL_PROOF', name: '고객 후기', description: '리뷰 및 평점' },
  ];

  const fallbackMessage: ChatMessage = {
    id: generateMessageId(),
    role: 'assistant',
    content: `기본 구성으로 상세페이지를 준비했어요.\n\n` +
      defaultSections.map((s, idx) => `${idx + 1}. ${s.name}`).join('\n') +
      `\n\n이대로 생성할까요?`,
    agentType: 'PLANNER',
    metadata: {
      uiType: 'options',
      askingField: 'planAction',
      options: [
        { id: 'generate', label: '이대로 생성하기', value: 'generate', description: '상세페이지 생성 시작' },
        { id: 'modify_sections', label: '섹션 수정', value: 'modify_sections', description: '섹션 구성 변경' },
        { id: 'modify_style', label: '스타일 변경', value: 'modify_style', description: '테마/톤 변경' },
      ],
      planPreview: {
        sections: defaultSections,
        theme: '기본',
        tone: '친근하고 전문적인',
      },
    },
    createdAt: new Date(),
  };

  return {
    messages: [fallbackMessage],
    collectedData: {
      plannedSections: defaultSections,
    },
    currentAgent: 'PLANNER',
    nextAction: { type: 'await_input' },
  };
}

// 섹션 수정 요청 처리
async function handleSectionModification(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { collectedData } = state;
  const existingSections = Array.isArray(collectedData.plannedSections)
    ? collectedData.plannedSections
    : [];
  const modificationRequest = collectedData.sectionModificationRequest || '';

  console.log('[Planner] Handling section modification request:', modificationRequest);
  console.log('[Planner] Existing sections:', existingSections.map(s => s.type).join(', '));

  const contextPrompt = `
## 기존 섹션 구성:
${existingSections.map((s, idx) => `${idx + 1}. ${s.type} (${s.name}): ${s.description}`).join('\n')}

## 사용자의 수정 요청:
${modificationRequest}

## 제품 정보:
- 제품명: ${collectedData.productName || '미정'}
- 카테고리: ${collectedData.category || '미정'}

위 수정 요청을 반영하여 섹션 구성을 수정해주세요.
특히 "텍스트만", "후킹 메시지", "문구만" 등의 요청이 있으면 TEXT_ONLY 또는 HOOK_MESSAGE 타입 섹션을 적절한 위치에 추가하세요.
`;

  try {
    const response = await getModel().invoke([
      { role: 'system', content: SECTION_MODIFICATION_PROMPT },
      { role: 'user', content: contextPrompt },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    console.log('[Planner] LLM response:', responseText.slice(0, 500));

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const modifiedSections: PlannedSection[] = parsed.modifiedSections || [];
      const explanation = parsed.explanation || '섹션이 수정되었습니다.';

      if (modifiedSections.length === 0) {
        throw new Error('수정된 섹션이 비어있습니다');
      }

      const sectionsPreview = modifiedSections
        .map((s, idx) => `${idx + 1}. **${s.name}** - ${s.description}`)
        .join('\n');

      const planMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `섹션 구성을 수정했어요! ✏️\n\n` +
          `**수정 내용:** ${explanation}\n\n` +
          `## 📋 수정된 섹션 구성\n${sectionsPreview}\n\n` +
          `이대로 진행할까요?`,
        agentType: 'PLANNER',
        metadata: {
          uiType: 'confirmation',
          planPreview: {
            sections: modifiedSections,
            theme: collectedData.visualTheme || '기본',
            tone: collectedData.toneAndManner || '친근하고 전문적인',
          },
          options: [
            { id: 'generate', label: '✨ 이대로 생성하기', value: 'generate', description: '상세페이지 생성 시작' },
            { id: 'modify_sections', label: '📝 추가 수정', value: 'modify_sections', description: '섹션 더 수정하기' },
            { id: 'modify_style', label: '🎨 스타일 변경', value: 'modify_style', description: '스타일/톤 변경' },
          ],
          askingField: 'planAction',
        },
        createdAt: new Date(),
      };

      return {
        messages: [planMessage],
        collectedData: {
          plannedSections: modifiedSections,
          sectionModificationRequest: undefined, // 수정 요청 처리 완료
        },
        currentAgent: 'PLANNER',
        nextAction: { type: 'await_input' },
      };
    }
  } catch (error) {
    console.error('[Planner] Section modification error:', error);
  }

  // 에러 시 폴백 - 수동으로 TEXT_ONLY 섹션 추가
  const fallbackSections = [...existingSections];

  // 후킹 메시지 요청인지 확인
  const isHookRequest = /후킹|텍스트만|문구만|메시지만/.test(modificationRequest);
  if (isHookRequest) {
    const heroIndex = fallbackSections.findIndex(s => s.type === 'HERO');
    const insertIndex = heroIndex >= 0 ? heroIndex + 1 : 1;
    fallbackSections.splice(insertIndex, 0, {
      type: 'HOOK_MESSAGE',
      name: '후킹 메시지',
      description: '주목도를 높이는 임팩트 문구',
    });
  }

  const sectionsPreview = fallbackSections
    .map((s, idx) => `${idx + 1}. **${s.name}** - ${s.description}`)
    .join('\n');

  const fallbackMessage: ChatMessage = {
    id: generateMessageId(),
    role: 'assistant',
    content: `요청하신 대로 섹션을 수정했어요!\n\n` +
      `## 📋 수정된 섹션 구성\n${sectionsPreview}\n\n` +
      `이대로 진행할까요?`,
    agentType: 'PLANNER',
    metadata: {
      uiType: 'confirmation',
      planPreview: {
        sections: fallbackSections,
        theme: collectedData.visualTheme || '기본',
        tone: collectedData.toneAndManner || '친근하고 전문적인',
      },
      options: [
        { id: 'generate', label: '✨ 이대로 생성하기', value: 'generate' },
        { id: 'modify_sections', label: '📝 추가 수정', value: 'modify_sections' },
      ],
      askingField: 'planAction',
    },
    createdAt: new Date(),
  };

  return {
    messages: [fallbackMessage],
    collectedData: {
      plannedSections: fallbackSections,
      sectionModificationRequest: undefined,
    },
    currentAgent: 'PLANNER',
    nextAction: { type: 'await_input' },
  };
}
