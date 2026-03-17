'use client';

/**
 * Chat Page
 * 대화형 프로젝트 생성 페이지
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChat } from '@/hooks/use-chat';
import { MessageItem } from './_components/message-item';
import { ChatInput } from './_components/chat-input';
import { TypingIndicator } from './_components/typing-indicator';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const prevMessageCountRef = useRef(0);

  const {
    messages,
    isLoading,
    isTyping,
    isStreaming,
    collectedData,
    error,
    sendMessage,
    selectOption,
    cancelStream,
  } = useChat({
    conversationId,
    onComplete: (projectId) => {
      console.log('프로젝트 생성 완료:', projectId);
    },
  });

  // 스크롤 위치 감지
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // 스크롤이 하단에서 100px 이상 떨어져 있으면 사용자가 위로 스크롤한 것으로 간주
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setUserScrolledUp(!isNearBottom);
  }, []);

  // 새 메시지가 추가될 때만 스크롤 (사용자가 위로 스크롤 중이 아닐 때)
  useEffect(() => {
    const messageCount = messages.length;
    const isNewMessage = messageCount > prevMessageCountRef.current;
    prevMessageCountRef.current = messageCount;

    // 새 메시지가 추가되었고, 사용자가 위로 스크롤 중이 아닐 때만 스크롤
    if (isNewMessage && !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, userScrolledUp]);

  // 타이핑 시작 시 스크롤 (사용자가 위로 스크롤 중이 아닐 때만)
  useEffect(() => {
    if (isTyping && !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping, userScrolledUp]);

  // 대화 삭제
  const handleDelete = async () => {
    if (!confirm('이 대화를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/chat/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/chat');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  // 뒤로가기
  const handleBack = () => {
    router.push('/dashboard/chat');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleBack}
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-gray-900">
              {collectedData?.productName
                ? `${collectedData.productName} 상세페이지`
                : '새 프로젝트'}
            </h1>
            <p className="text-xs text-gray-500">
              {collectedData?.category || 'AI와 대화하며 프로젝트를 만들어보세요'}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="chat-options-button">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              대화 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* 메시지 영역 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              무엇을 만들어볼까요?
            </h2>
            <p className="text-gray-500 max-w-sm">
              제품 상세페이지, 마케팅 콘텐츠 등 원하시는 내용을 자유롭게 말씀해주세요.
            </p>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onSelectOption={selectOption}
                isDisabled={isStreaming || isTyping}
              />
            ))}
            {isTyping && !messages.some((m) => m.isStreaming) && (
              <TypingIndicator />
            )}
            <div ref={messagesEndRef} data-testid="messages-end" />
          </div>
        )}
      </div>

      {/* 에러 표시 */}
      {error && (
        <div
          data-testid="error-banner"
          className="mx-4 mb-2 p-3 bg-red-50 border border-red-100 rounded-lg"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 입력 영역 */}
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        placeholder={
          messages.length === 0
            ? '어떤 콘텐츠를 만들고 싶으신가요?'
            : '메시지를 입력하세요...'
        }
      />
    </div>
  );
}
