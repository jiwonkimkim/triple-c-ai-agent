'use client';

import { useState, useCallback, useRef } from 'react';
import { useHistoryStore, VersionSnapshot } from '@/stores/history-store';

interface UseVersionHistoryOptions {
  projectId: string;
  autoSaveInterval?: number; // in milliseconds
  maxAutoSaves?: number;
}

interface UseVersionHistoryReturn {
  versions: VersionSnapshot[];
  currentVersion: VersionSnapshot | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchVersions: () => Promise<void>;
  createVersion: (
    content: any,
    action: 'CREATE' | 'UPDATE' | 'GENERATE' | 'AUTO_SAVE',
    description?: string,
    changes?: { added: number; modified: number; deleted: number }
  ) => Promise<VersionSnapshot | null>;
  restoreVersion: (versionId: string) => Promise<VersionSnapshot | null>;

  // Auto-save
  startAutoSave: (getContent: () => any) => void;
  stopAutoSave: () => void;
  isAutoSaving: boolean;
}

export function useVersionHistory({
  projectId,
  autoSaveInterval = 60000, // 1 minute default
  maxAutoSaves = 10,
}: UseVersionHistoryOptions): UseVersionHistoryReturn {
  const {
    versions,
    setVersions,
    isLoading,
    setLoading,
    error,
    setError,
    addVersion,
  } = useHistoryStore();

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  // Fetch all versions
  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');

      const data = await response.json();
      setVersions(data.versions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId, setVersions, setLoading, setError]);

  // Create a new version
  const createVersion = useCallback(
    async (
      content: any,
      action: 'CREATE' | 'UPDATE' | 'GENERATE' | 'AUTO_SAVE',
      description?: string,
      changes?: { added: number; modified: number; deleted: number }
    ): Promise<VersionSnapshot | null> => {
      try {
        const response = await fetch(`/api/projects/${projectId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            description,
            content,
            changes,
          }),
        });

        if (!response.ok) throw new Error('Failed to create version');

        const data = await response.json();

        // Add to local store
        const newVersion: VersionSnapshot = {
          id: data.version.id,
          versionNumber: data.version.versionNumber,
          createdAt: new Date(data.version.createdAt),
          createdBy: 'You',
          action,
          description: description || `버전 ${data.version.versionNumber}`,
          content,
          changes,
        };

        addVersion(newVersion);
        return newVersion;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create version');
        return null;
      }
    },
    [projectId, addVersion, setError]
  );

  // Restore a version
  const restoreVersion = useCallback(
    async (versionId: string): Promise<VersionSnapshot | null> => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/versions/${versionId}/restore`,
          { method: 'POST' }
        );

        if (!response.ok) throw new Error('Failed to restore version');

        const data = await response.json();

        // Refresh versions list
        await fetchVersions();

        return {
          id: data.version.id,
          versionNumber: data.version.versionNumber,
          createdAt: new Date(),
          createdBy: 'You',
          action: 'RESTORE',
          description: `v${data.version.restoredFrom}에서 복원됨`,
          content: data.version.content,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to restore version');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [projectId, fetchVersions, setLoading, setError]
  );

  // Start auto-save
  const startAutoSave = useCallback(
    (getContent: () => any) => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setInterval(async () => {
        const content = getContent();
        const contentString = JSON.stringify(content);

        // Only save if content has changed
        if (contentString !== lastContentRef.current) {
          setIsAutoSaving(true);
          lastContentRef.current = contentString;

          // Check auto-save count limit
          const autoSaveVersions = versions.filter(
            (v) => v.action === 'AUTO_SAVE'
          );

          if (autoSaveVersions.length >= maxAutoSaves) {
            // Remove oldest auto-save (keep in DB, just don't create new ones)
            console.log('Auto-save limit reached');
          } else {
            await createVersion(content, 'AUTO_SAVE', '자동 저장');
          }

          setIsAutoSaving(false);
        }
      }, autoSaveInterval);
    },
    [autoSaveInterval, maxAutoSaves, versions, createVersion]
  );

  // Stop auto-save
  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // Get current (latest) version
  const currentVersion = versions.length > 0 ? versions[0] : null;

  return {
    versions,
    currentVersion,
    isLoading,
    error,
    fetchVersions,
    createVersion,
    restoreVersion,
    startAutoSave,
    stopAutoSave,
    isAutoSaving,
  };
}
