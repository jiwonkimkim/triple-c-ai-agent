/**
 * Chat API - 대화 상세 조회 및 삭제
 * GET /api/chat/[conversationId] - 대화 상세 조회
 * DELETE /api/chat/[conversationId] - 대화 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    conversationId: string;
  };
}

// GET: 대화 상세 조회
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

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        status: conversation.status,
        currentAgent: conversation.currentAgent,
        collectedData: conversation.collectedData,
        agentState: conversation.agentState,
        projectId: conversation.projectId,
        project: conversation.project,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        completedAt: conversation.completedAt,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          agentType: msg.agentType,
          metadata: msg.metadata,
          attachments: msg.attachments,
          createdAt: msg.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('[GET /api/chat/[id]] Error:', error);
    return NextResponse.json(
      { error: '대화 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 대화 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { conversationId } = params;

    // 소유권 확인
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

    // 삭제 (Cascade로 메시지도 함께 삭제)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/chat/[id]] Error:', error);
    return NextResponse.json(
      { error: '대화 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 대화 상태 업데이트
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { status, title } = body;

    // 소유권 확인
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

    // 업데이트
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(status && { status }),
        ...(title && { title }),
      },
    });

    return NextResponse.json({
      conversation: {
        id: updatedConversation.id,
        status: updatedConversation.status,
        title: updatedConversation.title,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/chat/[id]] Error:', error);
    return NextResponse.json(
      { error: '대화 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
