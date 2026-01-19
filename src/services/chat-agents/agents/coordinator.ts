/**
 * Coordinator Agent (v2)
 * 대화 흐름 관리 및 다음 Agent 라우팅 결정
 * 뷰티 특화 Consultative 아키텍처
 */

import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  getMissingFields,
  isDataComplete,
  detectBeautySubCategory,
  isBeautyKeyword,
  BEAUTY_SPECIALIST_DATA,
  generateMessageId,
} from '../types';
import { parseIntent } from './intent-parser';
import { detectProduct } from './product-detector';
import { isDiscoveryRequest } from './discovery';

// 환영 메시지 생성
function createWelcomeMessage(): ChatMessage {
  return {
    id: generateMessageId(),
    role: 'assistant',
    content: `안녕하세요! 상세페이지 제작 도우미예요 ✨

저는 뷰티 제품 상세페이지 제작을 전문으로 도와드려요.

💄 **제품이 있으시면** 제품명이나 종류를 알려주세요
   예: "립틴트 상세페이지 만들어줘", "비타민C 세럼이야"

💡 **아이디어가 필요하시면** 편하게 말씀해주세요
   예: "요즘 뭐가 인기야?", "추천해줘"

어떤 제품의 상세페이지를 만들어 드릴까요?`,
    agentType: 'COORDINATOR',
    metadata: { uiType: 'text' },
    createdAt: new Date(),
  };
}

