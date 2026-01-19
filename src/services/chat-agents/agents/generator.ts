/**
 * Generator Agent
 * 실제 프로젝트 및 상세페이지 생성 실행
 */

import { AgentType, Prisma } from '@prisma/client';
import { ChatAgentState } from '../graph';
import { ChatMessage, GenerationResult, generateMessageId, getMissingFields } from '../types';
import { prisma } from '@/lib/prisma';
import { generateDetailPage } from '@/services/ai/detail-page-generator';

export async function generatorAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { collectedData, userId, brandContext, conversationId } = state;

  // ★★★ 중복 생성 방지: 이미 프로젝트가 생성된 대화인지 확인 ★★★
  const existingConversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { projectId: true, status: true },
  });

  if (existingConversation?.projectId) {
    console.log(`[Generator] ★ Project already exists for conversation ${conversationId}: ${existingConversation.projectId}`);

    // 이미 프로젝트가 있으면 해당 프로젝트로 리다이렉트
    const existingProject = await prisma.project.findUnique({
      where: { id: existingConversation.projectId },
      select: { id: true, title: true },
    });

    if (existingProject) {
      const alreadyExistsMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `이미 '${existingProject.title}' 프로젝트가 생성되어 있어요!\n\n에디터에서 확인하고 수정할 수 있습니다.`,
        agentType: 'GENERATOR',
        metadata: {
          uiType: 'redirect',
          redirect: {
            url: `/dashboard/projects/${existingProject.id}`,
            projectId: existingProject.id,
          },
        },
        createdAt: new Date(),
      };

      return {
        messages: [alreadyExistsMessage],
        generationResult: {
          projectId: existingProject.id,
          versionId: '',
          status: 'success',
        },
        currentAgent: 'GENERATOR',
        nextAction: { type: 'complete', projectId: existingProject.id },
      };
    }
  }

  // ★ 생성 중 상태로 변경 (중복 요청 방지)
  if (existingConversation?.status !== 'GENERATING') {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'GENERATING' },
    });
  } else {
    // 이미 생성 중이면 중복 요청으로 간주
    console.log(`[Generator] ★ Conversation ${conversationId} is already GENERATING, skipping duplicate request`);

    const inProgressMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '이미 상세페이지를 생성하고 있어요. 잠시만 기다려주세요!',
      agentType: 'GENERATOR',
      metadata: { uiType: 'text' },
      createdAt: new Date(),
    };

    return {
      messages: [inProgressMessage],
      currentAgent: 'GENERATOR',
      nextAction: { type: 'await_input' },
    };
  }

  // 필수 필드 검증
  const missingFields = getMissingFields(collectedData);
  if (missingFields.length > 0) {
    console.error('[Generator] Missing required fields:', missingFields);

    const fieldNames: Record<string, string> = {
      productName: '제품명',
      category: '카테고리',
      copyLength: '카피 길이',
      subCategory: '서브 카테고리',
    };

    const missingFieldNames = missingFields.map(f => fieldNames[f] || f).join(', ');

    const validationErrorMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `아직 필요한 정보가 부족해요.\n\n` +
        `**부족한 정보:** ${missingFieldNames}\n\n` +
        `필요한 정보를 먼저 알려주시겠어요?`,
      agentType: 'GENERATOR',
      metadata: {
        uiType: 'text',
      },
      createdAt: new Date(),
    };

    return {
      messages: [validationErrorMessage],
      currentAgent: 'GENERATOR',
      nextAction: { type: 'continue', targetAgent: 'INTAKE' as AgentType },
    };
  }

  // ★ 진행 메시지 제거 - 중복 메시지 방지
  // 성공/실패 시 단일 메시지만 반환

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

    // 3. 상세페이지 생성 (API route와 동일한 로직 적용)
    // - generateImages: false (기본) = 사용자 업로드 제품 이미지 직접 사용
    // - generateImages: true = AI가 새로운 이미지 생성
    // - 제품 이미지 없으면 자동으로 T2I 활성화
    const hasProductImages = collectedData.productImages && collectedData.productImages.length > 0;
    const shouldGenerateImages = collectedData.generateImages ?? !hasProductImages; // API와 동일: 제품 이미지 없으면 자동 T2I

    // ★ 디버그: 이미지 생성 모드 결정 로깅
    console.log('[Generator] ★★★ IMAGE GENERATION MODE ★★★');
    console.log('[Generator] collectedData.generateImages:', collectedData.generateImages);
    console.log('[Generator] Mode:', hasProductImages && shouldGenerateImages ? 'I2I' : (shouldGenerateImages ? 'T2I' : 'Direct'));

    // 브랜드 컨텍스트 구성
    let fullBrandContext: {
      name: string;
      identity: string;
      toneAndManner: string;
      imageKeywords: string[];
      ragContext?: string;
      styleGuide?: {
        colors?: { primary?: string; secondary?: string; palette?: string[] };
        images?: { logo?: string; favicon?: string; ogImage?: string };
        fonts?: { primary?: string; all?: string[] };
      };
    } | null = null;

    if (collectedData.brandProfileId) {
      const brandProfile = await prisma.brandProfile.findUnique({
        where: { id: collectedData.brandProfileId },
        include: {
          documentChunks: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (brandProfile) {
        let styleGuide = undefined;
        if (brandProfile.styleGuide) {
          try {
            const rawStyleGuide = brandProfile.styleGuide as Record<string, unknown>;
            styleGuide = {
              colors: rawStyleGuide.colors as { primary?: string; secondary?: string; palette?: string[] } | undefined,
              images: rawStyleGuide.images as { logo?: string; favicon?: string; ogImage?: string } | undefined,
              fonts: rawStyleGuide.fonts as { primary?: string; all?: string[] } | undefined,
            };
          } catch (e) {
            console.warn('[Generator] Failed to parse styleGuide:', e);
          }
        }

        fullBrandContext = {
          name: brandProfile.name,
          identity: brandProfile.identity,
          toneAndManner: brandProfile.toneAndManner,
          imageKeywords: brandProfile.imageKeywords,
          ragContext: brandProfile.documentChunks.map((c) => c.content).join('\n\n'),
          styleGuide,
        };
      }
    } else if (brandContext) {
      // 채팅에서 수집한 브랜드 정보 사용
      fullBrandContext = {
        name: brandContext.name,
        identity: brandContext.identity,
        toneAndManner: brandContext.toneAndManner,
        imageKeywords: brandContext.imageKeywords,
      };
    }

    // ★★★ API route와 동일한 상세 로깅 ★★★
    console.log('[Generator] ★★★ Calling generateDetailPage (ORCHESTRATION MODE) ★★★');
    console.log('[Generator] productName:', collectedData.productName);
    console.log('[Generator] category:', collectedData.category);
    console.log('[Generator] ★★★ subCategory (CRITICAL):', collectedData.subCategory);
    console.log('[Generator] ★★★ typeof subCategory:', typeof collectedData.subCategory);
    console.log('[Generator] copyLength:', collectedData.copyLength);
    console.log('[Generator] keyFeatures:', collectedData.keyFeatures?.slice(0, 3).join(', '));
    console.log('[Generator] targetAudience:', collectedData.targetAudience);
    console.log('[Generator] ★ productImages:', JSON.stringify(collectedData.productImages?.slice(0, 2)));
    console.log('[Generator] ★ hasProductImages:', hasProductImages);
    console.log('[Generator] ★ shouldGenerateImages (final):', shouldGenerateImages);
    console.log('[Generator] ★ imageModel:', collectedData.imageModel || 'gemini-2.5-flash-image');
    console.log('[Generator] ★ brandContext:', fullBrandContext ? `${fullBrandContext.name || 'unnamed'}` : 'null');

    const detailPageResult = await generateDetailPage({
      productImages: collectedData.productImages || [],
      productName: collectedData.productName!,
      category: collectedData.category!,
      subCategory: collectedData.subCategory,
      keyFeatures: collectedData.keyFeatures || [],
      targetAudience: collectedData.targetAudience || '일반 소비자',
      copyLength: collectedData.copyLength!,
      brandContext: fullBrandContext,
      generateImages: shouldGenerateImages,
      imageModel: collectedData.imageModel || 'gemini-2.5-flash-image',
    }, { includeDevPrompts: process.env.NODE_ENV === 'development' });

    console.log('[Generator] ★★★ generateDetailPage completed successfully ★★★');

    const { versions, devPrompts } = detailPageResult;

    if (!versions || versions.length === 0) {
      throw new Error('상세페이지 버전 생성 실패');
    }

    // 버전 번호 계산
    const maxVersion = await prisma.detailPageVersion.findFirst({
      where: { projectId: project.id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const startVersionNumber = (maxVersion?.versionNumber || 0) + 1;

    // DB에 버전 저장
    const savedVersions = await Promise.all(
      versions.map((version, index) =>
        prisma.detailPageVersion.create({
          data: {
            projectId: project.id,
            versionNumber: startVersionNumber + index,
            hookMessage: version.hookMessage,
            sections: version.sections as unknown as Prisma.InputJsonValue,
          },
        })
      )
    );

    // ProjectVersion 히스토리 생성
    const latestProjectVersion = await prisma.projectVersion.findFirst({
      where: { projectId: project.id },
      orderBy: { versionNumber: 'desc' },
    });
    const newProjectVersionNumber = (latestProjectVersion?.versionNumber || 0) + 1;

    // 썸네일 추출
    const firstVersion = versions[0];
    const sections = firstVersion?.sections || [];
    let thumbnailUrl: string | null = null;
    for (const section of sections) {
      const sec = section as { imageUrl?: string; imageUrls?: string[] };
      if (sec.imageUrls && sec.imageUrls.length > 0) {
        thumbnailUrl = sec.imageUrls[0];
        break;
      } else if (sec.imageUrl) {
        thumbnailUrl = sec.imageUrl;
        break;
      }
    }

    await prisma.projectVersion.create({
      data: {
        projectId: project.id,
        versionNumber: newProjectVersionNumber,
        action: 'GENERATE',
        description: `AI 생성 (채팅)`,
        content: {
          sections: versions[0]?.sections || [],
          hookMessage: versions[0]?.hookMessage,
          ...(devPrompts && { devPrompts }),
        } as unknown as Prisma.InputJsonValue,
        thumbnail: thumbnailUrl,
        createdById: userId,
      },
    });

    // 프로젝트 버전 업데이트
    await prisma.project.update({
      where: { id: project.id },
      data: {
        currentVersion: newProjectVersionNumber,
        updatedAt: new Date(),
      },
    });

    // 크레딧 차감
    await prisma.user.update({
      where: { id: userId },
      data: { trialCredits: { decrement: 1 } },
    });

    const generateResult = {
      data: {
        versionId: savedVersions[0]?.id || '',
      },
    };

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
      id: generateMessageId(),
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
      messages: [successMessage],  // ★ 단일 메시지만 반환
      generationResult,
      currentAgent: 'GENERATOR',
      nextAction: { type: 'complete', projectId: project.id },
    };
  } catch (error) {
    // ★★★ 상세 에러 로깅 ★★★
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Generator] ★★★ GENERATION FAILED ★★★');
    console.error('[Generator] Error message:', errorMsg);
    console.error('[Generator] Error stack:', errorStack);
    console.error('[Generator] collectedData at failure:', JSON.stringify({
      productName: collectedData.productName,
      category: collectedData.category,
      subCategory: collectedData.subCategory,
      copyLength: collectedData.copyLength,
      hasProductImages: collectedData.productImages?.length || 0,
    }));

    // Conversation 상태 복구
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'ACTIVE' },
    }).catch(() => {});

    const errorChatMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `죄송해요, 생성 중 문제가 발생했어요.\n\n` +
        `오류: ${errorMsg}\n\n` +
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
      messages: [errorChatMessage],  // ★ 단일 메시지만 반환
      generationResult: {
        projectId: '',
        versionId: '',
        status: 'failed',
        error: errorMsg,
      },
      currentAgent: 'GENERATOR',
      nextAction: { type: 'error', message: '생성 실패' },
    };
  }
}
