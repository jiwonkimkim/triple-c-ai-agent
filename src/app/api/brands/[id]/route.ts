import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateBrandProfileSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/brands/[id] - Get a single brand profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const brandProfile = await prisma.brandProfile.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            workspace: {
              members: {
                some: { userId: session.user.id },
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            projects: true,
            documentChunks: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { success: false, error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: brandProfile,
    });
  } catch (error) {
    console.error('Get brand profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/brands/[id] - Update a brand profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check ownership or workspace membership with edit permission
    const existingBrand = await prisma.brandProfile.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            workspace: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ['OWNER', 'ADMIN', 'EDITOR'] },
                },
              },
            },
          },
        ],
      },
    });

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: 'Brand profile not found or no permission' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateBrandProfileSchema.parse(body);

    const updatedBrand = await prisma.brandProfile.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.identity && { identity: validatedData.identity }),
        ...(validatedData.toneAndManner && { toneAndManner: validatedData.toneAndManner }),
        ...(validatedData.imageKeywords && { imageKeywords: validatedData.imageKeywords }),
        ...(validatedData.websiteUrl !== undefined && {
          websiteUrl: validatedData.websiteUrl || null
        }),
        ...(validatedData.instagramUrl !== undefined && {
          instagramUrl: validatedData.instagramUrl || null
        }),
      },
      include: {
        _count: {
          select: {
            projects: true,
            documentChunks: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBrand,
    });
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

    console.error('Update brand profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id] - Delete a brand profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check ownership or workspace membership with delete permission
    const existingBrand = await prisma.brandProfile.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            workspace: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ['OWNER', 'ADMIN'] },
                },
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: 'Brand profile not found or no permission' },
        { status: 404 }
      );
    }

    // Warn if there are connected projects
    if (existingBrand._count.projects > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete brand with ${existingBrand._count.projects} connected project(s). Please disconnect or delete the projects first.`
        },
        { status: 400 }
      );
    }

    // Delete brand document chunks first (cascade should handle this, but being explicit)
    await prisma.brandDocumentChunk.deleteMany({
      where: { brandProfileId: id },
    });

    // Delete the brand profile
    await prisma.brandProfile.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Brand profile deleted successfully',
    });
  } catch (error) {
    console.error('Delete brand profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
