'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { VersionSnapshot } from '../../_types';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: VersionSnapshot | null;
  newName: string;
  onNameChange: (name: string) => void;
  isRenaming: boolean;
  onRename: () => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  version,
  newName,
  onNameChange,
  isRenaming,
  onRename,
}: RenameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>버전 이름 변경</DialogTitle>
          <DialogDescription>
            {version && <>v{version.versionNumber} 버전의 이름을 변경합니다.</>}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={newName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="버전 이름 입력"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRenaming}
          >
            취소
          </Button>
          <Button onClick={onRename} disabled={isRenaming || !newName.trim()}>
            {isRenaming ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
