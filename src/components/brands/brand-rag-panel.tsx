'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Globe,
  Loader2,
  Trash2,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Upload,
  FileUp,
  Sparkles,
  Link as LinkIcon,
  Clock,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface BrandRagPanelProps {
  brandId: string;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
}

interface KnowledgeStats {
  vectorCount: number;
  lastUpdated: string | null;
}

interface Chunk {
  id: string;
  source: 'WEBSITE' | 'UPLOAD' | 'INSTAGRAM';
  content: string;
  preview: string;
  sourceUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

interface ChunksResponse {
  chunks: Chunk[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sourceCounts: Record<string, number>;
}

interface CrawlHistoryItem {
  date: string;
  urls: string[];
  chunkCount: number;
}

export function BrandRagPanel({ brandId, websiteUrl, instagramUrl }: BrandRagPanelProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);

  // 크롤링 옵션
  const [customUrl, setCustomUrl] = useState('');
  const [useWebsiteUrl, setUseWebsiteUrl] = useState(!!websiteUrl);
  const [useInstagramUrl, setUseInstagramUrl] = useState(false);
  const [maxPages, setMaxPages] = useState('20');
  const [clearExisting, setClearExisting] = useState(false);

  // 직접 입력
  const [manualContent, setManualContent] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);

  // 파일 업로드
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // 청크 목록
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [chunksPagination, setChunksPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChunks, setSelectedChunks] = useState<Set<string>>(new Set());
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [showChunkList, setShowChunkList] = useState(false);

