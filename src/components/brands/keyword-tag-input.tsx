'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface KeywordTagInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  error?: boolean;
}

export function KeywordTagInput({
  value,
  onChange,
  placeholder = '키워드 입력 후 Enter',
  maxTags = 10,
  error,
}: KeywordTagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed) && value.length < maxTags) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-wrap gap-2 rounded-md border p-2 ${
          error ? 'border-destructive' : 'border-input'
        } focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}
      >
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0 min-w-[120px]"
          disabled={value.length >= maxTags}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxTags} 키워드 (Enter 또는 쉼표로 추가)
      </p>
    </div>
  );
}
