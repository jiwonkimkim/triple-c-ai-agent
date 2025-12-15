'use client';

import { useState, useEffect } from 'react';
import { History, X, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { VersionTimeline } from './version-timeline';
import { VersionCompare } from './version-compare';
import { useHistoryStore, VersionSnapshot } from '@/stores/history-store';

interface HistoryPanelProps {
  projectId: string;
  currentVersionId?: string;
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete?: (version: VersionSnapshot) => void;
}

export function HistoryPanel({
  projectId,
  currentVersionId,
  isOpen,
  onClose,
  onRestoreComplete,
}: HistoryPanelProps) {
  const {
    versions,
    setVersions,
    isLoading,
    setLoading,
    error,
    setError,
  } = useHistoryStore();

  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<
    [VersionSnapshot, VersionSnapshot] | null
  >(null);
  const [previewVersion, setPreviewVersion] = useState<VersionSnapshot | null>(
    null
  );
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<VersionSnapshot | null>(
    null
  );
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch versions on mount
  useEffect(() => {
    if (isOpen && projectId) {
      fetchVersions();
    }
  }, [isOpen, projectId]);

  const fetchVersions = async () => {
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
  };

  const handleSelectVersion = (version: VersionSnapshot) => {
    setPreviewVersion(version);
  };

  const handleCompareVersions = (v1: VersionSnapshot, v2: VersionSnapshot) => {
    // Ensure older version is first
    const [older, newer] =
      new Date(v1.createdAt) < new Date(v2.createdAt) ? [v1, v2] : [v2, v1];
    setCompareVersions([older, newer]);
    setCompareMode(true);
  };

  const handleRestoreVersion = (version: VersionSnapshot) => {
    setVersionToRestore(version);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!versionToRestore) return;

    setIsRestoring(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionToRestore.id}/restore`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to restore version');

      // Refresh versions list
      await fetchVersions();

      // Notify parent
      onRestoreComplete?.(versionToRestore);

      setRestoreDialogOpen(false);
      setVersionToRestore(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore');
    } finally {
      setIsRestoring(false);
    }
  };

  // Show compare view
  if (compareMode && compareVersions) {
    return (
      <Sheet open={isOpen} onOpenChange={() => {}}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0"
        >
          <VersionCompare
            versionA={compareVersions[0]}
            versionB={compareVersions[1]}
            onClose={() => {
              setCompareMode(false);
              setCompareVersions(null);
            }}
            onRestoreVersion={handleRestoreVersion}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="space-y-0 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                버전 히스토리
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchVersions}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isLoading && 'animate-spin')}
                />
              </Button>
            </div>
          </SheetHeader>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <VersionTimeline
              versions={versions}
              currentVersionId={currentVersionId}
              onSelectVersion={handleSelectVersion}
              onRestoreVersion={handleRestoreVersion}
              onCompareVersions={handleCompareVersions}
              disabled={isLoading}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>버전 복원</DialogTitle>
            <DialogDescription>
              {versionToRestore && (
                <>
                  <strong>v{versionToRestore.versionNumber}</strong> 버전으로
                  복원하시겠습니까?
                  <br />
                  <br />
                  현재 작업 중인 내용이 저장되고, 선택한 버전의 내용으로
                  교체됩니다. 이 작업은 새로운 버전으로 기록됩니다.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
              disabled={isRestoring}
            >
              취소
            </Button>
            <Button onClick={confirmRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  복원 중...
                </>
              ) : (
                '복원'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
