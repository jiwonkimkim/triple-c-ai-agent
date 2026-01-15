/**
 * Clarifier Agent
 * 애매한 답변에 대한 명확화 질문
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import { ChatMessage } from '../types';

// Lazy initialization to avoid build-time API key requirement
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.3,
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }
  return _model;
}

const CLARIFIER_SYSTEM_PROMPT = `당신은 친근하고 도움이 되는 명확화 전문가입니다.
사용자의 애매한 답변을 명확하게 이해하기 위해 추가 질문을 합니다.

## 규칙:
1. 친근하고 부담 없는 톤으로 질문하세요
2. 예시를 들어 이해를 돕세요
3. 선택지가 있다면 구체적으로 제시하세요
4. 한 번에 하나의 질문만 하세요

## 응답 형식:
{
  "clarificationNeeded": true/false,
  "question": "명확화 질문",
  "examples": ["예시1", "예시2"],
  "suggestedOptions": ["옵션1", "옵션2"] // 선택지가 있는 경우
}`;

interface ClarifierResponse {
  clarificationNeeded: boolean;
  question: string;
  examples?: string[];
  suggestedOptions?: string[];
}

export async function clarifierAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { messages, collectedData } = state;

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  if (!lastUserMessage) {
    return {
      nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
    };
  }

  // 명확화가 필요한 상황 분석
  const contextPrompt = `
현재 수집된 정보:
${JSON.stringify(collectedData, null, 2)}

대화 히스토리 (최근 3개):
${messages.slice(-3).map(m => `[${m.role}]: ${m.content}`).join('\n')}

마지막 사용자 메시지: "${lastUserMessage.content}"

이 메시지가 애매하거나 추가 명확화가 필요한지 분석하고, 필요하다면 적절한 질문을 생성하세요.
`;

  try {
    const response = await getModel().invoke([
      { role: 'system', content: CLARIFIER_SYSTEM_PROMPT },
      { role: 'user', content: contextPrompt },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const clarifierResponse: ClarifierResponse = JSON.parse(jsonMatch[0]);

      if (!clarifierResponse.clarificationNeeded) {
        // 명확화 불필요 → Intake로 돌아가기
        return {
          currentAgent: 'CLARIFIER',
          nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
        };
      }

      // 명확화 질문 생성
      let messageContent = clarifierResponse.question;

      if (clarifierResponse.examples && clarifierResponse.examples.length > 0) {
        messageContent += `\n\n예시: ${clarifierResponse.examples.join(', ')}`;
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: messageContent,
        agentType: 'CLARIFIER',
        metadata: {
          uiType: clarifierResponse.suggestedOptions ? 'options' : 'text',
          options: clarifierResponse.suggestedOptions?.map((opt, idx) => ({
            id: `opt_${idx}`,
            label: opt,
            value: opt,
          })),
        },
        createdAt: new Date(),
      };

      return {
        messages: [assistantMessage],
        currentAgent: 'CLARIFIER',
        nextAction: { type: 'await_input' },
      };
    }
  } catch (error) {
    console.error('[Clarifier] Error:', error);
  }

  // 에러 시 Intake로 폴백
  return {
    nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
  };
}
