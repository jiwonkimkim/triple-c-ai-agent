/**
 * 이미지 업로드 서비스
 * - Cloudinary가 설정되어 있으면 Cloudinary에 업로드하고 URL 반환
 * - 설정되어 있지 않으면 기존 base64 data URL 반환 (fallback)
 */

import {
  uploadBase64ToCloudinary,
  isCloudinaryConfigured,
  CloudinaryUploadResult,
} from '@/lib/cloudinary';
import { GeminiGeneratedImage, base64ToDataUrl } from './gemini-image-generator';

export interface ImageUploadResult {
  /** 이미지 URL (Cloudinary URL 또는 data URL) */
  url: string;
  /** Cloudinary public ID (Cloudinary 사용 시) */
  publicId?: string;
  /** 이미지 너비 */
  width?: number;
  /** 이미지 높이 */
  height?: number;
  /** 원본 base64 데이터 (필요 시) */
  base64Data?: string;
}

/**
 * Gemini 생성 이미지를 업로드하고 URL 반환
 * - Cloudinary 설정 시: Cloudinary에 업로드 후 URL 반환
 * - 미설정 시: base64 data URL 반환
 */
export async function uploadGeneratedImage(
  image: GeminiGeneratedImage,
  options?: {
    folder?: string;
    projectId?: string;
    sectionType?: string;
  }
): Promise<ImageUploadResult> {
  // Cloudinary가 설정되어 있으면 업로드
  if (isCloudinaryConfigured()) {
    try {
      const folder = options?.folder ||
        (options?.projectId
          ? `triple-c/projects/${options.projectId}`
          : 'triple-c/images');

      const result = await uploadBase64ToCloudinary(image.base64Data, {
        folder,
        publicId: options?.sectionType
          ? `${options.sectionType}_${Date.now()}`
          : undefined,
      });

      console.log(`[ImageUpload] Uploaded to Cloudinary: ${result.secureUrl}`);

      return {
        url: result.secureUrl,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('[ImageUpload] Cloudinary upload failed, falling back to base64:', error);
      // 실패 시 base64로 fallback
    }
  }

  // Cloudinary 미설정 또는 업로드 실패 시 base64 data URL 반환
  const dataUrl = base64ToDataUrl(image.base64Data, image.mimeType);
  console.log('[ImageUpload] Using base64 data URL (Cloudinary not configured or failed)');

  return {
    url: dataUrl,
    base64Data: image.base64Data,
  };
}

/**
 * 여러 이미지를 동시에 업로드
 */
export async function uploadMultipleImages(
  images: GeminiGeneratedImage[],
  options?: {
    folder?: string;
    projectId?: string;
  }
): Promise<ImageUploadResult[]> {
  const uploadPromises = images.map((image, index) =>
    uploadGeneratedImage(image, {
      ...options,
      sectionType: `image_${index}`,
    })
  );

  return Promise.all(uploadPromises);
}

/**
 * base64 data URL인지 확인
 */
export function isBase64DataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Cloudinary URL인지 확인
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * 이미지 URL 타입 확인
 */
export function getImageUrlType(url: string): 'cloudinary' | 'base64' | 'external' {
  if (isCloudinaryUrl(url)) return 'cloudinary';
  if (isBase64DataUrl(url)) return 'base64';
  return 'external';
}
