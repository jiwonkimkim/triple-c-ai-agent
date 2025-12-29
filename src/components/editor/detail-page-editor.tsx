'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore, type Section, type EditorBlock } from '@/stores/editor-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useToast } from '@/hooks/use-toast';
import { EditorToolbar } from './editor-toolbar';
import { EditorSection } from './editor-section';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, X, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DetailPageEditorProps {
  projectId: string;
  versionId?: string;
  initialSections?: Section[];
  onSaveSuccess?: () => void;
}

const previewWidths = {
  desktop: 'max-w-4xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
};

export function DetailPageEditor({
  projectId,
  versionId,
  initialSections,
  onSaveSuccess,
}: DetailPageEditorProps) {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AI Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    sections,
    selectedBlockId,
    selectedSectionId,
    isDirty,
    isSaving,
    lastSavedAt,
    historyIndex,
    history,
    setSections,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    selectBlock,
    selectSection,
    undo,
    redo,
    pushHistory,
  } = useEditorStore();

  // Initialize editor with initial sections or fetch from API
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/content`);
        if (!response.ok) throw new Error('Failed to fetch content');

        const data = await response.json();

        // Handle new image-overlay blocks format
        if (data.success && data.data?.imageOverlayBlocks?.length > 0) {
          const convertedSections: Section[] = [{
            id: `section-${Date.now()}`,
            name: '메인 섹션',
            blocks: data.data.imageOverlayBlocks.map((block: {
              id: string;
              type: 'image-overlay';
              src: string;
              alt: string;
              overlayTexts: Array<{
                id: string;
                type: string;
                content: string;
                style: {
                  x: number;
                  y: number;
                  fontSize: number;
                  fontWeight: string;
                  fontFamily: string;
                  color: string;
                  textShadow: boolean;
                  textAlign: string;
                  opacity: number;
                  rotation: number;
                };
                zIndex: number;
              }>;
              overlayGradient?: string;
            }) => ({
              id: block.id,
              type: 'image-overlay' as const,
              src: block.src,
              alt: block.alt,
              overlayTexts: block.overlayTexts,
              overlayGradient: block.overlayGradient,
            })),
          }];
          setSections(convertedSections);
        } else if (data.success && data.data?.elements?.length > 0) {
          // Legacy: Convert old elements format to image-overlay blocks
          const elements = data.data.elements;
          const imageOverlayBlocks: EditorBlock[] = [];

          // Group elements and convert to image-overlay blocks
          let currentImage = '';
          let currentTexts: Array<{
            id: string;
            type: 'headline' | 'subheadline' | 'body';
            content: string;
            style: {
              x: number;
              y: number;
              fontSize: number;
              fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
              fontFamily: string;
              color: string;
              textShadow: boolean;
              textAlign: 'left' | 'center' | 'right';
              opacity: number;
              rotation: number;
            };
            zIndex: number;
          }> = [];
          let zIndex = 1;

          for (const el of elements) {
            if (el.type === 'image') {
              // If we have accumulated texts, create a block
              if (currentTexts.length > 0 || currentImage) {
                imageOverlayBlocks.push({
                  id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: 'image-overlay',
                  src: currentImage,
                  alt: '',
                  overlayTexts: currentTexts.length > 0 ? currentTexts : [{
                    id: `text-${Date.now()}`,
                    type: 'headline',
                    content: '텍스트를 입력하세요',
                    style: {
                      x: 50, y: 50, fontSize: 32, fontWeight: 'bold',
                      fontFamily: 'Pretendard, sans-serif', color: '#ffffff',
                      textShadow: true, textAlign: 'center', opacity: 100, rotation: 0,
                    },
                    zIndex: 1,
                  }],
                  overlayGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
                } as EditorBlock);
                currentTexts = [];
                zIndex = 1;
              }
              currentImage = el.content;
            } else if (el.type === 'heading') {
              currentTexts.push({
                id: el.id,
                type: 'headline',
                content: el.content,
                style: {
                  x: 50,
                  y: 20 + (zIndex * 15),
                  fontSize: el.level === 1 ? 48 : 36,
                  fontWeight: 'bold',
                  fontFamily: 'Pretendard, sans-serif',
                  color: '#ffffff',
                  textShadow: true,
                  textAlign: 'center',
                  opacity: 100,
                  rotation: 0,
                },
                zIndex: zIndex++,
              });
            } else if (el.type === 'text') {
              currentTexts.push({
                id: el.id,
                type: 'body',
                content: el.content,
                style: {
                  x: 50,
                  y: 20 + (zIndex * 15),
                  fontSize: 18,
                  fontWeight: 'normal',
                  fontFamily: 'Pretendard, sans-serif',
                  color: '#ffffff',
                  textShadow: true,
                  textAlign: 'center',
                  opacity: 100,
                  rotation: 0,
                },
                zIndex: zIndex++,
              });
            }
          }

          // Don't forget the last block
          if (currentTexts.length > 0 || currentImage) {
            imageOverlayBlocks.push({
              id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'image-overlay',
              src: currentImage,
              alt: '',
              overlayTexts: currentTexts.length > 0 ? currentTexts : [{
                id: `text-${Date.now()}`,
                type: 'headline',
                content: '텍스트를 입력하세요',
                style: {
                  x: 50, y: 50, fontSize: 32, fontWeight: 'bold',
                  fontFamily: 'Pretendard, sans-serif', color: '#ffffff',
                  textShadow: true, textAlign: 'center', opacity: 100, rotation: 0,
                },
                zIndex: 1,
              }],
              overlayGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
            } as EditorBlock);
          }

          const convertedSections: Section[] = [{
            id: `section-${Date.now()}`,
            name: '메인 섹션',
            blocks: imageOverlayBlocks,
          }];
          setSections(convertedSections);
        } else if (initialSections && initialSections.length > 0) {
          setSections(initialSections);
        } else {
          // Create default section with image-overlay block
          addSection({
            name: '히어로 섹션',
            blocks: [{
              id: `block-${Date.now()}`,
              type: 'image-overlay',
              src: '',
              alt: '',
              overlayTexts: [{
                id: `text-${Date.now()}`,
                type: 'headline',
                content: '헤드라인을 입력하세요',
                style: {
                  x: 50,
                  y: 40,
                  fontSize: 48,
                  fontWeight: 'bold',
                  fontFamily: 'Pretendard, sans-serif',
                  color: '#ffffff',
                  textShadow: true,
                  textAlign: 'center',
                  opacity: 100,
                  rotation: 0,
                },
                zIndex: 1,
              }],
              overlayGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
            }] as EditorBlock[],
          });
        }
        pushHistory();
      } catch (error) {
        console.error('Failed to load content:', error);
        // Fallback to default section with image-overlay block
        if (initialSections && initialSections.length > 0) {
          setSections(initialSections);
        } else {
          addSection({
            name: '히어로 섹션',
            blocks: [{
              id: `block-${Date.now()}`,
              type: 'image-overlay',
              src: '',
              alt: '',
              overlayTexts: [{
                id: `text-${Date.now()}`,
                type: 'headline',
                content: '헤드라인을 입력하세요',
                style: {
                  x: 50,
                  y: 40,
                  fontSize: 48,
                  fontWeight: 'bold',
                  fontFamily: 'Pretendard, sans-serif',
                  color: '#ffffff',
                  textShadow: true,
                  textAlign: 'center',
                  opacity: 100,
                  rotation: 0,
                },
                zIndex: 1,
              }],
              overlayGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
            }] as EditorBlock[],
          });
        }
        pushHistory();
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchContent();
    } else {
      if (initialSections && initialSections.length > 0) {
        setSections(initialSections);
      } else {
        addSection({
          name: '히어로 섹션',
          blocks: [{
            id: `block-${Date.now()}`,
            type: 'image-overlay',
            src: '',
            alt: '',
            overlayTexts: [{
              id: `text-${Date.now()}`,
              type: 'headline',
              content: '헤드라인을 입력하세요',
              style: {
                x: 50,
                y: 40,
                fontSize: 48,
                fontWeight: 'bold',
                fontFamily: 'Pretendard, sans-serif',
                color: '#ffffff',
                textShadow: true,
                textAlign: 'center',
                opacity: 100,
                rotation: 0,
              },
              zIndex: 1,
            }],
            overlayGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
          }] as EditorBlock[],
        });
      }
      pushHistory();
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Auto-save functionality
  const { save } = useAutoSave({
    projectId,
    versionId,
    interval: 30000, // 30 seconds
    onSave: (success) => {
      if (success) {
        onSaveSuccess?.();
      } else {
        toast({
          variant: 'destructive',
          title: '자동 저장 실패',
          description: '변경 사항을 저장할 수 없습니다. 수동으로 저장해 주세요.',
        });
      }
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Delete selected block: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId && selectedSectionId) {
        // Only delete if not editing a text input
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteBlock(selectedSectionId, selectedBlockId);
        }
      }
      // Deselect: Escape
      if (e.key === 'Escape') {
        selectBlock(null);
        selectSection(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedBlockId, selectedSectionId, deleteBlock, selectBlock, selectSection]);

  const handleAddSection = useCallback(() => {
    addSection({
      name: `섹션 ${sections.length + 1}`,
      blocks: [],
    });
  }, [addSection, sections.length]);

  const handleDuplicateSection = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      if (section) {
        addSection({
          name: `${section.name} (복사본)`,
          blocks: JSON.parse(JSON.stringify(section.blocks)).map((b: EditorBlock) => ({
            ...b,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })),
          backgroundColor: section.backgroundColor,
          padding: section.padding,
        });
      }
    },
    [sections, addSection]
  );

  const handleMoveSection = useCallback(
    (sectionIndex: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
      if (newIndex >= 0 && newIndex < sections.length) {
        reorderSections(sectionIndex, newIndex);
      }
    },
    [sections.length, reorderSections]
  );

  const handleExport = useCallback(
    async (format: 'html' | 'json') => {
      try {
        if (format === 'json') {
          const blob = new Blob([JSON.stringify(sections, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `detail-page-${projectId}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // Generate HTML export
          const response = await fetch(`/api/projects/${projectId}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections, format: 'html' }),
          });

          if (!response.ok) throw new Error('Export failed');

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `detail-page-${projectId}.html`;
          a.click();
          URL.revokeObjectURL(url);
        }

        toast({
          title: '내보내기 완료',
          description: `상세페이지가 ${format.toUpperCase()} 형식으로 내보내졌습니다.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: '내보내기 실패',
          description: '상세페이지를 내보낼 수 없습니다. 다시 시도해 주세요.',
        });
      }
    },
    [sections, projectId, toast]
  );

  const handlePreview = useCallback(() => {
    setIsPreviewOpen(true);
    // Open preview in new tab
    window.open(`/dashboard/projects/${projectId}/preview`, '_blank');
  }, [projectId]);

  // AI Chat handler
  const handleAiEdit = useCallback(async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
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
      // Get selected block info
      const selectedBlock = selectedBlockId
        ? sections.flatMap(s => s.blocks).find(b => b.id === selectedBlockId)
        : null;

      const response = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: userMessage,
          targetElement: selectedBlock,
          allElements: selectedBlock ? undefined : sections.flatMap(s => s.blocks),
        }),
      });

      if (!response.ok) throw new Error(`AI 수정 실패: ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'AI 수정 실패');

      let aiResponseContent = '';

      if (data.updatedElement && selectedBlockId) {
        // Update single block
        const sectionWithBlock = sections.find(s => s.blocks.some(b => b.id === selectedBlockId));
        if (sectionWithBlock) {
          updateBlock(sectionWithBlock.id, selectedBlockId, data.updatedElement);
        }
        aiResponseContent = '선택한 블록을 수정했습니다.';
      } else if (data.updatedElements) {
        // Update all blocks - reconstruct sections
        const updatedSections = sections.map(section => ({
          ...section,
          blocks: data.updatedElements.filter((el: EditorBlock) =>
            section.blocks.some(b => b.id === el.id)
          ),
        }));
        setSections(updatedSections);
        aiResponseContent = '페이지 전체를 수정했습니다.';
      }

      const aiChatMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponseContent || '수정을 완료했습니다.',
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, aiChatMessage]);
      toast({ title: '수정 완료', description: 'AI가 콘텐츠를 수정했습니다.' });
    } catch (error) {
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
  }, [chatMessage, selectedBlockId, sections, projectId, updateBlock, setSections, toast]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isAiLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">에디터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // Get selected block for chat context
  const selectedBlock = selectedBlockId
    ? sections.flatMap(s => s.blocks).find(b => b.id === selectedBlockId)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b">
        <EditorToolbar
          isDirty={isDirty}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          previewMode={previewMode}
          onUndo={undo}
          onRedo={redo}
          onSave={save}
          onPreview={handlePreview}
          onExport={handleExport}
          onAddSection={handleAddSection}
          onSetPreviewMode={setPreviewMode}
        />
        {/* AI Edit Button */}
        <div className="pr-4">
          <Button
            variant={isChatOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI 편집
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <div
          className="flex-1 overflow-y-auto bg-muted/30 p-6"
          onClick={() => {
            selectBlock(null);
            selectSection(null);
          }}
        >
          <div className={cn('mx-auto transition-all duration-300', previewWidths[previewMode])}>
            <div className="space-y-6">
              {sections.map((section, index) => (
                <EditorSection
                  key={section.id}
                  section={section}
                  sectionIndex={index}
                  totalSections={sections.length}
                  selectedBlockId={selectedBlockId}
                  isSelected={selectedSectionId === section.id}
                  onSelectSection={() => selectSection(section.id)}
                  onSelectBlock={selectBlock}
                  onUpdateSection={(updates) => updateSection(section.id, updates)}
                  onDeleteSection={() => deleteSection(section.id)}
                  onMoveSection={(direction) => handleMoveSection(index, direction)}
                  onDuplicateSection={() => handleDuplicateSection(section.id)}
                  onAddBlock={(block, blockIndex) => addBlock(section.id, block, blockIndex)}
                  onUpdateBlock={(blockId, updates) => updateBlock(section.id, blockId, updates)}
                  onDeleteBlock={(blockId) => deleteBlock(section.id, blockId)}
                  onReorderBlocks={(start, end) => reorderBlocks(section.id, start, end)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* AI Chat Panel */}
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

            {/* Selected block indicator */}
            {selectedBlock && (
              <div className="px-4 py-2 bg-muted/50 border-b text-sm">
                <span className="text-muted-foreground">선택된 블록:</span>
                <span className="ml-2 font-medium">
                  {selectedBlock.type === 'image-overlay' ? '이미지+텍스트' : selectedBlock.type}
                </span>
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  {selectedBlock
                    ? '선택한 블록을 어떻게 수정할까요?\n예: "텍스트를 더 짧게", "톤을 밝게"'
                    : '페이지 전체에 대해 수정 요청을 입력하세요.\n예: "전체적으로 톤을 친근하게 바꿔줘"'}
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
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
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={
                  selectedBlock
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
    </div>
  );
}
