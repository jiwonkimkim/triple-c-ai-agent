'use client';

/**
 * Message Item Component
 * 개별 채팅 메시지 표시
 */

import { cn } from '@/lib/utils';
import { Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/hooks/use-chat';

interface MessageItemProps {
  message: ChatMessage;
  onSelectOption?: (optionId: string, optionLabel: string) => void;
}

export function MessageItem({ message, onSelectOption }: MessageItemProps) {
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
          {/* 텍스트 내용 */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {displayContent}
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
                className="rounded-full text-xs h-8 px-4 bg-white/80 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
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
