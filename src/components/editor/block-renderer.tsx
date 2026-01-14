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
import { ImageOverlayBlockRenderer } from './image-overlay-block';
import type { EditorBlock, ImageOverlayBlock as ImageOverlayBlockType } from '@/stores/editor-store';

interface BlockRendererProps {
  block: EditorBlock;
  isSelected: boolean;
  isMain?: boolean;  // MAIN 섹션 여부 - 1:1 비율 적용
  previewMode?: 'desktop' | 'tablet' | 'mobile';  // 미리보기 모드 (텍스트 크기 비율 조절)
  onSelect: () => void;
  onUpdate: (updates: Partial<EditorBlock>) => void;
}

export function BlockRenderer({ block, isSelected, isMain = false, previewMode = 'desktop', onSelect, onUpdate }: BlockRendererProps) {
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
          previewMode={previewMode}
          onSelect={onSelect}
          onUpdate={onUpdate}
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
