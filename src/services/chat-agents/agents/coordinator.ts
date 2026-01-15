/**
 * Coordinator Agent
 * 대화 흐름 관리 및 다음 Agent 라우팅 결정
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  NextAction,
  getMissingFields,
  isDataComplete,
} from '../types';
import { parseIntent, getRecommendedAgent } from './intent-parser';

// Lazy initialization to avoid build-time API key requirement
let _model: ChatGoogleGenerativeAI | null = null;
function getModel() {
  if (!_model) {
    _model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.3,
    });
  }
  return _model;
}

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

  // Intent Parser를 사용한 의도 분석
  const conversationContext = messages.slice(-5).map(m => `[${m.role}]: ${m.content}`);
  const parsedIntent = await parseIntent(
    lastUserMessage.content,
    collectedData,
    conversationContext
  );

  console.log('[Coordinator] Parsed intent:', parsedIntent);

  // 의도에 따른 라우팅
  switch (parsedIntent.intent) {
    case 'CONFIRM':
      // 확인/승인: 데이터 완성도에 따라 분기
      if (dataComplete && collectedData.plannedSections && collectedData.plannedSections.length > 0) {
        return {
          currentAgent: 'GENERATOR',
          nextAction: { type: 'generate' },
        };
      }
      if (dataComplete) {
        return {
          currentAgent: 'PLANNER',
          nextAction: { type: 'continue', targetAgent: 'PLANNER' },
        };
      }
      // 데이터 부족 시 다음 정보 수집
      break;

    case 'MODIFY':
      return {
        currentAgent: 'FEEDBACK',
        nextAction: { type: 'continue', targetAgent: 'FEEDBACK' },
      };

    case 'CANCEL':
      // 취소 시 초기 상태로 (환영 메시지)
      const cancelMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '알겠습니다. 처음부터 다시 시작할게요. 어떤 제품의 상세페이지를 만들어 드릴까요?',
        agentType: 'COORDINATOR',
        metadata: { uiType: 'text' },
        createdAt: new Date(),
      };
      return {
        messages: [cancelMessage],
        collectedData: {}, // 데이터 초기화
        currentAgent: 'COORDINATOR',
        nextAction: { type: 'await_input' },
      };

    case 'QUESTION':
      return {
        currentAgent: 'CLARIFIER',
        nextAction: { type: 'continue', targetAgent: 'CLARIFIER' },
      };

    case 'GREETING':
      const greetingMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '안녕하세요! 무엇을 도와드릴까요? 상세페이지를 만들고 싶으시다면 제품 정보를 알려주세요.',
        agentType: 'COORDINATOR',
        metadata: { uiType: 'text' },
        createdAt: new Date(),
      };
      return {
        messages: [greetingMessage],
        currentAgent: 'COORDINATOR',
        nextAction: { type: 'await_input' },
      };

    case 'CREATE':
    case 'PROVIDE_INFO':
    case 'SELECT_OPTION':
      // 정보 제공/생성 요청: 추출된 정보가 있으면 활용
      if (parsedIntent.extractedInfo) {
        // 추출된 카테고리 정보를 collectedData에 힌트로 저장
        console.log('[Coordinator] Extracted info:', parsedIntent.extractedInfo);
      }
      break;

    case 'UNCLEAR':
    default:
      // 불분명한 경우 Clarifier로
      if (parsedIntent.confidence < 0.6) {
        return {
          currentAgent: 'CLARIFIER',
          nextAction: { type: 'continue', targetAgent: 'CLARIFIER' },
        };
      }
      break;
  }

  // 데이터 완성도에 따른 추가 라우팅
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

  // 정보 부족 시 - Suggester 또는 Intake
  if (missingFields.length > 0) {
    // 카테고리가 없으면 Suggester (선택지 제시)
    if (!collectedData.category) {
      return {
        currentAgent: 'SUGGESTER',
        nextAction: { type: 'continue', targetAgent: 'SUGGESTER' },
      };
    }
    // 뷰티 카테고리인데 서브카테고리가 없으면 Suggester
    if (collectedData.category === 'BEAUTY' && !collectedData.subCategory) {
      return {
        currentAgent: 'SUGGESTER',
        nextAction: { type: 'continue', targetAgent: 'SUGGESTER' },
      };
    }
    // 카피 길이가 없으면 Suggester
    if (!collectedData.copyLength) {
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

  // Intent Parser의 추천 Agent 사용
  const recommendedAgent = getRecommendedAgent(parsedIntent, collectedData) as AgentType;

  return {
    currentAgent: recommendedAgent,
    nextAction: { type: 'continue', targetAgent: recommendedAgent },
  };
}
