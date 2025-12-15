import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createBrandProfileSchema } from '@/lib/validations';
import { z } from 'zod';

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
        include: {
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
        include: {
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

    return NextResponse.json(
      {
        success: true,
        data: brandProfile,
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
