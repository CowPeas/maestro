import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeImageGeolocation } from '@/lib/intelligence/image-analyzer';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { imageUrl, fileName } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    const result = await analyzeImageGeolocation(imageUrl, userId, fileName);

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error('Image analysis API error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
