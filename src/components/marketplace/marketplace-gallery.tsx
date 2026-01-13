'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Search, SlidersHorizontal, Loader2, Layout, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MarketplaceTemplateCard,
  MarketplaceTemplateData,
} from './marketplace-template-card';
import { PurchaseConfirmDialog } from './purchase-confirm-dialog';
import { TemplatePreviewModal } from './template-preview-modal';
import { useDebounce } from '@/hooks/use-debounce';

interface MarketplaceGalleryProps {
  projectId?: string;
  onApplyTemplate?: (templateId: string) => void;
}

const categories = [
  { value: 'all', label: '전체' },
  { value: 'FREE', label: '무료' },
  { value: 'GENERIC', label: '일반' },
  { value: 'FASHION', label: '패션' },
  { value: 'FOOD', label: '음식' },
  { value: 'BEAUTY', label: '뷰티' },
  { value: 'DIGITAL', label: '디지털' },
];

const sortOptions = [
  { value: 'newest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'rating', label: '평점순' },
  { value: 'price_low', label: '가격 낮은순' },
  { value: 'price_high', label: '가격 높은순' },
  { value: 'credits_low', label: '크레딧 낮은순' },
  { value: 'credits_high', label: '크레딧 높은순' },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function MarketplaceGallery({
  projectId,
  onApplyTemplate,
}: MarketplaceGalleryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [useSemanticSearch, setUseSemanticSearch] = useState(true);
  const [purchaseTemplate, setPurchaseTemplate] =
    useState<MarketplaceTemplateData | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<MarketplaceTemplateData | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Build URL with query params
  const buildTemplatesUrl = () => {
    // Use semantic search API when search query exists and semantic search is enabled
    if (debouncedSearch && useSemanticSearch) {
      const params = new URLSearchParams({
        q: debouncedSearch,
        page: page.toString(),
        limit: '12',
        mode: 'hybrid',
      });

      if (category === 'FREE') {
        params.set('maxPrice', '0');
      } else if (category !== 'all') {
        params.set('category', category);
      }

      return `/api/marketplace/templates/search?${params}`;
    }

    // Use regular API for browsing or keyword search
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '12',
      sortBy,
    });

    if (category === 'FREE') {
      params.set('maxPrice', '0');
    } else if (category !== 'all') {
      params.set('category', category);
    }

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }

    return `/api/marketplace/templates?${params}`;
  };

  const { data: templatesData, error, isLoading, mutate } = useSWR(
    buildTemplatesUrl(),
    fetcher
  );

  const { data: creditsData, mutate: mutateCredits } = useSWR(
    '/api/billing/credits',
    fetcher
  );

  const templates: MarketplaceTemplateData[] = templatesData?.templates || [];
  const totalPages = templatesData?.pagination?.totalPages || 1;
  const userCredits = creditsData?.totalCredits ?? null;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [category, debouncedSearch, sortBy]);

  const handlePurchase = async (template: MarketplaceTemplateData) => {
    setPurchaseTemplate(template);
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseTemplate) return;

    try {
      const response = await fetch(
        `/api/marketplace/templates/${purchaseTemplate.id}/purchase`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Purchase failed');
      }

      // Refresh templates and credits
      mutate();
      mutateCredits();
      setPurchaseTemplate(null);

      // If applying to project
      if (projectId && onApplyTemplate) {
        onApplyTemplate(purchaseTemplate.id);
      }
    } catch (err: any) {
      alert(err.message || '구매에 실패했습니다.');
    }
  };

  const handlePreview = (template: MarketplaceTemplateData) => {
    setPreviewTemplate(template);
  };

  const handlePreviewPurchase = (template: MarketplaceTemplateData) => {
    setPreviewTemplate(null);
    setPurchaseTemplate(template);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={useSemanticSearch ? "의미로 검색... (예: 여름 메이크업)" : "키워드 검색..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Toggle
            pressed={useSemanticSearch}
            onPressedChange={setUseSemanticSearch}
            aria-label="시멘틱 검색"
            className="gap-1.5"
            title={useSemanticSearch ? "AI 의미 검색 활성화" : "키워드 검색 모드"}
          >
            <Sparkles className={`h-4 w-4 ${useSemanticSearch ? 'text-primary' : ''}`} />
            <span className="hidden sm:inline text-xs">AI</span>
          </Toggle>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[120px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">템플릿을 불러오는데 실패했습니다.</p>
          <Button onClick={() => mutate()} variant="outline" className="mt-4">
            다시 시도
          </Button>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <Layout className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">템플릿을 찾을 수 없습니다</p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((template) => (
              <MarketplaceTemplateCard
                key={template.id}
                template={template}
                onPreview={handlePreview}
                onPurchase={handlePurchase}
              />
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
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
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

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onPurchase={handlePreviewPurchase}
      />

      {/* Purchase Confirm Dialog */}
      <PurchaseConfirmDialog
        template={purchaseTemplate}
        userCredits={userCredits}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setPurchaseTemplate(null)}
      />
    </div>
  );
}
