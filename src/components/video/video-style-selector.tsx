'use client';

import { Film, ShoppingBag, Share2, Box, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import type { VideoStyle } from '@/services/video';

interface VideoStyleSelectorProps {
  value: VideoStyle;
  onChange: (style: VideoStyle) => void;
  disabled?: boolean;
}

const styleOptions: {
  value: VideoStyle;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'cinematic',
    label: '시네마틱',
    description: '영화 같은 고급스러운 영상',
    icon: <Film className="h-5 w-5" />,
  },
  {
    value: 'commercial',
    label: '광고',
    description: '전문적인 광고 퀄리티',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    value: 'social_media',
    label: '소셜 미디어',
    description: '눈길을 끄는 SNS용 영상',
    icon: <Share2 className="h-5 w-5" />,
  },
  {
    value: 'product_showcase',
    label: '제품 쇼케이스',
    description: '제품 중심의 360도 뷰',
    icon: <Box className="h-5 w-5" />,
  },
  {
    value: 'lifestyle',
    label: '라이프스타일',
    description: '자연스럽고 따뜻한 분위기',
    icon: <Heart className="h-5 w-5" />,
  },
];

export function VideoStyleSelector({
  value,
  onChange,
  disabled = false,
}: VideoStyleSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>영상 스타일</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {styleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center p-4 rounded-lg border-2 transition-all text-center',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-muted-foreground/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                'p-3 rounded-full mb-2',
                value === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {option.icon}
            </div>
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
