import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { publishTemplate, unpublishTemplate } from '@/lib/marketplace';
import { MARKETPLACE_CONFIG } from '@/lib/stripe';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const publishSchema = z.object({
  price: z
    .number()
    .int()
    .min(0, 'Price cannot be negative')
    .max(
      MARKETPLACE_CONFIG.MAX_TEMPLATE_PRICE,
      `Maximum price is ${MARKETPLACE_CONFIG.MAX_TEMPLATE_PRICE} credits`
    ),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  previewImages: z.array(z.string().url()).max(5).optional(),
});

/**
 * POST /api/marketplace/templates/[id]/publish
 * Publish a template to the marketplace
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const validation = publishSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await publishTemplate(userId, templateId, validation.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Template published successfully',
      template: result.template,
    });
  } catch (error) {
    console.error('Error publishing template:', error);
    return NextResponse.json(
      { error: 'Failed to publish template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketplace/templates/[id]/publish
 * Unpublish a template from the marketplace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    const userId = session.user.id;

    const result = await unpublishTemplate(userId, templateId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Template unpublished successfully',
    });
  } catch (error) {
    console.error('Error unpublishing template:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish template' },
      { status: 500 }
    );
  }
}
