'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ListBlock as ListBlockType, BlockStyle } from '@/stores/editor-store';

interface ListBlockProps {
  block: ListBlockType & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ListBlockType>) => void;
}

export function ListBlock({ block, isSelected, onSelect, onUpdate }: ListBlockProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (editingIndex !== null && inputRefs.current[editingIndex]) {
      inputRefs.current[editingIndex]?.focus();
    }
  }, [editingIndex]);

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...block.items];
    newItems[index] = value;
    onUpdate({ items: newItems });
  };

  const handleAddItem = () => {
    onUpdate({ items: [...block.items, ''] });
    setEditingIndex(block.items.length);
  };

  const handleRemoveItem = (index: number) => {
    if (block.items.length > 1) {
      const newItems = block.items.filter((_, i) => i !== index);
      onUpdate({ items: newItems });
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    } else if (e.key === 'Backspace' && block.items[index] === '' && block.items.length > 1) {
      e.preventDefault();
      handleRemoveItem(index);
      if (index > 0) {
        setEditingIndex(index - 1);
      }
    }
  };

  const toggleListType = () => {
    onUpdate({ listType: block.listType === 'bullet' ? 'number' : 'bullet' });
  };

  const getStyleClasses = (style?: BlockStyle) => {
    const classes: string[] = [];
    if (style?.fontSize) {
      classes.push(`text-${style.fontSize}`);
    }
    if (style?.color) {
      classes.push(style.color);
    }
    return classes.join(' ');
  };

  const ListTag = block.listType === 'bullet' ? 'ul' : 'ol';
  const listStyles = block.listType === 'bullet' ? 'list-disc' : 'list-decimal';

  return (
    <div
      className={cn(
        'relative group cursor-pointer rounded-md transition-all p-2',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      {/* List type toggle */}
      {isSelected && (
        <div className="absolute -top-3 right-2 flex gap-1 bg-background border rounded-md shadow-sm">
          <button
            type="button"
            className={cn(
              'p-1.5 rounded-l-md transition-colors',
              block.listType === 'bullet' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (block.listType !== 'bullet') toggleListType();
            }}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={cn(
              'p-1.5 rounded-r-md transition-colors',
              block.listType === 'number' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (block.listType !== 'number') toggleListType();
            }}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>
      )}

      <ListTag className={cn('ml-6 space-y-1', listStyles, getStyleClasses(block.style))}>
        {block.items.map((item, index) => (
          <li key={index} className="group/item">
            <div className="flex items-center gap-2">
              {editingIndex === index ? (
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  onBlur={() => setEditingIndex(null)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="flex-1 bg-transparent border-none outline-none"
                  placeholder="List item..."
                />
              ) : (
                <span
                  className={cn(
                    'flex-1',
                    !item && 'text-muted-foreground italic'
                  )}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingIndex(index);
                  }}
                >
                  {item || 'Empty item'}
                </span>
              )}
              {isSelected && block.items.length > 1 && (
                <button
                  type="button"
                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(index);
                  }}
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ListTag>

      {isSelected && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 ml-6"
          onClick={(e) => {
            e.stopPropagation();
            handleAddItem();
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add item
        </Button>
      )}
    </div>
  );
}
