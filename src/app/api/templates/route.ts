import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// GET /api/templates - List templates (marketplace)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const mine = searchParams.get('mine') === 'true';

    // Build filter conditions
    const where: any = {};

    // If mine=true, only get user's own templates
    if (mine) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      where.userId = session.user.id;
      where.createdBy = 'USER';
    } else {
      // Public templates (SYSTEM) or user's own templates
      if (session?.user?.id) {
        where.OR = [
          { createdBy: 'SYSTEM' },
          { userId: session.user.id },
        ];
      } else {
        where.createdBy = 'SYSTEM';
      }
    }

    if (category && category !== 'all') {
      where.category = category.toUpperCase();
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get templates with pagination
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          category: true,
          thumbnailUrl: true,
          isReference: true,
          createdBy: true,
          createdAt: true,
          // Additional fields for user's own templates
          isPublished: true,
          price: true,
          downloadCount: true,
        },
      }),
      prisma.template.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create user template
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['GENERIC', 'FASHION', 'FOOD', 'BEAUTY', 'DIGITAL']),
  thumbnailUrl: z.string().url().optional(),
  sections: z.array(z.any()),
  isReference: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Create user template
    const template = await prisma.template.create({
      data: {
        name: validatedData.name,
        category: validatedData.category,
        thumbnailUrl: validatedData.thumbnailUrl,
        sections: validatedData.sections,
        isReference: validatedData.isReference || false,
        createdBy: 'USER',
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Create template error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
