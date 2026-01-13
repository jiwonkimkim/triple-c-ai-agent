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
import { Loader2, Sparkles, X, Send, Type, ImageIcon, Layers, Layout, Plus, Monitor, Tablet, Smartphone, Download, Save } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TemplateImportModal } from './template-import-modal';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 섹션 사이 인라인 추가 버튼 컴포넌트
function SectionAddDivider({ onAdd }: { onAdd: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative h-6 flex items-center justify-center group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onAdd();
      }}
    >
      <div
        className={cn(
          'absolute inset-x-4 flex items-center justify-center transition-all duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex-1 h-px bg-primary/40" />
        <button
          className="mx-2 px-3 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/30 flex items-center gap-1 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <Plus className="h-3 w-3" />
          섹션 추가
        </button>
        <div className="flex-1 h-px bg-primary/40" />
      </div>
    </div>
  );
}

interface SectionPromptUpdate {
  sectionIndex: number;
  sectionType: string;
  imageUrl: string;
  promptComponents?: {
    orchestrationPrompt?: string;
    categoryTemplatePrompt?: string;
    i2iSystemPrompt?: string;
    fixedPrompt?: string;
    dynamicPrompt?: string;
  };
  // ★★★ API에서 반환한 전체 devPrompts (기존 섹션 + 새 섹션 모두 포함)
  updatedDevPrompts?: {
    textGeneration: { systemPrompt: string; userPrompt: string };
    sectionImagePrompts: Array<{
      sectionType: string;
      imagePrompt: string;
      [key: string]: unknown;
    }>;
  };
}

