/**
 * Chat API - 대화 생성 및 목록 조회
 * POST /api/chat - 새 대화 시작
 * GET /api/chat - 대화 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConversationStatus } from '@prisma/client';

// POST: 새 대화 시작
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { initialMessage, source = 'dashboard' } = body;

    // 새 대화 생성
    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        status: 'ACTIVE',
        title: initialMessage
          ? initialMessage.substring(0, 50) + (initialMessage.length > 50 ? '...' : '')
          : null,
        collectedData: {},
        currentAgent: 'COORDINATOR',
        agentState: { source },
      },
    });

    // AI 인사 메시지 추가 (대화 시작 시 항상)
    const welcomeMessage = `안녕하세요! 저는 상세페이지 생성 도우미예요. 🎨

저는 이런 것들을 도와드릴 수 있어요:
• 📦 **제품 상세페이지** - 화장품, 패션, 식품 등 다양한 카테고리
• ✨ **마케팅 콘텐츠** - 제품 특징을 살린 매력적인 카피
• 🎯 **맞춤형 디자인** - 브랜드 톤앤매너에 맞는 스타일

어떤 제품의 상세페이지를 만들어 드릴까요?`;

    await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: welcomeMessage,
        agentType: 'COORDINATOR',
        metadata: { uiType: 'text' },
      },
    });

    // 초기 메시지가 있으면 저장
    if (initialMessage) {
      await prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: initialMessage,
          metadata: { source },
        },
      });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      status: conversation.status,
    });
  } catch (error) {
    console.error('[POST /api/chat] Error:', error);
    return NextResponse.json(
      { error: '대화 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 대화 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ConversationStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 필터 조건
    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    // 대화 목록 조회
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    // 응답 데이터 변환
    const conversationList = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      status: conv.status,
      currentAgent: conv.currentAgent,
      projectId: conv.projectId,
      project: conv.project,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
      lastMessage: conv.messages[0]?.content?.substring(0, 100),
    }));

    return NextResponse.json({
      conversations: conversationList,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('[GET /api/chat] Error:', error);
    return NextResponse.json(
      { error: '대화 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
