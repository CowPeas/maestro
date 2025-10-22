import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeSystem, ThreatAnalysis } from '@/lib/ai/agents';
import { db } from '@/lib/db/client';
import { threats, mitigations } from '@/lib/db/schema';
import { z } from 'zod';

const analyzeSchema = z.object({
  input: z.string().min(20, 'System description must be at least 20 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { input } = analyzeSchema.parse(body);
    const userId = parseInt(session.user.id);

    // Run AI analysis
    const analyses: ThreatAnalysis[] = await analyzeSystem(input);

    // Save threats to database
    const savedThreats = [];
    for (const analysis of analyses) {
      const { threat, risk, mitigation } = analysis;

      // Create threat
      const [newThreat] = await db
        .insert(threats)
        .values({
          description: threat.description,
          classification: risk.classification,
          status: 'Open',
          layer: threat.layer,
          likelihood: risk.likelihood,
          impact: risk.impact,
          userId,
        })
        .returning();

      // Create mitigations
      const mitigationDescriptions = [
        ...mitigation.immediate.map(m => ({ desc: m, priority: 'immediate' })),
        ...mitigation.shortTerm.map(m => ({ desc: m, priority: 'short-term' })),
        ...mitigation.longTerm.map(m => ({ desc: m, priority: 'long-term' })),
      ];

      if (mitigationDescriptions.length > 0) {
        await db.insert(mitigations).values(
          mitigationDescriptions.map(({ desc }) => ({
            threatId: newThreat.id,
            description: desc,
            status: 'Pending' as const,
          }))
        );
      }

      savedThreats.push({
        ...newThreat,
        risk,
        mitigation,
      });
    }

    return NextResponse.json({
      message: 'Analysis completed successfully',
      threatsCount: savedThreats.length,
      threats: savedThreats,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to analyze system', message: (error as Error).message },
      { status: 500 }
    );
  }
}
