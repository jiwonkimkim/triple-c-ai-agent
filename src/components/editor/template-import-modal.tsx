'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Search,
  Layout,
  Loader2,
  Upload,
  FileJson,
  Download,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// 편집 가능한 요소 타입 (unified-editor와 동일)
interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'heading';
  content: string;
  styles?: Record<string, string>;
  level?: number;
  alt?: string;
}

// 템플릿 섹션 타입
interface TemplateSection {
  id: string;
  type: string;
  title: string;
  body: string;
  order: number;
  imageUrl?: string;
}

// 템플릿 데이터 타입
interface TemplateData {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string | null;
  isReference: boolean;
  createdBy: 'SYSTEM' | 'USER';
  createdAt: Date;
  sections?: TemplateSection[];
  price?: number;
  downloadCount?: number;
}

// 제품 정보 타입
interface ProductInfo {
  productName?: string;
  category?: string;
  keyFeatures?: string[];
  targetAudience?: string;
  description?: string;
}

interface TemplateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (elements: EditableElement[]) => void;
  projectId: string;
  productInfo?: ProductInfo;
}

const categories = [
  { value: 'all', label: '전체' },
  { value: 'GENERIC', label: '일반' },
  { value: 'FASHION', label: '패션' },
  { value: 'FOOD', label: '음식' },
  { value: 'BEAUTY', label: '뷰티' },
  { value: 'DIGITAL', label: '디지털' },
];

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

