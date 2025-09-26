import { NextResponse } from 'next/server';
import { atomicDb } from '@/lib/db';

// GET /api/goals
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get('since') || 0);

  try {
    const { goals } = await atomicDb.getSyncData(since);
    // Filter out deleted items
    const activeGoals = goals.filter(g => !g.deleted);
    return NextResponse.json(activeGoals);
  } catch (error) {
    console.error('Error getting goals:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Failed to get goals' },
      { status: 500 }
    );
  }
}
