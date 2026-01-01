'use client';

import { useState } from 'react';
import { X, ShoppingCart, Check, Coins, Star, Download, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MarketplaceTemplateData } from './marketplace-template-card';

interface TemplatePreviewModalProps {
  template: MarketplaceTemplateData | null;
  onClose: () => void;
  onPurchase: (template: MarketplaceTemplateData) => void;
}

const categoryLabels: Record<string, string> = {
  GENERIC: '일반',
  FASHION: '패션',
  FOOD: '음식',
  BEAUTY: '뷰티',
  DIGITAL: '디지털',
};

export function TemplatePreviewModal({
  template,
  onClose,
  onPurchase,
}: TemplatePreviewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!template) return null;

  const isFree = template.price === 0;
  const canPurchase = !template.isPurchased && !template.isOwner;

  // sections에서 이미지 메타데이터 추출
  const sections = template.sections as any;
  const sectionImages = sections?.images || [];

  // previewImages 사용 (모든 이미지가 순서대로 저장됨)
  const allImages = (template.previewImages && template.previewImages.length > 0)
    ? template.previewImages
    : [template.thumbnailUrl].filter(Boolean) as string[];

  const currentImage = allImages[currentImageIndex] || template.thumbnailUrl;

  // 현재 이미지의 메타데이터 찾기
  const currentImageMeta = sectionImages.find((img: any) => img.url === currentImage) || sectionImages[currentImageIndex];

  const goToPrev = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Image Gallery Section */}
            <div className="md:w-1/2 bg-muted flex flex-col">
              {/* Main Image */}
              <div className="relative flex-1 flex items-center justify-center p-4">
                {currentImage ? (
                  <>
                    <img
                      src={currentImage}
                      alt={`${template.name} - ${currentImageIndex + 1}`}
                      className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                    />
                    {/* Navigation Arrows */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={goToPrev}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={goToNext}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {/* Image Counter */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-muted to-muted-foreground/10 rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">미리보기 없음</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="p-2 border-t bg-background/50">
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={cn(
                            'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                            currentImageIndex === idx
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-transparent hover:border-muted-foreground/30'
                          )}
                        >
                          <img
                            src={img}
                            alt={`썸네일 ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Info section */}
            <div className="md:w-1/2 p-6 overflow-y-auto">
              {/* Category & Price */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">
                  {categoryLabels[template.category] || template.category}
                </Badge>
                <Badge variant={isFree ? 'outline' : 'default'}>
                  {isFree ? (
                    '무료'
                  ) : (
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {template.price} 크레딧
                    </span>
                  )}
                </Badge>
                {template.isReference && (
                  <Badge variant="outline" className="border-purple-500 text-purple-500">
                    참조 템플릿
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-2">{template.name}</h2>

              {/* 제품 정보 (카테고리, 브랜드, 가격) */}
              {(sections?.category || sections?.brand || sections?.price) && (
                <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                  {sections?.category && <span><span className="font-semibold text-foreground">카테고리</span> {sections.category}</span>}
                  {sections?.brand && <span><span className="font-semibold text-foreground">브랜드</span> {sections.brand}</span>}
                  {sections?.price && <span><span className="font-semibold text-foreground">가격</span> {Number(sections.price).toLocaleString()}원</span>}
                </div>
              )}

              {/* Rating & Downloads */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                {template.rating && template.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{template.rating.toFixed(1)}</span>
                    <span>({template.ratingCount})</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{template.downloadCount}회 다운로드</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Description - 현재 이미지의 설명 표시 */}
              {(currentImageMeta?.description || template.description) && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">
                    설명 {allImages.length > 1 && `(${currentImageIndex + 1}/${allImages.length})`}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {currentImageMeta?.description || template.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    태그
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller info */}
              {template.seller && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">판매자</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {template.seller.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{template.seller.name}</span>
                  </div>
                </div>
              )}

              {/* Status indicator */}
              {(template.isPurchased || template.isOwner) && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">
                      {template.isOwner ? '내가 만든 템플릿입니다' : '이미 보유한 템플릿입니다'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                {canPurchase ? (
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => onPurchase(template)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isFree ? '무료로 받기' : `${template.price} 크레딧으로 구매`}
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    size="lg"
                    variant="secondary"
                    disabled
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {template.isOwner ? '내 템플릿' : '보유 중'}
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={onClose}>
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
