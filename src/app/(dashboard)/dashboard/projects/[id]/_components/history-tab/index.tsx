'use client';

import { History, RefreshCw, GitCompare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VersionCompare } from '@/components/history/version-compare';
import { VersionItem } from './version-item';
import { RestoreDialog, PreviewDialog, RenameDialog } from '../dialogs';
import type { VersionSnapshot } from '../../_types';

interface HistoryTabProps {
  // Version list
  versions: VersionSnapshot[];
  isLoadingVersions: boolean;
  fetchVersions: () => void;

  // Compare mode
  compareMode: boolean;
  selectedForCompare: VersionSnapshot[];
  compareVersions: [VersionSnapshot, VersionSnapshot] | null;
  startCompareMode: () => void;
  cancelCompareMode: () => void;
  handleCompareSelect: (version: VersionSnapshot) => void;
  closeCompareView: () => void;

  // Preview
  previewVersion: VersionSnapshot | null;
  setPreviewVersion: (version: VersionSnapshot | null) => void;

  // Restore
  restoreDialogOpen: boolean;
  setRestoreDialogOpen: (open: boolean) => void;
  versionToRestore: VersionSnapshot | null;
  isRestoring: boolean;
  openRestoreDialog: (version: VersionSnapshot) => void;
  handleRestore: () => Promise<boolean>;

  // Rename
  renameDialogOpen: boolean;
  setRenameDialogOpen: (open: boolean) => void;
  versionToRename: VersionSnapshot | null;
  newVersionName: string;
  setNewVersionName: (name: string) => void;
  isRenaming: boolean;
  openRenameDialog: (version: VersionSnapshot) => void;
  handleRename: () => void;

  // Callbacks
  onEditorRemount: () => void;
  onTabChange: (tab: 'editor' | 'settings' | 'history') => void;
}

export function HistoryTab({
  versions,
  isLoadingVersions,
  fetchVersions,
  compareMode,
  selectedForCompare,
  compareVersions,
  startCompareMode,
  cancelCompareMode,
  handleCompareSelect,
  closeCompareView,
  previewVersion,
  setPreviewVersion,
  restoreDialogOpen,
  setRestoreDialogOpen,
  versionToRestore,
  isRestoring,
  openRestoreDialog,
  handleRestore,
  renameDialogOpen,
  setRenameDialogOpen,
  versionToRename,
  newVersionName,
  setNewVersionName,
  isRenaming,
  openRenameDialog,
  handleRename,
  onEditorRemount,
  onTabChange,
}: HistoryTabProps) {
  const handleRestoreAndSwitch = async () => {
    const success = await handleRestore();
    if (success) {
      onEditorRemount();
      onTabChange('editor');
    }
  };

  // Compare View
  if (compareVersions) {
    return (
      <VersionCompare
        versionA={compareVersions[0]}
        versionB={compareVersions[1]}
        onClose={closeCompareView}
        onRestoreVersion={(version) => {
          openRestoreDialog(version);
          closeCompareView();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5" />
          <h2 className="text-lg font-semibold">버전 히스토리</h2>
          <Badge variant="secondary">{versions.length}개</Badge>
        </div>
        <div className="flex items-center gap-2">
          {!compareMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={startCompareMode}
              disabled={isLoadingVersions || versions.length < 2}
            >
              <GitCompare className="h-4 w-4 mr-1" />
              비교
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedForCompare.length === 0 ? '첫 번째 버전 선택' : '두 번째 버전 선택'}
              </span>
              <Button variant="ghost" size="sm" onClick={cancelCompareMode}>
                취소
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchVersions}
            disabled={isLoadingVersions}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingVersions ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Version List */}
      <ScrollArea className="flex-1 p-4">
        {isLoadingVersions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">버전 히스토리가 없습니다</p>
            <p className="text-xs mt-1">변경사항이 저장되면 여기에 표시됩니다</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Version items */}
            <div className="space-y-4">
              {versions.map((version, index) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isCurrent={index === 0}
                  isSelectedForCompare={selectedForCompare.some(v => v.id === version.id)}
                  compareMode={compareMode}
                  onCompareSelect={handleCompareSelect}
                  onPreview={setPreviewVersion}
                  onRename={openRenameDialog}
                  onRestore={openRestoreDialog}
                />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Dialogs */}
      <RestoreDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        version={versionToRestore}
        isRestoring={isRestoring}
        onRestore={handleRestoreAndSwitch}
      />

      <PreviewDialog
        version={previewVersion}
        onClose={() => setPreviewVersion(null)}
        onRestore={(version) => {
          openRestoreDialog(version);
          setPreviewVersion(null);
        }}
        isCurrentVersion={versions[0]?.id === previewVersion?.id}
      />

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        version={versionToRename}
        newName={newVersionName}
        onNameChange={setNewVersionName}
        isRenaming={isRenaming}
        onRename={handleRename}
      />
    </div>
  );
}
