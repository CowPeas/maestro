import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getImageAnalysisHistory } from '@/lib/intelligence/image-analyzer';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const history = await getImageAnalysisHistory(userId, limit);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
