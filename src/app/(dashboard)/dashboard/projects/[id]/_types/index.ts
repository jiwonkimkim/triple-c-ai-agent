import { VersionSnapshot } from '@/stores/history-store';

export interface ProjectData {
  id: string;
  title: string;
  description?: string;
  status: string;
  brandProfile?: {
    id: string;
    name: string;
  };
  productName?: string;
  category?: string;
  subCategory?: string;  // 뷰티 서브카테고리 (skincare, lip 등)
  keyFeatures?: string[];
  targetAudience?: string;
  copyLength?: 'short' | 'medium' | 'long';
  productUrl?: string;
  productImages?: string[];
  imageModel?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  detailPageVersions: Array<{
    id: string;
    versionNumber: number;
    status: string;
    contentJson: unknown;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface SettingsFormState {
  title: string;
  description: string;
  brandProfileId: string | null;
  productName: string;
  category: string;
  subCategory: string;  // 뷰티 서브카테고리 (skincare, lip 등)
  keyFeatures: string[];
  targetAudience: string;
  copyLength: 'short' | 'medium' | 'long';
  productUrl: string;
  productImages: string[];
  imageModel: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
}

export interface CategoryOption {
  value: string;
  label: string;
}

export interface CopyLengthOption {
  value: 'short' | 'medium' | 'long';
  label: string;
  description: string;
}

export interface ImageModelOption {
  value: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  label: string;
  description: string;
}

export const CATEGORIES: CategoryOption[] = [
  { value: 'Fashion', label: '패션' },
  { value: 'Food & Beverage', label: '식품/음료' },
  { value: 'Beauty & Skincare', label: '뷰티/스킨케어' },
  { value: 'Electronics', label: '전자제품' },
  { value: 'Home & Living', label: '홈/리빙' },
  { value: 'Sports & Fitness', label: '스포츠/피트니스' },
  { value: 'Other', label: '기타' },
];

export const COPY_LENGTH_OPTIONS: CopyLengthOption[] = [
  { value: 'short', label: '짧게', description: '간결하고 임팩트 있게' },
  { value: 'medium', label: '보통', description: '균형 잡힌 정보 전달' },
  { value: 'long', label: '길게', description: '상세하고 포괄적으로' },
];

export const IMAGE_MODEL_OPTIONS: ImageModelOption[] = [
  { value: 'gemini-2.5-flash-image', label: '기본 (Flash)', description: '빠른 이미지 생성' },
  { value: 'gemini-3-pro-image-preview', label: '프로 (Pro)', description: '고품질 이미지 생성' },
];

export type { VersionSnapshot };
