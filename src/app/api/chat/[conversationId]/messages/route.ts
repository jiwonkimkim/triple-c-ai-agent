/**
 * Chat Messages API - 메시지 전송 (SSE 스트리밍)
 * POST /api/chat/[conversationId]/messages - 메시지 전송 및 Agent 응답
 * GET /api/chat/[conversationId]/messages - 메시지 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  getChatAgentGraph,
  createInitialState,
  addUserMessage,
  ChatAgentState,
  ChatMessage,
  ProjectCollectedData,
  SuggestionOption,
} from '@/services/chat-agents';
import { processSuggesterSelection } from '@/services/chat-agents/agents/suggester';
import { AgentType } from '@prisma/client';

interface RouteParams {
  params: {
    conversationId: string;
  };
}

// GET: 메시지 목록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { conversationId } = params;

    // 대화 소유권 확인
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const messages = await prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        agentType: msg.agentType,
        metadata: msg.metadata,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error('[GET /api/chat/[id]/messages] Error:', error);
    return NextResponse.json(
      { error: '메시지 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 메시지 전송 (SSE 스트리밍)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { conversationId } = params;
    const body = await request.json();
    const { content, attachments = [], selectedOptionId } = body;

    // 메시지 내용, 선택 옵션, 또는 첨부 파일 중 하나는 있어야 함
    if (!content && !selectedOptionId && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: '메시지 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    // 대화 조회 및 소유권 확인
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 메시지 저장
    // content 결정: 텍스트 > 선택 옵션 > 이미지 첨부
    let messageContent = content;
    if (!messageContent && selectedOptionId) {
      messageContent = `[선택] ${selectedOptionId}`;
    } else if (!messageContent && attachments.length > 0) {
      messageContent = `[이미지 ${attachments.length}장 첨부]`;
    }

    const userMessage = await prisma.conversationMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: messageContent || '',
        attachments,
        metadata: selectedOptionId ? { selectedOptionId } : {},
      },
    });

    // SSE 스트림 생성
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: any) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // 기존 메시지를 ChatMessage 형식으로 변환
          const existingMessages: ChatMessage[] = conversation.messages.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            agentType: msg.agentType || undefined,
            metadata: msg.metadata as any,
            attachments: msg.attachments,
            createdAt: msg.createdAt,
          }));

          // 새 사용자 메시지 추가
          existingMessages.push({
            id: userMessage.id,
            role: 'user',
            content: content || `[선택] ${selectedOptionId}`,
            attachments,
            createdAt: userMessage.createdAt,
          });

          // 선택 옵션 처리: selectedOptionId가 있으면 collectedData 업데이트
          let updatedCollectedData = conversation.collectedData as ProjectCollectedData;

          // planAction 처리를 위한 변수
          let shouldGenerate = false;
          let shouldModifySections = false;
          let shouldModifyStyle = false;

          if (selectedOptionId) {
            // 마지막 assistant 메시지에서 askingField와 options 찾기
            const lastAssistantMessage = [...existingMessages]
              .reverse()
              .find(m => m.role === 'assistant' && m.metadata?.askingField);

            if (lastAssistantMessage?.metadata) {
              const { askingField, options } = lastAssistantMessage.metadata as {
                askingField?: string;
                options?: SuggestionOption[];
              };

              if (askingField && options) {
                // planAction 특별 처리
                if (askingField === 'planAction') {
                  if (selectedOptionId === 'generate') {
                    shouldGenerate = true;
                    console.log('[Chat] Plan action: generate selected');
                  } else if (selectedOptionId === 'modify_sections') {
                    shouldModifySections = true;
                    console.log('[Chat] Plan action: modify sections selected');
                  } else if (selectedOptionId === 'modify_style') {
                    shouldModifyStyle = true;
                    console.log('[Chat] Plan action: modify style selected');
                  }
                }
                // ★ confirmGenerate 확인 처리 (생성 최종 확인)
                else if (askingField === 'confirmGenerate') {
                  if (selectedOptionId === 'confirm') {
                    updatedCollectedData = {
                      ...updatedCollectedData,
                      confirmedGenerate: true,
                    };
                    console.log('[Chat] Generation confirmed by user');
                  } else if (selectedOptionId === 'modify') {
                    // 기획 수정 요청
                    updatedCollectedData = {
                      ...updatedCollectedData,
                      readyToGenerate: undefined,
                      modifyRequest: 'sections',
                    };
                    console.log('[Chat] User wants to modify plan');
                  }
                } else {
                  // 일반 선택지 처리
                  const selectionUpdate = processSuggesterSelection(
                    selectedOptionId,
                    askingField,
                    options
                  );

                  updatedCollectedData = {
                    ...updatedCollectedData,
                    ...selectionUpdate,
                  };

                  console.log('[Chat] ★★★ Selection processed ★★★:', {
                    askingField,
                    selectedOptionId,
                    selectionUpdate,
                    subCategoryValue: selectionUpdate.subCategory,
                    categoryValue: updatedCollectedData.category,
                    fullCollectedData: JSON.stringify(updatedCollectedData).slice(0, 500),
                  });
                }
              }
            }
          }

          // planAction에 따른 collectedData 업데이트
          if (shouldGenerate) {
            updatedCollectedData = {
              ...updatedCollectedData,
              readyToGenerate: true,
            };
          } else if (shouldModifySections) {
            updatedCollectedData = {
              ...updatedCollectedData,
              plannedSections: undefined, // 섹션 초기화
              modifyRequest: 'sections',
            };
          } else if (shouldModifyStyle) {
            updatedCollectedData = {
              ...updatedCollectedData,
              visualTheme: undefined,
              toneAndManner: undefined,
              colorPalette: undefined,
              modifyRequest: 'style',
            };
          }

          // 첨부 파일(이미지) 처리 - productImages에 저장
          if (attachments && attachments.length > 0) {
            const existingImages = updatedCollectedData.productImages || [];
            const newImages = [...existingImages, ...attachments].slice(0, 5); // 최대 5장
            updatedCollectedData = {
              ...updatedCollectedData,
              productImages: newImages,
            };
            console.log('[Chat] Product images updated:', newImages.length);
          }

          // Agent 상태 초기화
          const initialState: ChatAgentState = {
            conversationId,
            userId: session.user.id,
            messages: existingMessages,
            collectedData: updatedCollectedData,
            currentAgent: conversation.currentAgent,
            nextAction: undefined,
            brandContext: undefined,
            generationResult: undefined,
            errors: [],
          };

          // 타이핑 시작 이벤트
          sendEvent('typing', { isTyping: true });

          // LangGraph 실행 (recursionLimit 설정으로 무한루프 방지)
          const graph = getChatAgentGraph();
          const result = await graph.invoke(initialState as any, {
            recursionLimit: 50, // 기본값 25에서 증가
          });

          // 결과에서 새 메시지 추출
          const newMessages = result.messages.filter(
            (msg: ChatMessage) => !existingMessages.some(em => em.id === msg.id)
          );

          // 새 메시지들 저장 및 스트리밍
          for (const msg of newMessages) {
            if (msg.role === 'assistant') {
              // DB에 저장
              const savedMessage = await prisma.conversationMessage.create({
                data: {
                  conversationId,
                  role: msg.role,
                  content: msg.content,
                  agentType: msg.agentType,
                  metadata: (msg.metadata || {}) as Prisma.InputJsonValue,
                  attachments: msg.attachments || [],
                },
              });

              // 스트리밍 (단어 단위로 분할하여 전송 - 자연스러운 타이핑 효과)
              // 단어와 공백/특수문자를 분리하여 청크로 전송
              const tokens = msg.content.match(/\S+|\s+/g) || [];
              let streamedContent = '';

              for (let i = 0; i < tokens.length; i++) {
                streamedContent += tokens[i];

                // 각 토큰(단어/공백)마다 청크 전송
                sendEvent('chunk', {
                  messageId: savedMessage.id,
                  content: streamedContent,
                  isComplete: i === tokens.length - 1,
                });

                // 자연스러운 타이핑 효과를 위한 딜레이
                // 단어는 빠르게, 문장 끝(마침표, 쉼표 등)은 약간 느리게
                const token = tokens[i];
                const isEndOfSentence = /[.!?。！？]$/.test(token);
                const isPunctuation = /[,;:，；：]$/.test(token);
                const delay = isEndOfSentence ? 100 : isPunctuation ? 50 : 30;

                await new Promise(resolve => setTimeout(resolve, delay));
              }

              // 메시지 완료 이벤트
              sendEvent('message', {
                id: savedMessage.id,
                role: msg.role,
                content: msg.content,
                agentType: msg.agentType,
                metadata: msg.metadata,
                createdAt: savedMessage.createdAt,
              });
            }
          }

          // 대화 상태 업데이트
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              collectedData: result.collectedData as Prisma.InputJsonValue,
              currentAgent: result.currentAgent,
              agentState: {
                nextAction: result.nextAction,
              } as Prisma.InputJsonValue,
              // 제목이 없고 productName이 있으면 제목 설정
              ...(!conversation.title && result.collectedData?.productName && {
                title: `${result.collectedData.productName} 상세페이지`,
              }),
            },
          });

          // 타이핑 종료 이벤트
          sendEvent('typing', { isTyping: false });

          // 완료 이벤트
          sendEvent('done', {
            status: result.nextAction?.type || 'await_input',
            currentAgent: result.currentAgent,
            collectedData: result.collectedData,
            projectId: result.generationResult?.projectId,
          });
        } catch (error) {
          console.error('[POST /api/chat/[id]/messages] Stream error:', error);

          sendEvent('error', {
            message: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[POST /api/chat/[id]/messages] Error:', error);
    return NextResponse.json(
      { error: '메시지 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
