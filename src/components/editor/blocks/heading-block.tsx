'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { HeadingBlock as HeadingBlockType, BlockStyle } from '@/stores/editor-store';

interface HeadingBlockProps {
  block: HeadingBlockType & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<HeadingBlockType>) => void;
}

const headingStyles: Record<number, string> = {
  1: 'text-4xl font-bold',
  2: 'text-3xl font-bold',
  3: 'text-2xl font-semibold',
  4: 'text-xl font-semibold',
};

export function HeadingBlock({ block, isSelected, onSelect, onUpdate }: HeadingBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ content: e.target.value });
  };

  const getStyleClasses = (style?: BlockStyle) => {
    const classes: string[] = [];
    if (style?.textAlign) {
      classes.push(`text-${style.textAlign}`);
    }
    if (style?.color) {
      classes.push(style.color);
    }
    return classes.join(' ');
  };

  const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;

  return (
    <div
      className={cn(
        'relative group cursor-pointer rounded-md transition-all',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        !isEditing && 'hover:bg-muted/50'
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={block.content}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full bg-transparent border-none outline-none p-2',
            headingStyles[block.level],
            getStyleClasses(block.style)
          )}
        />
      ) : (
        <Tag
          className={cn(
            'p-2',
            headingStyles[block.level],
            getStyleClasses(block.style),
            !block.content && 'text-muted-foreground'
          )}
        >
          {block.content || `Heading ${block.level}`}
        </Tag>
      )}
    </div>
  );
}
