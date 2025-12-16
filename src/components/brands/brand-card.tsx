'use client';

import Link from 'next/link';
import { Palette, FolderKanban, Database, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BrandCardProps {
  brand: {
    id: string;
    name: string;
    identity: string;
    toneAndManner: string;
    imageKeywords: string[];
    websiteUrl?: string | null;
    instagramUrl?: string | null;
    updatedAt: string;
    _count: {
      projects: number;
      documentChunks: number;
    };
  };
  onDelete?: (id: string) => void;
}

export function BrandCard({ brand, onDelete }: BrandCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{brand.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatDate(brand.updatedAt)} 업데이트
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/brands/${brand.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  편집
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(brand.id)}
                disabled={brand._count.projects > 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 아이덴티티 요약 */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {brand.identity}
        </p>

        {/* 키워드 태그 */}
        <div className="flex flex-wrap gap-1">
          {brand.imageKeywords.slice(0, 4).map((keyword, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {keyword}
            </Badge>
          ))}
          {brand.imageKeywords.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{brand.imageKeywords.length - 4}
            </Badge>
          )}
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FolderKanban className="h-4 w-4" />
            <span>프로젝트 {brand._count.projects}개</span>
          </div>
          <div className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            <span>RAG {brand._count.documentChunks}청크</span>
          </div>
        </div>

        {/* 편집 버튼 */}
        <Link href={`/dashboard/brands/${brand.id}`} className="block">
          <Button variant="outline" className="w-full">
            상세 보기
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
