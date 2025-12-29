'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, Settings, Type, Move } from 'lucide-react';
import type { ImageOverlayBlock, OverlayText, OverlayTextStyle } from '@/stores/editor-store';

interface ImageOverlayBlockRendererProps {
  block: ImageOverlayBlock & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageOverlayBlock>) => void;
}

// 위치별 CSS 클래스 매핑
const positionClasses: Record<OverlayTextStyle['position'], string> = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'center-left': 'top-1/2 left-4 -translate-y-1/2',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'center-right': 'top-1/2 right-4 -translate-y-1/2',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

// 폰트 크기 클래스 매핑
const fontSizeClasses: Record<NonNullable<OverlayTextStyle['fontSize']>, string> = {
  'sm': 'text-sm',
  'base': 'text-base',
  'lg': 'text-lg',
  'xl': 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

// 폰트 굵기 클래스 매핑
const fontWeightClasses: Record<NonNullable<OverlayTextStyle['fontWeight']>, string> = {
  'normal': 'font-normal',
  'medium': 'font-medium',
  'semibold': 'font-semibold',
  'bold': 'font-bold',
};

// 텍스트 타입별 기본 스타일
const defaultStylesByType: Record<OverlayText['type'], Partial<OverlayTextStyle>> = {
  headline: {
    position: 'top-center',
    fontSize: '3xl',
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: true,
  },
  subheadline: {
    position: 'top-center',
    fontSize: 'xl',
    fontWeight: 'medium',
    color: '#ffffff',
    textShadow: true,
  },
  body: {
    position: 'center',
    fontSize: 'base',
    fontWeight: 'normal',
    color: '#ffffff',
    textShadow: true,
  },
  statistic: {
    position: 'center',
    fontSize: '4xl',
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: true,
  },
  cta: {
    position: 'bottom-center',
    fontSize: 'lg',
    fontWeight: 'semibold',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '0.5rem 1.5rem',
  },
};

const generateId = () => `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ImageOverlayBlockRenderer({
  block,
  isSelected,
  onSelect,
  onUpdate,
}: ImageOverlayBlockRendererProps) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [showImageSettings, setShowImageSettings] = useState(false);

  // 오버레이 텍스트 추가
  const handleAddOverlayText = (type: OverlayText['type']) => {
    const defaultStyle = defaultStylesByType[type];
    const newText: OverlayText = {
      id: generateId(),
      type,
      content: type === 'headline' ? '헤드라인' :
               type === 'subheadline' ? '서브헤드라인' :
               type === 'statistic' ? '92%' :
               type === 'cta' ? '지금 만나보세요' : '본문 텍스트',
      style: {
        position: defaultStyle.position || 'center',
        fontSize: defaultStyle.fontSize || 'base',
        fontWeight: defaultStyle.fontWeight || 'normal',
        color: defaultStyle.color || '#ffffff',
        backgroundColor: defaultStyle.backgroundColor,
        padding: defaultStyle.padding,
        textShadow: defaultStyle.textShadow,
      },
    };

    onUpdate({
      overlayTexts: [...block.overlayTexts, newText],
    });
  };

  // 오버레이 텍스트 업데이트
  const handleUpdateOverlayText = (textId: string, updates: Partial<OverlayText>) => {
    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === textId ? { ...text, ...updates } : text
      ),
    });
  };

  // 오버레이 텍스트 스타일 업데이트
  const handleUpdateOverlayTextStyle = (textId: string, styleUpdates: Partial<OverlayTextStyle>) => {
    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === textId ? { ...text, style: { ...text.style, ...styleUpdates } } : text
      ),
    });
  };

  // 오버레이 텍스트 삭제
  const handleDeleteOverlayText = (textId: string) => {
    onUpdate({
      overlayTexts: block.overlayTexts.filter((text) => text.id !== textId),
    });
    setEditingTextId(null);
  };

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden cursor-pointer transition-all',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
    >
      {/* 이미지 */}
      <div className="relative aspect-[3/4] bg-muted">
        {block.src ? (
          <Image
            src={block.src}
            alt={block.alt || '상세페이지 이미지'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>이미지를 추가하세요</p>
            </div>
          </div>
        )}

        {/* 오버레이 그라데이션 (텍스트 가독성용) */}
        {block.overlayGradient && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: block.overlayGradient }}
          />
        )}

        {/* 오버레이 텍스트들 */}
        {block.overlayTexts.map((overlayText) => (
          <div
            key={overlayText.id}
            className={cn(
              'absolute max-w-[80%] transition-all',
              positionClasses[overlayText.style.position],
              editingTextId === overlayText.id && 'ring-2 ring-yellow-400'
            )}
            style={{
              color: overlayText.style.color || '#ffffff',
              backgroundColor: overlayText.style.backgroundColor,
              padding: overlayText.style.padding,
              textShadow: overlayText.style.textShadow ? '0 2px 4px rgba(0,0,0,0.5)' : undefined,
              borderRadius: overlayText.style.padding ? '0.25rem' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingTextId(overlayText.id);
            }}
          >
            {editingTextId === overlayText.id ? (
              <input
                type="text"
                value={overlayText.content}
                onChange={(e) => handleUpdateOverlayText(overlayText.id, { content: e.target.value })}
                className={cn(
                  'bg-transparent border-none outline-none w-full min-w-[100px]',
                  fontSizeClasses[overlayText.style.fontSize || 'base'],
                  fontWeightClasses[overlayText.style.fontWeight || 'normal']
                )}
                style={{ color: 'inherit' }}
                autoFocus
                onBlur={() => setEditingTextId(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingTextId(null);
                }}
              />
            ) : (
              <span
                className={cn(
                  fontSizeClasses[overlayText.style.fontSize || 'base'],
                  fontWeightClasses[overlayText.style.fontWeight || 'normal']
                )}
              >
                {overlayText.content}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 편집 도구 패널 (선택 시) */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {/* 이미지 설정 버튼 */}
          <Dialog open={showImageSettings} onOpenChange={setShowImageSettings}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>이미지 설정</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>이미지 URL</Label>
                  <Input
                    value={block.src}
                    onChange={(e) => onUpdate({ src: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>오버레이 그라데이션</Label>
                  <Select
                    value={block.overlayGradient || 'none'}
                    onValueChange={(value) => onUpdate({ overlayGradient: value === 'none' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="그라데이션 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      <SelectItem value="linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))">하단 어둡게</SelectItem>
                      <SelectItem value="linear-gradient(to top, transparent, rgba(0,0,0,0.5))">상단 어둡게</SelectItem>
                      <SelectItem value="linear-gradient(to bottom, rgba(0,0,0,0.3), transparent, rgba(0,0,0,0.3))">상하단 어둡게</SelectItem>
                      <SelectItem value="radial-gradient(circle, transparent 50%, rgba(0,0,0,0.5))">비네팅</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 텍스트 추가 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleAddOverlayText('headline')}>
                헤드라인 (대제목)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('subheadline')}>
                서브헤드라인
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('body')}>
                본문
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddOverlayText('statistic')}>
                통계 (수치)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('cta')}>
                CTA (버튼)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* 선택된 텍스트 편집 패널 */}
      {isSelected && editingTextId && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3">
          {(() => {
            const selectedText = block.overlayTexts.find((t) => t.id === editingTextId);
            if (!selectedText) return null;

            return (
              <div className="flex flex-wrap gap-2 items-center">
                {/* 위치 선택 */}
                <Select
                  value={selectedText.style.position}
                  onValueChange={(value) =>
                    handleUpdateOverlayTextStyle(editingTextId, { position: value as OverlayTextStyle['position'] })
                  }
                >
                  <SelectTrigger className="w-32">
                    <Move className="h-4 w-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">좌상단</SelectItem>
                    <SelectItem value="top-center">상단 중앙</SelectItem>
                    <SelectItem value="top-right">우상단</SelectItem>
                    <SelectItem value="center-left">좌측 중앙</SelectItem>
                    <SelectItem value="center">중앙</SelectItem>
                    <SelectItem value="center-right">우측 중앙</SelectItem>
                    <SelectItem value="bottom-left">좌하단</SelectItem>
                    <SelectItem value="bottom-center">하단 중앙</SelectItem>
                    <SelectItem value="bottom-right">우하단</SelectItem>
                  </SelectContent>
                </Select>

                {/* 폰트 크기 */}
                <Select
                  value={selectedText.style.fontSize || 'base'}
                  onValueChange={(value) =>
                    handleUpdateOverlayTextStyle(editingTextId, { fontSize: value as OverlayTextStyle['fontSize'] })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">작게</SelectItem>
                    <SelectItem value="base">보통</SelectItem>
                    <SelectItem value="lg">크게</SelectItem>
                    <SelectItem value="xl">XL</SelectItem>
                    <SelectItem value="2xl">2XL</SelectItem>
                    <SelectItem value="3xl">3XL</SelectItem>
                    <SelectItem value="4xl">4XL</SelectItem>
                  </SelectContent>
                </Select>

                {/* 폰트 굵기 */}
                <Select
                  value={selectedText.style.fontWeight || 'normal'}
                  onValueChange={(value) =>
                    handleUpdateOverlayTextStyle(editingTextId, { fontWeight: value as OverlayTextStyle['fontWeight'] })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">보통</SelectItem>
                    <SelectItem value="medium">중간</SelectItem>
                    <SelectItem value="semibold">굵게</SelectItem>
                    <SelectItem value="bold">더굵게</SelectItem>
                  </SelectContent>
                </Select>

                {/* 색상 */}
                <input
                  type="color"
                  value={selectedText.style.color || '#ffffff'}
                  onChange={(e) =>
                    handleUpdateOverlayTextStyle(editingTextId, { color: e.target.value })
                  }
                  className="w-8 h-8 rounded cursor-pointer"
                  title="텍스트 색상"
                />

                {/* 삭제 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteOverlayText(editingTextId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// 미리보기용 렌더러 (편집 불가)
export function ImageOverlayBlockPreview({
  block,
}: {
  block: ImageOverlayBlock & { id: string };
}) {
  return (
    <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
      {block.src ? (
        <Image
          src={block.src}
          alt={block.alt || '상세페이지 이미지'}
          fill
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* 오버레이 그라데이션 */}
      {block.overlayGradient && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: block.overlayGradient }}
        />
      )}

      {/* 오버레이 텍스트들 */}
      {block.overlayTexts.map((overlayText) => (
        <div
          key={overlayText.id}
          className={cn(
            'absolute max-w-[80%]',
            positionClasses[overlayText.style.position]
          )}
          style={{
            color: overlayText.style.color || '#ffffff',
            backgroundColor: overlayText.style.backgroundColor,
            padding: overlayText.style.padding,
            textShadow: overlayText.style.textShadow ? '0 2px 4px rgba(0,0,0,0.5)' : undefined,
            borderRadius: overlayText.style.padding ? '0.25rem' : undefined,
          }}
        >
          <span
            className={cn(
              fontSizeClasses[overlayText.style.fontSize || 'base'],
              fontWeightClasses[overlayText.style.fontWeight || 'normal']
            )}
          >
            {overlayText.content}
          </span>
        </div>
      ))}
    </div>
  );
}
