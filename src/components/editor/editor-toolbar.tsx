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
    if (!date) return 'Never saved';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
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
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={onAddSection}>
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Center section - Preview mode */}
      <div className="flex items-center gap-1 rounded-md border p-1">
        <Button
          variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onSetPreviewMode('desktop')}
          title="Desktop view"
        >
          <Monitor className="h-4 w-4" />
        </Button>
        <Button
          variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onSetPreviewMode('tablet')}
          title="Tablet view"
        >
          <Tablet className="h-4 w-4" />
        </Button>
        <Button
          variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => onSetPreviewMode('mobile')}
          title="Mobile view"
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
              <span>Saving...</span>
            </>
          ) : isDirty ? (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>Unsaved changes</span>
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
          Preview
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('html')}>
              Export as HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('json')}>
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" onClick={onSave} disabled={isSaving || !isDirty}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
