'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, ShoppingBag, Layout, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface PurchasedTemplate {
  id: string;
  purchasedAt: string;
  pricePaid: number;
  template: {
    id: string;
    name: string;
    category: string;
    thumbnailUrl?: string | null;
    description?: string | null;
    isReference: boolean;
    seller?: {
      id: string;
      name: string;
      image?: string | null;
    } | null;
  };
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

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function PurchasedTemplatesTab() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    `/api/marketplace/purchases?page=${page}&limit=12`,
    fetcher
  );

  const purchases: PurchasedTemplate[] = data?.purchases || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">구매한 템플릿</h2>
        <p className="text-sm text-muted-foreground">
          구매한 템플릿을 확인하고 프로젝트에 적용하세요
        </p>
      </div>

      {/* Templates Grid */}
      {purchases.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">아직 구매한 템플릿이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            전체 탭에서 마음에 드는 템플릿을 찾아보세요
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {purchases.map((purchase) => (
              <Card
                key={purchase.id}
                className="group overflow-hidden transition-all hover:shadow-lg"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {purchase.template.thumbnailUrl ? (
                    <img
                      src={purchase.template.thumbnailUrl}
                      alt={purchase.template.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                      <Layout className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Category badge */}
                  <Badge
                    className={`absolute top-2 left-2 text-white ${
                      categoryColors[purchase.template.category]
                    }`}
                  >
                    {categoryLabels[purchase.template.category] ||
                      purchase.template.category}
                  </Badge>

                  {/* Purchased badge */}
                  <Badge
                    variant="outline"
                    className="absolute top-2 right-2 bg-green-500/90 text-white border-0"
                  >
                    구매완료
                  </Badge>
                </div>

                <CardHeader className="p-4 pb-2">
                  <h3 className="font-semibold line-clamp-1">
                    {purchase.template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(purchase.purchasedAt)} 구매
                  </p>
                </CardHeader>

                <CardContent className="px-4 pb-2">
                  {purchase.template.seller && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={purchase.template.seller.image || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {purchase.template.seller.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {purchase.template.seller.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {purchase.pricePaid === 0
                          ? '무료'
                          : `${purchase.pricePaid} 크레딧`}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-4 pt-2">
                  <Button className="w-full" size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    프로젝트에 적용
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
