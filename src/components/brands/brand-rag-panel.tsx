'use client';

import { useState, useEffect } from 'react';
import { Database, Globe, Loader2, Trash2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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

  useEffect(() => {
    fetchStats();
  }, [brandId]);

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
      // 진행 상태 시뮬레이션
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
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '잠시 후 다시 시도해 주세요.',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="space-y-6">
      {/* 지식베이스 현황 */}
      <Card>
        <CardHeader>
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
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats?.vectorCount || 0} 청크</p>
                <p className="text-sm text-muted-foreground">
                  마지막 업데이트: {formatDate(stats?.lastUpdated || null)}
                </p>
              </div>
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
          )}
        </CardContent>
      </Card>

      {/* URL 크롤링 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>URL 크롤링</CardTitle>
          </div>
          <CardDescription>
            웹사이트에서 브랜드 정보를 자동으로 수집합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 저장된 URL 사용 */}
          {websiteUrl && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useWebsite"
                checked={useWebsiteUrl}
                onCheckedChange={(checked) => setUseWebsiteUrl(!!checked)}
              />
              <Label htmlFor="useWebsite" className="text-sm font-normal">
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
              <Label htmlFor="useInstagram" className="text-sm font-normal">
                인스타그램 URL 사용 ({instagramUrl})
              </Label>
            </div>
          )}

          {/* 커스텀 URL */}
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

          {/* 옵션 */}
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

          {/* 진행 상태 */}
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

      {/* 직접 입력 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>직접 입력</CardTitle>
          </div>
          <CardDescription>
            브랜드 가이드라인, 마케팅 자료 등을 직접 입력하여 지식베이스에 추가합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="브랜드에 대한 정보를 입력하세요...&#10;&#10;예:&#10;- 브랜드 슬로건: &quot;Just Do It&quot;&#10;- 주요 타겟: 20-30대 스포츠 애호가&#10;- 브랜드 컬러: 블랙, 화이트, 볼드 오렌지"
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            rows={6}
          />
          <Button
            onClick={handleAddManualContent}
            disabled={isAddingManual || !manualContent.trim()}
            variant="outline"
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
    </div>
  );
}
