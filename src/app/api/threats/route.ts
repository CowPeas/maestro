import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threats, mitigations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const threatSchema = z.object({
  description: z.string().min(10),
  classification: z.enum(['High', 'Medium', 'Low']),
  status: z.enum(['Open', 'In Progress', 'Resolved']).default('Open'),
  layer: z.string().min(3),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  mitigations: z.array(z.object({
    description: z.string(),
    status: z.enum(['Pending', 'Completed']).default('Pending'),
  })).optional(),
});

// GET /api/threats - Get all threats for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    
    // Get threats with mitigations
    const userThreats = await db.query.threats.findMany({
      where: eq(threats.userId, userId),
      orderBy: [desc(threats.createdAt)],
      with: {
        mitigations: true,
      },
    });

    return NextResponse.json({ threats: userThreats });
  } catch (error) {
    console.error('Error fetching threats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threats - Create a new threat
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
    const validated = threatSchema.parse(body);
    const userId = parseInt(session.user.id);

    // Create threat
    const [newThreat] = await db
      .insert(threats)
      .values({
        description: validated.description,
        classification: validated.classification,
        status: validated.status,
        layer: validated.layer,
        likelihood: validated.likelihood,
        impact: validated.impact,
        userId,
      })
      .returning();

    // Create mitigations if provided
    if (validated.mitigations && validated.mitigations.length > 0) {
      await db.insert(mitigations).values(
        validated.mitigations.map((m) => ({
          threatId: newThreat.id,
          description: m.description,
          status: m.status,
        }))
      );
    }

    // Fetch the complete threat with mitigations
    const [completeThreat] = await db.query.threats.findMany({
      where: eq(threats.id, newThreat.id),
      with: {
        mitigations: true,
      },
      limit: 1,
    });

    return NextResponse.json(
      { threat: completeThreat },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating threat:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
