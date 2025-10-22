import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveAlerts, getDetectionStats } from '@/lib/detection/realtime-detector';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const alerts = await getActiveAlerts(userId);
    const stats = await getDetectionStats(userId);

    return NextResponse.json({ alerts, stats });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
