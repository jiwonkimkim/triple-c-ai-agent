import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, memberId } = await params;

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to remove members
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Only owner can remove members
    if (workspace.ownerId !== currentUser.id) {
      return NextResponse.json({ error: 'Only workspace owner can remove members' }, { status: 403 });
    }

    // Can't remove the owner
    if (memberId === workspace.ownerId) {
      return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 400 });
    }

    // Find and delete membership
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: memberId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await prisma.workspaceMember.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Failed to remove member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
