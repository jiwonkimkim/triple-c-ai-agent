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
  FileImage,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  Check,
  AlertCircle,
  Image as ImageIcon,
  X,
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

// 마켓플레이스 템플릿 데이터 타입
interface MarketplaceTemplate {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string | null;
  description?: string | null;
  price: number;
  tags?: string[];
  downloadCount: number;
  rating?: number | null;
  ratingCount: number;
  isReference: boolean;
  createdBy: 'SYSTEM' | 'USER';
  publishedAt?: Date;
  sections?: TemplateSection[];
  seller?: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  isPurchased?: boolean;
  isOwner?: boolean;
}

// 업로드된 파일 정보
interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'pdf';
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
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 선택된 템플릿
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // 제품 정보 적용 옵션
  const [applyProductInfo, setApplyProductInfo] = useState(!!productInfo);

  // 로컬 파일 상태 (PDF/이미지)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 마켓플레이스 템플릿 목록 불러오기
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        sortBy: 'newest',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/marketplace/templates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch marketplace templates');

      const data = await response.json();
      setTemplates(data.templates || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch marketplace templates:', error);
      toast({
        variant: 'destructive',
        title: '템플릿 로딩 실패',
        description: '마켓플레이스 템플릿을 불러오는데 실패했습니다.',
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

  // 템플릿 상세 정보 불러오기 (섹션 포함)
  const loadTemplateDetails = async (template: MarketplaceTemplate) => {
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
        sections: data.data?.sections || data.sections || [],
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

  // 파일 업로드 처리 (PDF/이미지)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLocalError(null);

    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        setLocalError('이미지 또는 PDF 파일만 업로드할 수 있습니다.');
        return;
      }

      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setLocalError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      const preview = isImage ? URL.createObjectURL(file) : '';
      newFiles.push({
        file,
        preview,
        type: isImage ? 'image' : 'pdf',
      });
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 업로드된 파일 제거
  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // 업로드된 파일을 에디터 요소로 변환
  const handleApplyUploadedFiles = () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessingFiles(true);

    try {
      const elements: EditableElement[] = [];

      // 제목 추가
      elements.push({
        id: `uploaded-heading-${Date.now()}`,
        type: 'heading',
        content: productInfo?.productName || '상품 상세페이지',
        level: 1,
        styles: { textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' },
      });

      // 설명 추가
      if (productInfo?.description) {
        elements.push({
          id: `uploaded-desc-${Date.now()}`,
          type: 'text',
          content: productInfo.description,
          styles: { textAlign: 'center', fontSize: '1.25rem', lineHeight: '1.8', color: '#666', marginBottom: '2rem' },
        });
      }

      // 업로드된 이미지들 추가
      uploadedFiles.forEach((uploadedFile, index) => {
        if (uploadedFile.type === 'image') {
          elements.push({
            id: `uploaded-image-${Date.now()}-${index}`,
            type: 'image',
            content: uploadedFile.preview,
            alt: `상품 이미지 ${index + 1}`,
            styles: { width: '100%', maxHeight: '600px', objectFit: 'contain', marginBottom: '1rem' },
          });
        }
      });

      // 특징 섹션 추가
      if (productInfo?.keyFeatures?.length) {
        elements.push({
          id: `uploaded-features-heading-${Date.now()}`,
          type: 'heading',
          content: '주요 특징',
          level: 2,
          styles: { fontSize: '1.75rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' },
        });
        elements.push({
          id: `uploaded-features-body-${Date.now()}`,
          type: 'text',
          content: productInfo.keyFeatures.map((f) => `• ${f}`).join('\n'),
          styles: { fontSize: '1rem', lineHeight: '2', whiteSpace: 'pre-wrap' },
        });
      }

      onImport(elements);
      toast({
        title: '파일 적용 완료',
        description: `${uploadedFiles.length}개 파일이 적용되었습니다.`,
      });
      handleClose();
    } catch (error) {
      setLocalError('파일을 처리하는 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setSelectedTemplate(null);
    // 업로드된 파일 미리보기 URL 정리
    uploadedFiles.forEach((f) => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setUploadedFiles([]);
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
            <div className="flex-1 overflow-y-auto">
              {/* 파일 업로드 영역 */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  uploadedFiles.length > 0 ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="font-medium">클릭하여 이미지 또는 PDF 파일 업로드</p>
                <p className="text-sm text-muted-foreground mt-1">
                  여러 파일을 선택할 수 있습니다 (최대 10MB/파일)
                </p>
              </div>

              {/* 에러 메시지 */}
              {localError && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{localError}</span>
                </div>
              )}

              {/* 업로드된 파일 목록 */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-3">
                    업로드된 파일 ({uploadedFiles.length}개)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {uploadedFiles.map((uploadedFile, index) => (
                      <div
                        key={index}
                        className="relative group border rounded-lg overflow-hidden bg-muted"
                      >
                        {uploadedFile.type === 'image' ? (
                          <div className="aspect-square">
                            <img
                              src={uploadedFile.preview}
                              alt={uploadedFile.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square flex flex-col items-center justify-center p-4">
                            <FileText className="h-10 w-10 text-red-500 mb-2" />
                            <span className="text-xs text-muted-foreground text-center truncate w-full">
                              {uploadedFile.file.name}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedFile(index);
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                          {uploadedFile.type === 'image' ? (
                            <span className="flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {(uploadedFile.file.size / 1024).toFixed(0)}KB
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              PDF
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
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
                </div>
              )}

              {/* 파일 형식 안내 */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  지원 파일 형식
                </h4>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    <span>이미지 (JPG, PNG, GIF, WebP)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span>PDF 문서</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  업로드된 파일은 상세페이지 에디터에 순서대로 추가됩니다.
                  제품 정보가 있는 경우 자동으로 제목과 설명이 추가됩니다.
                </p>
              </div>
            </div>

            {/* 적용 버튼 */}
            {uploadedFiles.length > 0 && (
              <Button
                className="w-full mt-4"
                onClick={handleApplyUploadedFiles}
                disabled={isProcessingFiles}
              >
                {isProcessingFiles ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {uploadedFiles.length}개 파일 적용하기
                  </>
                )}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
