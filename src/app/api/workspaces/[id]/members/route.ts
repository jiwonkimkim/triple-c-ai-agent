import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/workspaces/[id]/members - List workspace members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    // Check if user has access to this workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!membership && workspace?.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all members
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
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
      orderBy: {
        joinedAt: 'asc',
      },
    });

    // Include owner info
    const owner = await prisma.user.findUnique({
      where: { id: workspace?.ownerId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        owner,
        members: members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          user: m.user,
        })),
      },
    });
  } catch (error) {
    console.error('Get workspace members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/members - Invite member
const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const body = await request.json();
    const { email, role } = inviteMemberSchema.parse(body);

    // Check if user has admin access
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const isOwner = workspace.ownerId === session.user.id;
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!isOwner && !membership) {
      return NextResponse.json(
        { error: 'Only admins can invite members' },
        { status: 403 }
      );
    }

    // Find user by email
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      return NextResponse.json(
        { error: 'User not found. They must register first.' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: userToInvite.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      );
    }

    // Check if user is the owner
    if (userToInvite.id === workspace.ownerId) {
      return NextResponse.json(
        { error: 'Cannot add workspace owner as member' },
        { status: 400 }
      );
    }

    // Add member
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role,
      },
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
        id: member.id,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
      },
    });
  } catch (error) {
    console.error('Invite member error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to invite member' },
      { status: 500 }
    );
  }
}
