import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Note: In production, you would store these settings in the database
// For now, we'll acknowledge the request and return success
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { emailNotifications, projectUpdates, marketingEmails, weeklyDigest } = body;

    // TODO: Store notification preferences in database
    // For now, just return success
    console.log('Notification settings:', {
      emailNotifications,
      projectUpdates,
      marketingEmails,
      weeklyDigest,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated',
      settings: { emailNotifications, projectUpdates, marketingEmails, weeklyDigest },
    });
  } catch (error) {
    console.error('Failed to update notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch notification preferences from database
    // Return default settings for now
    return NextResponse.json({
      success: true,
      settings: {
        emailNotifications: true,
        projectUpdates: true,
        marketingEmails: false,
        weeklyDigest: true,
      },
    });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 });
  }
}
