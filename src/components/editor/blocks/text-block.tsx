'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { TextBlock as TextBlockType, BlockStyle } from '@/stores/editor-store';

interface TextBlockProps {
  block: TextBlockType & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBlockType>) => void;
}

export function TextBlock({ block, isSelected, onSelect, onUpdate }: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Adjust height to content
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value });
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const getStyleClasses = (style?: BlockStyle) => {
    const classes: string[] = [];
    if (style?.textAlign) {
      classes.push(`text-${style.textAlign}`);
    }
    if (style?.fontSize) {
      classes.push(`text-${style.fontSize}`);
    }
    if (style?.fontWeight) {
      classes.push(`font-${style.fontWeight}`);
    }
    if (style?.color) {
      classes.push(style.color);
    }
    return classes.join(' ');
  };

  const inlineStyles: React.CSSProperties = {};
  if (block.style?.backgroundColor) {
    inlineStyles.backgroundColor = block.style.backgroundColor;
  }
  if (block.style?.padding) {
    inlineStyles.padding = block.style.padding;
  }
  if (block.style?.borderRadius) {
    inlineStyles.borderRadius = block.style.borderRadius;
  }

  return (
    <div
      className={cn(
        'relative group cursor-pointer rounded-md transition-all',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        !isEditing && 'hover:bg-muted/50'
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      style={inlineStyles}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={block.content}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full bg-transparent border-none outline-none resize-none p-2 min-h-[60px]',
            getStyleClasses(block.style)
          )}
          placeholder="Enter text..."
        />
      ) : (
        <p
          className={cn(
            'p-2 whitespace-pre-wrap',
            getStyleClasses(block.style),
            !block.content && 'text-muted-foreground italic'
          )}
        >
          {block.content || 'Click to edit text...'}
        </p>
      )}
    </div>
  );
}
