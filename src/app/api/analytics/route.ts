import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAnalytics } from '@/lib/analytics/predictor';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const analytics = await getAnalytics(userId);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
