import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET /api/settings/sessions - Get all active sessions
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

    // Get current session token to identify current session
    const cookieStore = cookies();
    const currentSessionToken = cookieStore.get('next-auth.session-token')?.value
      || cookieStore.get('__Secure-next-auth.session-token')?.value;

    // Get all active sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expires: { gt: new Date() }, // Only non-expired sessions
      },
      select: {
        id: true,
        sessionToken: true,
        deviceInfo: true,
        browser: true,
        os: true,
        ipAddress: true,
        location: true,
        lastActive: true,
        createdAt: true,
      },
      orderBy: { lastActive: 'desc' },
    });

    // Mark current session
    const sessionsWithCurrent = sessions.map((s) => ({
      id: s.id,
      device: s.deviceInfo || 'Unknown Device',
      browser: s.browser || 'Unknown Browser',
      os: s.os || 'Unknown OS',
      location: s.location || 'Unknown Location',
      ip: s.ipAddress || 'Unknown IP',
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: s.sessionToken === currentSessionToken,
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/sessions - Revoke all sessions except current
export async function DELETE(request: NextRequest) {
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

    // Get current session token
    const cookieStore = cookies();
    const currentSessionToken = cookieStore.get('next-auth.session-token')?.value
      || cookieStore.get('__Secure-next-auth.session-token')?.value;

    // Delete all sessions except current
    const result = await prisma.session.deleteMany({
      where: {
        userId: user.id,
        sessionToken: { not: currentSessionToken },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} sessions revoked`,
      count: result.count,
    });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke sessions' },
      { status: 500 }
    );
  }
}
