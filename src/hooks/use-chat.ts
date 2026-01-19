/**
 * Chat Hook
 * 채팅 상태 관리 및 메시지 전송 훅
 */

import { useState, useCallback, useEffect, useRef } from 'react';
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

  // streamingMessageId를 ref로 관리 (클로저 문제 해결)
  const streamingMessageIdRef = useRef<string | null>(null);

  // SSE 스트림 훅
  const { startStream, stopStream, isStreaming } = useSSEStream({
    onChunk: (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          // 스트리밍 중인 메시지 찾기 (ref 사용 또는 isStreaming 플래그로)
          const isTargetMessage =
            msg.id === data.messageId ||
            msg.id === streamingMessageIdRef.current ||
            msg.isStreaming;

          if (isTargetMessage) {
            return {
              ...msg,
              streamedContent: data.content,
              isStreaming: !data.isComplete
            };
          }
          return msg;
        })
      );
    },
    onMessage: (message) => {
      // 빈 메시지는 무시
      if (!message.content || message.content.trim() === '') {
        setStreamingMessageId(null);
        streamingMessageIdRef.current = null;
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
      streamingMessageIdRef.current = null; // ref도 초기화
    },
    onTyping: (typing) => {
      setIsTyping(typing);

      if (typing) {
        // 타이핑 시작 시 임시 메시지 추가
        const tempId = `streaming_${Date.now()}`;
        setStreamingMessageId(tempId);
        streamingMessageIdRef.current = tempId; // ref도 업데이트
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

  // 자동 트리거 실행 여부 추적
  const autoTriggerExecutedRef = useRef(false);
  const startStreamRef = useRef(startStream);

  // startStream 참조 업데이트
  useEffect(() => {
    startStreamRef.current = startStream;
  }, [startStream]);

  // 초기 메시지 로드
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${conversationId}/messages`);

        if (!response.ok) {
          throw new Error('메시지 로드 실패');
        }

        const data = await response.json();
        const loadedMessages = data.messages
          // 빈 메시지 필터링 (content가 없거나 빈 문자열인 메시지 제외)
          .filter((msg: any) => msg.content && msg.content.trim() !== '')
          .map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          }));

        setMessages(loadedMessages);

        // 마지막 메시지가 user이고 그 후에 assistant 응답이 없으면 자동으로 Agent 실행
        // 단, 한 번만 실행
        if (!autoTriggerExecutedRef.current && loadedMessages.length >= 2) {
          const lastMessage = loadedMessages[loadedMessages.length - 1];
          const secondLastMessage = loadedMessages[loadedMessages.length - 2];

          // 마지막이 user 메시지이고, 그 전이 assistant 메시지인 경우 (초기 메시지가 처리되지 않은 상태)
          if (lastMessage.role === 'user' && secondLastMessage.role === 'assistant') {
            console.log('[useChat] 처리되지 않은 초기 메시지 감지, Agent 자동 실행');
            autoTriggerExecutedRef.current = true;
            // 약간의 딜레이 후 Agent 실행 (UI 렌더링 완료 후)
            setTimeout(() => {
              startStreamRef.current(`/api/chat/${conversationId}/messages`, {
                content: lastMessage.content,
                autoTrigger: true, // 자동 트리거 표시
              });
            }, 100);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '메시지 로드 실패');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]); // startStream 의존성 제거

  // 메시지 전송
  const sendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      if (!content.trim() && !attachments?.length) return;

      // ★ 중복 요청 방지: 이미 스트리밍/타이핑 중이면 무시
      if (isStreaming || isTyping) {
        console.log('[useChat] 중복 요청 방지: 이미 처리 중입니다.');
        return;
      }

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
    [conversationId, startStream, isStreaming, isTyping]
  );

  // 선택지 선택
  const selectOption = useCallback(
    async (optionId: string, optionLabel: string) => {
      // ★ 중복 클릭 방지: 이미 스트리밍/타이핑 중이면 무시
      if (isStreaming || isTyping) {
        console.log('[useChat] 중복 요청 방지: 이미 처리 중입니다.');
        return;
      }

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
    [conversationId, startStream, isStreaming, isTyping]
  );

  // 스트림 중단
  const cancelStream = useCallback(() => {
    stopStream();
    setIsTyping(false);

    // 스트리밍 중인 메시지 제거
    const currentStreamingId = streamingMessageIdRef.current;
    if (currentStreamingId) {
      setMessages((prev) => prev.filter((m) => m.id !== currentStreamingId));
      setStreamingMessageId(null);
      streamingMessageIdRef.current = null;
    }
  }, [stopStream]);

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
