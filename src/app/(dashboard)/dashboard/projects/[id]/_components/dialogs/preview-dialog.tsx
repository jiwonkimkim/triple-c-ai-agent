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

// Types for new editor section format
interface EditorBlock {
  id: string;
  type: 'image-overlay' | string;
  src?: string;
  alt?: string;
  overlayTexts?: Array<{
    id: string;
    type: string;
    content: string;
    style?: {
      x?: number;
      y?: number;
      fontSize?: number;
      fontWeight?: string;
      color?: string;
    };
  }>;
}

interface EditorSection {
  id: string;
  name: string;
  blocks: EditorBlock[];
}

// Types for legacy content elements
interface LegacyElement {
  id?: string;
  type: string;
  level?: number;
  content?: string;
  alt?: string;
  styles?: React.CSSProperties;
}

export function PreviewDialog({
  version,
  onClose,
  onRestore,
  isCurrentVersion,
}: PreviewDialogProps) {
  if (!version) return null;

  // Check if content uses new editor section format (has blocks) or legacy format
  const sections = version.content?.sections || [];
  const isNewFormat = sections.length > 0 && 'blocks' in sections[0];

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
          {sections.length > 0 ? (
            <div className="p-4 space-y-6">
              {isNewFormat ? (
                // New editor section format
                (sections as EditorSection[]).map((section, sectionIndex) => (
                  <PreviewSection key={section.id || sectionIndex} section={section} />
                ))
              ) : (
                // Legacy element format
                (sections as LegacyElement[]).map((element, index) => (
                  <PreviewLegacyElement key={element.id || index} element={element} />
                ))
              )}
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

// Preview section for new editor format
function PreviewSection({ section }: { section: EditorSection }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="bg-muted/50 px-3 py-2 border-b">
        <span className="text-sm font-medium">{section.name}</span>
      </div>

      {/* Blocks */}
      <div className="space-y-2 p-2">
        {section.blocks.map((block, blockIndex) => (
          <PreviewBlock key={block.id || blockIndex} block={block} />
        ))}
      </div>
    </div>
  );
}

// Preview block for new editor format
function PreviewBlock({ block }: { block: EditorBlock }) {
  if (block.type === 'image-overlay' && block.src) {
    return (
      <div className="relative">
        {/* Image */}
        <img
          src={block.src}
          alt={block.alt || '이미지'}
          className="w-full h-auto rounded max-h-[300px] object-contain bg-gray-100"
        />

        {/* Overlay texts indicator */}
        {block.overlayTexts && block.overlayTexts.length > 0 && (
          <div className="mt-2 space-y-1">
            {block.overlayTexts.map((text, idx) => (
              <div key={text.id || idx} className="text-xs bg-muted/50 px-2 py-1 rounded">
                <span className="text-muted-foreground font-medium">{text.type}: </span>
                <span>{text.content.substring(0, 100)}{text.content.length > 100 ? '...' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-2 bg-muted/30 rounded text-sm text-muted-foreground">
      [{block.type}]
    </div>
  );
}

// Preview element for legacy format
function PreviewLegacyElement({ element }: { element: LegacyElement }) {
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
