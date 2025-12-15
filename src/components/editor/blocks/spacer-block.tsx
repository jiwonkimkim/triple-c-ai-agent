'use client';

import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import type { SpacerBlock as SpacerBlockType } from '@/stores/editor-store';

interface SpacerBlockProps {
  block: SpacerBlockType & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SpacerBlockType>) => void;
}

export function SpacerBlock({ block, isSelected, onSelect, onUpdate }: SpacerBlockProps) {
  const handleHeightChange = (delta: number) => {
    const newHeight = Math.max(8, Math.min(200, block.height + delta));
    onUpdate({ height: newHeight });
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all rounded-md',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        'hover:bg-muted/30'
      )}
      onClick={onSelect}
      style={{ height: block.height }}
    >
      {/* Visual indicator */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
          <GripVertical className="h-3 w-3" />
          <span>{block.height}px</span>
        </div>
      </div>

      {/* Resize handles when selected */}
      {isSelected && (
        <>
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 flex gap-1">
            <button
              type="button"
              className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                handleHeightChange(-8);
              }}
            >
              −
            </button>
            <button
              type="button"
              className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                handleHeightChange(8);
              }}
            >
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}
