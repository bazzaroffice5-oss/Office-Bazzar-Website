import { NextResponse } from 'next/server';
import { getBrands, createBrand } from '@/lib/db/store';
import { getAdminSession } from '@/lib/auth/adminSession';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brands = await getBrands();
    return NextResponse.json({ success: true, brands });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error fetching brands' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, logoUrl } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Brand name is required.' }, { status: 400 });
    }

    const brand = await createBrand({
      name: name.trim(),
      description: description?.trim(),
      logoUrl: logoUrl?.trim(),
    });

    return NextResponse.json({
      success: true,
      brand,
      message: 'Brand created successfully.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error creating brand' },
      { status: 500 }
    );
  }
}
