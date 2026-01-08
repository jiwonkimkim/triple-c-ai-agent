'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ImageBlock as ImageBlockType, BlockStyle } from '@/stores/editor-store';

interface ImageBlockProps {
  block: ImageBlockType & { id: string };
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageBlockType>) => void;
}

export function ImageBlock({ block, isSelected, onSelect, onUpdate }: ImageBlockProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For demo, create object URL
    // In production, upload to S3 and get URL
    const imageUrl = URL.createObjectURL(file);
    onUpdate({
      src: imageUrl,
      alt: file.name,
    });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ caption: e.target.value });
  };

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ alt: e.target.value });
  };

  const getStyleClasses = (style?: BlockStyle) => {
    const classes: string[] = [];
    if (style?.textAlign) {
      classes.push(`text-${style.textAlign}`);
    }
    return classes.join(' ');
  };

  const inlineStyles: React.CSSProperties = {};
  if (block.style?.borderRadius) {
    inlineStyles.borderRadius = block.style.borderRadius;
  }

  return (
    <div
      className={cn(
        'relative group cursor-pointer rounded-md transition-all',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={onSelect}
    >
      {block.src ? (
        <div className={cn('relative', getStyleClasses(block.style))}>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg" style={inlineStyles}>
            <Image
              src={block.src}
              alt={block.alt || 'Product image'}
              fill
              className="object-contain"
              unoptimized // For blob URLs
            />

            {/* Overlay controls on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-1" />
                Replace
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
              >
                Settings
              </Button>
            </div>
          </div>

          {/* Caption */}
          {(block.caption || isEditingCaption) && (
            <div className="mt-2 text-center">
              {isEditingCaption ? (
                <Input
                  value={block.caption || ''}
                  onChange={handleCaptionChange}
                  onBlur={() => setIsEditingCaption(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingCaption(false)}
                  placeholder="Add caption..."
                  className="text-sm text-center"
                  autoFocus
                />
              ) : (
                <p
                  className="text-sm text-muted-foreground cursor-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingCaption(true);
                  }}
                >
                  {block.caption}
                </p>
              )}
            </div>
          )}

          {/* Settings panel */}
          {showSettings && isSelected && (
            <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-background border rounded-lg shadow-lg z-10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Alt Text</Label>
                  <Input
                    value={block.alt}
                    onChange={handleAltChange}
                    placeholder="Describe the image..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Input
                    value={block.caption || ''}
                    onChange={handleCaptionChange}
                    placeholder="Add a caption..."
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSettings(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">Click to upload an image</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}
