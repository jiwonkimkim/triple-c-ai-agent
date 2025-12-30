'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
import {
  Plus,
  Trash2,
  Settings,
  Type,
  Layers,
  ChevronUp,
  ChevronDown,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Upload,
} from 'lucide-react';
import type { ImageOverlayBlock, OverlayText, OverlayTextStyle } from '@/stores/editor-store';

interface ImageOverlayBlockRendererProps {
  block: ImageOverlayBlock & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageOverlayBlock>) => void;
}

// 폰트 옵션 (카테고리별 분류)
const fontOptions = [
  // 고딕 계열 (Sans-serif)
  { value: 'Pretendard, sans-serif', label: 'Pretendard', category: '고딕' },
  { value: 'Noto Sans KR, sans-serif', label: 'Noto Sans KR', category: '고딕' },
  { value: 'Nanum Gothic, sans-serif', label: '나눔고딕', category: '고딕' },
  { value: 'Spoqa Han Sans Neo, sans-serif', label: '스포카 한 산스', category: '고딕' },
  { value: 'IBM Plex Sans KR, sans-serif', label: 'IBM Plex Sans', category: '고딕' },

  // 명조 계열 (Serif)
  { value: 'Nanum Myeongjo, serif', label: '나눔명조', category: '명조' },
  { value: 'Noto Serif KR, serif', label: 'Noto Serif KR', category: '명조' },
  { value: 'KoPub Batang, serif', label: '코퍼브 바탕', category: '명조' },

  // 디스플레이/타이틀 (Display)
  { value: 'Black Han Sans, sans-serif', label: '검은고딕', category: '타이틀' },
  { value: 'Jua, sans-serif', label: '주아', category: '타이틀' },
  { value: 'Do Hyeon, sans-serif', label: '도현', category: '타이틀' },
  { value: 'Gugi, sans-serif', label: '구기', category: '타이틀' },
  { value: 'Sunflower, sans-serif', label: '해바라기', category: '타이틀' },

  // 손글씨/캘리 (Handwriting)
  { value: 'Gaegu, cursive', label: '개구', category: '손글씨' },
  { value: 'Hi Melody, cursive', label: '하이멜로디', category: '손글씨' },
  { value: 'Gamja Flower, cursive', label: '감자꽃', category: '손글씨' },
  { value: 'Cute Font, cursive', label: '귀여운 폰트', category: '손글씨' },

  // 영문 (English)
  { value: 'Arial, sans-serif', label: 'Arial', category: '영문' },
  { value: 'Georgia, serif', label: 'Georgia', category: '영문' },
  { value: 'Impact, sans-serif', label: 'Impact', category: '영문' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat', category: '영문' },
  { value: 'Playfair Display, serif', label: 'Playfair Display', category: '영문' },
];

// 텍스트 타입별 기본 스타일
const defaultStylesByType: Record<OverlayText['type'], Partial<OverlayTextStyle>> = {
  headline: {
    x: 50,
    y: 30,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: true,
    textAlign: 'center',
  },
  subheadline: {
    x: 50,
    y: 45,
    fontSize: 24,
    fontWeight: 'medium',
    color: '#ffffff',
    textShadow: true,
    textAlign: 'center',
  },
  body: {
    x: 50,
    y: 60,
    fontSize: 16,
    fontWeight: 'normal',
    color: '#ffffff',
    textShadow: true,
    textAlign: 'center',
  },
  statistic: {
    x: 50,
    y: 50,
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: true,
    textAlign: 'center',
  },
  cta: {
    x: 50,
    y: 80,
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '12px 24px',
    textAlign: 'center',
  },
};

const generateId = () => `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ImageOverlayBlockRenderer({
  block,
  isSelected,
  onSelect,
  onUpdate,
}: ImageOverlayBlockRendererProps) {
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTextId(textId);
    setIsDragging(true);
  }, []);

  // 드래그 중
  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedTextId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // 범위 제한 (0-100)
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === selectedTextId
          ? { ...text, style: { ...text.style, x: clampedX, y: clampedY } }
          : text
      ),
    });
  }, [isDragging, selectedTextId, block.overlayTexts, onUpdate]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 마우스 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  // 오버레이 텍스트 추가
  const handleAddOverlayText = (type: OverlayText['type']) => {
    const defaultStyle = defaultStylesByType[type];
    const maxZIndex = Math.max(...block.overlayTexts.map((t) => t.zIndex || 0), 0);
    const newText: OverlayText = {
      id: generateId(),
      type,
      content: type === 'headline' ? '헤드라인을 입력하세요' :
               type === 'subheadline' ? '서브헤드라인' :
               type === 'statistic' ? '92%' :
               type === 'cta' ? '지금 만나보세요' : '본문 텍스트를 입력하세요',
      style: {
        x: defaultStyle.x || 50,
        y: defaultStyle.y || 50,
        fontSize: defaultStyle.fontSize || 16,
        fontWeight: defaultStyle.fontWeight || 'normal',
        fontFamily: 'Pretendard, sans-serif',
        color: defaultStyle.color || '#ffffff',
        backgroundColor: defaultStyle.backgroundColor,
        padding: defaultStyle.padding,
        textShadow: defaultStyle.textShadow,
        textAlign: defaultStyle.textAlign || 'center',
        opacity: 100,
        rotation: 0,
      },
      zIndex: maxZIndex + 1,
    };

    onUpdate({
      overlayTexts: [...block.overlayTexts, newText],
    });
    setSelectedTextId(newText.id);
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
  const handleUpdateStyle = (textId: string, styleUpdates: Partial<OverlayTextStyle>) => {
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
    setSelectedTextId(null);
  };

  // 레이어 순서 변경
  const handleMoveLayer = (textId: string, direction: 'up' | 'down') => {
    const sortedTexts = [...block.overlayTexts].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const index = sortedTexts.findIndex((t) => t.id === textId);

    if (direction === 'up' && index < sortedTexts.length - 1) {
      const temp = sortedTexts[index].zIndex;
      sortedTexts[index].zIndex = sortedTexts[index + 1].zIndex;
      sortedTexts[index + 1].zIndex = temp;
    } else if (direction === 'down' && index > 0) {
      const temp = sortedTexts[index].zIndex;
      sortedTexts[index].zIndex = sortedTexts[index - 1].zIndex;
      sortedTexts[index - 1].zIndex = temp;
    }

    onUpdate({ overlayTexts: sortedTexts });
  };

  // 레이어 복제
  const handleDuplicateLayer = (textId: string) => {
    const text = block.overlayTexts.find((t) => t.id === textId);
    if (!text) return;

    const maxZIndex = Math.max(...block.overlayTexts.map((t) => t.zIndex || 0), 0);
    const newText: OverlayText = {
      ...text,
      id: generateId(),
      style: {
        ...text.style,
        x: text.style.x + 5,
        y: text.style.y + 5,
      },
      zIndex: maxZIndex + 1,
    };

    onUpdate({ overlayTexts: [...block.overlayTexts, newText] });
    setSelectedTextId(newText.id);
  };

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdate({ src: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const selectedText = block.overlayTexts.find((t) => t.id === selectedTextId);

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden transition-all',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
    >
      {/* 이미지 캔버스 */}
      <div
        ref={containerRef}
        className="relative bg-muted"
        style={{ aspectRatio: '3/4' }}
      >
        {block.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.src}
            alt={block.alt || '상세페이지 이미지'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center text-white/70">
              <Upload className="h-12 w-12 mx-auto mb-2" />
              <p>클릭하여 이미지 업로드</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* 오버레이 그라데이션 */}
        {block.overlayGradient && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: block.overlayGradient }}
          />
        )}

        {/* 오버레이 텍스트들 (레이어) */}
        {block.overlayTexts
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .map((overlayText) => (
            <div
              key={overlayText.id}
              className={cn(
                'absolute cursor-move select-none transition-shadow',
                selectedTextId === overlayText.id && 'ring-2 ring-yellow-400 ring-offset-2',
                isDragging && selectedTextId === overlayText.id && 'cursor-grabbing'
              )}
              style={{
                left: `${overlayText.style.x}%`,
                top: `${overlayText.style.y}%`,
                transform: `translate(-50%, -50%) rotate(${overlayText.style.rotation || 0}deg)`,
                zIndex: overlayText.zIndex || 0,
                opacity: (overlayText.style.opacity || 100) / 100,
              }}
              onMouseDown={(e) => handleDragStart(e, overlayText.id)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setSelectedTextId(overlayText.id);
                setIsEditing(true);
              }}
            >
              {isEditing && selectedTextId === overlayText.id ? (
                <textarea
                  value={overlayText.content}
                  onChange={(e) => handleUpdateOverlayText(overlayText.id, { content: e.target.value })}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  autoFocus
                  className="bg-transparent border-none outline-none resize-none text-center min-w-[100px]"
                  style={{
                    color: overlayText.style.color || '#ffffff',
                    fontSize: `${overlayText.style.fontSize || 16}px`,
                    fontWeight: overlayText.style.fontWeight === 'bold' ? 700 :
                               overlayText.style.fontWeight === 'semibold' ? 600 :
                               overlayText.style.fontWeight === 'medium' ? 500 : 400,
                    fontFamily: overlayText.style.fontFamily || 'Pretendard, sans-serif',
                    textShadow: overlayText.style.textShadow ? '0 2px 8px rgba(0,0,0,0.8)' : undefined,
                    textAlign: overlayText.style.textAlign || 'center',
                    letterSpacing: overlayText.style.letterSpacing ? `${overlayText.style.letterSpacing}px` : undefined,
                    lineHeight: overlayText.style.lineHeight || 1.4,
                  }}
                />
              ) : (
                <div
                  style={{
                    color: overlayText.style.color || '#ffffff',
                    backgroundColor: overlayText.style.backgroundColor,
                    padding: overlayText.style.padding,
                    fontSize: `${overlayText.style.fontSize || 16}px`,
                    fontWeight: overlayText.style.fontWeight === 'bold' ? 700 :
                               overlayText.style.fontWeight === 'semibold' ? 600 :
                               overlayText.style.fontWeight === 'medium' ? 500 : 400,
                    fontFamily: overlayText.style.fontFamily || 'Pretendard, sans-serif',
                    textShadow: overlayText.style.textShadow ? '0 2px 8px rgba(0,0,0,0.8)' : undefined,
                    textAlign: overlayText.style.textAlign || 'center',
                    letterSpacing: overlayText.style.letterSpacing ? `${overlayText.style.letterSpacing}px` : undefined,
                    lineHeight: overlayText.style.lineHeight || 1.4,
                    borderRadius: overlayText.style.padding ? '4px' : undefined,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {overlayText.content}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* 상단 도구 버튼 */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex gap-1">
          {/* 레이어 패널 토글 */}
          <Button
            variant={showLayerPanel ? 'default' : 'secondary'}
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setShowLayerPanel(!showLayerPanel);
            }}
          >
            <Layers className="h-4 w-4" />
          </Button>

          {/* 이미지 설정 */}
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
                  <Label>이미지 업로드</Label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    파일 선택
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>오버레이 효과</Label>
                  <Select
                    value={block.overlayGradient || 'none'}
                    onValueChange={(value) => onUpdate({ overlayGradient: value === 'none' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="효과 선택" />
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

          {/* 텍스트 추가 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleAddOverlayText('headline')}>
                <Type className="h-4 w-4 mr-2" />
                헤드라인 (대제목)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('subheadline')}>
                <Type className="h-4 w-4 mr-2" />
                서브헤드라인
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('body')}>
                <Type className="h-4 w-4 mr-2" />
                본문
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddOverlayText('statistic')}>
                <Type className="h-4 w-4 mr-2" />
                통계 (수치)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('cta')}>
                <Type className="h-4 w-4 mr-2" />
                CTA (버튼)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* 레이어 패널 */}
      {isSelected && showLayerPanel && (
        <div className="absolute top-12 right-2 w-56 bg-background/95 backdrop-blur border rounded-lg shadow-lg p-2 max-h-64 overflow-y-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-1">레이어</div>
          {block.overlayTexts.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              텍스트가 없습니다
            </div>
          ) : (
            <div className="space-y-1">
              {[...block.overlayTexts]
                .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                .map((text) => (
                  <div
                    key={text.id}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-muted',
                      selectedTextId === text.id && 'bg-primary/10 ring-1 ring-primary'
                    )}
                    onClick={() => setSelectedTextId(text.id)}
                  >
                    <Type className="h-3 w-3 flex-shrink-0" />
                    <span className="flex-1 truncate">{text.content}</span>
                    <div className="flex gap-0.5">
                      <button
                        className="p-0.5 hover:bg-muted-foreground/20 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayer(text.id, 'up');
                        }}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        className="p-0.5 hover:bg-muted-foreground/20 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayer(text.id, 'down');
                        }}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        className="p-0.5 hover:bg-muted-foreground/20 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateLayer(text.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        className="p-0.5 hover:bg-destructive/20 rounded text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOverlayText(text.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 선택된 텍스트 편집 패널 */}
      {isSelected && selectedText && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 space-y-3">
          {/* 첫 번째 줄: 폰트 & 크기 */}
          <div className="flex gap-2 items-center">
            {/* 폰트 선택 */}
            <Select
              value={selectedText.style.fontFamily || 'Pretendard, sans-serif'}
              onValueChange={(value) => handleUpdateStyle(selectedTextId!, { fontFamily: value })}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 폰트 크기 */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={selectedText.style.fontSize || 16}
                onChange={(e) => handleUpdateStyle(selectedTextId!, { fontSize: Number(e.target.value) })}
                className="w-16 h-8 text-xs"
                min={8}
                max={200}
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>

            {/* 굵기 */}
            <Select
              value={selectedText.style.fontWeight || 'normal'}
              onValueChange={(value) => handleUpdateStyle(selectedTextId!, { fontWeight: value as 'normal' | 'medium' | 'semibold' | 'bold' })}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">
                  <span style={{ fontWeight: 400 }}>Regular</span>
                </SelectItem>
                <SelectItem value="medium">
                  <span style={{ fontWeight: 500 }}>Medium</span>
                </SelectItem>
                <SelectItem value="semibold">
                  <span style={{ fontWeight: 600 }}>Semibold</span>
                </SelectItem>
                <SelectItem value="bold">
                  <span style={{ fontWeight: 700 }}>Bold</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* 색상 */}
            <input
              type="color"
              value={selectedText.style.color || '#ffffff'}
              onChange={(e) => handleUpdateStyle(selectedTextId!, { color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border"
              title="텍스트 색상"
            />
          </div>

          {/* 두 번째 줄: 정렬 & 기타 */}
          <div className="flex gap-2 items-center">
            {/* 정렬 */}
            <div className="flex border rounded">
              <button
                className={cn(
                  'p-1.5',
                  selectedText.style.textAlign === 'left' && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handleUpdateStyle(selectedTextId!, { textAlign: 'left' })}
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                className={cn(
                  'p-1.5',
                  selectedText.style.textAlign === 'center' && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handleUpdateStyle(selectedTextId!, { textAlign: 'center' })}
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                className={cn(
                  'p-1.5',
                  selectedText.style.textAlign === 'right' && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handleUpdateStyle(selectedTextId!, { textAlign: 'right' })}
              >
                <AlignRight className="h-4 w-4" />
              </button>
            </div>

            {/* 텍스트 그림자 */}
            <button
              className={cn(
                'px-2 py-1 text-xs border rounded',
                selectedText.style.textShadow && 'bg-primary text-primary-foreground'
              )}
              onClick={() => handleUpdateStyle(selectedTextId!, { textShadow: !selectedText.style.textShadow })}
            >
              그림자
            </button>

            {/* 투명도 */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-muted-foreground">투명도</span>
              <Slider
                value={[selectedText.style.opacity || 100]}
                onValueChange={([value]) => handleUpdateStyle(selectedTextId!, { opacity: value })}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs w-8">{selectedText.style.opacity || 100}%</span>
            </div>

            {/* 삭제 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDeleteOverlayText(selectedTextId!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
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
    <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
      {block.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.src}
          alt={block.alt || '상세페이지 이미지'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {block.overlayGradient && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: block.overlayGradient }}
        />
      )}

      {block.overlayTexts
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((overlayText) => (
          <div
            key={overlayText.id}
            className="absolute"
            style={{
              left: `${overlayText.style.x}%`,
              top: `${overlayText.style.y}%`,
              transform: `translate(-50%, -50%) rotate(${overlayText.style.rotation || 0}deg)`,
              zIndex: overlayText.zIndex || 0,
              opacity: (overlayText.style.opacity || 100) / 100,
              color: overlayText.style.color || '#ffffff',
              backgroundColor: overlayText.style.backgroundColor,
              padding: overlayText.style.padding,
              fontSize: `${overlayText.style.fontSize || 16}px`,
              fontWeight: overlayText.style.fontWeight === 'bold' ? 700 :
                         overlayText.style.fontWeight === 'semibold' ? 600 :
                         overlayText.style.fontWeight === 'medium' ? 500 : 400,
              fontFamily: overlayText.style.fontFamily || 'Pretendard, sans-serif',
              textShadow: overlayText.style.textShadow ? '0 2px 8px rgba(0,0,0,0.8)' : undefined,
              textAlign: overlayText.style.textAlign || 'center',
              letterSpacing: overlayText.style.letterSpacing ? `${overlayText.style.letterSpacing}px` : undefined,
              lineHeight: overlayText.style.lineHeight || 1.4,
              borderRadius: overlayText.style.padding ? '4px' : undefined,
              whiteSpace: 'pre-wrap',
            }}
          >
            {overlayText.content}
          </div>
        ))}
    </div>
  );
}
