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
  conversationId?: string;  // 채팅에서 생성된 경우 대화 ID
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

// 뷰티 서브카테고리 옵션 (재생성 시 섹션 구성에 사용)
export const BEAUTY_SUBCATEGORIES = [
  { value: 'skincare', label: '스킨케어', description: '에센스, 세럼, 크림 등' },
  { value: 'suncare', label: '선케어', description: '선크림, 선스틱 등' },
  { value: 'lip', label: '립', description: '립스틱, 립틴트, 립글로스 등' },
  { value: 'mascara', label: '마스카라', description: '마스카라, 속눈썹 케어' },
  { value: 'maskpack', label: '마스크팩', description: '시트 마스크, 팩 등' },
  { value: 'cushion', label: '쿠션', description: '쿠션 파운데이션' },
  { value: 'eyeshadow', label: '아이섀도우', description: '아이섀도우 팔레트' },
  { value: 'cleanser', label: '클렌저', description: '클렌징 제품' },
  { value: 'other_beauty', label: '기타 뷰티', description: '그 외 뷰티 제품' },
] as const;

export type BeautySubCategory = typeof BEAUTY_SUBCATEGORIES[number]['value'];

export type { VersionSnapshot };
