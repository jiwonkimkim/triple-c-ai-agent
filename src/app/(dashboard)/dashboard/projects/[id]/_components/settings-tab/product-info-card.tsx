'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CATEGORIES,
  COPY_LENGTH_OPTIONS,
  IMAGE_MODEL_OPTIONS,
  BEAUTY_SUBCATEGORIES,
  type SettingsFormState,
} from '../../_types';

interface ProductInfoCardProps {
  settingsForm: SettingsFormState;
  onUpdate: (updates: Partial<SettingsFormState>) => void;
  onAddFeature: () => void;
  onUpdateFeature: (index: number, value: string) => void;
  onRemoveFeature: (index: number) => void;
}

export function ProductInfoCard({
  settingsForm,
  onUpdate,
  onAddFeature,
  onUpdateFeature,
  onRemoveFeature,
}: ProductInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>제품 정보</CardTitle>
        <CardDescription>
          AI 콘텐츠 생성을 위한 제품 정보를 설정합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>제품명</Label>
            <Input
              placeholder="예: 프리미엄 가죽 핸드백"
              value={settingsForm.productName}
              onChange={(e) => onUpdate({ productName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select
              value={settingsForm.category}
              onValueChange={(value) => onUpdate({
                category: value,
                // 뷰티 카테고리가 아니면 서브카테고리 초기화
                subCategory: value === 'Beauty & Skincare' ? settingsForm.subCategory : '',
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 뷰티 서브카테고리 (뷰티/스킨케어 선택 시에만 표시) */}
        {settingsForm.category === 'Beauty & Skincare' && (
          <div className="space-y-2">
            <Label>뷰티 서브카테고리</Label>
            <Select
              value={settingsForm.subCategory}
              onValueChange={(value) => onUpdate({ subCategory: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="서브카테고리 선택 (재생성 시 섹션 구성에 사용)" />
              </SelectTrigger>
              <SelectContent>
                {BEAUTY_SUBCATEGORIES.map((sub) => (
                  <SelectItem key={sub.value} value={sub.value}>
                    <div className="flex flex-col">
                      <span>{sub.label}</span>
                      <span className="text-xs text-muted-foreground">{sub.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              서브카테고리에 따라 재생성 시 최적화된 섹션 구성이 적용됩니다.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>주요 특징</Label>
          <div className="space-y-2">
            {settingsForm.keyFeatures.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`특징 ${index + 1}`}
                  value={feature}
                  onChange={(e) => onUpdateFeature(index, e.target.value)}
                />
                {settingsForm.keyFeatures.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {settingsForm.keyFeatures.length < 5 && (
            <Button type="button" variant="outline" size="sm" onClick={onAddFeature}>
              특징 추가
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>타겟 고객</Label>
          <Input
            placeholder="예: 25-40세 패션에 관심 있는 여성"
            value={settingsForm.targetAudience}
            onChange={(e) => onUpdate({ targetAudience: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>상품 URL</Label>
          <Input
            placeholder="예: https://www.coupang.com/... 또는 https://smartstore.naver.com/..."
            value={settingsForm.productUrl}
            onChange={(e) => onUpdate({ productUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            쿠팡, 네이버 스마트스토어 등의 상품 URL을 입력하면 상품 정보를 참고하여 콘텐츠를 생성합니다.
          </p>
        </div>

        {/* Product Images */}
        {settingsForm.productImages.length > 0 && (
          <div className="space-y-2">
            <Label>등록된 제품 이미지</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {settingsForm.productImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={img}
                    alt={`제품 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              제품 이미지는 새 프로젝트 생성 시에만 업로드할 수 있습니다.
            </p>
          </div>
        )}

        {/* Copy Length */}
        <div className="space-y-2">
          <Label>카피 길이</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {COPY_LENGTH_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  settingsForm.copyLength === option.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
              >
                <input
                  type="radio"
                  name="copyLength"
                  value={option.value}
                  checked={settingsForm.copyLength === option.value}
                  onChange={(e) =>
                    onUpdate({ copyLength: e.target.value as 'short' | 'medium' | 'long' })
                  }
                  className="sr-only"
                />
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Image Model */}
        <div className="space-y-2">
          <Label>이미지 생성 모델</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {IMAGE_MODEL_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  settingsForm.imageModel === option.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
              >
                <input
                  type="radio"
                  name="imageModel"
                  value={option.value}
                  checked={settingsForm.imageModel === option.value}
                  onChange={(e) =>
                    onUpdate({
                      imageModel: e.target.value as 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview',
                    })
                  }
                  className="sr-only"
                />
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            재생성 시 사용할 이미지 생성 모델을 선택합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
