import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acknowledgeAlert, resolveAlert } from '@/lib/detection/realtime-detector';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const alertId = parseInt(params.id);
    const { action } = await req.json();

    if (action === 'acknowledge') {
      await acknowledgeAlert(alertId, userId);
      return NextResponse.json({ message: 'Alert acknowledged' });
    } else if (action === 'resolve') {
      await resolveAlert(alertId, userId);
      return NextResponse.json({ message: 'Alert resolved' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
