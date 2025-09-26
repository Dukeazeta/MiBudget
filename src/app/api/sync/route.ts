import { NextResponse } from 'next/server';
import { atomicDb } from '@/lib/db';
import { SyncRequestSchema } from '@/lib';

// POST /api/sync
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const syncRequest = SyncRequestSchema.parse(body);
    const { since, push } = syncRequest;

    // 1. Apply pushed changes from the client and get conflicts
    const { serverTime: pushTime, conflicts } = await atomicDb.bulkSync(push);

    // 2. Get changes from the server since the client's last sync timestamp
    const pull = await atomicDb.getSyncData(since);

    // 3. Construct the response
    const response = {
      server_time: pushTime,
      pull,
      conflicts, // Include conflicts in the response
    };

    return NextResponse.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Invalid sync request data',
          details: error.errors,
        },
        { status: 422 }
      );
    }
    console.error('Error during sync:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Sync failed' },
      { status: 500 }
    );
  }
}
