'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { VersionSnapshot } from '../../_types';

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: VersionSnapshot | null;
  isRestoring: boolean;
  onRestore: () => void;
}

export function RestoreDialog({
  open,
  onOpenChange,
  version,
  isRestoring,
  onRestore,
}: RestoreDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>버전 복원</DialogTitle>
          <DialogDescription>
            {version && (
              <>
                <strong>v{version.versionNumber}</strong> 버전으로 복원하시겠습니까?
                <br /><br />
                현재 작업 중인 내용이 저장되고, 선택한 버전의 내용으로 교체됩니다.
                이 작업은 새로운 버전으로 기록됩니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRestoring}
          >
            취소
          </Button>
          <Button onClick={onRestore} disabled={isRestoring}>
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
  );
}
