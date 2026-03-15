'use client';

/**
 * Chat List Page
 * 대화 목록 페이지
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ConversationItem {
  id: string;
  title: string | null;
  status: 'ACTIVE' | 'AWAITING_INPUT' | 'GENERATING' | 'COMPLETED' | 'ABANDONED';
  currentAgent: string;
  projectId: string | null;
  project?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

const statusConfig = {
  ACTIVE: { icon: Clock, label: '진행 중', color: 'text-blue-500 bg-blue-50' },
  AWAITING_INPUT: { icon: Clock, label: '입력 대기', color: 'text-amber-500 bg-amber-50' },
  GENERATING: { icon: Loader2, label: '생성 중', color: 'text-purple-500 bg-purple-50' },
  COMPLETED: { icon: CheckCircle2, label: '완료', color: 'text-green-500 bg-green-50' },
  ABANDONED: { icon: AlertCircle, label: '중단됨', color: 'text-gray-500 bg-gray-50' },
};

export default function ChatListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  // 대화 목록 로드
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch('/api/chat');

        if (!response.ok) {
          throw new Error('대화 목록을 불러올 수 없습니다.');
        }

        const data = await response.json();
        setConversations(data.conversations);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // 새 대화 시작
  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'chat_list' }),
      });

      if (!response.ok) {
        throw new Error('대화를 시작할 수 없습니다.');
      }

      const data = await response.json();
      router.push(`/dashboard/chat/${data.conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  // 대화 삭제
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('이 대화를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/chat/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  // 제목 편집 시작
  const handleEditStart = (conversation: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title || '');
  };

  // 제목 편집 취소
  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle('');
  };

  // 제목 저장
  const handleEditSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!editingTitle.trim()) {
      setEditingId(null);
      setEditingTitle('');
      return;
    }

    try {
      const response = await fetch(`/api/chat/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      if (response.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, title: editingTitle.trim() } : c
          )
        );
      }
    } catch (error) {
      console.error('제목 수정 실패:', error);
    } finally {
      setEditingId(null);
      setEditingTitle('');
    }
  };

  // 엔터 키로 저장
  const handleEditKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave(id, e as unknown as React.MouseEvent);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingTitle('');
    }
  };

  // 대화 클릭
  const handleClick = (conversation: ConversationItem) => {
    if (conversation.status === 'COMPLETED' && conversation.projectId) {
      router.push(`/dashboard/projects/${conversation.projectId}`);
    } else {
      router.push(`/dashboard/chat/${conversation.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대화</h1>
          <p className="text-gray-500 mt-1">AI와 대화하며 프로젝트를 만들어보세요</p>
        </div>
        <Button
          onClick={handleNewChat}
          data-testid="new-chat-button"
          className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 대화
        </Button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 대화 목록 */}
      {conversations.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            아직 대화가 없습니다
          </h3>
          <p className="text-gray-500 mb-6">
            새 대화를 시작하여 AI와 함께 프로젝트를 만들어보세요
          </p>
          <Button
            onClick={handleNewChat}
            data-testid="new-chat-button"
            className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            첫 대화 시작하기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => {
            const status = statusConfig[conversation.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={conversation.id}
                onClick={() => handleClick(conversation)}
                className={cn(
                  'group p-4 bg-white rounded-xl border border-gray-100 shadow-sm',
                  'hover:border-blue-200 hover:shadow-md transition-all cursor-pointer'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {editingId === conversation.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(conversation.id, e)}
                            className="h-7 text-sm font-medium"
                            autoFocus
                            placeholder="대화 제목"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-50"
                            onClick={(e) => handleEditSave(conversation.id, e)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-gray-600 hover:bg-gray-100"
                            onClick={handleEditCancel}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.title || '새 대화'}
                        </h3>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                          status.color
                        )}
                      >
                        <StatusIcon
                          className={cn(
                            'w-3 h-3',
                            conversation.status === 'GENERATING' && 'animate-spin'
                          )}
                        />
                        {status.label}
                      </span>
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-500 truncate mb-2">
                        {conversation.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {new Date(conversation.updatedAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>{conversation.messageCount}개 메시지</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingId !== conversation.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={(e) => handleEditStart(conversation, e)}
                        title="제목 편집"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {conversation.projectId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/projects/${conversation.projectId}`);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => handleDelete(conversation.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
