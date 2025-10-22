import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSnapshot } from '@/lib/analytics/predictor';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    await createSnapshot(userId);

    return NextResponse.json({
      message: 'Analytics snapshot created successfully',
    });
  } catch (error) {
    console.error('Snapshot API error:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}
