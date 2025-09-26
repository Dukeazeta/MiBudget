import { NextResponse } from 'next/server';
import { atomicDb } from '@/lib/db';
import { SettingsSchema } from '@/lib';

// GET /api/settings
export async function GET() {
  try {
    const settings = await atomicDb.getSettings();
    if (!settings) {
      // This case should ideally not happen if db.init() works correctly
      return NextResponse.json(
        { error: 'not_found', message: 'Settings not initialized' },
        { status: 404 }
      );
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const settingsData = SettingsSchema.partial().parse(body);
    const updatedSettings = await atomicDb.updateSettings(settingsData);
    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Invalid settings data',
          details: error.errors,
        },
        { status: 422 }
      );
    }
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
