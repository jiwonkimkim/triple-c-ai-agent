'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { QuoteBlock as QuoteBlockType, BlockStyle } from '@/stores/editor-store';

interface QuoteBlockProps {
  block: QuoteBlockType & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<QuoteBlockType>) => void;
}

export function QuoteBlock({ block, isSelected, onSelect, onUpdate }: QuoteBlockProps) {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingContent && contentRef.current) {
      contentRef.current.focus();
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [isEditingContent]);

  useEffect(() => {
    if (isEditingAuthor && authorRef.current) {
      authorRef.current.focus();
    }
  }, [isEditingAuthor]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ author: e.target.value });
  };

  const getStyleClasses = (style?: BlockStyle) => {
    const classes: string[] = [];
    if (style?.fontSize) {
      classes.push(`text-${style.fontSize}`);
    }
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer rounded-md transition-all',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <blockquote
        className={cn(
          'border-l-4 border-primary pl-4 py-2',
          getStyleClasses(block.style)
        )}
      >
        {isEditingContent ? (
          <textarea
            ref={contentRef}
            value={block.content}
            onChange={handleContentChange}
            onBlur={() => setIsEditingContent(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsEditingContent(false)}
            className="w-full bg-transparent border-none outline-none resize-none italic text-lg"
            placeholder="Enter quote..."
          />
        ) : (
          <p
            className={cn(
              'italic text-lg',
              !block.content && 'text-muted-foreground'
            )}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingContent(true);
            }}
          >
            "{block.content || 'Click to add quote...'}"
          </p>
        )}

        <footer className="mt-2">
          {isEditingAuthor ? (
            <input
              ref={authorRef}
              type="text"
              value={block.author || ''}
              onChange={handleAuthorChange}
              onBlur={() => setIsEditingAuthor(false)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && setIsEditingAuthor(false)}
              className="bg-transparent border-none outline-none text-sm text-muted-foreground"
              placeholder="Author name"
            />
          ) : (
            <cite
              className={cn(
                'text-sm text-muted-foreground not-italic',
                !block.author && 'opacity-50'
              )}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingAuthor(true);
              }}
            >
              — {block.author || 'Author'}
            </cite>
          )}
        </footer>
      </blockquote>
    </div>
  );
}
