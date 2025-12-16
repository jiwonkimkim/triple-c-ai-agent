'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Palette, Check } from 'lucide-react';
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

interface Brand {
  id: string;
  name: string;
  identity: string;
  imageKeywords: string[];
}

interface BrandSelectProps {
  value?: string | null;
  onChange: (brandId: string | null) => void;
  workspaceId?: string;
  error?: boolean;
}

export function BrandSelect({ value, onChange, workspaceId, error }: BrandSelectProps) {
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
        onValueChange={(val) => onChange(val === 'none' ? null : val)}
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

      {value && brands.find((b) => b.id === value) && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-green-500" />
            브랜드 연결됨
          </div>
          <p className="mt-1 text-muted-foreground line-clamp-2">
            {brands.find((b) => b.id === value)?.identity}
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        브랜드를 선택하면 AI가 브랜드 톤에 맞는 콘텐츠를 생성합니다.
      </p>
    </div>
  );
}
