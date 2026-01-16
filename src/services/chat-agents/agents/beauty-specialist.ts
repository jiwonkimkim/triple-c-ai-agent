/**
 * Beauty Specialist Agent
 * 뷰티 서브카테고리별 전문 조언 및 정보 수집
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  ProjectCollectedData,
  BeautySubCategory,
  BEAUTY_SPECIALIST_DATA,
  getMissingFields,
  generateMessageId,
  validateGoogleAIApiKey,
} from '../types';

// Lazy initialization
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    const apiKey = validateGoogleAIApiKey();
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.3,
      apiKey,
    });
  }
  return _model;
}

// 서브카테고리별 전문 프롬프트 생성
function getSpecialistPrompt(subCategory: BeautySubCategory): string {
  const data = BEAUTY_SPECIALIST_DATA[subCategory];

  return `당신은 ${data.name} 전문 마케팅 컨설턴트입니다.

## 당신의 전문 분야: ${data.name} ${data.emoji}

## 현재 트렌드:
${data.trends.map(t => `- ${t}`).join('\n')}

## 상세페이지에서 강조할 핵심 포인트:
${data.keyPoints.map(p => `- ${p}`).join('\n')}

## 카피 작성 팁:
${data.tipsForCopy.map(t => `- ${t}`).join('\n')}

## 추천 섹션 구성:
${data.recommendedSections.join(' → ')}

## 대화 규칙:
1. 사용자의 제품 정보를 친근하게 물어보세요
2. 이미 알려준 정보는 다시 묻지 마세요
3. 전문적인 조언을 자연스럽게 녹여서 전달하세요
4. 핵심 포인트 중 아직 모르는 정보를 우선 수집하세요
5. 정보가 충분하면 요약 후 기획 단계로 넘어갈 준비를 하세요

## 응답 형식 (JSON):
{
  "message": "사용자에게 보낼 친근한 메시지",
  "collectedInfo": {
    "productName": "추출된 제품명 또는 null",
    "productType": "제품 유형 또는 null",
    "keyFeatures": ["추출된 특징들"] 또는 null,
    "targetAudience": "타겟 고객 또는 null"
  },
  "nextQuestion": "다음으로 물어볼 내용",
  "readyForPlanning": true/false
}`;
}

interface SpecialistResponse {
  message: string;
  collectedInfo: {
    productName?: string;
    productType?: string;
    keyFeatures?: string[];
    targetAudience?: string;
  };
  nextQuestion?: string;
  readyForPlanning: boolean;
}

export async function beautySpecialistAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { messages, collectedData } = state;

  // 서브카테고리 확인
  const subCategory = collectedData.subCategory;
  if (!subCategory || !BEAUTY_SPECIALIST_DATA[subCategory]) {
    // 서브카테고리가 없으면 Suggester로
    return {
      currentAgent: 'SUGGESTER',
      nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
    };
  }

  const specialistData = BEAUTY_SPECIALIST_DATA[subCategory];

  // 마지막 사용자 메시지
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  if (!lastUserMessage) {
    // 첫 진입 시 환영 메시지
    const welcomeMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `${specialistData.emoji} ${specialistData.name} 전문가로서 도와드릴게요!\n\n` +
        `좋은 상세페이지를 만들려면 이런 정보가 필요해요:\n` +
        specialistData.keyPoints.map(p => `• ${p}`).join('\n') +
        `\n\n먼저, 제품명이나 브랜드명을 알려주시겠어요?`,
      agentType: 'INTAKE',
      metadata: { uiType: 'text' },
      createdAt: new Date(),
    };

    return {
      messages: [welcomeMessage],
      currentAgent: 'INTAKE',
      nextAction: { type: 'await_input' },
    };
  }

  // 대화 컨텍스트 구성
  const conversationHistory = messages.slice(-6).map(m =>
    `[${m.role}]: ${m.content}`
  ).join('\n');

  const contextPrompt = `
현재 수집된 정보:
${JSON.stringify(collectedData, null, 2)}

대화 히스토리:
${conversationHistory}

마지막 사용자 메시지: "${lastUserMessage.content}"

위 메시지에서 정보를 추출하고, 부족한 정보를 자연스럽게 물어보세요.
`;

  try {
    const response = await getModel().invoke([
      { role: 'system', content: getSpecialistPrompt(subCategory) },
      { role: 'user', content: contextPrompt },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const specialistResponse: SpecialistResponse = JSON.parse(jsonMatch[0]);

      // 수집된 정보 업데이트
      const newCollectedData: Partial<ProjectCollectedData> = {};

      if (specialistResponse.collectedInfo.productName) {
        newCollectedData.productName = specialistResponse.collectedInfo.productName;
      }
      if (specialistResponse.collectedInfo.keyFeatures &&
          Array.isArray(specialistResponse.collectedInfo.keyFeatures)) {
        newCollectedData.keyFeatures = [
          ...(collectedData.keyFeatures || []),
          ...specialistResponse.collectedInfo.keyFeatures,
        ].filter((v, i, a) => a.indexOf(v) === i); // 중복 제거
      }
      if (specialistResponse.collectedInfo.targetAudience) {
        newCollectedData.targetAudience = specialistResponse.collectedInfo.targetAudience;
      }

      // 응답 메시지 생성
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: specialistResponse.message,
        agentType: 'INTAKE',
        metadata: {
          uiType: 'text',
          collectedFields: Object.keys(newCollectedData),
          specialist: subCategory,
        },
        createdAt: new Date(),
      };

      // 기획 단계로 넘어갈 준비가 되었는지 확인
      if (specialistResponse.readyForPlanning) {
        // 카피 길이가 없으면 먼저 물어보기
        if (!collectedData.copyLength) {
          return {
            messages: [assistantMessage],
            collectedData: newCollectedData,
            currentAgent: 'SUGGESTER',
            nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
          };
        }

        // 기획 단계로
        return {
          messages: [assistantMessage],
          collectedData: newCollectedData,
          currentAgent: 'PLANNER',
          nextAction: { type: 'continue', targetAgent: 'PLANNER' as AgentType },
        };
      }

      // 추가 정보 수집 필요
      return {
        messages: [assistantMessage],
        collectedData: newCollectedData,
        currentAgent: 'INTAKE',
        nextAction: { type: 'await_input' },
      };
    }
  } catch (error) {
    console.error('[BeautySpecialist] Error:', error);
  }

  // 에러 시 기본 응답
  const fallbackMessage: ChatMessage = {
    id: generateMessageId(),
    role: 'assistant',
    content: `${specialistData.emoji} 제품에 대해 더 알려주시겠어요?\n\n` +
      `특히 ${specialistData.keyPoints[0]}에 대해 알고 싶어요.`,
    agentType: 'INTAKE',
    metadata: { uiType: 'text' },
    createdAt: new Date(),
  };

  return {
    messages: [fallbackMessage],
    currentAgent: 'INTAKE',
    nextAction: { type: 'await_input' },
  };
}

// 서브카테고리별 추천 섹션 가져오기
export function getRecommendedSections(subCategory: BeautySubCategory): string[] {
  return BEAUTY_SPECIALIST_DATA[subCategory]?.recommendedSections || [
    'HERO', 'KEY_MESSAGE', 'FEATURES', 'HOW_TO_USE', 'SOCIAL_PROOF'
  ];
}

// 서브카테고리별 카피 팁 가져오기
export function getCopyTips(subCategory: BeautySubCategory): string[] {
  return BEAUTY_SPECIALIST_DATA[subCategory]?.tipsForCopy || [];
}
