import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

    // Get workspaces where user is owner or member
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: user.id },
      include: {
        _count: { select: { members: true } },
      },
    });

    const memberWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    const workspaces = [
      ...ownedWorkspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
        role: 'OWNER' as const,
        memberCount: ws._count.members + 1, // +1 for owner
      })),
      ...memberWorkspaces.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
        memberCount: m.workspace._count.members + 1,
      })),
    ];

    return NextResponse.json({ success: true, workspaces });
  } catch (error) {
    console.error('Failed to get workspaces:', error);
    return NextResponse.json({ error: 'Failed to get workspaces' }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        ownerId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        role: 'OWNER',
        memberCount: 1,
      },
    });
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
