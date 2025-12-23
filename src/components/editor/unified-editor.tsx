'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Save,
  Undo,
  Redo,
  Eye,
  Download,
  Monitor,
  Tablet,
  Smartphone,
  Image as ImageIcon,
  Type,
  MessageSquare,
  X,
  Send,
  Upload,
  Sparkles,
  Loader2,
  History,
} from 'lucide-react';
import { HistoryPanel } from '@/components/history/history-panel';

// 편집 가능한 요소 타입
interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'heading';
  content: string;
  styles?: Record<string, string>;
  level?: number; // heading level
  alt?: string; // image alt
}

interface UnifiedEditorProps {
  projectId: string;
  versionId?: string;
  initialHtml?: string;
  initialElements?: EditableElement[];
  onSaveSuccess?: () => void;
}

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

const previewWidths: Record<PreviewMode, string> = {
  desktop: 'max-w-4xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
};

export function UnifiedEditor({
  projectId,
  versionId,
  initialHtml,
  initialElements,
  onSaveSuccess,
}: UnifiedEditorProps) {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [elements, setElements] = useState<EditableElement[]>(initialElements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Chat history
  interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // History for undo/redo
  const [history, setHistory] = useState<EditableElement[][]>([initialElements || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>(versionId);

  // 기본 요소
  const defaultElements: EditableElement[] = [
    {
      id: 'hero-heading',
      type: 'heading',
      content: '상품명을 입력하세요',
      level: 1,
      styles: { textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold' },
    },
    {
      id: 'hero-image',
      type: 'image',
      content: '/placeholder-product.jpg',
      alt: '상품 이미지',
      styles: { width: '100%', maxHeight: '400px', objectFit: 'cover' },
    },
    {
      id: 'description',
      type: 'text',
      content: '상품 설명을 입력하세요. 클릭하여 편집할 수 있습니다.',
      styles: { fontSize: '1.1rem', lineHeight: '1.8', color: '#333' },
    },
    {
      id: 'features-heading',
      type: 'heading',
      content: '주요 특징',
      level: 2,
      styles: { fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem' },
    },
    {
      id: 'features-text',
      type: 'text',
      content: '• 특징 1: 여기에 특징을 입력하세요\n• 특징 2: 여기에 특징을 입력하세요\n• 특징 3: 여기에 특징을 입력하세요',
      styles: { fontSize: '1rem', lineHeight: '2', whiteSpace: 'pre-wrap' },
    },
  ];

  // API에서 콘텐츠 로드
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/content`);
        if (!response.ok) throw new Error('Failed to fetch content');

        const data = await response.json();
        if (data.success && data.data?.elements?.length > 0) {
          setElements(data.data.elements);
          setHistory([data.data.elements]);
          setCurrentVersionId(data.data.versionId);
        } else {
          // 콘텐츠가 없으면 기본 요소 사용
          setElements(defaultElements);
          setHistory([defaultElements]);
        }
      } catch (error) {
        console.error('Failed to load content:', error);
        // 에러 시 기본 요소 사용
        setElements(defaultElements);
        setHistory([defaultElements]);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchContent();
    } else {
      setElements(defaultElements);
      setHistory([defaultElements]);
      setIsLoading(false);
    }
  }, [projectId]);

  // 요소 업데이트
  const updateElement = useCallback((id: string, updates: Partial<EditableElement>) => {
    setElements((prev) => {
      const newElements = prev.map((el) => (el.id === id ? { ...el, ...updates } : el));
      // Add to history
      setHistory((h) => [...h.slice(0, historyIndex + 1), newElements]);
      setHistoryIndex((i) => i + 1);
      return newElements;
    });
    setIsDirty(true);
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((i) => i - 1);
      setElements(history[historyIndex - 1]);
      setIsDirty(true);
    }
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((i) => i + 1);
      setElements(history[historyIndex + 1]);
      setIsDirty(true);
    }
  }, [historyIndex, history]);

  // 저장
  const handleSave = useCallback(async (action: 'UPDATE' | 'AUTO_SAVE' = 'UPDATE') => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elements,
          versionId: currentVersionId,
          action, // 히스토리에 기록될 액션 타입
        }),
      });

      if (!response.ok) throw new Error('저장 실패');

      const data = await response.json();
      if (data.data?.versionId) {
        setCurrentVersionId(data.data.versionId);
      }

      setIsDirty(false);
      onSaveSuccess?.();
      if (action === 'UPDATE') {
        toast({ title: '저장됨', description: '변경 사항이 저장되었습니다.' });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '변경 사항을 저장할 수 없습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [projectId, elements, currentVersionId, onSaveSuccess, toast]);

  // AI 채팅으로 수정
  const handleAiEdit = useCallback(async () => {
    console.log('[AI Edit Frontend] handleAiEdit called');
    console.log('[AI Edit Frontend] chatMessage:', chatMessage);
    if (!chatMessage.trim()) {
      console.log('[AI Edit Frontend] Empty message, returning');
      return;
    }

    const userMessage = chatMessage.trim();
    console.log('[AI Edit Frontend] Sending request with message:', userMessage);

    // Add user message to chat history
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, userChatMessage]);
    setChatMessage('');

    setIsAiLoading(true);
    try {
      const targetElement = selectedElementId
        ? elements.find((el) => el.id === selectedElementId)
        : null;

      console.log('[AI Edit Frontend] Making fetch request to /api/ai/edit');
      const response = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: userMessage,
          targetElement,
          allElements: selectedElementId ? undefined : elements,
        }),
      });

      console.log('[AI Edit Frontend] Response status:', response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Edit Frontend] Error response:', errorText);
        throw new Error(`AI 수정 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI Edit Response:', data);

      if (!data.success) {
        throw new Error(data.error || 'AI 수정 실패');
      }

      let aiResponseContent = '';
      if (data.updatedElement && selectedElementId) {
        updateElement(selectedElementId, data.updatedElement);
        aiResponseContent = '선택한 요소를 수정했습니다.';
      } else if (data.updatedElements) {
        setElements(data.updatedElements);
        setHistory((h) => [...h.slice(0, historyIndex + 1), data.updatedElements]);
        setHistoryIndex((i) => i + 1);
        setIsDirty(true);
        aiResponseContent = '페이지 전체를 수정했습니다.';
      }

      // Add AI response to chat history
      const aiChatMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponseContent || '수정을 완료했습니다.',
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, aiChatMessage]);

      toast({ title: '수정 완료', description: 'AI가 콘텐츠를 수정했습니다.' });
    } catch (error) {
      console.error('AI Edit Error:', error);
      // Add error message to chat history
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorChatMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `수정 중 오류가 발생했습니다: ${errorMessage}`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorChatMessage]);

      toast({
        variant: 'destructive',
        title: 'AI 수정 실패',
        description: errorMessage,
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [chatMessage, selectedElementId, elements, projectId, updateElement, historyIndex, toast]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isAiLoading]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave('UPDATE');
      }
      if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleSave]);

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">콘텐츠 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={historyIndex === 0}
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="다시 실행 (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Preview mode */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewMode('desktop')}
              title="데스크톱"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewMode('tablet')}
              title="태블릿"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewMode('mobile')}
              title="모바일"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History toggle */}
          <Button
            variant={isHistoryOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            히스토리
          </Button>

          {/* AI Chat toggle */}
          <Button
            variant={isChatOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI 편집
          </Button>

          {/* Save status */}
          {isDirty && <span className="text-sm text-muted-foreground">저장되지 않음</span>}

          {/* Save button */}
          <Button onClick={() => handleSave('UPDATE')} disabled={isSaving || !isDirty} size="sm" className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            저장
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <div
          ref={editorRef}
          className="flex-1 overflow-y-auto bg-muted/30 p-6"
          onClick={() => setSelectedElementId(null)}
        >
          <div className={cn('mx-auto bg-white shadow-lg rounded-lg transition-all duration-300', previewWidths[previewMode])}>
            <div className="p-8 space-y-6">
              {elements.map((element) => (
                <EditableElementComponent
                  key={element.id}
                  element={element}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => setSelectedElementId(element.id)}
                  onUpdate={(updates) => updateElement(element.id, updates)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* AI Chat panel */}
        {isChatOpen && (
          <div className="w-80 border-l bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">AI 편집</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsChatOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected element indicator */}
            {selectedElement && (
              <div className="px-4 py-2 bg-muted/50 border-b text-sm">
                <span className="text-muted-foreground">선택된 요소:</span>
                <span className="ml-2 font-medium">
                  {selectedElement.type === 'heading' ? '제목' : selectedElement.type === 'image' ? '이미지' : '텍스트'}
                </span>
              </div>
            )}

            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  {selectedElement
                    ? '선택한 요소를 어떻게 수정할까요?'
                    : '전체 페이지에 대해 수정 요청을 입력하세요.'}
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>수정 중...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={
                    selectedElement
                      ? '예: "더 짧게 줄여줘", "톤을 밝게 바꿔줘"'
                      : '예: "전체적으로 톤을 친근하게 바꿔줘"'
                  }
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiEdit();
                    }
                  }}
                />
              </div>
              <Button
                className="w-full mt-2 gap-2"
                onClick={handleAiEdit}
                disabled={!chatMessage.trim() || isAiLoading}
              >
                {isAiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isAiLoading ? '수정 중...' : '수정 요청'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* History Panel */}
      <HistoryPanel
        projectId={projectId}
        currentVersionId={currentVersionId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestoreComplete={(version) => {
          // 복원 완료 시 콘텐츠 새로고침
          setCurrentVersionId(version.id);
          if (version.content?.sections) {
            // sections을 elements 형식으로 변환이 필요할 수 있음
            // 우선은 페이지 새로고침으로 처리
            window.location.reload();
          }
          toast({
            title: '버전 복원 완료',
            description: `v${version.versionNumber} 버전으로 복원되었습니다.`,
          });
        }}
      />
    </div>
  );
}

// 개별 편집 가능 요소 컴포넌트
interface EditableElementComponentProps {
  element: EditableElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<EditableElement>) => void;
}

