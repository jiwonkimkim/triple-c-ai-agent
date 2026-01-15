/**
 * Chat Hook
 * 채팅 상태 관리 및 메시지 전송 훅
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSSEStream } from './use-sse-stream';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentType?: string;
  metadata?: {
    uiType?: string;
    options?: Array<{
      id: string;
      label: string;
      value: string;
      description?: string;
      icon?: string;
    }>;
    multiSelect?: boolean;
    progress?: {
      step: string;
      percentage: number;
      message: string;
    };
    redirect?: {
      url: string;
      projectId?: string;
    };
    planPreview?: {
      sections: Array<{ type: string; name: string; description: string }>;
      theme: string;
      tone: string;
    };
  };
  attachments?: string[];
  createdAt: Date;
  isStreaming?: boolean;
  streamedContent?: string;
}

interface UseChatOptions {
  conversationId: string;
  onComplete?: (projectId: string) => void;
}

export function useChat({ conversationId, onComplete }: UseChatOptions) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [collectedData, setCollectedData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // SSE 스트림 훅
  const { startStream, stopStream, isStreaming } = useSSEStream({
    onChunk: (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId || msg.id === streamingMessageId
            ? { ...msg, streamedContent: data.content, isStreaming: !data.isComplete }
            : msg
        )
      );
    },
    onMessage: (message) => {
      // 빈 메시지는 무시
      if (!message.content || message.content.trim() === '') {
        setStreamingMessageId(null);
        return;
      }

      setMessages((prev) => {
        // 스트리밍 중인 메시지를 완성된 메시지로 교체
        const existingIndex = prev.findIndex(
          (m) => m.id === streamingMessageId || m.id === message.id
        );

        if (existingIndex >= 0) {
          const newMessages = [...prev];
          newMessages[existingIndex] = {
            ...message,
            createdAt: new Date(message.createdAt),
            isStreaming: false,
          };
          return newMessages;
        }

        return [
          ...prev,
          { ...message, createdAt: new Date(message.createdAt), isStreaming: false },
        ];
      });
      setStreamingMessageId(null);
    },
    onTyping: (typing) => {
      setIsTyping(typing);

      if (typing) {
        // 타이핑 시작 시 임시 메시지 추가
        const tempId = `streaming_${Date.now()}`;
        setStreamingMessageId(tempId);
        setMessages((prev) => [
          ...prev,
          {
            id: tempId,
            role: 'assistant',
            content: '',
            streamedContent: '',
            isStreaming: true,
            createdAt: new Date(),
          },
        ]);
      }
    },
    onDone: (data) => {
      setIsTyping(false);
      setCollectedData(data.collectedData || {});

      // 빈 스트리밍 메시지 정리
      setMessages((prev) =>
        prev.filter((m) => !m.isStreaming || (m.content && m.content.trim() !== ''))
      );

      // 완료 시 리다이렉트
      if (data.status === 'complete' && data.projectId) {
        onComplete?.(data.projectId);
        router.push(`/dashboard/projects/${data.projectId}`);
      }
    },
    onError: (errorMessage) => {
      setError(errorMessage);
      setIsTyping(false);
    },
  });

  // 초기 메시지 로드
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${conversationId}/messages`);

        if (!response.ok) {
          throw new Error('메시지 로드 실패');
        }

        const data = await response.json();
        setMessages(
          data.messages
            // 빈 메시지 필터링 (content가 없거나 빈 문자열인 메시지 제외)
            .filter((msg: any) => msg.content && msg.content.trim() !== '')
            .map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
            }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '메시지 로드 실패');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      if (!content.trim() && !attachments?.length) return;

      // 사용자 메시지 즉시 추가
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        attachments,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setError(null);

      // SSE 스트림 시작
      await startStream(`/api/chat/${conversationId}/messages`, {
        content,
        attachments,
      });
    },
    [conversationId, startStream]
  );

  // 선택지 선택
  const selectOption = useCallback(
    async (optionId: string, optionLabel: string) => {
      // 사용자 선택 메시지 추가
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: optionLabel,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setError(null);

      // SSE 스트림 시작
      await startStream(`/api/chat/${conversationId}/messages`, {
        content: optionLabel,
        selectedOptionId: optionId,
      });
    },
    [conversationId, startStream]
  );

  // 스트림 중단
  const cancelStream = useCallback(() => {
    stopStream();
    setIsTyping(false);

    // 스트리밍 중인 메시지 제거
    if (streamingMessageId) {
      setMessages((prev) => prev.filter((m) => m.id !== streamingMessageId));
      setStreamingMessageId(null);
    }
  }, [stopStream, streamingMessageId]);

  return {
    messages,
    isLoading,
    isTyping,
    isStreaming,
    collectedData,
    error,
    sendMessage,
    selectOption,
    cancelStream,
  };
}
