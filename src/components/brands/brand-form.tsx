'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Palette, Image as ImageIcon, Type, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { createBrandProfileSchema, type CreateBrandProfileInput } from '@/lib/validations';
import { KeywordTagInput } from './keyword-tag-input';

interface StyleGuide {
  colors?: {
    primary?: string;
    secondary?: string;
    palette?: string[];
  };
  images?: {
    logo?: string;
    favicon?: string;
    ogImage?: string;
  };
  fonts?: {
    primary?: string;
    all?: string[];
  };
  extractedAt?: string;
  sourceUrl?: string;
}

interface BrandFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    name: string;
    identity: string;
    toneAndManner: string;
    imageKeywords: string[];
    websiteUrl?: string | null;
    instagramUrl?: string | null;
  };
  styleGuide?: StyleGuide | null;
  workspaceId?: string;
  onSuccess?: () => void;
  onStyleGuideUpdate?: (styleGuide: StyleGuide) => void;
}

export function BrandForm({ mode, initialData, styleGuide, workspaceId, onSuccess, onStyleGuideUpdate }: BrandFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateBrandProfileInput>({
    resolver: zodResolver(createBrandProfileSchema),
    defaultValues: {
      name: initialData?.name || '',
      identity: initialData?.identity || '',
      toneAndManner: initialData?.toneAndManner || '',
      imageKeywords: initialData?.imageKeywords || [],
      websiteUrl: initialData?.websiteUrl || '',
      instagramUrl: initialData?.instagramUrl || '',
      workspaceId: workspaceId,
    },
  });

  const onSubmit = async (data: CreateBrandProfileInput) => {
    setIsLoading(true);
    // 생성 모드이고 websiteUrl이 있으면 크롤링 진행 표시
    if (mode === 'create' && data.websiteUrl) {
      setIsCrawling(true);
      setCrawlProgress(10);
    }
    try {
      const url = mode === 'create' ? '/api/brands' : `/api/brands/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      // 생성 모드이고 URL이 있으면 진행률 업데이트
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      if (mode === 'create' && data.websiteUrl) {
        progressInterval = setInterval(() => {
          setCrawlProgress((prev) => Math.min(prev + 5, 85));
        }, 500);
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (progressInterval) {
        clearInterval(progressInterval);
        setCrawlProgress(100);
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save brand profile');
      }

      // 크롤링 결과 메시지 생성
      let description = mode === 'create'
        ? '이제 프로젝트에서 이 브랜드를 사용할 수 있습니다.'
        : '변경사항이 저장되었습니다.';

      if (result.crawlResult) {
        description = `${result.crawlResult.pagesProcessed}개 페이지에서 브랜드 자산을 추출했습니다.`;
      }

      toast({
        title: mode === 'create' ? '브랜드가 생성되었습니다' : '브랜드가 수정되었습니다',
        description,
      });

      if (onSuccess) {
        onSuccess();
      } else if (mode === 'create' && result.data?.id) {
        // 생성 후 편집 페이지로 이동 (크롤링 결과 확인 가능)
        router.push(`/dashboard/brands/${result.data.id}`);
        router.refresh();
      } else {
        router.push('/dashboard/brands');
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '브랜드 저장에 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
      setIsCrawling(false);
      setCrawlProgress(0);
    }
  };

  const websiteUrlValue = watch('websiteUrl');

  const handleCrawl = async () => {
    if (!initialData?.id) {
      toast({
        variant: 'destructive',
        title: '브랜드 저장 필요',
        description: '크롤링을 실행하려면 먼저 브랜드를 저장해 주세요.',
      });
      return;
    }

    const urlToCrawl = websiteUrlValue || initialData.websiteUrl;
    if (!urlToCrawl) {
      toast({
        variant: 'destructive',
        title: 'URL이 필요합니다',
        description: '크롤링할 웹사이트 URL을 입력해 주세요.',
      });
      return;
    }

    setIsCrawling(true);
    setCrawlProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setCrawlProgress((prev) => Math.min(prev + 10, 90));
      }, 1000);

      const res = await fetch(`/api/brands/${initialData.id}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrls: [urlToCrawl],
          maxPagesPerUrl: 20,
        }),
      });

      clearInterval(progressInterval);
      setCrawlProgress(100);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('서버 응답 오류: JSON이 아닌 응답을 받았습니다.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Crawling failed');
      }

      toast({
        title: '크롤링 완료',
        description: `${data.data.pagesProcessed}개 페이지에서 브랜드 자산을 추출했습니다.`,
      });

      // Update styleGuide if extracted
      if (data.data.extractedAssets && onStyleGuideUpdate) {
        onStyleGuideUpdate({
          colors: data.data.extractedAssets.colors,
          images: data.data.extractedAssets.images,
          fonts: data.data.extractedAssets.fonts,
          extractedAt: new Date().toISOString(),
          sourceUrl: urlToCrawl,
        });
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
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            브랜드의 핵심 정보를 입력해 주세요. AI가 콘텐츠 생성 시 이 정보를 참고합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">브랜드명 *</Label>
            <Input
              id="name"
              placeholder="예: 나이키 코리아"
              {...register('name')}
              error={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="identity">브랜드 아이덴티티 *</Label>
            <Textarea
              id="identity"
              placeholder="브랜드의 핵심 가치, 미션, 포지셔닝을 설명해 주세요.&#10;&#10;예: &quot;모든 사람이 운동선수다&quot;라는 철학으로 스포츠를 통한 잠재력 실현을 돕는 브랜드. 혁신적인 기술과 디자인으로 운동 성능을 극대화합니다."
              {...register('identity')}
              rows={4}
              className={errors.identity ? 'border-destructive' : ''}
            />
            {errors.identity && (
              <p className="text-sm text-destructive">{errors.identity.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              AI가 브랜드에 맞는 콘텐츠를 생성하는 데 사용됩니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toneAndManner">톤앤매너 *</Label>
            <Textarea
              id="toneAndManner"
              placeholder="브랜드가 고객과 소통하는 말투와 스타일을 설명해 주세요.&#10;&#10;예: 활기차고 도전적인 톤. &quot;~하세요&quot;보다는 &quot;~해보자!&quot; 같은 권유형 사용. 젊고 역동적인 느낌. 전문 용어보다 쉬운 표현 선호."
              {...register('toneAndManner')}
              rows={4}
              className={errors.toneAndManner ? 'border-destructive' : ''}
            />
            {errors.toneAndManner && (
              <p className="text-sm text-destructive">{errors.toneAndManner.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              생성되는 카피의 말투와 분위기를 결정합니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label>이미지 키워드 *</Label>
            <Controller
              name="imageKeywords"
              control={control}
              render={({ field }) => (
                <KeywordTagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="예: 역동적, 스포티, 모던"
                  error={!!errors.imageKeywords}
                />
              )}
            />
            {errors.imageKeywords && (
              <p className="text-sm text-destructive">{errors.imageKeywords.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              이미지 생성 시 스타일 가이드로 사용됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 외부 연동 */}
      <Card>
        <CardHeader>
          <CardTitle>외부 연동 (선택)</CardTitle>
          <CardDescription>
            웹사이트나 인스타그램 URL을 입력하면 브랜드 정보를 자동으로 분석할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">웹사이트 URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://www.example.com"
              {...register('websiteUrl')}
              className={errors.websiteUrl ? 'border-destructive' : ''}
            />
            {errors.websiteUrl && (
              <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramUrl">인스타그램 URL</Label>
            <Input
              id="instagramUrl"
              type="url"
              placeholder="https://instagram.com/example"
              {...register('instagramUrl')}
              className={errors.instagramUrl ? 'border-destructive' : ''}
            />
            {errors.instagramUrl && (
              <p className="text-sm text-destructive">{errors.instagramUrl.message}</p>
            )}
          </div>

          {/* 크롤링 버튼 - 편집 모드에서만 표시 */}
          {mode === 'edit' && (
            <div className="pt-4 border-t space-y-3">
              {isCrawling && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>크롤링 중...</span>
                    <span>{crawlProgress}%</span>
                  </div>
                  <Progress value={crawlProgress} />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleCrawl}
                disabled={isCrawling || !websiteUrlValue && !initialData?.websiteUrl}
                className="w-full"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    브랜드 자산 추출 중...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    웹사이트에서 브랜드 자산 추출
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                웹사이트에서 색상, 로고, 폰트를 자동으로 추출합니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 크롤링된 브랜드 자산 - 편집 모드에서만 표시 */}
      {mode === 'edit' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              크롤링된 브랜드 자산
            </CardTitle>
            <CardDescription>
              웹사이트에서 자동으로 추출된 브랜드 스타일 정보입니다.
              {styleGuide?.extractedAt && (
                <span className="ml-2 text-xs">
                  (추출일: {new Date(styleGuide.extractedAt).toLocaleDateString('ko-KR')})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 데이터가 없을 때 안내 메시지 */}
            {(!styleGuide || (!styleGuide.colors?.primary && !styleGuide.images?.logo && !styleGuide.fonts?.primary)) && (
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">아직 추출된 브랜드 자산이 없습니다.</p>
                <p className="text-xs mt-1">
                  위 &apos;외부 연동&apos; 섹션에서 웹사이트 URL을 입력하고<br />
                  &apos;브랜드 자산 추출&apos; 버튼을 클릭하세요.
                </p>
              </div>
            )}
            {/* 색상 팔레트 */}
            {styleGuide?.colors && (styleGuide.colors.primary || (styleGuide.colors.palette && styleGuide.colors.palette.length > 0)) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">색상 팔레트</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {styleGuide.colors.primary && (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-md border shadow-sm"
                        style={{ backgroundColor: styleGuide.colors.primary }}
                        title={styleGuide.colors.primary}
                      />
                      <div className="text-xs">
                        <div className="font-medium">Primary</div>
                        <div className="text-muted-foreground">{styleGuide.colors.primary}</div>
                      </div>
                    </div>
                  )}
                  {styleGuide.colors.secondary && (
                    <div className="flex items-center gap-2 ml-4">
                      <div
                        className="h-8 w-8 rounded-md border shadow-sm"
                        style={{ backgroundColor: styleGuide.colors.secondary }}
                        title={styleGuide.colors.secondary}
                      />
                      <div className="text-xs">
                        <div className="font-medium">Secondary</div>
                        <div className="text-muted-foreground">{styleGuide.colors.secondary}</div>
                      </div>
                    </div>
                  )}
                </div>
                {styleGuide.colors.palette && styleGuide.colors.palette.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {styleGuide.colors.palette.slice(0, 10).map((color, idx) => (
                      <div
                        key={idx}
                        className="h-6 w-6 rounded border shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 이미지 */}
            {styleGuide?.images && (styleGuide.images.logo || styleGuide.images.favicon || styleGuide.images.ogImage) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">추출된 이미지</Label>
                </div>
                <div className="flex flex-wrap gap-4">
                  {styleGuide.images.logo && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">로고</div>
                      <a href={styleGuide.images.logo} target="_blank" rel="noopener noreferrer">
                        <img
                          src={styleGuide.images.logo}
                          alt="Brand Logo"
                          className="h-12 max-w-[120px] object-contain rounded border bg-white p-1 hover:border-primary transition-colors"
                        />
                      </a>
                    </div>
                  )}
                  {styleGuide.images.favicon && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">파비콘</div>
                      <a href={styleGuide.images.favicon} target="_blank" rel="noopener noreferrer">
                        <img
                          src={styleGuide.images.favicon}
                          alt="Favicon"
                          className="h-8 w-8 object-contain rounded border bg-white p-1 hover:border-primary transition-colors"
                        />
                      </a>
                    </div>
                  )}
                  {styleGuide.images.ogImage && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">OG 이미지</div>
                      <a href={styleGuide.images.ogImage} target="_blank" rel="noopener noreferrer">
                        <img
                          src={styleGuide.images.ogImage}
                          alt="OG Image"
                          className="h-16 max-w-[200px] object-cover rounded border hover:border-primary transition-colors"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 폰트 */}
            {styleGuide?.fonts && (styleGuide.fonts.primary || (styleGuide.fonts.all && styleGuide.fonts.all.length > 0)) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">폰트</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {styleGuide.fonts.primary && (
                    <Badge variant="default">{styleGuide.fonts.primary}</Badge>
                  )}
                  {styleGuide.fonts.all && styleGuide.fonts.all
                    .filter(f => f !== styleGuide.fonts?.primary)
                    .slice(0, 5)
                    .map((font, idx) => (
                      <Badge key={idx} variant="outline">{font}</Badge>
                    ))}
                </div>
              </div>
            )}

            {/* 소스 URL */}
            {styleGuide?.sourceUrl && (
              <div className="pt-2 border-t">
                <a
                  href={styleGuide.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {styleGuide.sourceUrl}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 버튼 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button type="submit" disabled={isLoading || isCrawling}>
          {isLoading || isCrawling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isCrawling ? `크롤링 중... ${crawlProgress}%` : '저장 중...'}
            </>
          ) : mode === 'create' ? (
            '브랜드 생성'
          ) : (
            '변경사항 저장'
          )}
        </Button>
      </div>
    </form>
  );
}
