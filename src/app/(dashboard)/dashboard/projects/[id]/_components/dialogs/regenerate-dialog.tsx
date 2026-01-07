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
import { Label } from '@/components/ui/label';
import type { ProjectData } from '../../_types';
import { IMAGE_MODEL_OPTIONS } from '../../_types';

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData | undefined;
  isRegenerating: boolean;
  selectedModel: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  onModelChange: (model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview') => void;
  onRegenerate: () => void;
}

export function RegenerateDialog({
  open,
  onOpenChange,
  project,
  isRegenerating,
  selectedModel,
  onModelChange,
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
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasProductInfo ? (
            <div className="text-left space-y-1 p-3 bg-muted rounded-lg text-sm">
              <p><strong>제품명:</strong> {project.productName}</p>
              <p><strong>카테고리:</strong> {project.category}</p>
              <p><strong>주요 특징:</strong> {project.keyFeatures?.join(', ')}</p>
              <p><strong>타겟 고객:</strong> {project.targetAudience || '일반 소비자'}</p>
            </div>
          ) : (
            <div className="text-destructive text-sm">
              제품 정보가 없습니다. Settings 탭에서 먼저 입력해주세요.
            </div>
          )}

          {/* 이미지 생성 모델 선택 */}
          <div className="space-y-2">
            <Label>이미지 생성 모델</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {IMAGE_MODEL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selectedModel === option.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="imageModel"
                    value={option.value}
                    checked={selectedModel === option.value}
                    onChange={(e) =>
                      onModelChange(e.target.value as 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview')
                    }
                    className="sr-only"
                  />
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

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
