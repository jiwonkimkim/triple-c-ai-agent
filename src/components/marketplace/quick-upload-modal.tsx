'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Upload,
  ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { useImageModeration } from '@/hooks/use-image-moderation';

interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const categories = [
  { value: 'GENERIC', label: '일반' },
  { value: 'FASHION', label: '패션' },
  { value: 'FOOD', label: '음식' },
  { value: 'BEAUTY', label: '뷰티' },
  { value: 'DIGITAL', label: '디지털' },
];

export function QuickUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickUploadModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateFile, isLoading: isValidating } = useImageModeration();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('GENERIC');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);

  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailStatus, setThumbnailStatus] = useState<'idle' | 'validating' | 'approved' | 'rejected'>('idle');
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setThumbnailError(null);
    setThumbnailStatus('validating');

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);

    try {
      // Validate with NSFW.js
      const result = await validateFile(file);

      if (result.isApproved) {
        setThumbnailFile(file);
        setThumbnailStatus('approved');
      } else {
        setThumbnailFile(null);
        setThumbnailStatus('rejected');
        setThumbnailError(result.reason || '부적절한 이미지입니다.');
        setThumbnailPreview(null);
      }
    } catch (error: any) {
      setThumbnailStatus('rejected');
      setThumbnailError(error.message || '이미지 검증에 실패했습니다.');
      setThumbnailPreview(null);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailStatus('idle');
    setThumbnailError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }
    if (description.trim().length < 10) {
      alert('설명을 최소 10자 이상 입력해주세요.');
      return;
    }
    if (!isFree && (price < 1 || price > 100)) {
      alert('가격은 1~100 크레딧 사이로 설정해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload thumbnail if exists
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('file', thumbnailFile);
        formData.append('type', 'template-thumbnail');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          thumbnailUrl = uploadData.url;
        }
      }

      // 2. Create template
      const templateRes = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          thumbnailUrl,
          sections: [
            {
              id: '1',
              type: 'HERO',
              title: '메인 섹션',
              content: description.trim(),
              order: 0,
            },
          ],
        }),
      });

      if (!templateRes.ok) {
        const data = await templateRes.json();
        throw new Error(data.error || '템플릿 생성에 실패했습니다.');
      }

      const templateData = await templateRes.json();
      const templateId = templateData.data.id;

      // 3. Publish to marketplace
      const publishRes = await fetch(`/api/marketplace/templates/${templateId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: isFree ? 0 : price,
          description: description.trim(),
        }),
      });

      if (!publishRes.ok) {
        const data = await publishRes.json();
        throw new Error(data.error || '마켓 등록에 실패했습니다.');
      }

      // Reset form
      setName('');
      setCategory('GENERIC');
      setDescription('');
      setPrice(0);
      setIsFree(true);
      removeThumbnail();

      onSuccess?.();
      onClose();
      router.refresh();
    } catch (error: any) {
      alert(error.message || '업로드에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            템플릿 업로드
          </DialogTitle>
          <DialogDescription>
            템플릿을 마켓플레이스에 바로 등록합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>썸네일 이미지</Label>
            <div className="flex items-start gap-4">
              {thumbnailPreview ? (
                <div className="relative w-32 h-24 rounded-lg overflow-hidden border">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  {thumbnailStatus === 'validating' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  {thumbnailStatus === 'approved' && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <button
                    onClick={removeThumbnail}
                    className="absolute top-1 left-1 bg-black/50 rounded-full p-0.5 hover:bg-black/70"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isValidating}
                  className="w-32 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {isValidating ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">이미지 선택</span>
                    </>
                  )}
                </button>
              )}
              <div className="flex-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="h-4 w-4" />
                  <span>AI 자동 검증</span>
                </div>
                <p className="text-xs">
                  부적절한 이미지는 자동으로 차단됩니다
                </p>
                {thumbnailError && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {thumbnailError}
                  </p>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">템플릿 이름 *</Label>
            <Input
              id="name"
              placeholder="예: 프리미엄 패션 룩북"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>카테고리 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 * (최소 10자)</Label>
            <Textarea
              id="description"
              placeholder="템플릿에 대한 설명을 입력하세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          {/* Price */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>무료로 공유</Label>
              <Switch
                checked={isFree}
                onCheckedChange={setIsFree}
              />
            </div>
            {!isFree && (
              <div className="space-y-2">
                <Label htmlFor="price">가격 (1~100 크레딧)</Label>
                <Input
                  id="price"
                  type="number"
                  min={1}
                  max={100}
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  판매 수익의 70%를 받습니다 (예상 수익: {Math.floor(price * 0.7)} 크레딧)
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || thumbnailStatus === 'validating'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {isFree ? '무료로 공유하기' : `${price} 크레딧에 판매하기`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
