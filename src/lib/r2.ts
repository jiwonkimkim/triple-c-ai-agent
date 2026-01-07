import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// R2 클라이언트 (지연 초기화 - 환경변수 없을 때 문제 방지)
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_r2Client) {
    if (!isR2Configured()) {
      throw new Error('R2 is not configured. Missing required environment variables.');
    }
    _r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _r2Client;
}

// ★ R2 설정 여부 체크 함수를 먼저 정의
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}

export interface R2UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  key: string;
}

/**
 * Base64 이미지를 R2에 업로드
 * @param base64Data - base64 인코딩된 이미지 데이터 (data URL 또는 순수 base64)
 * @param options - 업로드 옵션
 */
export async function uploadBase64ToR2(
  base64Data: string,
  options?: {
    folder?: string;
    publicId?: string;
    fileName?: string;
  }
): Promise<R2UploadResult> {
  // data URL에서 실제 base64 데이터와 mime type 추출
  let mimeType = 'image/png';
  let base64Content = base64Data;

  if (base64Data.startsWith('data:')) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Content = matches[2];
    }
  }

  // base64를 Buffer로 변환
  const buffer = Buffer.from(base64Content, 'base64');

  // 파일명 생성
  const extension = mimeType.split('/')[1] || 'png';
  const fileName = options?.fileName || options?.publicId || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const folder = options?.folder || 'triple-c';
  const key = `${folder}/${fileName}.${extension}`;

  try {
    await getR2Client().send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return {
      url: publicUrl,
      secureUrl: publicUrl,
      publicId: key,
      key: key,
    };
  } catch (error) {
    console.error('[R2] Upload failed:', error);
    throw error;
  }
}

/**
 * 여러 base64 이미지를 동시에 업로드
 */
export async function uploadMultipleToR2(
  images: Array<{ base64Data: string; folder?: string; fileName?: string }>,
  defaultFolder: string = 'triple-c'
): Promise<R2UploadResult[]> {
  const uploadPromises = images.map((img) =>
    uploadBase64ToR2(img.base64Data, {
      folder: img.folder || defaultFolder,
      fileName: img.fileName,
    })
  );

  return Promise.all(uploadPromises);
}

/**
 * R2 이미지 삭제
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    if (!isR2Configured()) {
      console.warn('[R2] Delete skipped - R2 not configured');
      return false;
    }
    await getR2Client().send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (error) {
    console.error('[R2] Delete failed:', error);
    return false;
  }
}

/**
 * 파일을 R2에 직접 업로드 (Buffer)
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  options: {
    folder?: string;
    fileName: string;
    contentType: string;
  }
): Promise<R2UploadResult> {
  const folder = options.folder || 'triple-c';
  const key = `${folder}/${options.fileName}`;

  try {
    await getR2Client().send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: options.contentType,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return {
      url: publicUrl,
      secureUrl: publicUrl,
      publicId: key,
      key: key,
    };
  } catch (error) {
    console.error('[R2] Buffer upload failed:', error);
    throw error;
  }
}

// 하위 호환성을 위해 getter로 export (실제 사용 시에만 초기화)
export const R2 = {
  send: async (command: PutObjectCommand | DeleteObjectCommand) => {
    return getR2Client().send(command);
  },
};