  // 크롤링 히스토리
  const [crawlHistory, setCrawlHistory] = useState<CrawlHistoryItem[]>([]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}/knowledge`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchChunks = useCallback(async (page = 1) => {
    setChunksLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (sourceFilter !== 'all') {
        params.set('source', sourceFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const res = await fetch(`/api/brands/${brandId}/knowledge/chunks?${params}`);
      const data = await res.json();

      if (data.success) {
        const responseData = data.data as ChunksResponse;
        setChunks(responseData.chunks);
        setChunksPagination(responseData.pagination);
        setSourceCounts(responseData.sourceCounts);

        // Build crawl history from chunks
        buildCrawlHistory(responseData.chunks);
      }
    } catch (error) {
      console.error('Failed to fetch chunks:', error);
    } finally {
      setChunksLoading(false);
    }
  }, [brandId, sourceFilter, searchQuery]);

  const buildCrawlHistory = (chunkList: Chunk[]) => {
    const historyMap = new Map<string, { urls: Set<string>; count: number }>();

    chunkList.forEach((chunk) => {
      if (chunk.source === 'WEBSITE' && chunk.sourceUrl) {
        const date = new Date(chunk.createdAt).toLocaleDateString('ko-KR');
        if (!historyMap.has(date)) {
          historyMap.set(date, { urls: new Set(), count: 0 });
        }
        const entry = historyMap.get(date)!;
        entry.urls.add(chunk.sourceUrl);
        entry.count++;
      }
    });

    const history: CrawlHistoryItem[] = Array.from(historyMap.entries()).map(
      ([date, { urls, count }]) => ({
        date,
        urls: Array.from(urls),
        chunkCount: count,
      })
    );

    setCrawlHistory(history);
  };

  useEffect(() => {
    fetchStats();
  }, [brandId]);

  useEffect(() => {
    if (showChunkList) {
      fetchChunks(1);
    }
  }, [showChunkList, sourceFilter, fetchChunks]);

  const handleCrawl = async () => {
    const urls: string[] = [];
    if (useWebsiteUrl && websiteUrl) urls.push(websiteUrl);
    if (useInstagramUrl && instagramUrl) urls.push(instagramUrl);
    if (customUrl) urls.push(customUrl);

    if (urls.length === 0) {
      toast({
        variant: 'destructive',
        title: 'URL이 필요합니다',
        description: '크롤링할 URL을 선택하거나 입력해 주세요.',
      });
      return;
    }

    setIsCrawling(true);
    setCrawlProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setCrawlProgress((prev) => Math.min(prev + 10, 90));
      }, 1000);

      const res = await fetch(`/api/brands/${brandId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrls: urls,
          maxPagesPerUrl: parseInt(maxPages),
          clearExisting,
        }),
      });

      clearInterval(progressInterval);
      setCrawlProgress(100);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Crawling failed');
      }

      toast({
        title: '크롤링 완료',
        description: `${data.data.pagesProcessed}개 페이지에서 ${data.data.chunksIndexed}개 청크를 수집했습니다.`,
      });

      fetchStats();
      if (showChunkList) {
        fetchChunks(1);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '크롤링 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsCrawling(false);
      setCrawlProgress(0);
      setCustomUrl('');
    }
  };

  const handleAddManualContent = async () => {
    if (!manualContent.trim()) {
      toast({
        variant: 'destructive',
        title: '내용이 필요합니다',
        description: '추가할 텍스트를 입력해 주세요.',
      });
      return;
    }

    setIsAddingManual(true);

    try {
      const res = await fetch(`/api/brands/${brandId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualContent: manualContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add content');
      }

      toast({
        title: '추가 완료',
        description: `${data.data.chunksIndexed}개 청크가 지식베이스에 추가되었습니다.`,
      });

      setManualContent('');
      fetchStats();
      if (showChunkList) {
        fetchChunks(1);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '추가 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsAddingManual(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      toast({
        variant: 'destructive',
        title: '지원하지 않는 파일 형식',
        description: 'TXT, PDF, DOC, DOCX 파일만 업로드할 수 있습니다.',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '파일 크기 초과',
        description: '10MB 이하의 파일만 업로드할 수 있습니다.',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // 텍스트 파일의 경우 직접 읽기
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setUploadProgress(60);

        const res = await fetch(`/api/brands/${brandId}/knowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manualContent: text,
            fileName: file.name,
          }),
        });

        setUploadProgress(100);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to process file');
        }

        toast({
          title: '파일 처리 완료',
          description: `${file.name}에서 ${data.data.chunksIndexed}개 청크가 추가되었습니다.`,
        });
      } else {
        // PDF/DOC 파일의 경우 FormData로 업로드
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandId', brandId);

        const res = await fetch(`/api/brands/${brandId}/knowledge/upload`, {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(100);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload file');
        }

        toast({
          title: '파일 업로드 완료',
          description: `${file.name}에서 ${data.data.chunksIndexed}개 청크가 추가되었습니다.`,
        });
      }

      fetchStats();
      if (showChunkList) {
        fetchChunks(1);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '파일 처리 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDeleteKnowledge = async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}/knowledge`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete knowledge base');
      }

      toast({
        title: '삭제 완료',
        description: '지식베이스가 초기화되었습니다.',
      });

      fetchStats();
      setChunks([]);
      setSelectedChunks(new Set());
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  const handleDeleteSelectedChunks = async () => {
    if (selectedChunks.size === 0) return;

    try {
      const res = await fetch(`/api/brands/${brandId}/knowledge/chunks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkIds: Array.from(selectedChunks),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete chunks');
      }

      toast({
        title: '삭제 완료',
        description: `${data.data.deletedCount}개 청크가 삭제되었습니다.`,
      });

      setSelectedChunks(new Set());
      fetchStats();
      fetchChunks(chunksPagination.page);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  const toggleChunkSelection = (chunkId: string) => {
    const newSelected = new Set(selectedChunks);
    if (newSelected.has(chunkId)) {
      newSelected.delete(chunkId);
    } else {
      newSelected.add(chunkId);
    }
    setSelectedChunks(newSelected);
  };

  const toggleChunkExpand = (chunkId: string) => {
    const newExpanded = new Set(expandedChunks);
    if (newExpanded.has(chunkId)) {
      newExpanded.delete(chunkId);
    } else {
      newExpanded.add(chunkId);
    }
    setExpandedChunks(newExpanded);
  };

  const selectAllChunks = () => {
    if (selectedChunks.size === chunks.length) {
      setSelectedChunks(new Set());
    } else {
      setSelectedChunks(new Set(chunks.map((c) => c.id)));
    }
  };

  const handleSearch = () => {
    fetchChunks(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'WEBSITE':
        return 'default';
      case 'UPLOAD':
        return 'secondary';
      case 'INSTAGRAM':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'WEBSITE':
        return '웹사이트';
      case 'UPLOAD':
        return '직접 입력';
      case 'INSTAGRAM':
        return '인스타그램';
      default:
        return source;
    }
  };

  // 빈 상태 온보딩 UI
  if (!isLoadingStats && stats?.vectorCount === 0) {
    return (
      <div className="space-y-6">
        {/* 온보딩 안내 */}
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">지식베이스를 시작해보세요</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                브랜드 정보를 지식베이스에 추가하면 AI가 브랜드 아이덴티티에 맞는 콘텐츠를 생성합니다.
                웹사이트 크롤링, 파일 업로드, 직접 입력 중 원하는 방법을 선택하세요.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="flex flex-col items-center p-4 rounded-lg border bg-background">
                  <Globe className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="font-medium text-sm">웹사이트 크롤링</span>
                  <span className="text-xs text-muted-foreground">URL 입력으로 자동 수집</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg border bg-background">
                  <FileUp className="h-6 w-6 text-green-500 mb-2" />
                  <span className="font-medium text-sm">파일 업로드</span>
                  <span className="text-xs text-muted-foreground">TXT, PDF, DOC 지원</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg border bg-background">
                  <FileText className="h-6 w-6 text-purple-500 mb-2" />
                  <span className="font-medium text-sm">직접 입력</span>
                  <span className="text-xs text-muted-foreground">텍스트로 직접 추가</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 입력 탭 */}
        <Tabs defaultValue="crawl" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="crawl" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">웹사이트</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">파일 업로드</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">직접 입력</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crawl" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">URL 크롤링</CardTitle>
                <CardDescription>
                  웹사이트에서 브랜드 정보를 자동으로 수집합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {websiteUrl && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useWebsite"
                      checked={useWebsiteUrl}
                      onCheckedChange={(checked) => setUseWebsiteUrl(!!checked)}
                    />
                    <Label htmlFor="useWebsite" className="text-sm font-normal truncate max-w-md">
                      저장된 웹사이트 URL 사용 ({websiteUrl})
                    </Label>
                  </div>
                )}

                {instagramUrl && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useInstagram"
                      checked={useInstagramUrl}
                      onCheckedChange={(checked) => setUseInstagramUrl(!!checked)}
                    />
                    <Label htmlFor="useInstagram" className="text-sm font-normal truncate max-w-md">
                      인스타그램 URL 사용 ({instagramUrl})
                    </Label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="customUrl">직접 URL 입력</Label>
                  <Input
                    id="customUrl"
                    type="url"
                    placeholder="https://example.com/about"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>최대 크롤링 페이지</Label>
                    <Select value={maxPages} onValueChange={setMaxPages}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 페이지</SelectItem>
                        <SelectItem value="10">10 페이지</SelectItem>
                        <SelectItem value="20">20 페이지</SelectItem>
                        <SelectItem value="50">50 페이지</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="clearExisting"
                        checked={clearExisting}
                        onCheckedChange={(checked) => setClearExisting(!!checked)}
                      />
                      <Label htmlFor="clearExisting" className="text-sm font-normal">
                        기존 데이터 삭제 후 크롤링
                      </Label>
                    </div>
                  </div>
                </div>

                {isCrawling && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>크롤링 중...</span>
                      <span>{crawlProgress}%</span>
                    </div>
                    <Progress value={crawlProgress} />
                  </div>
                )}

                <Button onClick={handleCrawl} disabled={isCrawling} className="w-full">
                  {isCrawling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      크롤링 중...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      분석하기
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">파일 업로드</CardTitle>
                <CardDescription>
                  브랜드 가이드라인, 마케팅 자료 등의 문서를 업로드합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx,.md"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">
                      파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-xs text-muted-foreground">
                      TXT, PDF, DOC, DOCX (최대 10MB)
                    </p>
                  </label>
                </div>

                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>업로드 중...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">직접 입력</CardTitle>
                <CardDescription>
                  브랜드 정보를 직접 텍스트로 입력합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="브랜드에 대한 정보를 입력하세요...&#10;&#10;예:&#10;- 브랜드 슬로건: &quot;Just Do It&quot;&#10;- 주요 타겟: 20-30대 스포츠 애호가&#10;- 브랜드 컬러: 블랙, 화이트, 볼드 오렌지"
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  rows={8}
                />
                <Button
                  onClick={handleAddManualContent}
                  disabled={isAddingManual || !manualContent.trim()}
                  className="w-full"
                >
                  {isAddingManual ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      추가 중...
                    </>
                  ) : (
                    '지식베이스에 추가'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // 데이터가 있는 경우의 UI
  return (
    <div className="space-y-6">
      {/* 지식베이스 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>지식베이스 현황</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchStats}
              disabled={isLoadingStats}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              로딩 중...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stats?.vectorCount || 0} 청크</p>
                  <p className="text-sm text-muted-foreground">
                    마지막 업데이트: {formatDate(stats?.lastUpdated || null)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChunkList(!showChunkList)}
                  >
                    {showChunkList ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        목록 닫기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        목록 보기
                      </>
                    )}
                  </Button>
                  {stats && stats.vectorCount > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          전체 삭제
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>지식베이스를 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            모든 크롤링 데이터와 업로드된 문서가 삭제됩니다.
                            이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteKnowledge}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* 소스별 통계 */}
              {Object.keys(sourceCounts).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sourceCounts).map(([source, count]) => (
                    <Badge key={source} variant={getSourceBadgeVariant(source)}>
                      {getSourceLabel(source)}: {count}개
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 청크 목록 */}
      {showChunkList && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">저장된 청크 목록</CardTitle>
              {selectedChunks.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      선택 삭제 ({selectedChunks.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>선택한 청크를 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {selectedChunks.size}개의 청크가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSelectedChunks}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* 필터 및 검색 */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="청크 내용 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="소스 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="WEBSITE">웹사이트</SelectItem>
                  <SelectItem value="UPLOAD">직접 입력</SelectItem>
                  <SelectItem value="INSTAGRAM">인스타그램</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 전체 선택 */}
            {chunks.length > 0 && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <Checkbox
                  checked={selectedChunks.size === chunks.length && chunks.length > 0}
                  onCheckedChange={selectAllChunks}
                />
                <span className="text-sm text-muted-foreground">
                  전체 선택 ({chunks.length}개)
                </span>
              </div>
            )}

            {/* 청크 목록 */}
            {chunksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : chunks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className={`border rounded-lg p-3 transition-colors ${
                      selectedChunks.has(chunk.id) ? 'bg-muted/50 border-primary/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedChunks.has(chunk.id)}
                        onCheckedChange={() => toggleChunkSelection(chunk.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSourceBadgeVariant(chunk.source)} className="text-xs">
                            {getSourceLabel(chunk.source)}
                          </Badge>
                          {chunk.sourceUrl && (
                            <a
                              href={chunk.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline truncate max-w-[200px]"
                            >
                              <LinkIcon className="inline h-3 w-3 mr-1" />
                              {new URL(chunk.sourceUrl).hostname}
                            </a>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(chunk.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {expandedChunks.has(chunk.id) ? chunk.content : chunk.preview}
                          </p>
                          {chunk.content.length > 200 && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-xs"
                              onClick={() => toggleChunkExpand(chunk.id)}
                            >
                              {expandedChunks.has(chunk.id) ? '접기' : '더 보기'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {chunksPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={chunksPagination.page === 1}
                  onClick={() => fetchChunks(chunksPagination.page - 1)}
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {chunksPagination.page} / {chunksPagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={chunksPagination.page === chunksPagination.totalPages}
                  onClick={() => fetchChunks(chunksPagination.page + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 크롤링 히스토리 */}
      {crawlHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">크롤링 히스토리</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crawlHistory.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.date}</span>
                      <Badge variant="secondary">{item.chunkCount}개 청크</Badge>
                    </div>
                    <div className="mt-1 space-y-1">
                      {item.urls.slice(0, 3).map((url, urlIndex) => (
                        <a
                          key={urlIndex}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-muted-foreground hover:text-blue-500 truncate"
                        >
                          {url}
                        </a>
                      ))}
                      {item.urls.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{item.urls.length - 3}개 더
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 입력 탭 */}
      <Tabs defaultValue="crawl" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crawl" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">웹사이트</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">파일 업로드</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">직접 입력</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crawl" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">URL 크롤링</CardTitle>
              <CardDescription>
                웹사이트에서 브랜드 정보를 자동으로 수집합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {websiteUrl && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useWebsite2"
                    checked={useWebsiteUrl}
                    onCheckedChange={(checked) => setUseWebsiteUrl(!!checked)}
                  />
                  <Label htmlFor="useWebsite2" className="text-sm font-normal truncate max-w-md">
                    저장된 웹사이트 URL 사용 ({websiteUrl})
                  </Label>
                </div>
              )}

              {instagramUrl && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useInstagram2"
                    checked={useInstagramUrl}
                    onCheckedChange={(checked) => setUseInstagramUrl(!!checked)}
                  />
                  <Label htmlFor="useInstagram2" className="text-sm font-normal truncate max-w-md">
                    인스타그램 URL 사용 ({instagramUrl})
                  </Label>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="customUrl2">직접 URL 입력</Label>
                <Input
                  id="customUrl2"
                  type="url"
                  placeholder="https://example.com/about"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>최대 크롤링 페이지</Label>
                  <Select value={maxPages} onValueChange={setMaxPages}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 페이지</SelectItem>
                      <SelectItem value="10">10 페이지</SelectItem>
                      <SelectItem value="20">20 페이지</SelectItem>
                      <SelectItem value="50">50 페이지</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="clearExisting2"
                      checked={clearExisting}
                      onCheckedChange={(checked) => setClearExisting(!!checked)}
                    />
                    <Label htmlFor="clearExisting2" className="text-sm font-normal">
                      기존 데이터 삭제 후 크롤링
                    </Label>
                  </div>
                </div>
              </div>

              {isCrawling && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>크롤링 중...</span>
                    <span>{crawlProgress}%</span>
                  </div>
                  <Progress value={crawlProgress} />
                </div>
              )}

              <Button onClick={handleCrawl} disabled={isCrawling} className="w-full">
                {isCrawling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    크롤링 중...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    분석하기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">파일 업로드</CardTitle>
              <CardDescription>
                브랜드 가이드라인, 마케팅 자료 등의 문서를 업로드합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload2"
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx,.md"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <label htmlFor="file-upload2" className="cursor-pointer">
                  <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">
                    파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-muted-foreground">
                    TXT, PDF, DOC, DOCX (최대 10MB)
                  </p>
                </label>
              </div>

              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>업로드 중...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">직접 입력</CardTitle>
              <CardDescription>
                브랜드 정보를 직접 텍스트로 입력합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="브랜드에 대한 정보를 입력하세요...&#10;&#10;예:&#10;- 브랜드 슬로건: &quot;Just Do It&quot;&#10;- 주요 타겟: 20-30대 스포츠 애호가&#10;- 브랜드 컬러: 블랙, 화이트, 볼드 오렌지"
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={8}
              />
              <Button
                onClick={handleAddManualContent}
                disabled={isAddingManual || !manualContent.trim()}
                className="w-full"
              >
                {isAddingManual ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    추가 중...
                  </>
                ) : (
                  '지식베이스에 추가'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
