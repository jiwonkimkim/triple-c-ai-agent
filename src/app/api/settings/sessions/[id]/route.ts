import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// DELETE /api/settings/sessions/[id] - Revoke a specific session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const sessionId = params.id;

    // Verify the session belongs to this user
    const targetSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
    });

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if trying to revoke current session
    const cookieStore = cookies();
    const currentSessionToken = cookieStore.get('next-auth.session-token')?.value
      || cookieStore.get('__Secure-next-auth.session-token')?.value;

    if (targetSession.sessionToken === currentSessionToken) {
      return NextResponse.json(
        { error: 'Cannot revoke current session' },
        { status: 400 }
      );
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Session revoked',
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}
