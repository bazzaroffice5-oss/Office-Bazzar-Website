import { NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/db/store';
import { getAdminSession } from '@/lib/auth/adminSession';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error fetching categories' },
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
    const { name, description, parentId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    const category = await createCategory({
      name: name.trim(),
      description: description?.trim(),
      parentId: parentId || null,
    });

    return NextResponse.json({
      success: true,
      category,
      message: 'Category created successfully.',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error creating category' },
      { status: 500 }
    );
  }
}
