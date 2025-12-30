'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatVersionDate } from '@/stores/history-store';
import type { VersionSnapshot } from '../../_types';

interface PreviewDialogProps {
  version: VersionSnapshot | null;
  onClose: () => void;
  onRestore: (version: VersionSnapshot) => void;
  isCurrentVersion: boolean;
}

export function PreviewDialog({
  version,
  onClose,
  onRestore,
  isCurrentVersion,
}: PreviewDialogProps) {
  if (!version) return null;

  return (
    <Dialog open={!!version} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>v{version.versionNumber} 미리보기</DialogTitle>
          <DialogDescription>
            {version.description} - {formatVersionDate(version.createdAt)}
          </DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg bg-white min-h-[300px] max-h-[500px] overflow-auto">
          {version.content?.sections && version.content.sections.length > 0 ? (
            <div className="p-6 space-y-4">
              {version.content.sections.map((element: ContentElement, index: number) => (
                <PreviewElement key={element.id || index} element={element} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              콘텐츠가 없습니다.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          {!isCurrentVersion && (
            <Button onClick={() => onRestore(version)}>
              <RotateCcw className="h-4 w-4 mr-1" />
              이 버전으로 복원
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Types for content elements
interface ContentElement {
  id?: string;
  type: string;
  level?: number;
  content?: string;
  alt?: string;
  styles?: React.CSSProperties;
}

// Preview element renderer
function PreviewElement({ element }: { element: ContentElement }) {
  const styles: React.CSSProperties = element.styles || {};

  if (element.type === 'heading') {
    const HeadingTag = `h${element.level || 2}` as keyof JSX.IntrinsicElements;
    return (
      <HeadingTag style={styles} className="whitespace-pre-wrap">
        {element.content || '제목'}
      </HeadingTag>
    );
  }

  if (element.type === 'text') {
    return (
      <p style={styles} className="whitespace-pre-wrap">
        {element.content || '텍스트'}
      </p>
    );
  }

  if (element.type === 'image') {
    return element.content ? (
      <img
        src={element.content}
        alt={element.alt || '이미지'}
        style={styles}
        className="max-w-full h-auto rounded"
      />
    ) : (
      <div className="w-full h-32 bg-muted flex items-center justify-center rounded border-2 border-dashed">
        <span className="text-muted-foreground text-sm">이미지</span>
      </div>
    );
  }

  return (
    <div className="p-2 bg-muted/50 rounded text-sm">
      {element.content || `[${element.type}]`}
    </div>
  );
}
