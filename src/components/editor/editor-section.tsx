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

interface EditorSectionProps {
  section: Section;
  sectionIndex: number;
  totalSections: number;
  selectedBlockId: string | null;
  isSelected: boolean;
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
    overlayGradient: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
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
        'relative group/section border rounded-lg transition-all',
        isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
      )}
      style={sectionStyles}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSection();
      }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <span className="font-medium text-sm">{section.name || `Section ${sectionIndex + 1}`}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
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
      <div className="p-4 space-y-3">
        {section.blocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">This section is empty</p>
            <AddBlockDropdown onAddBlock={(type) => onAddBlock(defaultBlockContent[type])} />
          </div>
        ) : (
          <>
            {section.blocks.map((block, index) => (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'relative group/block',
                  draggedBlockIndex === index && 'opacity-50',
                  dragOverBlockIndex === index && 'border-t-2 border-primary'
                )}
              >
                {/* Block controls */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
                  <button
                    type="button"
                    className="p-1 hover:bg-muted rounded cursor-grab"
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Block delete button */}
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                  <button
                    type="button"
                    className="p-1 hover:bg-destructive/10 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBlock(block.id);
                    }}
                    title="Delete block"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>

                <BlockRenderer
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                />
              </div>
            ))}

            {/* Add block button at the end */}
            <div className="pt-4 flex justify-center">
              <AddBlockDropdown onAddBlock={(type) => onAddBlock(defaultBlockContent[type])} />
            </div>
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
