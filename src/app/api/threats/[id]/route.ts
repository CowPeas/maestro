import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { threats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
  classification: z.enum(['High', 'Medium', 'Low']).optional(),
  description: z.string().optional(),
});

// PATCH /api/threats/[id] - Update threat
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const threatId = parseInt(params.id);
    if (isNaN(threatId)) {
      return NextResponse.json(
        { error: 'Invalid threat ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates = updateSchema.parse(body);

    const userId = parseInt(session.user.id);

    // Verify threat belongs to user
    const [existingThreat] = await db
      .select()
      .from(threats)
      .where(and(eq(threats.id, threatId), eq(threats.userId, userId)))
      .limit(1);

    if (!existingThreat) {
      return NextResponse.json(
        { error: 'Threat not found or access denied' },
        { status: 404 }
      );
    }

    // Update threat
    const [updatedThreat] = await db
      .update(threats)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(threats.id, threatId))
      .returning();

    // Fetch complete threat with mitigations
    const [completeThreat] = await db.query.threats.findMany({
      where: eq(threats.id, threatId),
      with: {
        mitigations: true,
      },
      limit: 1,
    });

    return NextResponse.json({ threat: completeThreat });
  } catch (error) {
    console.error('Error updating threat:', error);
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

// DELETE /api/threats/[id] - Delete threat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const threatId = parseInt(params.id);
    if (isNaN(threatId)) {
      return NextResponse.json(
        { error: 'Invalid threat ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Verify threat belongs to user and delete
    const result = await db
      .delete(threats)
      .where(and(eq(threats.id, threatId), eq(threats.userId, userId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Threat not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Threat deleted successfully' });
  } catch (error) {
    console.error('Error deleting threat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
