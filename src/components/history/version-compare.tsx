'use client';

import { useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Minus,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  VersionSnapshot,
  formatVersionDate,
  getActionLabel,
} from '@/stores/history-store';

interface VersionCompareProps {
  versionA: VersionSnapshot;
  versionB: VersionSnapshot;
  onClose: () => void;
  onRestoreVersion: (version: VersionSnapshot) => void;
}

interface DiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  sectionId?: string;
  sectionA?: any;
  sectionB?: any;
  blockDiffs?: BlockDiff[];
}

interface BlockDiff {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  blockId?: string;
  blockA?: any;
  blockB?: any;
  changes?: string[];
}

function computeDiff(versionA: VersionSnapshot, versionB: VersionSnapshot): DiffResult[] {
  const sectionsA = versionA.content.sections || [];
  const sectionsB = versionB.content.sections || [];

  const results: DiffResult[] = [];
  const processedB = new Set<string>();

  // Find modified and removed sections
  for (const sectionA of sectionsA) {
    const sectionB = sectionsB.find((s) => s.id === sectionA.id);

    if (!sectionB) {
      // Section was removed
      results.push({
        type: 'removed',
        sectionId: sectionA.id,
        sectionA,
      });
    } else {
      processedB.add(sectionB.id);

      // Compare blocks
      const blockDiffs = computeBlockDiff(sectionA.blocks || [], sectionB.blocks || []);
      const hasChanges = blockDiffs.some((d) => d.type !== 'unchanged');

      results.push({
        type: hasChanges ? 'modified' : 'unchanged',
        sectionId: sectionA.id,
        sectionA,
        sectionB,
        blockDiffs,
      });
    }
  }

  // Find added sections
  for (const sectionB of sectionsB) {
    if (!processedB.has(sectionB.id)) {
      results.push({
        type: 'added',
        sectionId: sectionB.id,
        sectionB,
      });
    }
  }

  return results;
}

function computeBlockDiff(blocksA: any[], blocksB: any[]): BlockDiff[] {
  const results: BlockDiff[] = [];
  const processedB = new Set<string>();

  for (const blockA of blocksA) {
    const blockB = blocksB.find((b) => b.id === blockA.id);

    if (!blockB) {
      results.push({
        type: 'removed',
        blockId: blockA.id,
        blockA,
      });
    } else {
      processedB.add(blockB.id);
      const changes = findBlockChanges(blockA, blockB);

      results.push({
        type: changes.length > 0 ? 'modified' : 'unchanged',
        blockId: blockA.id,
        blockA,
        blockB,
        changes,
      });
    }
  }

  for (const blockB of blocksB) {
    if (!processedB.has(blockB.id)) {
      results.push({
        type: 'added',
        blockId: blockB.id,
        blockB,
      });
    }
  }

  return results;
}

function findBlockChanges(blockA: any, blockB: any): string[] {
  const changes: string[] = [];

  if (blockA.type !== blockB.type) {
    changes.push(`타입: ${blockA.type} → ${blockB.type}`);
  }

  if (JSON.stringify(blockA.content) !== JSON.stringify(blockB.content)) {
    changes.push('내용 변경');
  }

  if (JSON.stringify(blockA.style) !== JSON.stringify(blockB.style)) {
    changes.push('스타일 변경');
  }

  return changes;
}

function getBlockPreview(block: any): string {
  if (!block) return '';

  switch (block.type) {
    case 'heading':
    case 'text':
      return block.content?.text?.slice(0, 50) || '';
    case 'image':
      return block.content?.alt || '이미지';
    case 'button':
      return block.content?.label || '버튼';
    case 'list':
      return `목록 (${block.content?.items?.length || 0}개)`;
    case 'quote':
      return block.content?.text?.slice(0, 50) || '인용';
    default:
      return block.type;
  }
}

