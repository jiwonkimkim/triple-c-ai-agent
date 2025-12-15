import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// PUT /api/workspaces/[id]/members/[memberId] - Update member role
const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, memberId } = await params;
    const body = await request.json();
    const { role } = updateMemberSchema.parse(body);

    // Check workspace and admin access
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const isOwner = workspace.ownerId === session.user.id;
    const adminMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: 'ADMIN',
      },
    });

    if (!isOwner && !adminMembership) {
      return NextResponse.json(
        { error: 'Only owners and admins can update roles' },
        { status: 403 }
      );
    }

    // Get the member to update
    const memberToUpdate = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate || memberToUpdate.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Admins cannot change other admins' roles (only owner can)
    if (!isOwner && memberToUpdate.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Only the owner can change admin roles' },
        { status: 403 }
      );
    }

    // Update member role
    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        role: updatedMember.role,
        user: updatedMember.user,
      },
    });
  } catch (error) {
    console.error('Update member error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId, memberId } = await params;

    // Check workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const isOwner = workspace.ownerId === session.user.id;
    const adminMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: 'ADMIN',
      },
    });

    // Get the member to remove
    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Users can remove themselves
    const isSelfRemoval = memberToRemove.userId === session.user.id;

    if (!isOwner && !adminMembership && !isSelfRemoval) {
      return NextResponse.json(
        { error: 'Only owners and admins can remove members' },
        { status: 403 }
      );
    }

    // Admins cannot remove other admins (only owner can)
    if (!isOwner && !isSelfRemoval && memberToRemove.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Only the owner can remove admins' },
        { status: 403 }
      );
    }

    // Remove member
    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
