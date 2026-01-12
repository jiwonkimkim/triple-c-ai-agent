import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadBufferToR2, isR2Configured } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// POST /api/upload - Upload images to Cloudflare R2
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // 이미지 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // R2 설정 확인
    if (!isR2Configured()) {
      console.error('[Upload] R2 is not configured');
      return NextResponse.json(
        { success: false, error: 'Image storage is not configured' },
        { status: 500 }
      );
    }

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 파일명 생성
    const extension = file.type.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    console.log(`[Upload] Uploading to R2... (${Math.round(file.size / 1024)}KB)`);

    // R2에 업로드
    const result = await uploadBufferToR2(buffer, {
      folder: 'products',
      fileName,
      contentType: file.type,
    });

    console.log(`[Upload] Success: ${result.secureUrl}`);

    return NextResponse.json({
      success: true,
      url: result.secureUrl,  // R2 Public URL 반환
      fileName: result.key,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
