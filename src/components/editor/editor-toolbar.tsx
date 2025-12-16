'use client';

import {
  Undo2,
  Redo2,
  Save,
  Eye,
  Download,
  Loader2,
  Check,
  AlertCircle,
  Plus,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EditorToolbarProps {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  canUndo: boolean;
  canRedo: boolean;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreview: () => void;
  onExport: (format: 'html' | 'json') => void;
  onAddSection: () => void;
  onSetPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

export function EditorToolbar({
  isDirty,
  isSaving,
  lastSavedAt,
  canUndo,
  canRedo,
  previewMode,
  onUndo,
  onRedo,
  onSave,
  onPreview,
  onExport,
  onAddSection,
  onSetPreviewMode,
}: EditorToolbarProps) {
  const formatLastSaved = (date: Date | null) => {
    if (!date) return '저장된 적 없음';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return date.toLocaleDateString();
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background px-4 py-2">
      {/* Left section - History controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border-r pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            title="다시 실행 (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={onAddSection}>
          <Plus className="h-4 w-4" />
          섹션 추가
        </Button>
      </div>

      {/* Center section - Preview mode */}
      <div className="flex items-center gap-1 rounded-md border p-1">
        <Button
          variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onSetPreviewMode('desktop')}
          title="데스크톱 보기"
        >
          <Monitor className="h-4 w-4" />
        </Button>
        <Button
          variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onSetPreviewMode('tablet')}
          title="태블릿 보기"
        >
          <Tablet className="h-4 w-4" />
        </Button>
        <Button
          variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onSetPreviewMode('mobile')}
          title="모바일 보기"
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      </div>

      {/* Right section - Save and export */}
      <div className="flex items-center gap-2">
        {/* Save status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>저장 중...</span>
            </>
          ) : isDirty ? (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>저장되지 않은 변경사항</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span>{formatLastSaved(lastSavedAt)}</span>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-border" />

        <Button variant="ghost" size="sm" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-2" />
          미리보기
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('html')}>
              HTML로 내보내기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('json')}>
              JSON으로 내보내기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" onClick={onSave} disabled={isSaving || !isDirty}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          저장
        </Button>
      </div>
    </div>
  );
}
