/**
 * Generator Agent
 * 실제 프로젝트 및 상세페이지 생성 실행
 */

import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import { ChatMessage, GenerationResult } from '../types';
import { prisma } from '@/lib/prisma';

export async function generatorAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { collectedData, userId, brandContext, conversationId } = state;

  // 진행 상태 메시지
  const progressMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: '상세페이지를 생성하고 있어요... 잠시만 기다려주세요!',
    agentType: 'GENERATOR',
    metadata: {
      uiType: 'progress',
      progress: {
        step: 'creating_project',
        percentage: 10,
        message: '프로젝트 생성 중...',
      },
    },
    createdAt: new Date(),
  };

  try {
    // 1. 프로젝트 생성
    const projectTitle = collectedData.title ||
      `${collectedData.productName} 상세페이지`;

    const project = await prisma.project.create({
      data: {
        ownerId: userId,
        title: projectTitle,
        description: collectedData.description,
        brandProfileId: collectedData.brandProfileId,
        productName: collectedData.productName,
        category: collectedData.category,
        subCategory: collectedData.subCategory,
        keyFeatures: collectedData.keyFeatures || [],
        targetAudience: collectedData.targetAudience,
        copyLength: collectedData.copyLength,
        productUrl: collectedData.productUrl,
        productImages: collectedData.productImages || [],
        imageModel: collectedData.imageModel || 'gemini-2.5-flash-image',
        status: 'ACTIVE',
      },
    });

    // 2. Conversation에 projectId 연결
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        projectId: project.id,
        status: 'GENERATING',
      },
    });

    // 3. 상세페이지 생성 API 호출 (내부 함수 또는 API)
    // 실제 구현에서는 기존 generateDetailPage 함수를 호출
    // 여기서는 API 엔드포인트를 통해 호출하도록 설계

    const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate/detail-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 인증은 서버 사이드이므로 내부 호출로 처리
        'X-Internal-Call': 'true',
      },
      body: JSON.stringify({
        projectId: project.id,
        productImages: collectedData.productImages || [],
        productName: collectedData.productName,
        category: collectedData.category,
        subCategory: collectedData.subCategory,
        keyFeatures: collectedData.keyFeatures,
        targetAudience: collectedData.targetAudience || '일반 소비자',
        copyLength: collectedData.copyLength,
        productUrl: collectedData.productUrl,
        generateImages: true,
        imageModel: collectedData.imageModel || 'gemini-2.5-flash-image',
        // 브랜드 컨텍스트
        brandContext: brandContext ? {
          identity: brandContext.identity,
          toneAndManner: brandContext.toneAndManner,
          voiceTone: brandContext.voiceTone,
          imageKeywords: brandContext.imageKeywords,
        } : undefined,
      }),
    });

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json();
      throw new Error(errorData.error || '상세페이지 생성 실패');
    }

    const generateResult = await generateResponse.json();

    // 4. Conversation 상태 업데이트
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // 5. 성공 메시지
    const successMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `🎉 상세페이지가 성공적으로 생성되었어요!\n\n` +
        `'${projectTitle}' 프로젝트가 준비되었습니다.\n` +
        `에디터에서 확인하고 수정할 수 있어요.`,
      agentType: 'GENERATOR',
      metadata: {
        uiType: 'redirect',
        redirect: {
          url: `/dashboard/projects/${project.id}`,
          projectId: project.id,
        },
        progress: {
          step: 'complete',
          percentage: 100,
          message: '생성 완료!',
        },
      },
      createdAt: new Date(),
    };

    const generationResult: GenerationResult = {
      projectId: project.id,
      versionId: generateResult.data?.versionId || '',
      status: 'success',
    };

    return {
      messages: [progressMessage, successMessage],
      generationResult,
      currentAgent: 'GENERATOR',
      nextAction: { type: 'complete', projectId: project.id },
    };
  } catch (error) {
    console.error('[Generator] Error:', error);

    // Conversation 상태 복구
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'ACTIVE' },
    }).catch(() => {});

    const errorMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `죄송해요, 생성 중 문제가 발생했어요.\n\n` +
        `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n` +
        `다시 시도하시겠어요?`,
      agentType: 'GENERATOR',
      metadata: {
        uiType: 'confirmation',
        options: [
          { id: 'retry', label: '다시 시도', value: 'retry' },
          { id: 'modify', label: '정보 수정', value: 'modify' },
        ],
      },
      createdAt: new Date(),
    };

    return {
      messages: [progressMessage, errorMessage],
      generationResult: {
        projectId: '',
        versionId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      currentAgent: 'GENERATOR',
      nextAction: { type: 'error', message: '생성 실패' },
    };
  }
}
