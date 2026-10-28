import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/adminSession';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/db/supabase';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin authorization required to upload product images.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, WebP, GIF, and SVG images are permitted.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute safe extension
    const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    const rawExt = extMatch ? extMatch[1].toLowerCase() : 'png';
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(rawExt) ? rawExt : 'png';
    const uniqueFileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    // 1. Attempt Supabase Storage upload
    if (isSupabaseConfigured && (supabaseAdmin || supabase)) {
      try {
        const client = supabaseAdmin || supabase!;
        const storagePath = `catalog/${uniqueFileName}`;

        const { error: uploadError } = await client.storage
          .from('products')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = client.storage
            .from('products')
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicUrlData.publicUrl,
              filename: uniqueFileName,
              source: 'supabase_storage',
            });
          }
        }
      } catch {
        // Fall back to local uploads folder
      }
    }

    // 2. High-reliability fallback: save locally to public/uploads/products/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localFilePath = path.join(uploadDir, uniqueFileName);
    fs.writeFileSync(localFilePath, buffer);

    const publicUrl = `/uploads/products/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueFileName,
      source: 'local_storage',
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error processing image upload.' },
      { status: 500 }
    );
  }
}
