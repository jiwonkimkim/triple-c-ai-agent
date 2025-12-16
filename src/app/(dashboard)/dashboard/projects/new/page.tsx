'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations';

const categories = [
  { value: 'Fashion', label: '패션' },
  { value: 'Food & Beverage', label: '식품/음료' },
  { value: 'Beauty & Skincare', label: '뷰티/스킨케어' },
  { value: 'Electronics', label: '전자제품' },
  { value: 'Home & Living', label: '홈/리빙' },
  { value: 'Sports & Fitness', label: '스포츠/피트니스' },
  { value: 'Other', label: '기타' },
];

const copyLengthOptions = [
  { value: 'short', label: '짧게', description: '간결하고 임팩트 있게' },
  { value: 'medium', label: '보통', description: '균형 잡힌 정보 전달' },
  { value: 'long', label: '길게', description: '상세하고 포괄적으로' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productInfo, setProductInfo] = useState({
    productName: '',
    category: '',
    keyFeatures: [''],
    targetAudience: '',
    copyLength: 'medium' as const,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // For demo, we'll use placeholder URLs
    // In production, upload to S3 and get URLs
    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setProductImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (productInfo.keyFeatures.length < 5) {
      setProductInfo((prev) => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, ''],
      }));
    }
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...productInfo.keyFeatures];
    newFeatures[index] = value;
    setProductInfo((prev) => ({ ...prev, keyFeatures: newFeatures }));
  };

  const removeFeature = (index: number) => {
    if (productInfo.keyFeatures.length > 1) {
      setProductInfo((prev) => ({
        ...prev,
        keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
      }));
    }
  };

  const onSubmitProject = async (data: CreateProjectInput) => {
    setIsLoading(true);
    try {
      // Create project
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!projectRes.ok) {
        throw new Error('Failed to create project');
      }

      const { data: project } = await projectRes.json();

      toast({
        title: '프로젝트가 생성되었습니다!',
        description: '이제 제품 정보를 입력해 주세요.',
      });

      setStep(2);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '프로젝트 생성에 실패했습니다. 다시 시도해 주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (productImages.length === 0) {
      toast({
        variant: 'destructive',
        title: '이미지가 필요합니다',
        description: '최소 1개의 제품 이미지를 업로드해 주세요.',
      });
      return;
    }

    if (!productInfo.productName || !productInfo.category) {
      toast({
        variant: 'destructive',
        title: '정보가 부족합니다',
        description: '제품명과 카테고리를 입력해 주세요.',
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: '생성 중...',
      description: 'AI가 상품 상세페이지를 생성하고 있습니다. 잠시만 기다려 주세요.',
    });

    // Simulate generation (in production, call the generate API)
    setTimeout(() => {
      toast({
        title: '완료!',
        description: '상세페이지가 생성되었습니다.',
      });
      router.push('/dashboard/projects');
    }, 3000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">새 프로젝트 만들기</h1>
          <p className="text-muted-foreground">
            {step}단계 / 2단계: {step === 1 ? '프로젝트 정보' : '제품 정보'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 정보</CardTitle>
            <CardDescription>
              프로젝트 이름과 설명을 입력해 주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitProject)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">프로젝트 제목 *</Label>
                <Input
                  id="title"
                  placeholder="예: 여름 신상품 런칭"
                  {...register('title')}
                  error={!!errors.title}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명 (선택)</Label>
                <Textarea
                  id="description"
                  placeholder="프로젝트에 대한 간단한 설명..."
                  {...register('description')}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Link href="/dashboard/projects">
                  <Button variant="outline" type="button">
                    취소
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    '계속'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>제품 이미지</CardTitle>
              <CardDescription>
                최대 5장의 제품 이미지를 업로드하세요 (최소 1장 필수)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {productImages.map((img, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={img}
                      alt={`제품 ${index + 1}`}
                      className="h-full w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {productImages.length < 5 && (
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <span className="mt-2 block text-sm text-muted-foreground">
                        업로드
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>제품 정보</CardTitle>
              <CardDescription>
                AI 콘텐츠 생성을 위해 제품 정보를 입력해 주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>제품명 *</Label>
                  <Input
                    placeholder="예: 프리미엄 가죽 핸드백"
                    value={productInfo.productName}
                    onChange={(e) =>
                      setProductInfo((prev) => ({ ...prev, productName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>카테고리 *</Label>
                  <Select
                    value={productInfo.category}
                    onValueChange={(value) =>
                      setProductInfo((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
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
              </div>

              <div className="space-y-2">
                <Label>주요 특징 *</Label>
                <div className="space-y-2">
                  {productInfo.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`특징 ${index + 1}`}
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                      />
                      {productInfo.keyFeatures.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFeature(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {productInfo.keyFeatures.length < 5 && (
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    특징 추가
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>타겟 고객</Label>
                <Input
                  placeholder="예: 25-40세 패션에 관심 있는 여성"
                  value={productInfo.targetAudience}
                  onChange={(e) =>
                    setProductInfo((prev) => ({ ...prev, targetAudience: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>카피 길이</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {copyLengthOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        productInfo.copyLength === option.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="copyLength"
                        value={option.value}
                        checked={productInfo.copyLength === option.value}
                        onChange={(e) =>
                          setProductInfo((prev) => ({
                            ...prev,
                            copyLength: e.target.value as 'short' | 'medium' | 'long',
                          }))
                        }
                        className="sr-only"
                      />
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              이전
            </Button>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '상세페이지 생성하기'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
