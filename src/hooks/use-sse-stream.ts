/**
 * SSE Stream Hook
 * Server-Sent Events를 사용한 실시간 스트리밍 훅
 */

import { useState, useCallback, useRef } from 'react';

interface SSEMessage {
  event: string;
  data: any;
}

interface UseSSEStreamOptions {
  onChunk?: (data: { messageId: string; content: string; isComplete: boolean }) => void;
  onMessage?: (message: any) => void;
  onTyping?: (isTyping: boolean) => void;
  onDone?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useSSEStream(options: UseSSEStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (url: string, body: any) => {
      setIsStreaming(true);
      setError(null);

      // 이전 스트림 중단
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '스트리밍 요청 실패');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('스트림을 읽을 수 없습니다.');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE 이벤트 파싱
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          let currentData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6);

              try {
                const parsedData = JSON.parse(currentData);

                switch (currentEvent) {
                  case 'chunk':
                    options.onChunk?.(parsedData);
                    break;
                  case 'message':
                    options.onMessage?.(parsedData);
                    break;
                  case 'typing':
                    options.onTyping?.(parsedData.isTyping);
                    break;
                  case 'done':
                    options.onDone?.(parsedData);
                    break;
                  case 'error':
                    setError(parsedData.message);
                    options.onError?.(parsedData.message);
                    break;
                }
              } catch (e) {
                console.error('SSE 데이터 파싱 오류:', e);
              }

              currentEvent = '';
              currentData = '';
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // 사용자가 중단한 경우
          return;
        }

        const errorMessage = err instanceof Error ? err.message : '스트리밍 오류';
        setError(errorMessage);
        options.onError?.(errorMessage);
      } finally {
        setIsStreaming(false);
      }
    },
    [options]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return {
    startStream,
    stopStream,
    isStreaming,
    error,
  };
}
