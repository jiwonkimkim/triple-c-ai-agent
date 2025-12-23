'use client';

import { useState } from 'react';
import { Coins, Upload, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MARKETPLACE_CONFIG } from '@/lib/stripe';

interface TemplatePublishModalProps {
  open: boolean;
  onClose: () => void;
  template: {
    id: string;
    name: string;
    thumbnailUrl?: string | null;
  } | null;
  onPublish: (data: {
    price: number;
    description: string;
    tags: string[];
  }) => Promise<void>;
}

export function TemplatePublishModal({
  open,
  onClose,
  template,
  onPublish,
}: TemplatePublishModalProps) {
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async () => {
    if (!template) return;

    setLoading(true);
    setError(null);

    try {
      await onPublish({ price, description, tags });
      onClose();
      // Reset form
      setPrice(0);
      setDescription('');
      setTags([]);
    } catch (err: any) {
      setError(err.message || '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sellerEarning = Math.floor(price * 0.7);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>템플릿 마켓플레이스 등록</DialogTitle>
          <DialogDescription>
            템플릿을 마켓플레이스에 등록하고 수익을 창출하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Preview */}
          {template && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {template.thumbnailUrl ? (
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="w-16 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-12 bg-muted-foreground/10 rounded" />
              )}
              <div>
                <h4 className="font-semibold">{template.name}</h4>
                <p className="text-sm text-muted-foreground">
                  마켓플레이스에 등록됩니다
                </p>
              </div>
            </div>
          )}

          {/* Price Setting */}
          <div className="space-y-3">
            <Label>판매 가격 (크레딧)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[price]}
                onValueChange={([v]) => setPrice(v)}
                max={MARKETPLACE_CONFIG.MAX_TEMPLATE_PRICE}
                step={1}
                className="flex-1"
              />
              <div className="flex items-center gap-1 min-w-[80px]">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{price}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {price === 0 ? '무료 템플릿' : `예상 수익: ${sellerEarning} 크레딧 (70%)`}
              </span>
              <span className="text-muted-foreground">
                최대 {MARKETPLACE_CONFIG.MAX_TEMPLATE_PRICE} 크레딧
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="템플릿에 대한 설명을 입력하세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">태그 (최대 10개)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="태그 입력 후 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={tags.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
              >
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Commission Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-300">
              수수료 안내
            </p>
            <p className="text-blue-600 dark:text-blue-400 mt-1">
              판매 수익의 30%가 플랫폼 수수료로 차감됩니다.
              <br />
              예: 10 크레딧 판매 시 → 7 크레딧 수익
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                등록 중...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                마켓플레이스에 등록
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