export async function coordinatorAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { messages, collectedData, conversationId } = state;

  // 1. 메시지가 없으면 환영 메시지
  if (messages.length === 0) {
    return {
      messages: [createWelcomeMessage()],
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'await_input' },
    };
  }

  // 2. 생성 플래그 확인 - 바로 Generator로 라우팅
  if (collectedData.readyToGenerate) {
    console.log('[Coordinator] readyToGenerate flag detected, routing to GENERATOR');
    return {
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'generate' },
      // readyToGenerate 플래그 제거 (일회성)
      collectedData: { ...collectedData, readyToGenerate: undefined },
    };
  }

  // 3. 수정 요청 확인
  if (collectedData.modifyRequest) {
    const modifyType = collectedData.modifyRequest;
    console.log('[Coordinator] modifyRequest detected:', modifyType);

    // 플래그 제거
    const cleanedData = { ...collectedData, modifyRequest: undefined };

    if (modifyType === 'sections') {
      return {
        currentAgent: 'COORDINATOR',
        nextAction: { type: 'continue', targetAgent: 'FEEDBACK' as AgentType },
        collectedData: cleanedData,
      };
    } else if (modifyType === 'style') {
      return {
        currentAgent: 'COORDINATOR',
        nextAction: { type: 'continue', targetAgent: 'FEEDBACK' as AgentType },
        collectedData: cleanedData,
      };
    }
  }

  // 4. 마지막 사용자 메시지 찾기
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  if (!lastUserMessage) {
    return {
      nextAction: { type: 'await_input' },
    };
  }

  const userContent = lastUserMessage.content;

  // 5. Intent 분석
  const conversationContext = messages.slice(-5).map(m => `[${m.role}]: ${m.content}`);
  const parsedIntent = await parseIntent(userContent, collectedData, conversationContext);

  console.log('[Coordinator] Intent:', parsedIntent.intent, 'Confidence:', parsedIntent.confidence);

  // 6. Intent별 라우팅
  switch (parsedIntent.intent) {
    // === Discovery 모드 ===
    case 'QUESTION':
      if (isDiscoveryRequest(userContent)) {
        return {
          currentAgent: 'COORDINATOR',
          nextAction: { type: 'discovery' as any }, // Discovery Agent로 라우팅
        };
      }
      // 일반 질문은 Clarifier로
      return {
        currentAgent: 'CLARIFIER',
        nextAction: { type: 'continue', targetAgent: 'CLARIFIER' as AgentType },
      };

    case 'GREETING':
      if (isDiscoveryRequest(userContent)) {
        return {
          currentAgent: 'COORDINATOR',
          nextAction: { type: 'discovery' as any },
        };
      }
      const greetingMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '안녕하세요! 😊 어떤 제품의 상세페이지를 만들어 드릴까요?',
        agentType: 'COORDINATOR',
        metadata: { uiType: 'text' },
        createdAt: new Date(),
      };
      return {
        messages: [greetingMessage],
        currentAgent: 'COORDINATOR',
        nextAction: { type: 'await_input' },
      };

    // === 확인/승인 ===
    case 'CONFIRM':
      // 기획이 완료되었으면 생성으로
      if (collectedData.plannedSections && collectedData.plannedSections.length > 0) {
        return {
          currentAgent: 'GENERATOR',
          nextAction: { type: 'generate' },
        };
      }
      // 데이터가 충분하면 기획으로
      if (isDataComplete(collectedData)) {
        return {
          currentAgent: 'PLANNER',
          nextAction: { type: 'continue', targetAgent: 'PLANNER' as AgentType },
        };
      }
      break;

    // === 수정 요청 ===
    case 'MODIFY':
      return {
        currentAgent: 'FEEDBACK',
        nextAction: { type: 'continue', targetAgent: 'FEEDBACK' as AgentType },
      };

    // === 취소 ===
    case 'CANCEL':
      const cancelMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '알겠습니다. 처음부터 다시 시작할게요! 🔄\n\n어떤 제품의 상세페이지를 만들어 드릴까요?',
        agentType: 'COORDINATOR',
        metadata: { uiType: 'text' },
        createdAt: new Date(),
      };
      return {
        messages: [cancelMessage],
        collectedData: {},
        currentAgent: 'COORDINATOR',
        nextAction: { type: 'await_input' },
      };

    // === 옵션 선택 ===
    case 'SELECT_OPTION':
      // 선택된 옵션 처리는 messages/route.ts에서 처리 후
      // 여기서는 다음 단계로 라우팅
      if (collectedData.category === 'BEAUTY' && collectedData.subCategory) {
        return {
          currentAgent: 'INTAKE',
          nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
        };
      }
      break;

    // === 정보 제공 / 생성 요청 ===
    case 'PROVIDE_INFO':
    case 'CREATE':
      // 이미 카테고리/서브카테고리가 설정되어 있으면 Intake로 바로 라우팅
      if (collectedData.category && collectedData.subCategory) {
        return {
          currentAgent: 'INTAKE',
          nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
        };
      }

      // 뷰티 카테고리만 설정되어 있고 서브카테고리가 없으면 Suggester로
      if (collectedData.category === 'BEAUTY' && !collectedData.subCategory) {
        return {
          currentAgent: 'SUGGESTER',
          nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
        };
      }

      // 카테고리가 이미 있으면(뷰티가 아닌 경우) Intake로
      if (collectedData.category) {
        return {
          currentAgent: 'INTAKE',
          nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
        };
      }

      // 제품 자동 감지 (카테고리가 아직 설정되지 않은 경우에만)
      const detected = await detectProduct(userContent, true); // quick detection only

      if (detected.category === 'BEAUTY' && detected.subCategory) {
        const specialistData = BEAUTY_SPECIALIST_DATA[detected.subCategory];

        // 자동 분류된 메시지
        const autoDetectMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: `${specialistData.emoji} ${specialistData.name} 제품이시군요!\n\n` +
            `**요즘 인기 트렌드:**\n` +
            specialistData.trends.slice(0, 3).map(t => `• ${t}`).join('\n') +
            `\n\n제품에 대해 더 알려주시겠어요?\n` +
            `(${specialistData.keyPoints.slice(0, 3).join(', ')} 등)`,
          agentType: 'COORDINATOR',
          metadata: {
            uiType: 'text',
            autoDetected: {
              category: 'BEAUTY',
              subCategory: detected.subCategory,
            },
          },
          createdAt: new Date(),
        };

        return {
          messages: [autoDetectMessage],
          collectedData: {
            category: 'BEAUTY',
            subCategory: detected.subCategory,
          },
          currentAgent: 'INTAKE',
          nextAction: { type: 'await_input' },
        };
      }

      // 뷰티 키워드만 감지된 경우
      if (detected.category === 'BEAUTY' && !detected.subCategory) {
        const clarifyMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: `뷰티 제품이시군요! 💄\n\n어떤 종류의 제품인지 알려주시겠어요?`,
          agentType: 'COORDINATOR',
          metadata: {
            uiType: 'options',
            options: Object.entries(BEAUTY_SPECIALIST_DATA).slice(0, 6).map(([key, data]) => ({
              id: key,
              label: `${data.emoji} ${data.name}`,
              value: key,
              description: data.trends.slice(0, 2).join(', '),
            })),
            askingField: 'subCategory',
          },
          createdAt: new Date(),
        };

        return {
          messages: [clarifyMessage],
          collectedData: { category: 'BEAUTY' },
          currentAgent: 'COORDINATOR',
          nextAction: { type: 'await_input' },
        };
      }
      break;
  }

  // 7. 상태 기반 라우팅

  // Discovery 요청인지 다시 확인
  if (isDiscoveryRequest(userContent)) {
    return {
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'discovery' as any }, // Discovery Agent 호출
    };
  }

  // 데이터 완성도 확인
  const missingFields = getMissingFields(collectedData);
  const dataComplete = isDataComplete(collectedData);

  // ★★★ imageModel이 없으면 Suggester로 라우팅 (기획 전에 이미지 품질 선택) ★★★
  // brandProfileId와 productImages도 체크하여 완전한 정보 수집
  if (dataComplete && !collectedData.imageModel) {
    console.log('[Coordinator] ★ imageModel not set, routing to SUGGESTER for image quality selection');
    return {
      currentAgent: 'SUGGESTER',
      nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
    };
  }

  // 기획 완료 후 생성 대기 상태
  if (dataComplete && collectedData.plannedSections) {
    return {
      currentAgent: 'PLANNER',
      nextAction: { type: 'await_input' },
    };
  }

  // 데이터 완료 + imageModel 있음 → 기획으로
  if (dataComplete && collectedData.imageModel) {
    return {
      currentAgent: 'PLANNER',
      nextAction: { type: 'continue', targetAgent: 'PLANNER' as AgentType },
    };
  }

  // 브랜드 로드 필요
  if (collectedData.brandProfileId && !state.brandContext) {
    return {
      currentAgent: 'BRAND_CONTEXT',
      nextAction: { type: 'continue', targetAgent: 'BRAND_CONTEXT' as AgentType },
    };
  }

  // 정보 수집 필요
  if (missingFields.length > 0) {
    // 카테고리 없음 → Discovery 또는 Suggester
    if (!collectedData.category) {
      // 질문/탐색 모드면 Discovery로
      if (isDiscoveryRequest(userContent)) {
        return {
          currentAgent: 'COORDINATOR',
          nextAction: { type: 'discovery' as any },
        };
      }
      // 그렇지 않으면 Intake로 정보 추출 시도
      return {
        currentAgent: 'INTAKE',
        nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
      };
    }

    // 뷰티 카테고리인데 서브카테고리 없음
    if (collectedData.category === 'BEAUTY' && !collectedData.subCategory) {
      return {
        currentAgent: 'SUGGESTER',
        nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
      };
    }

    // 카피 길이 없음
    if (!collectedData.copyLength) {
      return {
        currentAgent: 'SUGGESTER',
        nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
      };
    }

    // 기타 정보 수집
    return {
      currentAgent: 'INTAKE',
      nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
    };
  }

  // 기본값: Intake로
  return {
    currentAgent: 'INTAKE',
    nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
  };
}
