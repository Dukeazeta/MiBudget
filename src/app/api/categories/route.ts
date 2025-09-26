import { NextResponse } from 'next/server';
import { atomicDb } from '@/lib/db';

// GET /api/categories
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get('since') || 0);

  try {
    const { categories } = await atomicDb.getSyncData(since);
    // Filter out deleted items
    const activeCategories = categories.filter(c => !c.deleted);
    return NextResponse.json(activeCategories);
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Failed to get categories' },
      { status: 500 }
    );
  }
}
