'use client';

/**
 * Typing Indicator Component
 * AI가 응답을 생성 중임을 표시
 */

import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div data-testid="typing-indicator" className="flex gap-3 p-4">
      {/* 아바타 */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>

      {/* 타이핑 애니메이션 */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
