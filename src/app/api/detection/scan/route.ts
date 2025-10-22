import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { scanForAnomalies } from '@/lib/detection/realtime-detector';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const results = await scanForAnomalies(userId);

    return NextResponse.json({
      message: `${results.length} anomalies detected`,
      detections: results,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
