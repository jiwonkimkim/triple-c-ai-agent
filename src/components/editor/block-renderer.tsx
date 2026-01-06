'use client';

import {
  HeadingBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  ListBlock,
  QuoteBlock,
} from './blocks';
import { ImageOverlayBlockRenderer, type SectionRegenerationContext } from './image-overlay-block';
import type { EditorBlock, ImageOverlayBlock as ImageOverlayBlockType } from '@/stores/editor-store';

interface BlockRendererProps {
  block: EditorBlock;
  isSelected: boolean;
  isMain?: boolean;  // MAIN 섹션 여부 - 1:1 비율 적용
  onSelect: () => void;
  onUpdate: (updates: Partial<EditorBlock>) => void;
  // 재생성 관련 props (선택적)
  regenerationContext?: SectionRegenerationContext;
  isRegenerating?: boolean;
  onRegenerate?: (selectedModel: string) => void;
}

export function BlockRenderer({
  block,
  isSelected,
  isMain = false,
  onSelect,
  onUpdate,
  regenerationContext,
  isRegenerating,
  onRegenerate,
}: BlockRendererProps) {
  switch (block.type) {
    case 'heading':
      return (
        <HeadingBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'text':
      return (
        <TextBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'image':
      return (
        <ImageBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'image-overlay':
      return (
        <ImageOverlayBlockRenderer
          block={block as ImageOverlayBlockType & { id: string }}
          isSelected={isSelected}
          isMain={isMain}
          onSelect={onSelect}
          onUpdate={onUpdate}
          regenerationContext={regenerationContext}
          isRegenerating={isRegenerating}
          onRegenerate={onRegenerate}
        />
      );

    case 'button':
      return (
        <ButtonBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'divider':
      return (
        <DividerBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'spacer':
      return (
        <SpacerBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'list':
      return (
        <ListBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    case 'quote':
      return (
        <QuoteBlock
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onUpdate={onUpdate}
        />
      );

    default:
      return (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          Unknown block type: {(block as EditorBlock).type}
        </div>
      );
  }
}

// Re-export for convenience
export type { SectionRegenerationContext };