interface DetailPageEditorProps {
  projectId: string;
  versionId?: string;
  initialSections?: Section[];
  onSaveSuccess?: () => void;
  onSectionPromptUpdated?: (update: SectionPromptUpdate) => void;
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
  onSectionPromptUpdated,
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
  const [editType, setEditType] = useState<'text' | 'image' | 'both'>('text');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Template modal state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Section regeneration state
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);

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
    insertSectionAt,
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
    reset,  // ★ 프로젝트 전환 시 store 초기화용
    // pushHistory is called internally by setSections/addSection, no need to call it manually
  } = useEditorStore();

  // ★★★ 프로젝트 전환 시 store 초기화 (다른 프로젝트 데이터 오염 방지)
  // projectId가 변경되면 이전 프로젝트 저장 후 store 초기화
  const prevProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prevProjectId = prevProjectIdRef.current;

    // 이전 프로젝트가 있고, 프로젝트가 변경되었을 때
    if (prevProjectId && prevProjectId !== projectId) {
      console.log(`[Editor] Project switching from ${prevProjectId} to ${projectId}`);

      // 이전 프로젝트에 저장되지 않은 변경사항이 있으면 저장 시도
      const { sections: prevSections, isDirty: wasDirty } = useEditorStore.getState();
      if (wasDirty && prevSections.length > 0) {
        console.log(`[Editor] Saving unsaved changes for ${prevProjectId} before switching`);
        // sendBeacon으로 비동기 저장 (페이지 이동 중에도 동작)
        navigator.sendBeacon?.(
          `/api/projects/${prevProjectId}/drafts`,
          JSON.stringify({ content: prevSections })
        );
      }

      // store 초기화
      reset();
    }

    prevProjectIdRef.current = projectId;
  }, [projectId, reset]);

  // Initialize editor with initial sections or fetch from API
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/content`);
        if (!response.ok) throw new Error('Failed to fetch content');

        const data = await response.json();

        // Handle new editor sections format (each AI section as separate editor section)
        if (data.success && data.data?.editorSections?.length > 0) {
          const convertedSections: Section[] = data.data.editorSections.map((section: {
            id: string;
            name: string;
            blocks: Array<{
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
            }>;
          }) => ({
            id: section.id,
            name: section.name,
            blocks: section.blocks.map(block => ({
              id: block.id,
              type: 'image-overlay' as const,
              src: block.src,
              alt: block.alt,
              overlayTexts: block.overlayTexts,
              overlayGradient: block.overlayGradient,
            })),
          }));
          setSections(convertedSections);
        } else if (data.success && data.data?.imageOverlayBlocks?.length > 0) {
          // Legacy: Handle old image-overlay blocks format (single section)
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
          // setSections already calls pushHistory internally
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
                  overlayGradient: undefined,
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
              overlayGradient: undefined,
            } as EditorBlock);
          }

          const convertedSections: Section[] = [{
            id: `section-${Date.now()}`,
            name: '메인 섹션',
            blocks: imageOverlayBlocks,
          }];
          // setSections already calls pushHistory internally
          setSections(convertedSections);
        } else if (initialSections && initialSections.length > 0) {
          // setSections already calls pushHistory internally
          setSections(initialSections);
        } else {
          // Create default section with image-overlay block
          // addSection already calls pushHistory internally
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
              overlayGradient: undefined,
            }] as EditorBlock[],
          });
        }
        // Removed duplicate pushHistory() - store methods already call it internally
      } catch (error) {
        console.error('Failed to load content:', error);
        // Fallback to default section with image-overlay block
        if (initialSections && initialSections.length > 0) {
          // setSections already calls pushHistory internally
          setSections(initialSections);
        } else {
          // addSection already calls pushHistory internally
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
              overlayGradient: undefined,
            }] as EditorBlock[],
          });
        }
        // Removed duplicate pushHistory() - store methods already call it internally
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchContent();
    } else {
      if (initialSections && initialSections.length > 0) {
        // setSections already calls pushHistory internally
        setSections(initialSections);
      } else {
        // addSection already calls pushHistory internally
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
            overlayGradient: undefined,
          }] as EditorBlock[],
        });
      }
      // Removed duplicate pushHistory() - store methods already call it internally
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

  const handleInsertSectionAt = useCallback((index: number) => {
    insertSectionAt({
      name: `섹션 ${sections.length + 1}`,
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
        overlayGradient: undefined,
      }] as EditorBlock[],
    }, index);
  }, [insertSectionAt, sections.length]);

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

  // ★★★ API 오버레이 형식 → 에디터 형식 변환 (fontFamily 포함!)
  const convertApiOverlayToEditorFormat = (
    apiOverlay: {
      headline?: { text: string; x: number; y: number; fontSize: number; fontWeight: string; fontFamily?: string; color: string; textAlign?: string } | string;
      subheadline?: { text: string; x: number; y: number; fontSize: number; fontWeight: string; fontFamily?: string; color: string; textAlign?: string } | string;
      body?: { text: string; x: number; y: number; fontSize: number; fontWeight: string; fontFamily?: string; color: string; textAlign?: string } | string;
      statistics?: Array<{ text: string; x: number; y: number; fontSize: number; fontWeight: string; fontFamily?: string; color: string } | string>;
      cta?: { text: string; x: number; y: number; fontSize: number; fontWeight: string; fontFamily?: string; color: string; textAlign?: string } | string;
    },
    sectionId: string
  ): Array<{
    id: string;
    type: 'headline' | 'subheadline' | 'body' | 'statistic' | 'cta';
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
      width?: number;
    };
    zIndex: number;
  }> => {
    const result: Array<{
      id: string;
      type: 'headline' | 'subheadline' | 'body' | 'statistic' | 'cta';
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
        width?: number;
      };
      zIndex: number;
    }> = [];
    let zIndex = 1;

    // ★ 흰색 계열인지 확인 (흰색만 그림자 적용)
    const isWhiteColor = (color?: string): boolean => {
      if (!color) return true;
      const c = color.toLowerCase().trim();
      if (c === '#ffffff' || c === '#fff' || c === 'white') return true;
      if (c.startsWith('#')) {
        const hex = c.replace('#', '');
        if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          return (r + g + b) / 3 > 200;
        }
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return (r + g + b) / 3 > 200;
        }
      }
      return false;
    };

    const parseItem = (
      item: { text: string; x: number; y: number; fontSize: number; fontWeight: string; fontFamily?: string; color: string; textAlign?: string } | string | undefined,
      type: 'headline' | 'subheadline' | 'body' | 'statistic' | 'cta',
      defaultStyle: { x: number; y: number; fontSize: number; align: 'left' | 'center' | 'right' }
    ) => {
      if (!item) return null;
      const isString = typeof item === 'string';
      const itemColor = isString ? '#333333' : item.color;
      return {
        id: `${sectionId}-${type}-${Date.now()}`,
        type,
        content: isString ? item : item.text,
        style: {
          x: isString ? defaultStyle.x : item.x,
          y: isString ? defaultStyle.y : item.y,
          fontSize: isString ? defaultStyle.fontSize : item.fontSize,
          fontWeight: (isString ? 'medium' : item.fontWeight) as 'normal' | 'medium' | 'semibold' | 'bold',
          fontFamily: isString ? 'Pretendard, sans-serif' : (item.fontFamily || 'Pretendard, sans-serif'),
          color: itemColor,
          textShadow: isWhiteColor(itemColor),  // ★ 흰색만 그림자 적용
          textAlign: (isString ? defaultStyle.align : (item.textAlign || defaultStyle.align)) as 'left' | 'center' | 'right',
          opacity: 100,
          rotation: 0,
          width: type === 'headline' || type === 'subheadline' ? 80 : undefined,
        },
        zIndex: zIndex++,
      };
    };

    // Headline
    const headline = parseItem(apiOverlay.headline, 'headline', { x: 50, y: 8, fontSize: 28, align: 'center' });
    if (headline) result.push(headline);

    // Subheadline
    const subheadline = parseItem(apiOverlay.subheadline, 'subheadline', { x: 50, y: 18, fontSize: 16, align: 'center' });
    if (subheadline) result.push(subheadline);

    // Body
    const body = parseItem(apiOverlay.body, 'body', { x: 50, y: 85, fontSize: 14, align: 'center' });
    if (body) result.push(body);

    // Statistics
    if (apiOverlay.statistics && apiOverlay.statistics.length > 0) {
      apiOverlay.statistics.forEach((stat, idx) => {
        const isString = typeof stat === 'string';
        const statColor = isString ? '#ffffff' : stat.color;
        result.push({
          id: `${sectionId}-stat-${idx}-${Date.now()}`,
          type: 'statistic',
          content: isString ? stat : stat.text,
          style: {
            x: isString ? 50 : stat.x,
            y: isString ? 50 + (idx * 12) : stat.y,
            fontSize: isString ? 48 : stat.fontSize,
            fontWeight: (isString ? 'bold' : stat.fontWeight) as 'normal' | 'medium' | 'semibold' | 'bold',
            fontFamily: isString ? 'Montserrat, sans-serif' : (stat.fontFamily || 'Montserrat, sans-serif'),
            color: statColor,
            textShadow: isWhiteColor(statColor),  // ★ 흰색만 그림자 적용
            textAlign: 'center',
            opacity: 100,
            rotation: 0,
          },
          zIndex: zIndex++,
        });
      });
    }

    // CTA
    const cta = parseItem(apiOverlay.cta, 'cta', { x: 50, y: 90, fontSize: 16, align: 'center' });
    if (cta) result.push(cta);

    return result;
  };

  // 섹션 이미지 재생성 핸들러
  const handleRegenerateSection = useCallback(async (sectionId: string, sectionIndex: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setRegeneratingSectionId(sectionId);

    // ID에서 섹션 타입 추출 (예: "section-MAIN-abc123" → "MAIN")
    // 형식: section-{TYPE}-{uuid} 또는 section-{TYPE}_{index}-{uuid}
    const extractSectionType = (id: string): string => {
      const match = id.match(/section-([A-Z_0-9]+)/i);
      if (match) {
        const rawType = match[1].toUpperCase();

        // ★★★ 텍스트 배경 섹션은 전체 타입 유지 (TEXT_BANNER_1, KEY_MESSAGE_2 등)
        // 이 섹션들은 순수 색상 배경만 생성해야 함
        const textBackgroundPrefixes = ['TEXT_BANNER', 'KEY_MESSAGE', 'BENEFIT_HIGHLIGHT', 'DIVIDER_VISUAL'];
        for (const prefix of textBackgroundPrefixes) {
          if (rawType.startsWith(prefix)) {
            console.log(`[Section Regenerate] ★ Text background section detected: ${rawType}`);
            return rawType; // 전체 타입 반환 (예: TEXT_BANNER_1)
          }
        }

        // 일반 섹션: 첫 번째 부분만 추출 (HERO_LIP_1 → HERO)
        return rawType.split('_')[0];
      }
      // fallback: 이름 기반 매핑
      const nameToType: Record<string, string> = {
        '메인': 'MAIN',
        '히어로': 'HERO',
        '특징': 'FEATURES',
        '사용법': 'HOW_TO_USE',
        '후기': 'SOCIAL_PROOF',
        'faq': 'FAQ',
      };
      return nameToType[section.name.toLowerCase()] || section.name;
    };

    const sectionType = extractSectionType(sectionId);
    console.log(`[Section Regenerate] sectionId: ${sectionId}, extracted type: ${sectionType}`);

    try {
      const response = await fetch('/api/generate/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sectionType,
          sectionIndex,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '섹션 재생성 실패');
      }

      const data = await response.json();
      if (!data.success || !data.data?.imageUrl) {
        throw new Error('이미지 생성에 실패했습니다.');
      }

      // 섹션의 첫 번째 이미지 블록 업데이트
      const imageBlock = section.blocks.find(b => b.type === 'image-overlay' || b.type === 'image');
      if (imageBlock && imageBlock.type === 'image-overlay') {
        // ★★★ 오버레이 텍스트도 함께 업데이트 (NEW!)
        const newOverlayTexts = data.data.overlayText
          ? convertApiOverlayToEditorFormat(data.data.overlayText, sectionId)
          : imageBlock.overlayTexts; // 오버레이 없으면 기존 것 유지

        updateBlock(sectionId, imageBlock.id, {
          ...imageBlock,
          src: data.data.imageUrl,
          overlayTexts: newOverlayTexts,
        });

        console.log(`[Section Regenerate] Updated overlay texts:`, newOverlayTexts.length, 'items');
      } else if (imageBlock) {
        // 일반 이미지 블록
        updateBlock(sectionId, imageBlock.id, {
          ...imageBlock,
          src: data.data.imageUrl,
        });
      }

      // ★ 프롬프트 뷰어 업데이트를 위해 콜백 호출
      if (onSectionPromptUpdated) {
        onSectionPromptUpdated({
          sectionIndex,
          sectionType,
          imageUrl: data.data.imageUrl,
          promptComponents: data.data.promptComponents,
          // ★★★ API에서 반환한 전체 devPrompts (기존 섹션 포함)
          updatedDevPrompts: data.data.updatedDevPrompts,
        });
      }

      toast({
        title: '재생성 완료',
        description: `${section.name} 섹션 이미지와 텍스트가 새로 생성되었습니다.`,
      });
    } catch (error) {
      console.error('[Section Regenerate] Error:', error);
      toast({
        variant: 'destructive',
        title: '재생성 실패',
        description: error instanceof Error ? error.message : '섹션 이미지 재생성에 실패했습니다.',
      });
    } finally {
      setRegeneratingSectionId(null);
    }
  }, [sections, projectId, updateBlock, toast, onSectionPromptUpdated]);

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
          editType, // 편집 유형 전송
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
        // 이미지 편집 여부에 따른 응답 메시지
        if (data.editedImage) {
          aiResponseContent = data.updatedElement.overlayTexts
            ? '선택한 블록의 이미지와 텍스트를 수정했습니다.'
            : '선택한 블록의 이미지를 새로 생성했습니다.';
        } else {
          aiResponseContent = '선택한 블록의 텍스트를 수정했습니다.';
        }
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
  }, [chatMessage, selectedBlockId, sections, projectId, updateBlock, setSections, toast, editType]);

  // Template import handler - convert old elements to image-overlay blocks
  const handleTemplateImport = useCallback((elements: Array<{
    id: string;
    type: 'text' | 'image' | 'heading';
    content: string;
    styles?: Record<string, string>;
    level?: number;
    alt?: string;
  }>) => {
    // Group elements into image-overlay blocks
    const imageOverlayBlocks: EditorBlock[] = [];
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
    let currentImage = '';
    let zIndex = 1;

    const createBlock = () => {
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
          overlayGradient: undefined,
        } as EditorBlock);
        currentTexts = [];
        currentImage = '';
        zIndex = 1;
      }
    };

    for (const el of elements) {
      if (el.type === 'image') {
        createBlock();
        currentImage = el.content;
      } else if (el.type === 'heading') {
        currentTexts.push({
          id: el.id,
          type: 'headline',
          content: el.content,
          style: {
            x: 50,
            y: 15 + (zIndex * 12),
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
            y: 15 + (zIndex * 12),
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
    createBlock();

    // Update sections
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: '템플릿 섹션',
      blocks: imageOverlayBlocks,
    };
    // setSections already calls pushHistory internally
    setSections([newSection]);

    toast({
      title: '템플릿 적용 완료',
      description: `${imageOverlayBlocks.length}개 블록이 생성되었습니다.`,
    });
  }, [setSections, toast]);

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
          onUndo={undo}
          onRedo={redo}
          onPreview={handlePreview}
        />
        {/* Template, AI Edit, Export, Save Buttons */}
        <div className="pr-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplateModalOpen(true)}
            className="w-24 justify-center gap-2"
          >
            <Layout className="h-4 w-4" />
            템플릿
          </Button>
          <Button
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-24 justify-center gap-2 text-white font-medium rounded-lg shadow-[0_0_20px_#eee] transition-all duration-500 bg-[length:200%_auto] bg-[linear-gradient(to_right,#ddd6f3_0%,#faaca8_51%,#ddd6f3_100%)] hover:bg-[position:right_center]"
          >
            <Sparkles className="h-4 w-4" />
            AI 편집
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-24 justify-center gap-2">
                <Download className="h-4 w-4" />
                내보내기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('html')}>
                HTML로 내보내기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                JSON으로 내보내기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={() => save(true)} disabled={isSaving || !isDirty} className="w-24 justify-center gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            저장
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor canvas */}
        <div
          className="relative flex-1 overflow-y-auto bg-muted/30 p-6"
          onClick={() => {
            selectBlock(null);
            selectSection(null);
          }}
        >
          {/* Floating viewport toggle - bottom right (hide when AI chat is open) */}
          {!isChatOpen && (
          <div className="fixed bottom-6 right-6 z-30 flex items-center gap-1 rounded-lg border bg-background/95 backdrop-blur-sm p-1.5 shadow-lg">
            <button
              className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
                previewMode === 'desktop'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewMode('desktop');
              }}
              title="데스크톱 보기"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
                previewMode === 'tablet'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewMode('tablet');
              }}
              title="태블릿 보기"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              className={cn(
                'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
                previewMode === 'mobile'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewMode('mobile');
              }}
              title="모바일 보기"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
          )}
          <div className={cn('mx-auto transition-all duration-300', previewWidths[previewMode])}>
            <div className="space-y-0">
              {/* MAIN 섹션 판별: 첫 번째 섹션이 메인인지 확인 */}
              {(() => {
                const firstSection = sections[0];
                const isFirstSectionMain = firstSection && (
                  firstSection.name === '메인' ||
                  firstSection.id.includes('MAIN') ||
                  firstSection.name?.toLowerCase().includes('main')
                );

                return (
                  <>
                    {/* 맨 위 섹션 추가 버튼 - MAIN 섹션이 있으면 숨김 */}
                    {!isFirstSectionMain && (
                      <SectionAddDivider onAdd={() => handleInsertSectionAt(0)} />
                    )}

                    {sections.map((section, index) => {
                      // 해당 섹션이 MAIN인지 확인
                      const isMain = section.name === '메인' ||
                        section.id.includes('MAIN') ||
                        section.name?.toLowerCase().includes('main');

                      return (
                        <div key={section.id} className={isMain ? 'mb-6' : ''}>
                          <EditorSection
                            section={section}
                            sectionIndex={index}
                            totalSections={sections.length}
                            selectedBlockId={selectedBlockId}
                            isSelected={selectedSectionId === section.id}
                            isMain={isMain}
                            isRegenerating={regeneratingSectionId === section.id}
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
                            onRegenerateSection={() => handleRegenerateSection(section.id, index)}
                          />
                          {/* 각 섹션 아래 섹션 추가 버튼 - MAIN 섹션 바로 아래는 숨김 */}
                          {!isMain && (
                            <SectionAddDivider onAdd={() => handleInsertSectionAt(index + 1)} />
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
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

            {/* Edit type selector - only show for image-overlay blocks */}
            {selectedBlock?.type === 'image-overlay' && (
              <div className="px-4 py-2 border-b">
                <div className="text-xs text-muted-foreground mb-2">편집 대상:</div>
                <div className="flex gap-1">
                  <Button
                    variant={editType === 'text' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => setEditType('text')}
                  >
                    <Type className="h-3 w-3" />
                    텍스트
                  </Button>
                  <Button
                    variant={editType === 'image' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => setEditType('image')}
                  >
                    <ImageIcon className="h-3 w-3" />
                    이미지
                  </Button>
                  <Button
                    variant={editType === 'both' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => setEditType('both')}
                  >
                    <Layers className="h-3 w-3" />
                    둘 다
                  </Button>
                </div>
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8 whitespace-pre-line">
                  {!selectedBlock
                    ? '페이지 전체에 대해 수정 요청을 입력하세요.\n예: "전체적으로 톤을 친근하게 바꿔줘"'
                    : editType === 'image'
                    ? '이미지를 어떻게 바꿀까요?\n예: "밝은 분위기로", "화려한 배경으로"'
                    : editType === 'both'
                    ? '이미지와 텍스트를 함께 수정합니다.\n예: "더 세련된 느낌으로"'
                    : '텍스트를 어떻게 수정할까요?\n예: "더 짧게", "톤을 밝게"'}
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
                  !selectedBlock
                    ? '예: "전체적으로 톤을 친근하게 바꿔줘"'
                    : editType === 'image'
                    ? '예: "밝은 분위기로 변경해줘"'
                    : editType === 'both'
                    ? '예: "더 세련되게 바꿔줘"'
                    : '예: "더 짧게 줄여줘"'
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

      {/* Template Import Modal */}
      <TemplateImportModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onImport={handleTemplateImport}
        projectId={projectId}
      />
    </div>
  );
}
