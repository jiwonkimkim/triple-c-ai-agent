'use client';

import { useState, useEffect } from 'react';
import {
  Layout,
  Download,
  Loader2,
  X,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TemplateData } from './template-card';

interface TemplatePreviewModalProps {
  template: TemplateData;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  isApplying?: boolean;
  canApply?: boolean;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes: Record<ViewportSize, { width: number; label: string; icon: React.ReactNode }> = {
  desktop: { width: 1200, label: '데스크탑', icon: <Monitor className="h-4 w-4" /> },
  tablet: { width: 768, label: '태블릿', icon: <Tablet className="h-4 w-4" /> },
  mobile: { width: 375, label: '모바일', icon: <Smartphone className="h-4 w-4" /> },
};

const categoryLabels: Record<string, string> = {
  GENERIC: '일반',
  FASHION: '패션',
  FOOD: '음식',
  BEAUTY: '뷰티',
  DIGITAL: '디지털',
};

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onApply,
  isApplying = false,
  canApply = true,
}: TemplatePreviewModalProps) {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [templateDetails, setTemplateDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch full template details
  useEffect(() => {
    if (isOpen && template.id) {
      fetchTemplateDetails();
    }
  }, [isOpen, template.id]);

  const fetchTemplateDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/templates/${template.id}`);
      if (response.ok) {
        const data = await response.json();
        setTemplateDetails(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch template details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getViewportClass = (): string => {
    switch (viewportSize) {
      case 'tablet':
        return 'max-w-[768px]';
      case 'mobile':
        return 'max-w-[375px]';
      default:
        return 'max-w-full';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{template.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {categoryLabels[template.category] || template.category}
                </Badge>
                {template.createdBy === 'SYSTEM' && (
                  <Badge variant="outline">시스템 템플릿</Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Viewport Selector */}
        <div className="flex items-center justify-center gap-2 py-2 border-b">
          {(Object.entries(viewportSizes) as [ViewportSize, typeof viewportSizes[ViewportSize]][]).map(
            ([key, value]) => (
              <Button
                key={key}
                variant={viewportSize === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewportSize(key)}
              >
                {value.icon}
                <span className="ml-1 hidden sm:inline">{value.label}</span>
              </Button>
            )
          )}
        </div>

        {/* Preview Area */}
        <ScrollArea className="flex-1 border rounded-lg bg-muted/30">
          <div
            className={cn(
              'mx-auto transition-all duration-300 p-4',
              getViewportClass()
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : templateDetails?.sections ? (
              <div className="space-y-4 bg-background rounded-lg shadow-sm p-6">
                {/* Render template sections preview */}
                {(templateDetails.sections as any[]).map((section: any, index: number) => (
                  <div
                    key={section.id || index}
                    className="border rounded-lg p-4 bg-muted/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {section.type || 'SECTION'}
                      </Badge>
                      <span className="text-sm font-medium">
                        {section.name || `섹션 ${index + 1}`}
                      </span>
                    </div>

                    {/* Blocks preview */}
                    {section.blocks && section.blocks.length > 0 ? (
                      <div className="space-y-2">
                        {section.blocks.slice(0, 3).map((block: any, blockIndex: number) => (
                          <div
                            key={block.id || blockIndex}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary/50" />
                            <span>{block.type}</span>
                          </div>
                        ))}
                        {section.blocks.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{section.blocks.length - 3}개 더...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        빈 섹션
                      </p>
                    )}
                  </div>
                ))}

                {(!templateDetails.sections || templateDetails.sections.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>템플릿 미리보기를 사용할 수 없습니다</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Layout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>미리보기를 로드할 수 없습니다</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Template Info */}
        {templateDetails && (
          <div className="grid grid-cols-3 gap-4 py-4 border-t text-sm">
            <div>
              <p className="text-muted-foreground">섹션 수</p>
              <p className="font-medium">
                {templateDetails.sections?.length || 0}개
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">카테고리</p>
              <p className="font-medium">
                {categoryLabels[templateDetails.category] || templateDetails.category}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">타입</p>
              <p className="font-medium">
                {templateDetails.createdBy === 'SYSTEM' ? '공식' : '사용자'}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          {canApply && (
            <Button onClick={onApply} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  적용 중...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  프로젝트에 적용
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
