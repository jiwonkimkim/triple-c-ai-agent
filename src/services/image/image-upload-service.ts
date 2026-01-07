/**
 * 이미지 업로드 서비스
 * - R2가 설정되어 있으면 R2에 업로드 (우선)
 * - R2 미설정 시 Cloudinary에 업로드
 * - 둘 다 미설정 시 base64 data URL 반환 (fallback)
 */

import {
  uploadBase64ToCloudinary,
  isCloudinaryConfigured,
  CloudinaryUploadResult,
} from '@/lib/cloudinary';
import {
  uploadBase64ToR2,
  isR2Configured,
} from '@/lib/r2';
import { GeminiGeneratedImage, base64ToDataUrl } from './gemini-image-generator';

export interface ImageUploadResult {
  /** 이미지 URL (R2, Cloudinary URL 또는 data URL) */
  url: string;
  /** 스토리지 키/ID (R2 key 또는 Cloudinary public ID) */
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
 * - R2 설정 시: R2에 업로드 (우선)
 * - R2 미설정 & Cloudinary 설정 시: Cloudinary에 업로드
 * - 둘 다 미설정 시: base64 data URL 반환
 */
export async function uploadGeneratedImage(
  image: GeminiGeneratedImage,
  options?: {
    folder?: string;
    projectId?: string;
    sectionType?: string;
  }
): Promise<ImageUploadResult> {
  const folder = options?.folder ||
    (options?.projectId
      ? `projects/${options.projectId}`
      : 'images');

  // 1. R2가 설정되어 있으면 R2에 업로드 (우선)
  if (isR2Configured()) {
    try {
      const fileName = options?.sectionType
        ? `${options.sectionType}_${Date.now()}`
        : `img_${Date.now()}`;

      const result = await uploadBase64ToR2(image.base64Data, {
        folder,
        fileName,
      });

      console.log(`[ImageUpload] Uploaded to R2: ${result.secureUrl}`);

      return {
        url: result.secureUrl,
        publicId: result.key,
      };
    } catch (error) {
      console.error('[ImageUpload] R2 upload failed, trying Cloudinary:', error);
      // R2 실패 시 Cloudinary로 fallback
    }
  }

  // 2. Cloudinary가 설정되어 있으면 업로드
  if (isCloudinaryConfigured()) {
    try {
      const cloudinaryFolder = options?.folder ||
        (options?.projectId
          ? `triple-c/projects/${options.projectId}`
          : 'triple-c/images');

      const result = await uploadBase64ToCloudinary(image.base64Data, {
        folder: cloudinaryFolder,
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

  // 3. 둘 다 미설정 또는 업로드 실패 시 base64 data URL 반환
  const dataUrl = base64ToDataUrl(image.base64Data, image.mimeType);
  console.log('[ImageUpload] Using base64 data URL (storage not configured or failed)');

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
 * R2 URL인지 확인
 */
export function isR2Url(url: string): boolean {
  return url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com');
}

/**
 * 이미지 URL 타입 확인
 */
export function getImageUrlType(url: string): 'r2' | 'cloudinary' | 'base64' | 'external' {
  if (isR2Url(url)) return 'r2';
  if (isCloudinaryUrl(url)) return 'cloudinary';
  if (isBase64DataUrl(url)) return 'base64';
  return 'external';
}
