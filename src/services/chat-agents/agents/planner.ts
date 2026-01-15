/**
 * Planner Agent
 * 수집된 정보를 바탕으로 콘텐츠 구조 기획
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import { ChatMessage, PlannedSection } from '../types';

// Lazy initialization to avoid build-time API key requirement
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.4,
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }
  return _model;
}

const PLANNER_SYSTEM_PROMPT = `당신은 마케팅 콘텐츠 기획 전문가입니다.
수집된 제품 정보를 바탕으로 효과적인 상세페이지 구조를 기획합니다.

## 사용 가능한 섹션 타입:
- HERO: 메인 비주얼, 제품 대표 이미지
- KEY_MESSAGE: 핵심 메시지, 슬로건
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

interface PlannerResponse {
  sections: PlannedSection[];
  visualTheme: string;
  toneAndManner: string;
  colorPalette: string[];
}

export async function plannerAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { collectedData, brandContext } = state;

  // 기획에 필요한 정보 조합
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
        id: `msg_${Date.now()}`,
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
          uiType: 'confirmation',
          planPreview: {
            sections: plannerResponse.sections,
            theme: plannerResponse.visualTheme,
            tone: plannerResponse.toneAndManner,
          },
          options: [
            { id: 'generate', label: '생성 시작', value: 'generate', description: '상세페이지 생성' },
            { id: 'modify', label: '구성 수정', value: 'modify', description: '섹션 구성 변경' },
          ],
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
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: `기본 구성으로 상세페이지를 준비했어요.\n\n` +
      defaultSections.map((s, idx) => `${idx + 1}. ${s.name}`).join('\n') +
      `\n\n이대로 생성할까요?`,
    agentType: 'PLANNER',
    metadata: {
      uiType: 'confirmation',
      planPreview: {
        sections: defaultSections,
        theme: '기본',
        tone: '친근하고 전문적인',
      },
      options: [
        { id: 'generate', label: '생성 시작', value: 'generate' },
        { id: 'modify', label: '구성 수정', value: 'modify' },
      ],
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
