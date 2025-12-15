'use client';

import { useState } from 'react';
import {
  History,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  GitCompare,
  Sparkles,
  Save,
  ImageIcon,
  Video,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  VersionSnapshot,
  formatVersionDate,
  getActionLabel,
  getActionColor,
} from '@/stores/history-store';

interface VersionTimelineProps {
  versions: VersionSnapshot[];
  currentVersionId?: string;
  onSelectVersion: (version: VersionSnapshot) => void;
  onRestoreVersion: (version: VersionSnapshot) => void;
  onCompareVersions: (v1: VersionSnapshot, v2: VersionSnapshot) => void;
  disabled?: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Save className="h-3 w-3" />,
  UPDATE: <Save className="h-3 w-3" />,
  GENERATE: <Sparkles className="h-3 w-3" />,
  RESTORE: <RotateCcw className="h-3 w-3" />,
  AUTO_SAVE: <Clock className="h-3 w-3" />,
  GENERATE_IMAGE: <ImageIcon className="h-3 w-3" />,
  GENERATE_MOTION: <Video className="h-3 w-3" />,
  EXPORT: <Download className="h-3 w-3" />,
};

export function VersionTimeline({
  versions,
  currentVersionId,
  onSelectVersion,
  onRestoreVersion,
  onCompareVersions,
  disabled = false,
}: VersionTimelineProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<VersionSnapshot[]>([]);

  const toggleExpand = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleCompareSelect = (version: VersionSnapshot) => {
    if (selectedForCompare.length === 0) {
      setSelectedForCompare([version]);
    } else if (selectedForCompare.length === 1) {
      if (selectedForCompare[0].id !== version.id) {
        onCompareVersions(selectedForCompare[0], version);
        setSelectedForCompare([]);
        setCompareMode(false);
      }
    }
  };

  const cancelCompareMode = () => {
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <History className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">버전 히스토리가 없습니다</p>
        <p className="text-xs mt-1">변경사항이 저장되면 여기에 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h3 className="font-semibold">버전 히스토리</h3>
          <Badge variant="secondary" className="ml-2">
            {versions.length}개
          </Badge>
        </div>

        {!compareMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompareMode(true)}
            disabled={disabled || versions.length < 2}
          >
            <GitCompare className="h-4 w-4 mr-1" />
            비교
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedForCompare.length === 0
                ? '첫 번째 버전 선택'
                : '두 번째 버전 선택'}
            </span>
            <Button variant="ghost" size="sm" onClick={cancelCompareMode}>
              취소
            </Button>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {/* Version items */}
        <div className="space-y-4">
          {versions.map((version, index) => {
            const isExpanded = expandedVersions.has(version.id);
            const isCurrent = version.id === currentVersionId;
            const isSelectedForCompare = selectedForCompare.some(
              (v) => v.id === version.id
            );

            return (
              <div
                key={version.id}
                className={cn(
                  'relative pl-10 transition-all',
                  compareMode && 'cursor-pointer hover:bg-muted/50 rounded-lg p-2 -ml-2',
                  isSelectedForCompare && 'bg-primary/10 rounded-lg p-2 -ml-2'
                )}
                onClick={() => compareMode && handleCompareSelect(version)}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-2.5 w-3 h-3 rounded-full border-2 border-background',
                    isCurrent ? 'bg-primary' : getActionColor(version.action)
                  )}
                />

                {/* Version card */}
                <div
                  className={cn(
                    'border rounded-lg p-4 transition-all',
                    isCurrent && 'border-primary bg-primary/5',
                    !compareMode && 'hover:border-muted-foreground/50'
                  )}
                >
                  {/* Version header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isCurrent ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          v{version.versionNumber}
                        </Badge>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                            getActionColor(version.action),
                            'text-white'
                          )}
                        >
                          {actionIcons[version.action]}
                          {getActionLabel(version.action)}
                        </span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            현재
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm mt-2 line-clamp-2">
                        {version.description}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatVersionDate(version.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.createdBy}
                        </span>
                      </div>
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

                  {/* Changes summary */}
                  {version.changes && (
                    <div className="flex items-center gap-3 mt-3 text-xs">
                      {version.changes.added > 0 && (
                        <span className="text-green-600">
                          +{version.changes.added} 추가
                        </span>
                      )}
                      {version.changes.modified > 0 && (
                        <span className="text-blue-600">
                          ~{version.changes.modified} 수정
                        </span>
                      )}
                      {version.changes.deleted > 0 && (
                        <span className="text-red-600">
                          -{version.changes.deleted} 삭제
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expandable details */}
                  {!compareMode && (
                    <>
                      <button
                        onClick={() => toggleExpand(version.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            접기
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            자세히 보기
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {/* Section count */}
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              섹션 수:{' '}
                            </span>
                            <span className="font-medium">
                              {version.content.sections?.length || 0}개
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectVersion(version);
                                    }}
                                    disabled={disabled}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    미리보기
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>이 버전 미리보기</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {!isCurrent && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRestoreVersion(version);
                                      }}
                                      disabled={disabled}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      복원
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    이 버전으로 복원
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
