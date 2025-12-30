'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProjectData } from '../../_types';

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData | undefined;
  isRegenerating: boolean;
  onRegenerate: () => void;
}

export function RegenerateDialog({
  open,
  onOpenChange,
  project,
  isRegenerating,
  onRegenerate,
}: RegenerateDialogProps) {
  const hasProductInfo = project?.productName && project?.category && project?.keyFeatures?.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>상세페이지 재생성</DialogTitle>
          <DialogDescription>
            기존에 입력한 제품 정보를 바탕으로 새로운 상세페이지를 생성합니다.
            <br /><br />
            {hasProductInfo ? (
              <div className="text-left space-y-1 mt-2 p-3 bg-muted rounded-lg">
                <p><strong>제품명:</strong> {project.productName}</p>
                <p><strong>카테고리:</strong> {project.category}</p>
                <p><strong>주요 특징:</strong> {project.keyFeatures?.join(', ')}</p>
                <p><strong>타겟 고객:</strong> {project.targetAudience || '일반 소비자'}</p>
              </div>
            ) : (
              <div className="text-destructive mt-2">
                제품 정보가 없습니다. Settings 탭에서 먼저 입력해주세요.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRegenerating}
          >
            취소
          </Button>
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating || !hasProductInfo}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                재생성하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
