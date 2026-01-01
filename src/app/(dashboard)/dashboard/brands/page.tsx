'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Palette, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandCard } from '@/components/brands';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Brand {
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
}

export default function BrandsPage() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (data.success) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '브랜드 목록을 불러오는 데 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/brands/${deleteTarget}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete brand');
      }

      toast({
        title: '삭제 완료',
        description: '브랜드가 삭제되었습니다.',
      });

      setBrands((prev) => prev.filter((b) => b.id !== deleteTarget));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">브랜드 프로필</h1>
          <p className="text-muted-foreground">
            브랜드별 톤앤매너와 스타일을 관리하세요
          </p>
        </div>
        <Link href="/dashboard/brands/new">
          <Button className="gap-2 text-white font-medium rounded-xl shadow-[0_0_20px_#eee] transition-all duration-500 bg-[length:200%_auto] bg-[linear-gradient(to_right,#77A1D3_0%,#79CBCA_51%,#77A1D3_100%)] hover:bg-[position:right_center]">
            <Plus className="h-4 w-4" />
            새 브랜드
          </Button>
        </Link>
      </div>

      {/* Brand Grid */}
      {brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Palette className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">등록된 브랜드가 없습니다</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            브랜드 프로필을 등록하면 AI가 브랜드에 맞는 일관된 콘텐츠를 생성합니다.
          </p>
          <Link href="/dashboard/brands/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              첫 브랜드 만들기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
          {/* Add New Card */}
          <Link
            href="/dashboard/brands/new"
            className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 hover:border-primary hover:bg-muted/50 transition-colors min-h-[200px]"
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="mt-2 text-sm text-muted-foreground">새 브랜드 추가</span>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>브랜드를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 브랜드와 연결된 지식베이스(RAG) 데이터도 함께 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
