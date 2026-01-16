/**
 * Brand Context Agent
 * 브랜드 프로필 정보 로드 및 RAG 컨텍스트 준비
 */

import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import { ChatMessage, BrandContext, generateMessageId } from '../types';
import { prisma } from '@/lib/prisma';

export async function brandContextAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { collectedData, userId } = state;

  // 브랜드 프로필 ID가 없으면 스킵
  if (!collectedData.brandProfileId) {
    return {
      currentAgent: 'BRAND_CONTEXT',
      nextAction: { type: 'continue', targetAgent: 'PLANNER' as AgentType },
    };
  }

  try {
    // 브랜드 프로필 조회
    const brandProfile = await prisma.brandProfile.findFirst({
      where: {
        id: collectedData.brandProfileId,
        OR: [
          { userId },
          { workspace: { members: { some: { userId } } } },
        ],
      },
      include: {
        documentChunks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!brandProfile) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '선택하신 브랜드 프로필을 찾을 수 없어요. 브랜드 없이 계속 진행할까요?',
        agentType: 'BRAND_CONTEXT',
        metadata: {
          uiType: 'confirmation',
          options: [
            { id: 'continue', label: '네, 계속할게요', value: 'continue' },
            { id: 'select', label: '다른 브랜드 선택', value: 'select' },
          ],
        },
        createdAt: new Date(),
      };

      return {
        messages: [errorMessage],
        collectedData: { brandProfileId: undefined },
        currentAgent: 'BRAND_CONTEXT',
        nextAction: { type: 'await_input' },
      };
    }

    // 브랜드 컨텍스트 구성
    const brandContext: BrandContext = {
      id: brandProfile.id,
      name: brandProfile.name,
      identity: brandProfile.identity,
      toneAndManner: brandProfile.toneAndManner,
      voiceTone: brandProfile.voiceTone || undefined,
      imageKeywords: brandProfile.imageKeywords,
      styleGuide: brandProfile.styleGuide as BrandContext['styleGuide'],
      ragChunks: brandProfile.documentChunks.map(chunk => chunk.content),
    };

    // 브랜드 로드 완료 메시지
    const successMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `'${brandProfile.name}' 브랜드 스타일을 적용할게요!\n\n` +
        `🎨 브랜드 아이덴티티: ${brandProfile.identity.substring(0, 100)}...\n` +
        `✍️ 톤앤매너: ${brandProfile.toneAndManner.substring(0, 80)}...`,
      agentType: 'BRAND_CONTEXT',
      metadata: {
        uiType: 'text',
      },
      createdAt: new Date(),
    };

    return {
      messages: [successMessage],
      brandContext,
      currentAgent: 'BRAND_CONTEXT',
      nextAction: { type: 'continue', targetAgent: 'PLANNER' as AgentType },
    };
  } catch (error) {
    console.error('[BrandContext] Error:', error);

    return {
      currentAgent: 'BRAND_CONTEXT',
      nextAction: { type: 'continue', targetAgent: 'PLANNER' as AgentType },
      errors: ['브랜드 정보 로드 실패'],
    };
  }
}
