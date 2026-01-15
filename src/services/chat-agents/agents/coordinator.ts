/**
 * Coordinator Agent
 * 대화 흐름 관리 및 다음 Agent 라우팅 결정
 */

import { ChatAnthropic } from '@langchain/anthropic';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  NextAction,
  getMissingFields,
  isDataComplete,
} from '../types';

const model = new ChatAnthropic({
  modelName: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
});

const COORDINATOR_SYSTEM_PROMPT = `당신은 마케팅 콘텐츠 생성 서비스의 대화 조율자입니다.
사용자와의 대화를 분석하여 다음에 어떤 Agent가 처리해야 하는지 결정합니다.

## 사용 가능한 Agent:
- INTAKE: 제품명, 카테고리, 특징 등 기본 정보 수집
- CLARIFIER: 애매한 답변에 대해 명확화 질문
- SUGGESTER: 선택지나 추천 옵션 제시
- PLANNER: 수집된 정보로 콘텐츠 구조 기획
- BRAND_CONTEXT: 브랜드 프로필 정보 로드
- GENERATOR: 실제 상세페이지 생성 실행
- FEEDBACK: 생성 결과에 대한 수정 요청 처리

## 라우팅 규칙:
1. 대화 시작 또는 정보 부족 → INTAKE 또는 SUGGESTER
2. 애매한 답변 → CLARIFIER
3. 선택지 필요 → SUGGESTER
4. 필수 정보 완료 → PLANNER
5. 기획 확인 완료 + 브랜드 있음 → BRAND_CONTEXT
6. 생성 요청 → GENERATOR
7. 수정 요청 → FEEDBACK

## 필수 수집 정보:
- productName (제품명)
- category (카테고리)
- keyFeatures (주요 특징, 최소 1개)
- copyLength (카피 길이)

## 응답 형식:
다음 Agent와 간단한 이유를 JSON으로 응답하세요:
{"nextAgent": "AGENT_TYPE", "reason": "이유"}`;

interface CoordinatorDecision {
  nextAgent: AgentType;
  reason: string;
}

export async function coordinatorAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { messages, collectedData, conversationId } = state;

  // 메시지가 없으면 환영 메시지로 시작
  if (messages.length === 0) {
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: '안녕하세요! 어떤 콘텐츠를 만들고 싶으신가요? 제품 상세페이지, 마케팅 배너 등 원하시는 내용을 말씀해 주세요.',
      agentType: 'COORDINATOR',
      metadata: {
        uiType: 'text',
      },
      createdAt: new Date(),
    };

    return {
      messages: [welcomeMessage],
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'await_input' },
    };
  }

  // 최근 메시지 분석
  const lastMessage = messages[messages.length - 1];
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  if (!lastUserMessage) {
    return {
      nextAction: { type: 'await_input' },
    };
  }

  // 데이터 완성도 체크
  const missingFields = getMissingFields(collectedData);
  const dataComplete = isDataComplete(collectedData);

  // 빠른 라우팅 (LLM 호출 없이)
  // 1. 생성 요청 감지
  const generateKeywords = ['생성', '만들어', '시작', '좋아', 'ok', '네', '확인', '진행'];
  const lastContent = lastUserMessage.content.toLowerCase();

  if (dataComplete && generateKeywords.some(k => lastContent.includes(k))) {
    // 기획 확인이 되었다면 생성으로
    if (collectedData.plannedSections && collectedData.plannedSections.length > 0) {
      return {
        currentAgent: 'GENERATOR',
        nextAction: { type: 'generate' },
      };
    }
    // 기획이 없으면 Planner로
    return {
      currentAgent: 'PLANNER',
      nextAction: { type: 'continue', targetAgent: 'PLANNER' },
    };
  }

  // 2. 수정 요청 감지
  const modifyKeywords = ['수정', '바꿔', '변경', '다시', '다른'];
  if (modifyKeywords.some(k => lastContent.includes(k))) {
    return {
      currentAgent: 'FEEDBACK',
      nextAction: { type: 'continue', targetAgent: 'FEEDBACK' },
    };
  }

  // 3. 데이터 완성도에 따른 라우팅
  if (dataComplete) {
    // 브랜드 프로필이 선택되었고 컨텍스트가 없으면
    if (collectedData.brandProfileId && !state.brandContext) {
      return {
        currentAgent: 'BRAND_CONTEXT',
        nextAction: { type: 'continue', targetAgent: 'BRAND_CONTEXT' },
      };
    }
    // 기획이 없으면 Planner로
    if (!collectedData.plannedSections) {
      return {
        currentAgent: 'PLANNER',
        nextAction: { type: 'continue', targetAgent: 'PLANNER' },
      };
    }
  }

  // 4. 정보 부족 시 - Suggester 또는 Intake
  if (missingFields.length > 0) {
    // 카테고리가 없으면 Suggester (선택지 제시)
    if (!collectedData.category) {
      return {
        currentAgent: 'SUGGESTER',
        nextAction: { type: 'continue', targetAgent: 'SUGGESTER' },
      };
    }
    // 나머지는 Intake
    return {
      currentAgent: 'INTAKE',
      nextAction: { type: 'continue', targetAgent: 'INTAKE' },
    };
  }

  // 5. LLM을 사용한 복잡한 라우팅 결정
  try {
    const contextSummary = `
현재 수집된 정보:
- 제품명: ${collectedData.productName || '없음'}
- 카테고리: ${collectedData.category || '없음'}
- 서브카테고리: ${collectedData.subCategory || '없음'}
- 주요 특징: ${collectedData.keyFeatures?.join(', ') || '없음'}
- 타겟: ${collectedData.targetAudience || '없음'}
- 카피 길이: ${collectedData.copyLength || '없음'}
- 브랜드 프로필: ${collectedData.brandProfileId ? '선택됨' : '없음'}
- 기획 완료: ${collectedData.plannedSections ? '완료' : '미완료'}

부족한 필드: ${missingFields.join(', ') || '없음'}
데이터 완성: ${dataComplete ? '예' : '아니오'}

마지막 사용자 메시지: "${lastUserMessage.content}"
`;

    const response = await model.invoke([
      { role: 'system', content: COORDINATOR_SYSTEM_PROMPT },
      { role: 'user', content: contextSummary },
    ]);

    const responseText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    // JSON 파싱
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const decision: CoordinatorDecision = JSON.parse(jsonMatch[0]);

      return {
        currentAgent: decision.nextAgent,
        nextAction: { type: 'continue', targetAgent: decision.nextAgent },
      };
    }
  } catch (error) {
    console.error('[Coordinator] LLM routing error:', error);
  }

  // 기본값: Intake로 라우팅
  return {
    currentAgent: 'INTAKE',
    nextAction: { type: 'continue', targetAgent: 'INTAKE' },
  };
}
