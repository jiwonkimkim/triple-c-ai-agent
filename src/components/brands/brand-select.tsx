'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Palette, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// 브랜드 스타일 가이드 타입
interface BrandStyleGuide {
  colors?: {
    primary?: string;
    secondary?: string;
    palette?: string[];
  };
  images?: {
    logo?: string;
    favicon?: string;
    ogImage?: string;
  };
  fonts?: {
    primary?: string;
    all?: string[];
  };
}

interface Brand {
  id: string;
  name: string;
  identity: string;
  imageKeywords: string[];
  styleGuide?: BrandStyleGuide | null;
}

interface BrandSelectProps {
  value?: string | null;
  onChange: (brandId: string | null) => void;
  onBrandSelect?: (brand: Brand | null) => void;  // 선택된 브랜드 전체 정보 전달
  workspaceId?: string;
  error?: boolean;
}

export function BrandSelect({ value, onChange, onBrandSelect, workspaceId, error }: BrandSelectProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const params = new URLSearchParams();
        if (workspaceId) {
          params.set('workspaceId', workspaceId);
        }
        const res = await fetch(`/api/brands?${params}`);
        const data = await res.json();
        if (data.success) {
          setBrands(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, [workspaceId]);

  // 선택된 브랜드
  const selectedBrand = value ? brands.find((b) => b.id === value) : null;

  // 브랜드 변경 핸들러
  const handleChange = (val: string) => {
    const brandId = val === 'none' ? null : val;
    onChange(brandId);
    if (onBrandSelect) {
      onBrandSelect(brandId ? brands.find((b) => b.id === brandId) || null : null);
    }
  };

  // 수집된 이미지가 있는지 확인
  const hasImages = selectedBrand?.styleGuide?.images && (
    selectedBrand.styleGuide.images.logo ||
    selectedBrand.styleGuide.images.ogImage ||
    selectedBrand.styleGuide.images.favicon
  );

  // 수집된 컬러가 있는지 확인
  const hasColors = selectedBrand?.styleGuide?.colors && (
    selectedBrand.styleGuide.colors.primary ||
    (selectedBrand.styleGuide.colors.palette && selectedBrand.styleGuide.colors.palette.length > 0)
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>브랜드 프로필</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>브랜드 프로필</Label>
        <Link href="/dashboard/brands/new" target="_blank">
          <Button type="button" variant="ghost" size="sm" className="h-auto p-1 text-xs">
            <Plus className="mr-1 h-3 w-3" />
            새로 만들기
          </Button>
        </Link>
      </div>

      <Select
        value={value || 'none'}
        onValueChange={handleChange}
      >
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder="브랜드를 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">브랜드 없이 진행</span>
            </div>
          </SelectItem>
          {brands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id}>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <span>{brand.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedBrand && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-green-500" />
            브랜드 연결됨
          </div>
          <p className="text-muted-foreground line-clamp-2">
            {selectedBrand.identity}
          </p>

          {/* 수집된 브랜드 자산 표시 */}
          {(hasColors || hasImages) && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">수집된 브랜드 자산</p>

              {/* 컬러 팔레트 */}
              {hasColors && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">컬러:</span>
                  <div className="flex gap-1">
                    {selectedBrand.styleGuide?.colors?.primary && (
                      <div
                        className="w-5 h-5 rounded border border-border"
                        style={{ backgroundColor: selectedBrand.styleGuide.colors.primary }}
                        title={`Primary: ${selectedBrand.styleGuide.colors.primary}`}
                      />
                    )}
                    {selectedBrand.styleGuide?.colors?.secondary && (
                      <div
                        className="w-5 h-5 rounded border border-border"
                        style={{ backgroundColor: selectedBrand.styleGuide.colors.secondary }}
                        title={`Secondary: ${selectedBrand.styleGuide.colors.secondary}`}
                      />
                    )}
                    {selectedBrand.styleGuide?.colors?.palette?.slice(0, 5).map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 추출된 이미지 */}
              {hasImages && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">이미지:</span>
                  <div className="flex gap-2">
                    {selectedBrand.styleGuide?.images?.logo && (
                      <div className="relative group">
                        <img
                          src={selectedBrand.styleGuide.images.logo}
                          alt="Logo"
                          className="h-8 w-auto max-w-[60px] object-contain rounded border border-border bg-white"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="absolute -bottom-4 left-0 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                          로고
                        </span>
                      </div>
                    )}
                    {selectedBrand.styleGuide?.images?.ogImage && (
                      <div className="relative group">
                        <img
                          src={selectedBrand.styleGuide.images.ogImage}
                          alt="OG Image"
                          className="h-8 w-auto max-w-[60px] object-contain rounded border border-border"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="absolute -bottom-4 left-0 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                          대표
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        브랜드를 선택하면 AI가 브랜드 톤에 맞는 콘텐츠를 생성합니다.
      </p>
    </div>
  );
}