export function VersionCompare({
  versionA,
  versionB,
  onClose,
  onRestoreVersion,
}: VersionCompareProps) {
  const diffs = useMemo(() => computeDiff(versionA, versionB), [versionA, versionB]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;

    diffs.forEach((diff) => {
      if (diff.type === 'added') added++;
      else if (diff.type === 'removed') removed++;
      else if (diff.type === 'modified') modified++;
    });

    return { added, removed, modified };
  }, [diffs]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">버전 비교</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <Plus className="h-4 w-4" />
              {stats.added} 추가
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <Minus className="h-4 w-4" />
              {stats.removed} 삭제
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <Edit3 className="h-4 w-4" />
              {stats.modified} 수정
            </span>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Version Headers */}
      <div className="grid grid-cols-2 border-b">
        <div className="p-4 border-r bg-red-50/50">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">v{versionA.versionNumber}</Badge>
            <span className="text-sm text-muted-foreground">이전</span>
          </div>
          <p className="text-sm mt-1 font-medium">{versionA.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatVersionDate(versionA.createdAt)}
          </p>
        </div>

        <div className="p-4 bg-green-50/50">
          <div className="flex items-center gap-2">
            <Badge>v{versionB.versionNumber}</Badge>
            <span className="text-sm text-muted-foreground">이후</span>
          </div>
          <p className="text-sm mt-1 font-medium">{versionB.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatVersionDate(versionB.createdAt)}
          </p>
        </div>
      </div>

      {/* Diff Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {diffs.map((diff, index) => (
            <div
              key={diff.sectionId || index}
              className={cn(
                'rounded-lg border p-4',
                diff.type === 'added' && 'bg-green-50 border-green-200',
                diff.type === 'removed' && 'bg-red-50 border-red-200',
                diff.type === 'modified' && 'bg-blue-50 border-blue-200',
                diff.type === 'unchanged' && 'bg-muted/30'
              )}
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {diff.type === 'added' && (
                    <Badge className="bg-green-500">추가됨</Badge>
                  )}
                  {diff.type === 'removed' && (
                    <Badge className="bg-red-500">삭제됨</Badge>
                  )}
                  {diff.type === 'modified' && (
                    <Badge className="bg-blue-500">수정됨</Badge>
                  )}
                  {diff.type === 'unchanged' && (
                    <Badge variant="secondary">변경 없음</Badge>
                  )}
                  <span className="font-medium">
                    {diff.sectionA?.name || diff.sectionB?.name || '섹션'}
                  </span>
                </div>
              </div>

              {/* Block diffs */}
              {diff.type === 'modified' && diff.blockDiffs && (
                <div className="space-y-2">
                  {diff.blockDiffs
                    .filter((bd) => bd.type !== 'unchanged')
                    .map((blockDiff, bdIndex) => (
                      <div
                        key={blockDiff.blockId || bdIndex}
                        className={cn(
                          'flex items-start gap-3 p-2 rounded text-sm',
                          blockDiff.type === 'added' && 'bg-green-100',
                          blockDiff.type === 'removed' && 'bg-red-100',
                          blockDiff.type === 'modified' && 'bg-blue-100'
                        )}
                      >
                        {blockDiff.type === 'added' && (
                          <Plus className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        )}
                        {blockDiff.type === 'removed' && (
                          <Minus className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        {blockDiff.type === 'modified' && (
                          <Edit3 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {blockDiff.blockA?.type || blockDiff.blockB?.type}
                            </Badge>
                            <span className="text-muted-foreground truncate">
                              {getBlockPreview(blockDiff.blockA || blockDiff.blockB)}
                            </span>
                          </div>

                          {blockDiff.type === 'modified' && blockDiff.changes && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {blockDiff.changes.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Added section preview */}
              {diff.type === 'added' && diff.sectionB && (
                <div className="text-sm text-muted-foreground">
                  <p>{diff.sectionB.blocks?.length || 0}개의 블록 추가</p>
                </div>
              )}

              {/* Removed section preview */}
              {diff.type === 'removed' && diff.sectionA && (
                <div className="text-sm text-muted-foreground">
                  <p>{diff.sectionA.blocks?.length || 0}개의 블록 삭제</p>
                </div>
              )}
            </div>
          ))}

          {diffs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              두 버전 간에 차이가 없습니다.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onRestoreVersion(versionA)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            v{versionA.versionNumber}로 복원
          </Button>
          <Button onClick={() => onRestoreVersion(versionB)}>
            v{versionB.versionNumber}로 복원
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
