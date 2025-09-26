import { NextResponse } from 'next/server';
import { atomicDb } from '@/lib/db';

// GET /api/transactions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const filters: Parameters<typeof atomicDb.getTransactions>[0] = {};
  
  const since = searchParams.get('since');
  if (since) filters.since = Number(since);

  const category_id = searchParams.get('category_id');
  if (category_id) filters.category_id = category_id;

  const goal_id = searchParams.get('goal_id');
  if (goal_id) filters.goal_id = goal_id;

  const from = searchParams.get('from');
  if (from) filters.from = from;

  const to = searchParams.get('to');
  if (to) filters.to = to;

  try {
    const transactions = await atomicDb.getTransactions(filters);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Failed to get transactions' },
      { status: 500 }
    );
  }
}
