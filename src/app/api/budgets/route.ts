import { NextResponse } from 'next/server';
import { atomicDb } from '@/lib/db';

// GET /api/budgets
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get('since') || 0);

  try {
    const { budgets } = await atomicDb.getSyncData(since);
    // Filter out deleted items
    const activeBudgets = budgets.filter(b => !b.deleted);
    return NextResponse.json(activeBudgets);
  } catch (error) {
    console.error('Error getting budgets:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Failed to get budgets' },
      { status: 500 }
    );
  }
}
