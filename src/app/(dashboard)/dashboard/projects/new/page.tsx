'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Upload, X, Loader2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations';
import { BrandSelect } from '@/components/brands';

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

const imageModelOptions = [
  { value: 'gemini-2.5-flash-image', label: '기본 (Flash)', description: '빠른 이미지 생성' },
  { value: 'gemini-3-pro-image-preview', label: '프로 (Pro)', description: '고품질 이미지 생성' },
];

// 개발 모드 확인
const isDev = process.env.NODE_ENV === 'development';

// 테스트용 샘플 데이터
const TEST_DATA = {
  project: {
    title: '테스트 립스틱 상세페이지',
    description: '개발 테스트용 프로젝트입니다.',
  },
  product: {
    productName: '벨벳 매트 립스틱 #로즈베리',
    category: 'Beauty & Skincare',
    keyFeatures: [
      '12시간 지속되는 롱래스팅 포뮬러',
      '입술 보습 케어 성분 함유',
      '선명한 발색과 부드러운 밀착력',
    ],
    targetAudience: '20-35세 뷰티에 관심있는 여성',
    copyLength: 'medium' as const,
    productUrl: '',
    imageModel: 'gemini-2.5-flash-image' as const,
  },
};

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [productInfo, setProductInfo] = useState<{
    productName: string;
    category: string;
    keyFeatures: string[];
    targetAudience: string;
    copyLength: 'short' | 'medium' | 'long';
    productUrl: string;
    imageModel: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  }>({
    productName: '',
    category: '',
    keyFeatures: [''],
    targetAudience: '',
    copyLength: 'medium',
    productUrl: '',
    imageModel: 'gemini-2.5-flash-image',
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  // [DEV] 프로젝트 정보 자동 입력
  const handleAutoFillProject = () => {
    setValue('title', TEST_DATA.project.title);
    setValue('description', TEST_DATA.project.description);
    toast({
      title: '🧪 테스트 데이터 입력됨',
      description: '프로젝트 정보가 자동으로 입력되었습니다.',
    });
  };

  // [DEV] 제품 정보 자동 입력
  const handleAutoFillProduct = () => {
    setProductInfo({
      productName: TEST_DATA.product.productName,
      category: TEST_DATA.product.category,
      keyFeatures: TEST_DATA.product.keyFeatures,
      targetAudience: TEST_DATA.product.targetAudience,
      copyLength: TEST_DATA.product.copyLength,
      productUrl: TEST_DATA.product.productUrl,
      imageModel: TEST_DATA.product.imageModel,
    });
    toast({
      title: '🧪 테스트 데이터 입력됨',
      description: '제품 정보가 자동으로 입력되었습니다.',
    });
  };

  // 세션 로딩 중이면 로딩 표시
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

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
      // Create project with brand profile
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          brandProfileId: selectedBrandId,
        }),
      });

      const result = await projectRes.json();

      if (!projectRes.ok || !result.success) {
        // 에러 메시지 상세 처리
        let errorMessage = result.error || '프로젝트 생성에 실패했습니다.';
        if (result.details) {
          // details가 배열인 경우 (Zod validation 에러)
          if (Array.isArray(result.details)) {
            const validationErrors = result.details
              .map((e: { path: string[]; message: string }) => e.message)
              .join(', ');
            errorMessage = `입력 오류: ${validationErrors}`;
          } else if (typeof result.details === 'string') {
            // details가 문자열인 경우 (개발 환경 상세 에러)
            errorMessage = `${errorMessage} (${result.details})`;
          }
        }
        throw new Error(errorMessage);
      }

      // 프로젝트 데이터 확인
      if (!result.data?.id) {
        throw new Error('프로젝트 생성 응답이 올바르지 않습니다.');
      }

      // 프로젝트 ID 저장
      setProjectId(result.data.id);

      toast({
        title: '프로젝트가 생성되었습니다!',
        description: '이제 제품 정보를 입력해 주세요.',
      });

      setStep(2);
    } catch (error) {
      console.error('Project creation error:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다. 다시 시도해 주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지를 서버에 업로드하는 함수
  const uploadImages = async (blobUrls: string[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const blobUrl of blobUrls) {
      try {
        // Blob URL에서 File 객체 가져오기
        const response = await fetch(blobUrl);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('file', blob, `image-${Date.now()}.jpg`);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          uploadedUrls.push(url);
        }
      } catch (error) {
        console.error('Image upload failed:', error);
      }
    }

    return uploadedUrls;
  };

  const handleGenerate = async () => {
    // 프로젝트 ID 확인
    if (!projectId) {
      toast({
        variant: 'destructive',
        title: '프로젝트 오류',
        description: '프로젝트가 생성되지 않았습니다. 다시 시도해 주세요.',
      });
      setStep(1);
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

    // 빈 특징 필터링
    const filteredFeatures = productInfo.keyFeatures.filter(
      (feature) => feature.trim() !== ''
    );

    if (filteredFeatures.length === 0) {
      toast({
        variant: 'destructive',
        title: '특징이 필요합니다',
        description: '최소 1개의 제품 특징을 입력해 주세요.',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. 이미지 업로드 (이미지가 있는 경우에만)
      let imageUrls: string[] = [];
      if (productImages.length > 0) {
        toast({
          title: '이미지 업로드 중...',
          description: '제품 이미지를 업로드하고 있습니다.',
        });
        imageUrls = await uploadImages(productImages);
        setUploadedImageUrls(imageUrls);
      }

      // 2. 프로젝트에 제품 정보 저장 (재생성 시 사용)
      toast({
        title: '제품 정보 저장 중...',
        description: '입력한 제품 정보를 저장하고 있습니다.',
      });

      const updateRes = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productInfo.productName,
          category: productInfo.category,
          keyFeatures: filteredFeatures,
          targetAudience: productInfo.targetAudience || '일반 소비자',
          copyLength: productInfo.copyLength,
          productUrl: productInfo.productUrl || '',
          productImages: imageUrls,
        }),
      });

      if (!updateRes.ok) {
        console.error('Failed to save product info to project');
      }

      toast({
        title: '생성 중...',
        description: 'AI가 상품 상세페이지를 생성하고 있습니다. 잠시만 기다려 주세요.',
      });

      // 3. 상세페이지 생성 API 호출
      // generateImages: true → 사용자 제품 이미지 + 프롬프트로 Image-to-Image 생성
      const generateRes = await fetch('/api/generate/detail-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          productImages: imageUrls,
          productName: productInfo.productName,
          category: productInfo.category,
          keyFeatures: filteredFeatures,
          targetAudience: productInfo.targetAudience || '일반 소비자',
          copyLength: productInfo.copyLength,
          productUrl: productInfo.productUrl || undefined,
          generateImages: true,  // Image-to-Image 생성 활성화
          imageModel: productInfo.imageModel,
        }),
      });

      const result = await generateRes.json();

      if (!generateRes.ok) {
        throw new Error(result.error || '상세페이지 생성에 실패했습니다.');
      }

      // 개발 모드에서 프롬프트 정보를 sessionStorage에 저장
      if (result.data?.devPrompts) {
        try {
          sessionStorage.setItem(
            `devPrompts_${projectId}`,
            JSON.stringify(result.data.devPrompts)
          );
        } catch (e) {
          console.warn('Failed to save devPrompts to sessionStorage:', e);
        }
      }

      toast({
        title: '완료!',
        description: `상세페이지가 생성되었습니다. 남은 크레딧: ${result.data.remainingCredits}`,
      });

      // Blob URL 메모리 해제
      productImages.forEach((url) => URL.revokeObjectURL(url));

      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '생성 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>프로젝트 정보</CardTitle>
                <CardDescription>
                  프로젝트 이름과 설명을 입력해 주세요
                </CardDescription>
              </div>
              {isDev && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFillProject}
                  className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <Wand2 className="h-4 w-4" />
                  테스트 데이터
                </Button>
              )}
            </div>
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

              {/* 브랜드 선택 */}
              <BrandSelect
                value={selectedBrandId}
                onChange={setSelectedBrandId}
              />

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
              <CardTitle>제품 이미지 (선택)</CardTitle>
              <CardDescription>
                최대 5장의 제품 이미지를 업로드할 수 있습니다
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>제품 정보</CardTitle>
                  <CardDescription>
                    AI 콘텐츠 생성을 위해 제품 정보를 입력해 주세요
                  </CardDescription>
                </div>
                {isDev && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFillProduct}
                    className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    <Wand2 className="h-4 w-4" />
                    테스트 데이터
                  </Button>
                )}
              </div>
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
                <Label>상품 URL (선택)</Label>
                <Input
                  placeholder="예: https://www.coupang.com/... 또는 https://smartstore.naver.com/..."
                  value={productInfo.productUrl}
                  onChange={(e) =>
                    setProductInfo((prev) => ({ ...prev, productUrl: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  쿠팡, 네이버 스마트스토어 등의 상품 URL을 입력하면 상품 정보를 참고하여 콘텐츠를 생성합니다.
                </p>
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

              <div className="space-y-2">
                <Label>이미지 생성 모델</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {imageModelOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        productInfo.imageModel === option.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="imageModel"
                        value={option.value}
                        checked={productInfo.imageModel === option.value}
                        onChange={(e) =>
                          setProductInfo((prev) => ({
                            ...prev,
                            imageModel: e.target.value as 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
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
