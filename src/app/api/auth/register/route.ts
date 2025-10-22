import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  role: z.enum(['Admin', 'Analyst']).default('Analyst'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role } = registerSchema.parse(body);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        passwordHash,
        role,
      })
      .returning();

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
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
