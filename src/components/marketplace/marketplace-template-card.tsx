'use client';

import { Layout, Eye, ShoppingCart, Star, Check, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

export interface TemplateSectionData {
  id: string;
  type: string;
  imageUrl?: string;
  ocrText?: string;
  description?: string;
  prompt?: string;
}

export interface MarketplaceTemplateData {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string | null;
  previewImages?: string[];
  sections?: TemplateSectionData[] | {
    product_code?: string;
    original_price?: string;
    raw_data?: {
      category?: string;
      brand?: string;
      price?: string;
      product_code?: string;
    };
  };
  description?: string | null;
  price: number;
  tags?: string[];
  downloadCount: number;
  rating?: number | null;
  ratingCount: number;
  isReference: boolean;
  createdBy: 'SYSTEM' | 'USER';
  publishedAt?: Date | null;
  seller?: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  isPurchased: boolean;
  isOwner: boolean;
}

interface MarketplaceTemplateCardProps {
  template: MarketplaceTemplateData;
  onPreview?: (template: MarketplaceTemplateData) => void;
  onPurchase?: (template: MarketplaceTemplateData) => void;
  isSelected?: boolean;
}

const categoryLabels: Record<string, string> = {
  GENERIC: '일반',
  FASHION: '패션',
  FOOD: '음식',
  BEAUTY: '뷰티',
  DIGITAL: '디지털',
};

const categoryColors: Record<string, string> = {
  GENERIC: 'bg-gray-500',
  FASHION: 'bg-pink-500',
  FOOD: 'bg-orange-500',
  BEAUTY: 'bg-purple-500',
  DIGITAL: 'bg-blue-500',
};

export function MarketplaceTemplateCard({
  template,
  onPreview,
  onPurchase,
  isSelected = false,
}: MarketplaceTemplateCardProps) {
  const canPurchase = !template.isPurchased && !template.isOwner;
  const isFree = template.price === 0;

  // sections에서 제품 정보 추출
  const sections = template.sections as any;
  const productCategory = sections?.category || '';
  const productBrand = sections?.brand || template.tags?.[1] || '';
  const productPrice = sections?.price || '';

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all hover:shadow-lg',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {template.thumbnailUrl ? (
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <Layout className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onPreview?.(template)}
          >
            <Eye className="h-4 w-4 mr-1" />
            미리보기
          </Button>
        </div>

        {/* Category badge */}
        <Badge
          className={cn(
            'absolute top-2 left-2 text-white',
            categoryColors[template.category]
          )}
        >
          {categoryLabels[template.category] || template.category}
        </Badge>

        {/* Price badge */}
        <Badge
          variant={isFree ? 'secondary' : 'default'}
          className="absolute top-2 right-2"
        >
          {isFree ? (
            '무료'
          ) : (
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {template.price}
            </span>
          )}
        </Badge>

        {/* Purchased/Owner indicator */}
        {(template.isPurchased || template.isOwner) && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="outline" className="bg-green-500/90 text-white border-0">
              <Check className="h-3 w-3 mr-1" />
              {template.isOwner ? '내 템플릿' : '구매완료'}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-1 flex-1">{template.name}</h3>
          {template.rating && template.rating > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{template.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {/* 제품 정보 표시 */}
        {(productCategory || productBrand || productPrice) && (
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground mt-1">
            {productCategory && <span><span className="font-medium bg-amber-200/40 text-amber-600 px-1 rounded">카테고리</span> {productCategory}</span>}
            {productBrand && <span><span className="font-medium bg-rose-200/40 text-rose-500 px-1 rounded">브랜드</span> {productBrand}</span>}
            {productPrice && <span><span className="font-medium bg-emerald-200/40 text-emerald-600 px-1 rounded">가격</span> {Number(productPrice).toLocaleString()}원</span>}
          </div>
        )}
        {/* 설명 표시 */}
        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {template.description}
          </p>
        )}
        {/* 태그 표시 */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-2">
        {/* Seller info */}
        {template.seller && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={template.seller.image || undefined} />
              <AvatarFallback className="text-xs">
                {template.seller.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {template.seller.name}
            </span>
            {template.downloadCount > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {template.downloadCount}회 다운로드
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-2">
        {canPurchase ? (
          <Button
            className="w-full"
            size="sm"
            onClick={() => onPurchase?.(template)}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {isFree ? '무료로 받기' : `${template.price} 크레딧으로 구매`}
          </Button>
        ) : (
          <Button
            className="w-full"
            size="sm"
            variant="outline"
            onClick={() => onPreview?.(template)}
          >
            <Eye className="h-4 w-4 mr-1" />
            상세보기
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
