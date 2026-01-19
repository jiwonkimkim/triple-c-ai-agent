'use client';

/**
 * Message Item Component
 * 개별 채팅 메시지 표시 (마크다운 지원)
 */

import { cn } from '@/lib/utils';
import { Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/hooks/use-chat';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: ChatMessage;
  onSelectOption?: (optionId: string, optionLabel: string) => void;
  isDisabled?: boolean;  // ★ 스트리밍/타이핑 중일 때 버튼 비활성화
}

export function MessageItem({ message, onSelectOption, isDisabled }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const displayContent = isStreaming ? message.streamedContent || '' : message.content;

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* 아바타 */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* 메시지 내용 */}
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm rounded-bl-md'
          )}
        >
          {/* 텍스트 내용 (마크다운 렌더링) */}
          <div className={cn(
            "text-sm leading-relaxed prose prose-sm max-w-none",
            isUser ? "prose-invert" : "prose-gray",
            // 마크다운 스타일 커스텀
            "[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5",
            "[&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1",
            "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1",
            "[&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-1 [&_h3]:mb-0.5",
            "[&_strong]:font-semibold",
            "[&_ul]:list-disc [&_ul]:pl-4",
            "[&_ol]:list-decimal [&_ol]:pl-4",
            "[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs",
            isUser && "[&_code]:bg-blue-400/30"
          )}>
            <ReactMarkdown>{displayContent}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
            )}
          </div>

          {/* 진행 상태 표시 */}
          {message.metadata?.progress && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{message.metadata.progress.message}</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${message.metadata.progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* 기획 미리보기 */}
          {message.metadata?.planPreview && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">섹션 구성 미리보기</div>
              <div className="space-y-1">
                {message.metadata.planPreview.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs text-gray-600"
                  >
                    <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-medium">
                      {idx + 1}
                    </span>
                    <span>{section.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 선택지 버튼 */}
        {message.metadata?.options && message.metadata.options.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.metadata.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                size="sm"
                disabled={isDisabled}
                className={cn(
                  "rounded-full text-xs h-8 px-4 bg-white/80 backdrop-blur-sm transition-all",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                )}
                onClick={() => onSelectOption?.(option.id, option.label)}
              >
                {option.icon && <span className="mr-1">{option.icon}</span>}
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {/* 리다이렉트 버튼 */}
        {message.metadata?.redirect && (
          <Button
            className="mt-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            onClick={() => {
              if (message.metadata?.redirect?.url) {
                window.location.href = message.metadata.redirect.url;
              }
            }}
          >
            에디터에서 확인하기
          </Button>
        )}

        {/* 타임스탬프 */}
        <span className="text-[10px] text-gray-400">
          {message.createdAt.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
