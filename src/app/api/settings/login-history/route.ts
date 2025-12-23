import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/settings/login-history - Get login history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get login history
    const [history, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          device: true,
          browser: true,
          os: true,
          ipAddress: true,
          location: true,
          success: true,
          failReason: true,
          createdAt: true,
        },
      }),
      prisma.loginHistory.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      history: history.map((h) => ({
        id: h.id,
        device: h.device || 'Unknown Device',
        browser: h.browser || 'Unknown Browser',
        os: h.os || 'Unknown OS',
        location: h.location || 'Unknown Location',
        ip: h.ipAddress || 'Unknown IP',
        success: h.success,
        failReason: h.failReason,
        timestamp: h.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get login history error:', error);
    return NextResponse.json(
      { error: 'Failed to get login history' },
      { status: 500 }
    );
  }
}
