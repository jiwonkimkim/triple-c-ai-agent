'use client';

import { Eye, Pencil, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatVersionDate, getActionLabel, getActionColor } from '@/stores/history-store';
import type { VersionSnapshot } from '../../_types';

interface VersionItemProps {
  version: VersionSnapshot;
  isCurrent: boolean;
  isSelectedForCompare: boolean;
  compareMode: boolean;
  onCompareSelect: (version: VersionSnapshot) => void;
  onPreview: (version: VersionSnapshot) => void;
  onRename: (version: VersionSnapshot) => void;
  onRestore: (version: VersionSnapshot) => void;
}

export function VersionItem({
  version,
  isCurrent,
  isSelectedForCompare,
  compareMode,
  onCompareSelect,
  onPreview,
  onRename,
  onRestore,
}: VersionItemProps) {
  return (
    <div
      className={`relative pl-10 ${
        compareMode ? 'cursor-pointer hover:bg-muted/50 rounded-lg p-2 -ml-2' : ''
      } ${isSelectedForCompare ? 'bg-primary/10 rounded-lg p-2 -ml-2' : ''}`}
      onClick={() => compareMode && onCompareSelect(version)}
    >
      {/* Timeline dot */}
      <div
        className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${
          isCurrent ? 'bg-primary' : getActionColor(version.action)
        }`}
      />

      {/* Version card */}
      <div
        className={`border rounded-lg p-4 transition-all ${
          isCurrent ? 'border-primary bg-primary/5' : ''
        } ${!compareMode ? 'hover:border-muted-foreground/50' : ''}`}
      >
        {/* Version header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={isCurrent ? 'default' : 'secondary'}
                className="text-xs cursor-pointer hover:opacity-80 flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(version);
                }}
              >
                {version.description &&
                !['수동 저장', '자동 저장', `v${version.versionNumber}에서 복원됨`].some(d => version.description?.includes(d))
                  ? version.description
                  : `v${version.versionNumber}`}
                <Pencil className="h-3 w-3 ml-0.5 opacity-60" />
              </Badge>
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white ${getActionColor(version.action)}`}
              >
                {getActionLabel(version.action)}
              </span>
              {isCurrent && (
                <Badge variant="outline" className="text-xs">현재</Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{formatVersionDate(version.createdAt)}</span>
              <span>{version.createdBy}</span>
            </div>

            {/* Changes summary */}
            {version.changes && (
              <div className="flex items-center gap-3 mt-2 text-xs">
                {version.changes.added > 0 && (
                  <span className="text-green-600">+{version.changes.added} 추가</span>
                )}
                {version.changes.modified > 0 && (
                  <span className="text-blue-600">~{version.changes.modified} 수정</span>
                )}
                {version.changes.deleted > 0 && (
                  <span className="text-red-600">-{version.changes.deleted} 삭제</span>
                )}
              </div>
            )}
          </div>

          {/* Thumbnail */}
          {version.thumbnail && (
            <div className="ml-4 w-16 h-16 rounded border bg-muted overflow-hidden flex-shrink-0">
              <img
                src={version.thumbnail}
                alt={`Version ${version.versionNumber}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {!compareMode && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(version);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              미리보기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRename(version);
              }}
            >
              <Pencil className="h-4 w-4 mr-1" />
              이름 변경
            </Button>
            {!isCurrent && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(version);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                복원
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
