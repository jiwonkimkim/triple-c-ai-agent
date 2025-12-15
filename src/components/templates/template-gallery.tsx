'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Layout,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TemplateCard, type TemplateData } from './template-card';
import { TemplatePreviewModal } from './template-preview-modal';

interface TemplateGalleryProps {
  projectId?: string;
  onApplyTemplate?: (templateId: string) => Promise<void>;
}

const categories = [
  { value: 'all', label: '전체' },
  { value: 'GENERIC', label: '일반' },
  { value: 'FASHION', label: '패션' },
  { value: 'FOOD', label: '음식' },
  { value: 'BEAUTY', label: '뷰티' },
  { value: 'DIGITAL', label: '디지털' },
];

export function TemplateGallery({
  projectId,
  onApplyTemplate,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<TemplateData | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, sortBy, page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchTemplates();
      } else {
        setPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder: 'desc',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/templates?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.data.templates);
      setTotalPages(data.data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = async (template: TemplateData) => {
    if (!projectId || !onApplyTemplate) return;

    setIsApplying(true);

    try {
      await onApplyTemplate(template.id);
      setPreviewTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Layout className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">템플릿 마켓플레이스</h2>
            <p className="text-sm text-muted-foreground">
              다양한 템플릿으로 빠르게 시작하세요
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="템플릿 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
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

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">최신순</SelectItem>
            <SelectItem value="name">이름순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-8 text-destructive">
          <p>{error}</p>
          <Button variant="outline" onClick={fetchTemplates} className="mt-2">
            다시 시도
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Templates Grid */}
      {!isLoading && !error && (
        <>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>템플릿을 찾을 수 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPreview={setPreviewTemplate}
                  onApply={handleApplyTemplate}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'ghost'}
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onApply={() => handleApplyTemplate(previewTemplate)}
          isApplying={isApplying}
          canApply={!!projectId}
        />
      )}
    </div>
  );
}
