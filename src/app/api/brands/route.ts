import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createBrandProfileSchema } from '@/lib/validations';
import { z } from 'zod';
import { indexBrandContent } from '@/services/rag/brand-context';

export const dynamic = 'force-dynamic';

// GET /api/brands - List all brand profiles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 개발 환경에서 사용자 ID 동기화
    if (process.env.NODE_ENV === 'development') {
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!existingUser) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (userByEmail) {
          session.user.id = userByEmail.id;
        }
      }
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    let brandProfiles;

    if (workspaceId) {
      // Get workspace brand profiles
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: session.user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: 'No access to this workspace' },
          { status: 403 }
        );
      }

      brandProfiles = await prisma.brandProfile.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          identity: true,
          toneAndManner: true,
          imageKeywords: true,
          websiteUrl: true,
          instagramUrl: true,
          styleGuide: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              documentChunks: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      // Get user's personal brand profiles (B2C)
      brandProfiles = await prisma.brandProfile.findMany({
        where: {
          userId: session.user.id,
          workspaceId: null,
        },
        select: {
          id: true,
          name: true,
          identity: true,
          toneAndManner: true,
          imageKeywords: true,
          websiteUrl: true,
          instagramUrl: true,
          styleGuide: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              documentChunks: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      data: brandProfiles,
    });
  } catch (error) {
    console.error('Get brand profiles error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create a new brand profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 개발 환경에서 사용자 ID 동기화
    if (process.env.NODE_ENV === 'development') {
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!existingUser) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (userByEmail) {
          session.user.id = userByEmail.id;
        }
      }
    }

    const body = await request.json();
    const validatedData = createBrandProfileSchema.parse(body);

    // Verify workspace access if workspaceId provided
    if (validatedData.workspaceId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: validatedData.workspaceId,
            userId: session.user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: 'No access to this workspace' },
          { status: 403 }
        );
      }

      // Only OWNER, ADMIN, EDITOR can create brand profiles
      if (membership.role === 'VIEWER') {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    const brandProfile = await prisma.brandProfile.create({
      data: {
        name: validatedData.name,
        identity: validatedData.identity,
        toneAndManner: validatedData.toneAndManner,
        imageKeywords: validatedData.imageKeywords,
        websiteUrl: validatedData.websiteUrl || null,
        instagramUrl: validatedData.instagramUrl || null,
        workspaceId: validatedData.workspaceId || null,
        userId: validatedData.workspaceId ? null : session.user.id,
      },
    });

    // 웹사이트 URL이 있으면 자동으로 크롤링 실행
    let crawlResult = null;
    if (validatedData.websiteUrl) {
      try {
        console.log(`[Brand Create] Auto-crawling: ${validatedData.websiteUrl}`);
        crawlResult = await indexBrandContent(brandProfile.id, {
          websiteUrls: [validatedData.websiteUrl],
          maxPagesPerUrl: 5,
        });
        console.log(`[Brand Create] Crawl complete:`, crawlResult);
      } catch (crawlError) {
        console.error('[Brand Create] Auto-crawl failed:', crawlError);
        // 크롤링 실패해도 브랜드 생성은 성공으로 처리
      }
    }

    // 크롤링 후 업데이트된 브랜드 프로필 조회
    const updatedBrandProfile = await prisma.brandProfile.findUnique({
      where: { id: brandProfile.id },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedBrandProfile || brandProfile,
        crawlResult,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Create brand profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