function EditableElementComponent({
  element,
  isSelected,
  onSelect,
  onUpdate,
}: EditableElementComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 편집 완료
  const handleBlur = () => {
    if (editValue !== element.content) {
      onUpdate({ content: editValue });
    }
    setIsEditing(false);
  };

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: 실제 이미지 업로드 구현
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdate({ content: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const styles: React.CSSProperties = element.styles
    ? (element.styles as React.CSSProperties)
    : {};

  // 텍스트/제목 요소
  if (element.type === 'text' || element.type === 'heading') {
    const Tag = element.type === 'heading' ? (`h${element.level || 2}` as keyof JSX.IntrinsicElements) : 'p';

    if (isEditing) {
      return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <Textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditValue(element.content);
                setIsEditing(false);
              }
            }}
            className="w-full min-h-[100px] resize-none border-2 border-primary"
            style={styles}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          'relative cursor-pointer rounded transition-all',
          isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-primary/30'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        <Tag style={styles} className="whitespace-pre-wrap">
          {element.content || '텍스트를 입력하세요...'}
        </Tag>
        {isSelected && (
          <div className="absolute -top-8 left-0 flex gap-1 bg-primary text-primary-foreground rounded px-2 py-1 text-xs">
            <Type className="h-3 w-3" />
            <span>더블클릭하여 편집</span>
          </div>
        )}
      </div>
    );
  }

  // 이미지 요소
  if (element.type === 'image') {
    return (
      <div
        className={cn(
          'relative cursor-pointer rounded transition-all',
          isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-primary/30'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {element.content ? (
          <img
            src={element.content}
            alt={element.alt || ''}
            style={styles}
            className="w-full rounded"
          />
        ) : (
          <div
            className="w-full h-64 bg-muted flex items-center justify-center rounded border-2 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p>클릭하여 이미지 업로드</p>
            </div>
          </div>
        )}
        {isSelected && element.content && (
          <div className="absolute -top-8 left-0 flex gap-2">
            <button
              className="flex items-center gap-1 bg-primary text-primary-foreground rounded px-2 py-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="h-3 w-3" />
              교체
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
