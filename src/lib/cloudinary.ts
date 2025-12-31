import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Base64 이미지를 Cloudinary에 업로드
 * @param base64Data - base64 인코딩된 이미지 데이터 (data URL 또는 순수 base64)
 * @param options - 업로드 옵션
 */
export async function uploadBase64ToCloudinary(
  base64Data: string,
  options?: {
    folder?: string;
    publicId?: string;
    transformation?: Record<string, unknown>;
  }
): Promise<CloudinaryUploadResult> {
  // data URL 형식이 아니면 변환
  let dataUrl = base64Data;
  if (!base64Data.startsWith('data:')) {
    dataUrl = `data:image/png;base64,${base64Data}`;
  }

  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(dataUrl, {
      folder: options?.folder || 'triple-c',
      public_id: options?.publicId,
      transformation: options?.transformation,
      resource_type: 'image',
    });

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error);
    throw error;
  }
}

/**
 * 여러 base64 이미지를 동시에 업로드
 */
export async function uploadMultipleToCloudinary(
  images: Array<{ base64Data: string; folder?: string }>,
  defaultFolder: string = 'triple-c'
): Promise<CloudinaryUploadResult[]> {
  const uploadPromises = images.map((img) =>
    uploadBase64ToCloudinary(img.base64Data, {
      folder: img.folder || defaultFolder,
    })
  );

  return Promise.all(uploadPromises);
}

/**
 * Cloudinary 이미지 삭제
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error);
    return false;
  }
}

/**
 * Cloudinary가 설정되어 있는지 확인
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * 이미지 URL 최적화 (Cloudinary transformation)
 */
export function getOptimizedUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'png' | 'jpg';
  }
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options?.width,
        height: options?.height,
        crop: 'limit',
        quality: options?.quality || 'auto',
        fetch_format: options?.format || 'auto',
      },
    ],
  });
}

export default cloudinary;
