import { NextResponse } from 'next/server';
import { atomicDb } from '@/lib/db';

export async function GET() {
  try {
    const health = await atomicDb.getHealth();
    return NextResponse.json(health);
  } catch (error) {
    // If the db isn't healthy, getHealth() might throw
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'database_connection_error',
        message: 'Failed to connect to the database.',
      },
      { status: 500 }
    );
  }
}
