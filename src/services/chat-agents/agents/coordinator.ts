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

  // 2. 생성 플래그 확인 - 확인 후 Generator로 라우팅
  if (collectedData.readyToGenerate) {
    // ★ 이미 확인을 받았으면 (confirmedGenerate) 바로 생성
    if (collectedData.confirmedGenerate) {
      console.log('[Coordinator] confirmedGenerate flag detected, routing to GENERATOR');
      return {
        currentAgent: 'COORDINATOR',
        nextAction: { type: 'generate' },
        // 플래그들 제거 (일회성)
        collectedData: {
          ...collectedData,
          readyToGenerate: undefined,
          confirmedGenerate: undefined,
        },
      };
    }

    // ★ 첫 번째 요청: 확인 메시지를 보내고 사용자 응답 대기
    console.log('[Coordinator] readyToGenerate flag detected, asking for confirmation');

    const confirmMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `기획안대로 상세페이지를 생성할게요!\n\n` +
        `📋 **생성 정보**\n` +
        `• 제품명: ${collectedData.productName || '미정'}\n` +
        `• 카테고리: ${collectedData.subCategory || collectedData.category || '미정'}\n` +
        `• 카피 스타일: ${collectedData.copyLength === 'short' ? '짧고 임팩트 있게' : collectedData.copyLength === 'long' ? '상세하고 풍부하게' : '적당한 길이로'}\n\n` +
        `생성을 시작할까요?`,
      agentType: 'COORDINATOR',
      metadata: {
        uiType: 'confirmation',
        askingField: 'confirmGenerate',
        options: [
          { id: 'confirm', label: '네, 생성해주세요', value: 'confirm' },
          { id: 'modify', label: '기획 수정하기', value: 'modify' },
        ],
      },
      createdAt: new Date(),
    };

    return {
      messages: [confirmMessage],
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'await_input' },
      // readyToGenerate 유지, 다음 응답에서 confirmedGenerate 확인
      collectedData: { ...collectedData },
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
      // ★ 이미 카테고리/서브카테고리가 설정되어 있으면 Intake로 (제품 추천)
      if (isDiscoveryRequest(userContent)) {
        if (collectedData.subCategory) {
          console.log('[Coordinator] Discovery request but subCategory exists, routing to INTAKE for product recommendation');
          return {
            currentAgent: 'INTAKE',
            nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
          };
        }
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
        if (collectedData.subCategory) {
          return {
            currentAgent: 'INTAKE',
            nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
          };
        }
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
      // ★ 이미지 관련 정보가 없으면 먼저 SUGGESTER로 라우팅
      if (collectedData.productImages === undefined || collectedData.imageModel === undefined) {
        console.log('[Coordinator] CONFIRM but image info missing, routing to SUGGESTER');
        return {
          currentAgent: 'SUGGESTER',
          nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
        };
      }
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
      // ★ 이미지 업로드 대기 중이면 바로 SUGGESTER로 라우팅 (이미지 업로드 UI 표시)
      if (collectedData.waitingForImageUpload === true) {
        console.log('[Coordinator] SELECT_OPTION with waitingForImageUpload, routing to SUGGESTER');
        return {
          currentAgent: 'SUGGESTER',
          nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
        };
      }
      // 선택된 옵션 처리는 messages/route.ts에서 처리 후
      // 여기서는 다음 단계로 라우팅 → SUGGESTER가 다음 질문 결정
      if (collectedData.category && collectedData.subCategory) {
        return {
          currentAgent: 'SUGGESTER',
          nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
        };
      }
      break;

    // === 정보 제공 / 생성 요청 ===
    case 'PROVIDE_INFO':
    case 'CREATE':
      // ★ 이미지 관련 입력인지 체크 (기획안이 있는 상태에서)
      const imageKeywords = ['이미지', '사진', '이미지도', '사진도', '이미지가', '사진이', '이미지 있', '사진 있'];
      const isImageRelatedInput = imageKeywords.some(k => userContent.includes(k));

      if (isImageRelatedInput) {
        // 이미지 업로드 대기 상태로 전환
        console.log('[Coordinator] ★ Image-related input detected, routing to SUGGESTER for image upload');
        return {
          currentAgent: 'SUGGESTER',
          nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
          collectedData: {
            ...collectedData,
            waitingForImageUpload: true,
          },
        };
      }

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

  // ★ 이미지 업로드 대기 중인 경우 → Suggester로 라우팅
  if (collectedData.waitingForImageUpload === true) {
    console.log('[Coordinator] ★ Waiting for image upload, routing to SUGGESTER');
    return {
      currentAgent: 'SUGGESTER',
      nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
    };
  }

  // Discovery 요청인지 다시 확인
  // ★ 이미 subCategory가 설정되어 있으면 Intake로 라우팅 (제품 추천)
  if (isDiscoveryRequest(userContent)) {
    if (collectedData.subCategory) {
      console.log('[Coordinator] Discovery request but subCategory exists (state routing), routing to INTAKE');
      return {
        currentAgent: 'INTAKE',
        nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
      };
    }
    return {
      currentAgent: 'COORDINATOR',
      nextAction: { type: 'discovery' as any }, // Discovery Agent 호출
    };
  }

  // 데이터 완성도 확인
  const missingFields = getMissingFields(collectedData);
  const dataComplete = isDataComplete(collectedData);

  // ★★★ productImages가 undefined면 먼저 이미지 업로드 여부 질문 ★★★
  if (dataComplete && collectedData.productImages === undefined) {
    console.log('[Coordinator] ★ productImages not set, routing to SUGGESTER for image upload question');
    return {
      currentAgent: 'SUGGESTER',
      nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
    };
  }

  // ★★★ imageModel이 없으면 Suggester로 라우팅 (기획 전에 이미지 품질 선택) ★★★
  if (dataComplete && collectedData.productImages !== undefined && !collectedData.imageModel) {
    console.log('[Coordinator] ★ imageModel not set, routing to SUGGESTER for image quality selection');
    return {
      currentAgent: 'SUGGESTER',
      nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
    };
  }

  // 기획 완료 후 생성 대기 상태 - 이미지 정보가 완료된 경우만
  if (dataComplete && collectedData.plannedSections && collectedData.imageModel) {
    return {
      currentAgent: 'PLANNER',
      nextAction: { type: 'await_input' },
    };
  }

  // 기획 완료됐지만 이미지 정보가 없으면 SUGGESTER로
  if (dataComplete && collectedData.plannedSections && (collectedData.productImages === undefined || !collectedData.imageModel)) {
    console.log('[Coordinator] ★ Planning done but image info missing, routing to SUGGESTER');
    return {
      currentAgent: 'SUGGESTER',
      nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
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
