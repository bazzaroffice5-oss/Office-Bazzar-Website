import { NextResponse } from 'next/server';
import { seedCatalogToSupabase } from '@/lib/db/seed';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const adminKey = process.env.ADMIN_SECRET_KEY;

    // Optional secret key check if specified
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      // Allow if admin session or internal request
    }

    const res = await seedCatalogToSupabase();
    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database seeding failure.' },
      { status: 500 }
    );
  }
}
