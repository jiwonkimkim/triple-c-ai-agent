'use client';

import { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BlockRenderer } from './block-renderer';
import type { Section, EditorBlock, BlockType } from '@/stores/editor-store';

// 블록 사이 인라인 추가 버튼 컴포넌트
function BlockAddDivider({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative h-4 flex items-center justify-center group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'absolute inset-x-2 flex items-center justify-center transition-all duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex-1 h-px bg-primary/30" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="mx-2 px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/30 flex items-center gap-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="h-3 w-3" />
              블록 추가
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            {blockTypes.map((item) => (
              <DropdownMenuItem
                key={item.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(item.type);
                }}
              >
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1 h-px bg-primary/30" />
      </div>
    </div>
  );
}

interface EditorSectionProps {
  section: Section;
  sectionIndex: number;
  totalSections: number;
  selectedBlockId: string | null;
  isSelected: boolean;
  /** MAIN 섹션인지 여부 - 블록 추가 버튼 숨김, 특별 디자인 적용 */
  isMain?: boolean;
  /** 섹션 이미지 재생성 중 여부 */
  isRegenerating?: boolean;
  /** 미리보기 모드 (텍스트 크기 비율 조절용) */
  previewMode?: 'desktop' | 'tablet' | 'mobile';
  /** ★★★ 우측 패널 열림 상태 콜백 ★★★ */
  onRightPanelChange?: (isOpen: boolean) => void;
  onSelectSection: () => void;
  onSelectBlock: (blockId: string | null) => void;
  onUpdateSection: (updates: Partial<Omit<Section, 'id'>>) => void;
  onDeleteSection: () => void;
  onMoveSection: (direction: 'up' | 'down') => void;
  onDuplicateSection: () => void;
  onAddBlock: (block: Omit<EditorBlock, 'id'>, index?: number) => void;
  onUpdateBlock: (blockId: string, updates: Partial<EditorBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  onReorderBlocks: (startIndex: number, endIndex: number) => void;
  /** 섹션 이미지 재생성 핸들러 */
  onRegenerateSection?: () => void;
}

const blockTypes: { type: BlockType; label: string; description: string }[] = [
  { type: 'image-overlay', label: '이미지 + 텍스트', description: '이미지 위에 텍스트를 자유롭게 배치' },
  { type: 'spacer', label: '여백', description: '섹션 간 여백 추가' },
  { type: 'divider', label: '구분선', description: '가로 구분선' },
];

const defaultBlockContent: Record<BlockType, Omit<EditorBlock, 'id'>> = {
  heading: { type: 'heading', level: 2, content: '' },
  text: { type: 'text', content: '' },
  image: { type: 'image', src: '', alt: '' },
  'image-overlay': {
    type: 'image-overlay',
    src: '',
    alt: '',
    overlayTexts: [
      {
        id: `overlay-default-${Date.now()}`,
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
      },
    ],
    // 기본 테마는 그라데이션 없음 (투명)
    overlayGradient: undefined,
  },
  button: { type: 'button', text: 'Click me', variant: 'primary' },
  list: { type: 'list', listType: 'bullet', items: [''] },
  quote: { type: 'quote', content: '', author: '' },
  divider: { type: 'divider' },
  spacer: { type: 'spacer', height: 32 },
} as Record<BlockType, Omit<EditorBlock, 'id'>>;

export function EditorSection({
  section,
  sectionIndex,
  totalSections,
  selectedBlockId,
  isSelected,
  isMain = false,
  isRegenerating = false,
  previewMode = 'desktop',
  onRightPanelChange,
  onSelectSection,
  onSelectBlock,
  onUpdateSection,
  onDeleteSection,
  onMoveSection,
  onDuplicateSection,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
  onRegenerateSection,
}: EditorSectionProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBlockIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverBlockIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedBlockIndex !== null && draggedBlockIndex !== targetIndex) {
      onReorderBlocks(draggedBlockIndex, targetIndex);
    }
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockIndex(null);
    setDragOverBlockIndex(null);
  };

  const sectionStyles: React.CSSProperties = {};
  if (section.backgroundColor) {
    sectionStyles.backgroundColor = section.backgroundColor;
  }
  if (section.padding) {
    sectionStyles.padding = section.padding;
  }

  return (
    <div
      className={cn(
        'relative group/section transition-all',
        isMain
          ? 'border-2 border-blue-400 rounded-xl shadow-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20'
          : 'border rounded-lg',
        isSelected
          ? isMain ? 'ring-2 ring-blue-500' : 'ring-2 ring-primary'
          : isMain ? 'hover:border-blue-500' : 'hover:border-primary/50'
      )}
      style={sectionStyles}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSection();
      }}
    >
      {/* Section header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2 border-b',
        isMain
          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-t-xl'
          : 'bg-muted/50 rounded-t-lg'
      )}>
        <div className="flex items-center gap-2">
          {!isMain && <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />}
          {isMain && (
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">MAIN</span>
          )}
          <span className={cn(
            'font-medium text-sm',
            isMain && 'text-blue-700 dark:text-blue-300'
          )}>{section.name || `Section ${sectionIndex + 1}`}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* 나머지 버튼들은 호버 시 표시 */}
          <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
          {/* MAIN 섹션은 이동 불가 */}
          {!isMain && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveSection('up');
                }}
                disabled={sectionIndex === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveSection('down');
                }}
                disabled={sectionIndex === totalSections - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {/* MAIN 섹션은 복제/삭제 불가 */}
          {!isMain && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSection();
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSection();
                }}
                disabled={totalSections === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          </div>
          {/* 섹션 이미지 재생성 버튼 - 항상 표시 (맨 오른쪽) */}
          {onRegenerateSection && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 gap-1 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-300 hover:border-violet-400 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300"
              onClick={(e) => {
                e.stopPropagation();
                onRegenerateSection();
              }}
              disabled={isRegenerating}
              title="이 섹션 이미지 재생성"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRegenerating && 'animate-spin')} />
              <span className="text-xs font-medium">{isRegenerating ? '생성중...' : '재생성'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Section settings panel */}
      {showSettings && (
        <div className="p-4 border-b bg-muted/30 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input
                value={section.name}
                onChange={(e) => onUpdateSection({ name: e.target.value })}
                placeholder="Section name..."
              />
            </div>
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={section.backgroundColor || '#ffffff'}
                  onChange={(e) => onUpdateSection({ backgroundColor: e.target.value })}
                  className="w-12 h-9 p-1"
                />
                <Input
                  value={section.backgroundColor || ''}
                  onChange={(e) => onUpdateSection({ backgroundColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
                {section.backgroundColor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateSection({ backgroundColor: undefined })}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section content - blocks */}
      <div className={cn('p-4 space-y-0', isMain && 'pb-6')}>
        {section.blocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">{isMain ? 'MAIN 이미지가 아직 없습니다' : '이 섹션이 비어 있습니다'}</p>
            {/* MAIN 섹션은 블록 추가 버튼 숨김 */}
            {!isMain && <AddBlockDropdown onAddBlock={(type) => onAddBlock(defaultBlockContent[type])} />}
          </div>
        ) : (
          <>
            {/* 맨 위 블록 추가 버튼 - MAIN 섹션은 숨김 */}
            {!isMain && <BlockAddDivider onAdd={(type) => onAddBlock(defaultBlockContent[type], 0)} />}

            {section.blocks.map((block, index) => (
              <div key={block.id}>
                <div
                  onDragOver={(e) => !isMain && handleDragOver(e, index)}
                  onDragLeave={!isMain ? handleDragLeave : undefined}
                  onDrop={(e) => !isMain && handleDrop(e, index)}
                  onDragEnd={!isMain ? handleDragEnd : undefined}
                  className={cn(
                    'relative group/block',
                    !isMain && draggedBlockIndex === index && 'opacity-50',
                    !isMain && dragOverBlockIndex === index && 'border-t-2 border-primary'
                  )}
                >
                  {/* Block controls - MAIN 섹션은 드래그 핸들 숨김 */}
                  {/* ★★★ 드래그 핸들에서만 드래그 시작 (블록 전체 draggable 제거) ★★★ */}
                  {!isMain && (
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
                      <button
                        type="button"
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, index)}
                        className="p-1 hover:bg-muted rounded cursor-grab"
                        title="드래그하여 순서 변경"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* Block delete button - MAIN 섹션은 블록 삭제 숨김 */}
                  {!isMain && (
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="p-1 hover:bg-destructive/10 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBlock(block.id);
                        }}
                        title="블록 삭제"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  )}

                  <BlockRenderer
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    isMain={isMain}
                    previewMode={previewMode}
                    onRightPanelChange={onRightPanelChange}
                    onSelect={() => onSelectBlock(block.id)}
                    onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                  />
                </div>

                {/* 각 블록 아래 블록 추가 버튼 - MAIN 섹션은 숨김 */}
                {!isMain && <BlockAddDivider onAdd={(type) => onAddBlock(defaultBlockContent[type], index + 1)} />}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function AddBlockDropdown({ onAddBlock }: { onAddBlock: (type: BlockType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          블록 추가
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        {blockTypes.map((item) => (
          <DropdownMenuItem key={item.type} onClick={() => onAddBlock(item.type)}>
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
