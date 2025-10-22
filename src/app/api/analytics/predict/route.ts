import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzePatterns, generatePredictions } from '@/lib/analytics/predictor';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Analyze patterns and generate predictions
    const patterns = await analyzePatterns(userId);
    
    if (patterns.length === 0) {
      return NextResponse.json({
        message: 'Not enough threat data to generate predictions',
        predictions: [],
      });
    }

    const predictions = await generatePredictions(userId, patterns);

    return NextResponse.json({
      message: 'Predictions generated successfully',
      predictions,
      basedOnPatterns: patterns.length,
    });
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
