'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ButtonBlock as ButtonBlockType } from '@/stores/editor-store';

interface ButtonBlockProps {
  block: ButtonBlockType & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ButtonBlockType>) => void;
}

const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
};

export function ButtonBlock({ block, isSelected, onSelect, onUpdate }: ButtonBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ text: e.target.value });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ url: e.target.value });
  };

  const handleVariantChange = (variant: 'primary' | 'secondary' | 'outline') => {
    onUpdate({ variant });
  };

  return (
    <div
      className={cn(
        'relative group rounded-md transition-all',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={onSelect}
    >
      <div className={cn('flex', block.style?.textAlign === 'center' && 'justify-center', block.style?.textAlign === 'right' && 'justify-end')}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={block.text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              'px-6 py-3 rounded-md font-medium text-center',
              buttonVariants[block.variant],
              'border-none outline-none'
            )}
          />
        ) : (
          <button
            type="button"
            className={cn(
              'px-6 py-3 rounded-md font-medium transition-colors cursor-pointer',
              buttonVariants[block.variant]
            )}
            onDoubleClick={handleDoubleClick}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelected) {
                setShowSettings(!showSettings);
              }
            }}
          >
            {block.text || 'Button'}
          </button>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && isSelected && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-4 bg-background border rounded-lg shadow-lg z-10 min-w-[280px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={block.text}
                onChange={handleTextChange}
                placeholder="Button text..."
              />
            </div>
            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input
                value={block.url || ''}
                onChange={handleUrlChange}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Style</Label>
              <div className="flex gap-2">
                {(['primary', 'secondary', 'outline'] as const).map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-sm font-medium capitalize',
                      buttonVariants[variant],
                      block.variant === variant && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    onClick={() => handleVariantChange(variant)}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
