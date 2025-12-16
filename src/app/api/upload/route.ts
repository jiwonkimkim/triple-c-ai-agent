import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/upload - Upload images
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

    // 파일 이름 생성 (userId + timestamp + random)
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${session.user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    // 개발 환경: public/uploads 디렉토리에 저장
    // 프로덕션 환경: S3 또는 다른 클라우드 스토리지 사용 권장
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // 업로드 디렉토리 생성 (없는 경우)
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // 디렉토리가 이미 존재하는 경우 무시
    }

    const filePath = path.join(uploadDir, fileName);

    // 파일을 Buffer로 변환하여 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL 반환 (로컬 개발용)
    const url = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url,
      fileName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
