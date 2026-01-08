import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { VersionSnapshot } from '../_types';
import type { DevPromptInfo } from '@/components/dev/dev-prompt-viewer';

interface UseVersionHistoryOptions {
  onDevPromptsLoaded?: (prompts: DevPromptInfo | null) => void;
}

export function useVersionHistory(
  projectId: string,
  isActive: boolean,
  options?: UseVersionHistoryOptions
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Version list state
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<VersionSnapshot[]>([]);
  const [compareVersions, setCompareVersions] = useState<[VersionSnapshot, VersionSnapshot] | null>(null);

  // Preview state
  const [previewVersion, setPreviewVersion] = useState<VersionSnapshot | null>(null);

  // Restore state
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<VersionSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Rename state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [versionToRename, setVersionToRename] = useState<VersionSnapshot | null>(null);
  const [newVersionName, setNewVersionName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingVersions(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      const data = await response.json();
      setVersions(data.versions || []);
    } catch {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '버전 히스토리를 불러올 수 없습니다.',
      });
    } finally {
      setIsLoadingVersions(false);
    }
  }, [projectId, toast]);

  // Fetch versions when tab becomes active
  useEffect(() => {
    if (isActive) {
      fetchVersions();
    }
  }, [isActive, fetchVersions]);

  // Compare selection handler
  const handleCompareSelect = useCallback((version: VersionSnapshot) => {
    if (selectedForCompare.length === 0) {
      setSelectedForCompare([version]);
    } else if (selectedForCompare.length === 1) {
      if (selectedForCompare[0].id !== version.id) {
        const [older, newer] =
          new Date(selectedForCompare[0].createdAt) < new Date(version.createdAt)
            ? [selectedForCompare[0], version]
            : [version, selectedForCompare[0]];
        setCompareVersions([older, newer]);
        setSelectedForCompare([]);
        setCompareMode(false);
      }
    }
  }, [selectedForCompare]);

  // Cancel compare mode
  const cancelCompareMode = useCallback(() => {
    setCompareMode(false);
    setSelectedForCompare([]);
  }, []);

  // Close compare view
  const closeCompareView = useCallback(() => {
    setCompareVersions(null);
  }, []);

  // Start compare mode
  const startCompareMode = useCallback(() => {
    setCompareMode(true);
  }, []);

  // Open restore dialog
  const openRestoreDialog = useCallback((version: VersionSnapshot) => {
    setVersionToRestore(version);
    setRestoreDialogOpen(true);
  }, []);

  // Handle restore
  const handleRestore = useCallback(async (): Promise<boolean> => {
    if (!versionToRestore) return false;
    setIsRestoring(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionToRestore.id}/restore`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to restore');

      const responseData = await response.json();

      // devPrompts가 있으면 콜백 호출 및 sessionStorage에 저장
      if (responseData.devPrompts) {
        options?.onDevPromptsLoaded?.(responseData.devPrompts);
        try {
          sessionStorage.setItem(`devPrompts_${projectId}`, JSON.stringify(responseData.devPrompts));
        } catch (e) {
          console.warn('Failed to save devPrompts to sessionStorage:', e);
        }
      }

      await fetchVersions();
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      toast({
        title: '복원 완료',
        description: `v${versionToRestore.versionNumber} 버전으로 복원되었습니다.`,
      });
      setRestoreDialogOpen(false);
      setVersionToRestore(null);
      return true;
    } catch {
      toast({
        variant: 'destructive',
        title: '복원 실패',
        description: '버전을 복원할 수 없습니다.',
      });
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [versionToRestore, projectId, fetchVersions, queryClient, toast, options]);

  // Open rename dialog
  const openRenameDialog = useCallback((version: VersionSnapshot) => {
    setVersionToRename(version);
    setNewVersionName(version.description || `버전 ${version.versionNumber}`);
    setRenameDialogOpen(true);
  }, []);

  // Handle rename
  const handleRename = useCallback(async () => {
    if (!versionToRename || !newVersionName.trim()) return;
    setIsRenaming(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionToRename.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: newVersionName.trim() }),
        }
      );
      if (!response.ok) throw new Error('Failed to rename');

      setVersions((prev) =>
        prev.map((v) =>
          v.id === versionToRename.id
            ? { ...v, description: newVersionName.trim() }
            : v
        )
      );

      toast({
        title: '이름 변경 완료',
        description: `v${versionToRename.versionNumber} 이름이 변경되었습니다.`,
      });
      setRenameDialogOpen(false);
      setVersionToRename(null);
    } catch {
      toast({
        variant: 'destructive',
        title: '이름 변경 실패',
        description: '버전 이름을 변경할 수 없습니다.',
      });
    } finally {
      setIsRenaming(false);
    }
  }, [versionToRename, newVersionName, projectId, toast]);

  return {
    // Version list
    versions,
    isLoadingVersions,
    fetchVersions,

    // Compare mode
    compareMode,
    selectedForCompare,
    compareVersions,
    startCompareMode,
    cancelCompareMode,
    handleCompareSelect,
    closeCompareView,

    // Preview
    previewVersion,
    setPreviewVersion,

    // Restore
    restoreDialogOpen,
    setRestoreDialogOpen,
    versionToRestore,
    isRestoring,
    openRestoreDialog,
    handleRestore,

    // Rename
    renameDialogOpen,
    setRenameDialogOpen,
    versionToRename,
    newVersionName,
    setNewVersionName,
    isRenaming,
    openRenameDialog,
    handleRename,
  };
}