// 섹션 타입별 스타일 매핑
const sectionTypeStyles: Record<string, { headingLevel: number; headingStyle: React.CSSProperties; bodyStyle: React.CSSProperties }> = {
  HERO: {
    headingLevel: 1,
    headingStyle: { textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' },
    bodyStyle: { textAlign: 'center', fontSize: '1.25rem', lineHeight: '1.8', color: '#666' },
  },
  FEATURES: {
    headingLevel: 2,
    headingStyle: { fontSize: '1.75rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' },
    bodyStyle: { fontSize: '1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' },
  },
  SOCIAL_PROOF: {
    headingLevel: 2,
    headingStyle: { fontSize: '1.75rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' },
    bodyStyle: { fontSize: '1rem', lineHeight: '1.8', fontStyle: 'italic' },
  },
  HOW_TO_USE: {
    headingLevel: 2,
    headingStyle: { fontSize: '1.75rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' },
    bodyStyle: { fontSize: '1rem', lineHeight: '2', whiteSpace: 'pre-wrap' },
  },
  FAQ: {
    headingLevel: 2,
    headingStyle: { fontSize: '1.75rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' },
    bodyStyle: { fontSize: '1rem', lineHeight: '1.8' },
  },
  CUSTOM: {
    headingLevel: 2,
    headingStyle: { fontSize: '1.5rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.75rem' },
    bodyStyle: { fontSize: '1rem', lineHeight: '1.8' },
  },
};

// 템플릿 섹션을 EditableElement[]로 변환
function convertSectionsToElements(
  sections: TemplateSection[],
  productInfo?: ProductInfo,
  applyProductInfo?: boolean
): EditableElement[] {
  const elements: EditableElement[] = [];

  // 섹션을 순서대로 정렬
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  sortedSections.forEach((section, index) => {
    const styles = sectionTypeStyles[section.type] || sectionTypeStyles.CUSTOM;

    // 제품 정보 적용
    let title = section.title;
    let body = section.body;

    if (applyProductInfo && productInfo) {
      // HERO 섹션에 제품명 적용
      if (section.type === 'HERO' && productInfo.productName) {
        title = productInfo.productName;
        if (productInfo.description) {
          body = productInfo.description;
        }
      }

      // FEATURES 섹션에 주요 특징 적용
      if (section.type === 'FEATURES' && productInfo.keyFeatures?.length) {
        body = productInfo.keyFeatures.map((f) => `• ${f}`).join('\n');
      }

      // 타겟 오디언스 관련 내용 적용
      if (section.type === 'SOCIAL_PROOF' && productInfo.targetAudience) {
        body = `${productInfo.targetAudience}를 위한 완벽한 선택`;
      }
    }

    // 제목 요소 추가
    elements.push({
      id: `${section.id}-heading`,
      type: 'heading',
      content: title,
      level: styles.headingLevel,
      styles: styles.headingStyle as Record<string, string>,
    });

    // 이미지가 있으면 추가
    if (section.imageUrl) {
      elements.push({
        id: `${section.id}-image`,
        type: 'image',
        content: section.imageUrl,
        alt: title,
        styles: { width: '100%', maxHeight: '400px', objectFit: 'cover', marginBottom: '1rem' },
      });
    }

    // 본문 요소 추가
    elements.push({
      id: `${section.id}-body`,
      type: 'text',
      content: body,
      styles: styles.bodyStyle as Record<string, string>,
    });
  });

  return elements;
}

export function TemplateImportModal({
  isOpen,
  onClose,
  onImport,
  projectId,
  productInfo,
}: TemplateImportModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'local'>('marketplace');

  // 마켓플레이스 상태
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 선택된 템플릿
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // 제품 정보 적용 옵션
  const [applyProductInfo, setApplyProductInfo] = useState(!!productInfo);

  // 로컬 파일 상태
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localSections, setLocalSections] = useState<TemplateSection[] | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 템플릿 목록 불러오기
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/templates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.data.templates);
      setTotalPages(data.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast({
        variant: 'destructive',
        title: '템플릿 로딩 실패',
        description: '템플릿 목록을 불러오는데 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedCategory, searchQuery, toast]);

  useEffect(() => {
    if (isOpen && activeTab === 'marketplace') {
      fetchTemplates();
    }
  }, [isOpen, activeTab, fetchTemplates]);

  // 검색어 디바운스
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

  // 템플릿 상세 정보 불러오기
  const loadTemplateDetails = async (template: TemplateData) => {
    if (template.sections) {
      setSelectedTemplate(template);
      return;
    }

    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/templates/${template.id}`);
      if (!response.ok) throw new Error('Failed to fetch template details');

      const data = await response.json();
      setSelectedTemplate({
        ...template,
        sections: data.data.sections,
      });
    } catch (error) {
      console.error('Failed to load template details:', error);
      toast({
        variant: 'destructive',
        title: '템플릿 로딩 실패',
        description: '템플릿 상세 정보를 불러오는데 실패했습니다.',
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // 마켓플레이스 템플릿 적용
  const handleApplyMarketplaceTemplate = () => {
    if (!selectedTemplate?.sections) return;

    const elements = convertSectionsToElements(
      selectedTemplate.sections,
      productInfo,
      applyProductInfo
    );

    onImport(elements);
    toast({
      title: '템플릿 적용 완료',
      description: `"${selectedTemplate.name}" 템플릿이 적용되었습니다.`,
    });
    handleClose();
  };

  // 로컬 파일 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalFile(file);
    setLocalError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // 섹션 배열 확인
        let sections: TemplateSection[];
        if (Array.isArray(parsed)) {
          sections = parsed;
        } else if (parsed.sections && Array.isArray(parsed.sections)) {
          sections = parsed.sections;
        } else {
          throw new Error('올바른 템플릿 형식이 아닙니다.');
        }

        // 섹션 유효성 검사
        const isValid = sections.every((s) =>
          s.id && s.type && typeof s.title === 'string' && typeof s.body === 'string'
        );

        if (!isValid) {
          throw new Error('템플릿 섹션 형식이 올바르지 않습니다.');
        }

        setLocalSections(sections);
      } catch (error) {
        const message = error instanceof Error ? error.message : '파일을 파싱할 수 없습니다.';
        setLocalError(message);
        setLocalSections(null);
      }
    };
    reader.readAsText(file);
  };

  // 로컬 파일 템플릿 적용
  const handleApplyLocalTemplate = () => {
    if (!localSections) return;

    const elements = convertSectionsToElements(
      localSections,
      productInfo,
      applyProductInfo
    );

    onImport(elements);
    toast({
      title: '템플릿 적용 완료',
      description: `로컬 템플릿이 적용되었습니다.`,
    });
    handleClose();
  };

  // 모달 닫기
  const handleClose = () => {
    setSelectedTemplate(null);
    setLocalFile(null);
    setLocalSections(null);
    setLocalError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            템플릿 불러오기
          </DialogTitle>
          <DialogDescription>
            마켓플레이스에서 템플릿을 선택하거나 로컬 파일을 업로드하세요
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'marketplace' | 'local')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="marketplace" className="gap-2">
              <Download className="h-4 w-4" />
              마켓플레이스
            </TabsTrigger>
            <TabsTrigger value="local" className="gap-2">
              <Upload className="h-4 w-4" />
              로컬 파일
            </TabsTrigger>
          </TabsList>

          {/* 마켓플레이스 탭 */}
          <TabsContent value="marketplace" className="flex-1 overflow-hidden flex flex-col mt-4">
            {/* 선택된 템플릿이 없으면 목록 표시 */}
            {!selectedTemplate ? (
              <>
                {/* 필터 */}
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="템플릿 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
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
                </div>

                {/* 템플릿 그리드 */}
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>템플릿을 찾을 수 없습니다</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="group cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-all"
                          onClick={() => loadTemplateDetails(template)}
                        >
                          <div className="relative aspect-[4/3] bg-muted">
                            {template.thumbnailUrl ? (
                              <img
                                src={template.thumbnailUrl}
                                alt={template.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Layout className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                            <Badge
                              className={cn(
                                'absolute top-2 left-2 text-white text-xs',
                                categoryColors[template.category]
                              )}
                            >
                              {categoryLabels[template.category]}
                            </Badge>
                            {template.isReference && (
                              <Badge variant="outline" className="absolute top-2 right-2 bg-white/80 text-xs">
                                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                추천
                              </Badge>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button size="sm" variant="secondary">
                                <Eye className="h-4 w-4 mr-1" />
                                선택
                              </Button>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm line-clamp-1">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {template.createdBy === 'SYSTEM' ? '시스템' : '사용자'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page} / {totalPages}
                    </span>
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
            ) : (
              /* 선택된 템플릿 상세 */
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    뒤로
                  </Button>
                  <h3 className="font-semibold">{selectedTemplate.name}</h3>
                  <Badge className={cn('text-white', categoryColors[selectedTemplate.category])}>
                    {categoryLabels[selectedTemplate.category]}
                  </Badge>
                </div>

                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* 섹션 미리보기 */}
                    <div className="border rounded-lg p-4 bg-muted/30 mb-4 max-h-[300px] overflow-y-auto">
                      <h4 className="text-sm font-medium mb-3">섹션 구성</h4>
                      <div className="space-y-2">
                        {selectedTemplate.sections?.map((section, index) => (
                          <div key={section.id} className="flex items-start gap-3 p-2 bg-background rounded border">
                            <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {section.type}
                                </Badge>
                                <span className="font-medium text-sm truncate">{section.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {section.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 제품 정보 적용 옵션 */}
                    {productInfo && (
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-primary/5 mb-4">
                        <Checkbox
                          id="applyProductInfo"
                          checked={applyProductInfo}
                          onCheckedChange={(checked) => setApplyProductInfo(!!checked)}
                        />
                        <Label htmlFor="applyProductInfo" className="text-sm cursor-pointer flex-1">
                          프로젝트 제품 정보 적용하기
                          {productInfo.productName && (
                            <span className="text-muted-foreground ml-2">
                              ({productInfo.productName})
                            </span>
                          )}
                        </Label>
                      </div>
                    )}

                    {/* 적용 버튼 */}
                    <Button
                      className="w-full"
                      onClick={handleApplyMarketplaceTemplate}
                      disabled={!selectedTemplate.sections}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      이 템플릿 적용하기
                    </Button>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* 로컬 파일 탭 */}
          <TabsContent value="local" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex-1">
              {/* 파일 업로드 영역 */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  localFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {localFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileJson className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{localFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(localFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="font-medium">클릭하여 JSON 파일 업로드</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      또는 파일을 여기에 드래그하세요
                    </p>
                  </>
                )}
              </div>

              {/* 에러 메시지 */}
              {localError && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{localError}</span>
                </div>
              )}

              {/* 로컬 섹션 미리보기 */}
              {localSections && (
                <>
                  <div className="border rounded-lg p-4 bg-muted/30 mt-4 max-h-[250px] overflow-y-auto">
                    <h4 className="text-sm font-medium mb-3">
                      섹션 구성 ({localSections.length}개)
                    </h4>
                    <div className="space-y-2">
                      {localSections.map((section, index) => (
                        <div key={section.id} className="flex items-start gap-3 p-2 bg-background rounded border">
                          <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {section.type}
                              </Badge>
                              <span className="font-medium text-sm truncate">{section.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {section.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 제품 정보 적용 옵션 */}
                  {productInfo && (
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-primary/5 mt-4">
                      <Checkbox
                        id="applyProductInfoLocal"
                        checked={applyProductInfo}
                        onCheckedChange={(checked) => setApplyProductInfo(!!checked)}
                      />
                      <Label htmlFor="applyProductInfoLocal" className="text-sm cursor-pointer flex-1">
                        프로젝트 제품 정보 적용하기
                        {productInfo.productName && (
                          <span className="text-muted-foreground ml-2">
                            ({productInfo.productName})
                          </span>
                        )}
                      </Label>
                    </div>
                  )}
                </>
              )}

              {/* 파일 형식 안내 */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">지원 파일 형식</h4>
                <pre className="text-xs text-muted-foreground bg-background p-3 rounded overflow-x-auto">
{`{
  "sections": [
    {
      "id": "section-1",
      "type": "HERO",
      "title": "제목",
      "body": "본문 내용",
      "order": 0
    }
  ]
}`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  지원 타입: HERO, FEATURES, SOCIAL_PROOF, HOW_TO_USE, FAQ, CUSTOM
                </p>
              </div>
            </div>

            {/* 적용 버튼 */}
            {localSections && (
              <Button className="w-full mt-4" onClick={handleApplyLocalTemplate}>
                <Check className="h-4 w-4 mr-2" />
                이 템플릿 적용하기
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
