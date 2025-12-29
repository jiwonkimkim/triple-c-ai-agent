'use client';

import {
  Undo2,
  Redo2,
  Eye,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorToolbarProps {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
}

export function EditorToolbar({
  isDirty,
  isSaving,
  lastSavedAt,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPreview,
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
        <div className="flex items-center gap-1">
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
      </div>

      {/* Right section - Save status and preview */}
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
      </div>
    </div>
  );
}
