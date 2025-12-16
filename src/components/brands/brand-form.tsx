'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createBrandProfileSchema, type CreateBrandProfileInput } from '@/lib/validations';
import { KeywordTagInput } from './keyword-tag-input';

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
  workspaceId?: string;
  onSuccess?: () => void;
}

export function BrandForm({ mode, initialData, workspaceId, onSuccess }: BrandFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
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
    try {
      const url = mode === 'create' ? '/api/brands' : `/api/brands/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save brand profile');
      }

      toast({
        title: mode === 'create' ? '브랜드가 생성되었습니다' : '브랜드가 수정되었습니다',
        description: mode === 'create'
          ? '이제 프로젝트에서 이 브랜드를 사용할 수 있습니다.'
          : '변경사항이 저장되었습니다.',
      });

      if (onSuccess) {
        onSuccess();
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

          <p className="text-sm text-muted-foreground">
            URL을 저장한 후 &apos;지식베이스&apos; 탭에서 크롤링을 실행할 수 있습니다.
          </p>
        </CardContent>
      </Card>

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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
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
