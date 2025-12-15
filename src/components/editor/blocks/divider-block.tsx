'use client';

import { cn } from '@/lib/utils';
import type { DividerBlock as DividerBlockType } from '@/stores/editor-store';

interface DividerBlockProps {
  block: DividerBlockType & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<DividerBlockType>) => void;
}

export function DividerBlock({ block, isSelected, onSelect }: DividerBlockProps) {
  return (
    <div
      className={cn(
        'relative group cursor-pointer py-4 transition-all rounded-md',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <hr className="border-t border-border" />
    </div>
  );
}
