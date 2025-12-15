'use client';

import { Layout, Eye, Download, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

export interface TemplateData {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string | null;
  isReference: boolean;
  createdBy: 'SYSTEM' | 'USER';
  createdAt: Date;
}

interface TemplateCardProps {
  template: TemplateData;
  onPreview?: (template: TemplateData) => void;
  onApply?: (template: TemplateData) => void;
  isSelected?: boolean;
}

const categoryLabels: Record<string, string> = {
  GENERIC: '일반',
  FASHION: '패션',
  FOOD: '음식',
  BEAUTY: '뷰티',
  DIGITAL: '디지털',
};

const categoryColors: Record<string, string> = {
  GENERIC: 'bg-gray-500',
  FASHION: 'bg-pink-500',
  FOOD: 'bg-orange-500',
  BEAUTY: 'bg-purple-500',
  DIGITAL: 'bg-blue-500',
};

export function TemplateCard({
  template,
  onPreview,
  onApply,
  isSelected = false,
}: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all hover:shadow-lg',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {template.thumbnailUrl ? (
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <Layout className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onPreview?.(template)}
          >
            <Eye className="h-4 w-4 mr-1" />
            미리보기
          </Button>
        </div>

        {/* Category badge */}
        <Badge
          className={cn(
            'absolute top-2 left-2 text-white',
            categoryColors[template.category]
          )}
        >
          {categoryLabels[template.category] || template.category}
        </Badge>

        {/* Reference badge */}
        {template.isReference && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-white/80">
            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
            추천
          </Badge>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <h3 className="font-semibold line-clamp-1">{template.name}</h3>
        <p className="text-xs text-muted-foreground">
          {template.createdBy === 'SYSTEM' ? '시스템 템플릿' : '사용자 템플릿'}
        </p>
      </CardHeader>

      <CardFooter className="p-4 pt-2">
        <Button
          className="w-full"
          size="sm"
          onClick={() => onApply?.(template)}
        >
          <Download className="h-4 w-4 mr-1" />
          적용하기
        </Button>
      </CardFooter>
    </Card>
  );
}
