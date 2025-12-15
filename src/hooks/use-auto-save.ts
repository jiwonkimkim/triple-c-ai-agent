import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';

interface UseAutoSaveOptions {
  projectId: string;
  versionId?: string;
  interval?: number; // in milliseconds, default 30000 (30 seconds)
  onSave?: (success: boolean) => void;
  enabled?: boolean;
}

export function useAutoSave({
  projectId,
  versionId,
  interval = 30000,
  onSave,
  enabled = true,
}: UseAutoSaveOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');

  const { sections, isDirty, isSaving, setDirty, setSaving, setLastSavedAt } = useEditorStore();

  const save = useCallback(async () => {
    if (!isDirty || isSaving) return;

    const currentContent = JSON.stringify(sections);
    if (currentContent === lastSavedContentRef.current) {
      // No actual changes
      setDirty(false);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/drafts`, {
        method: versionId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionId,
          content: sections,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      lastSavedContentRef.current = currentContent;
      setDirty(false);
      setLastSavedAt(new Date());
      onSave?.(true);
    } catch (error) {
      console.error('Auto-save failed:', error);
      onSave?.(false);
    } finally {
      setSaving(false);
    }
  }, [isDirty, isSaving, sections, projectId, versionId, setDirty, setSaving, setLastSavedAt, onSave]);

  // Setup auto-save interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      save();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, save]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirty) {
        // Attempt synchronous save on unmount
        navigator.sendBeacon?.(
          `/api/projects/${projectId}/drafts`,
          JSON.stringify({
            versionId,
            content: sections,
          })
        );
      }
    };
  }, [isDirty, projectId, versionId, sections]);

  // Handle keyboard shortcut (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  // Handle beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    save,
    isDirty,
    isSaving,
  };
}
