import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseUserAgent, getClientIP } from '@/lib/device-info';

export const dynamic = 'force-dynamic';

// POST /api/auth/record-session - Record current session for tracking
export async function POST(request: NextRequest) {
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

    // Parse device info from headers
    const userAgent = request.headers.get('user-agent');
    const deviceInfo = parseUserAgent(userAgent);
    const ipAddress = getClientIP(request.headers);

    // Check if we already have a recent login record (within last hour)
    const recentLogin = await prisma.loginHistory.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        ipAddress,
        browser: deviceInfo.browser,
      },
    });

    // Only create new record if no recent one exists
    if (!recentLogin) {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ipAddress,
          success: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Record session error:', error);
    return NextResponse.json(
      { error: 'Failed to record session' },
      { status: 500 }
    );
  }
}

// GET /api/auth/record-session - Get current session info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userAgent = request.headers.get('user-agent');
    const deviceInfo = parseUserAgent(userAgent);
    const ipAddress = getClientIP(request.headers);

    return NextResponse.json({
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip: ipAddress,
    });
  } catch (error) {
    console.error('Get session info error:', error);
    return NextResponse.json(
      { error: 'Failed to get session info' },
      { status: 500 }
    );
  }
}
