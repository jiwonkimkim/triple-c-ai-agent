/**
 * Feedback Agent
 * 수정 요청 및 피드백 처리
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import { ChatMessage, ProjectCollectedData, generateMessageId, validateGoogleAIApiKey } from '../types';

// Lazy initialization to avoid build-time API key requirement
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

const FEEDBACK_SYSTEM_PROMPT = `당신은 수정 요청을 분석하는 전문가입니다.
사용자의 피드백을 분석하여 어떤 정보를 수정해야 하는지 파악합니다.

## 수정 가능한 필드:
- productName: 제품명
- category: 카테고리
- subCategory: 서브카테고리
- keyFeatures: 주요 특징
- targetAudience: 타겟 고객
- copyLength: 카피 길이
- plannedSections: 섹션 구성
- visualTheme: 비주얼 테마
- toneAndManner: 톤앤매너

## 응답 형식:
{
  "modificationType": "field_update" | "section_change" | "regenerate" | "unclear",
  "fieldsToModify": ["수정할 필드명들"],
  "newValues": { "필드명": "새 값" },
  "clarificationNeeded": true/false,
  "responseMessage": "사용자에게 보낼 메시지"
}`;

interface FeedbackResponse {
  modificationType: 'field_update' | 'section_change' | 'regenerate' | 'unclear';
  fieldsToModify: string[];
  newValues: Partial<ProjectCollectedData>;
  clarificationNeeded: boolean;
  responseMessage: string;
}

export async function feedbackAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { messages, collectedData, generationResult } = state;

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  if (!lastUserMessage) {
    return {
      nextAction: { type: 'await_input' },
    };
  }

  // 수정 요청 분석
  const contextPrompt = `
현재 수집된 정보:
${JSON.stringify(collectedData, null, 2)}

생성 결과: ${generationResult ? '생성됨' : '생성 전'}

사용자의 수정 요청: "${lastUserMessage.content}"

이 요청을 분석하고 적절한 수정 방안을 제시하세요.
`;

  try {
    const response = await getModel().invoke([
      { role: 'system', content: FEEDBACK_SYSTEM_PROMPT },
      { role: 'user', content: contextPrompt },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const feedbackResponse: FeedbackResponse = JSON.parse(jsonMatch[0]);

      // 명확화가 필요한 경우
      if (feedbackResponse.clarificationNeeded || feedbackResponse.modificationType === 'unclear') {
        const clarifyMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: feedbackResponse.responseMessage,
          agentType: 'FEEDBACK',
          metadata: { uiType: 'text' },
          createdAt: new Date(),
        };

        return {
          messages: [clarifyMessage],
          currentAgent: 'FEEDBACK',
          nextAction: { type: 'await_input' },
        };
      }

      // 필드 업데이트
      if (feedbackResponse.modificationType === 'field_update') {
        const updateMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: feedbackResponse.responseMessage,
          agentType: 'FEEDBACK',
          metadata: {
            uiType: 'text',
            collectedFields: feedbackResponse.fieldsToModify,
          },
          createdAt: new Date(),
        };

        // 업데이트된 데이터로 다시 기획
        return {
          messages: [updateMessage],
          collectedData: feedbackResponse.newValues,
          currentAgent: 'FEEDBACK',
          nextAction: { type: 'continue', targetAgent: 'PLANNER' as AgentType },
        };
      }

      // 섹션 변경
      if (feedbackResponse.modificationType === 'section_change') {
        const sectionMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: feedbackResponse.responseMessage,
          agentType: 'FEEDBACK',
          metadata: { uiType: 'text' },
          createdAt: new Date(),
        };

        // 기획 초기화하고 다시 진행
        return {
          messages: [sectionMessage],
          collectedData: {
            ...feedbackResponse.newValues,
            plannedSections: undefined,
          },
          currentAgent: 'FEEDBACK',
          nextAction: { type: 'continue', targetAgent: 'PLANNER' as AgentType },
        };
      }

      // 재생성 요청
      if (feedbackResponse.modificationType === 'regenerate') {
        const regenerateMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: feedbackResponse.responseMessage,
          agentType: 'FEEDBACK',
          metadata: { uiType: 'text' },
          createdAt: new Date(),
        };

        return {
          messages: [regenerateMessage],
          collectedData: feedbackResponse.newValues,
          currentAgent: 'FEEDBACK',
          nextAction: { type: 'generate' },
        };
      }
    }
  } catch (error) {
    console.error('[Feedback] Error:', error);
  }

  // 기본 응답
  const fallbackMessage: ChatMessage = {
    id: generateMessageId(),
    role: 'assistant',
    content: '어떤 부분을 수정하고 싶으신가요? 구체적으로 말씀해 주시면 도움이 될 것 같아요.',
    agentType: 'FEEDBACK',
    metadata: {
      uiType: 'options',
      options: [
        { id: 'product_info', label: '제품 정보 수정', value: 'product_info' },
        { id: 'sections', label: '섹션 구성 변경', value: 'sections' },
        { id: 'style', label: '스타일/톤 변경', value: 'style' },
        { id: 'regenerate', label: '전체 다시 생성', value: 'regenerate' },
      ],
    },
    createdAt: new Date(),
  };

  return {
    messages: [fallbackMessage],
    currentAgent: 'FEEDBACK',
    nextAction: { type: 'await_input' },
  };
}
