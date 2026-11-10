import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

// Allowed formats and limits
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES = 10;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files: File[] = [];

    // Extract all file entries from formData
    const photosEntries = formData.getAll('photos');
    const filesEntries = formData.getAll('files');
    const allEntries = [...photosEntries, ...filesEntries];

    for (const entry of allEntries) {
      if (entry instanceof File && entry.size > 0) {
        files.push(entry);
      }
    }

    if (files.length === 0) {
      formData.forEach((value) => {
        if (value instanceof File && value.size > 0 && !files.includes(value)) {
          files.push(value);
        }
      });
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No image files were provided for upload.' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `You can upload a maximum of ${MAX_FILES} photos per quote request.` },
        { status: 400 }
      );
    }

    // Validate all files before processing
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      const mime = file.type.toLowerCase();

      if (!ALLOWED_MIME_TYPES.has(mime) && !ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" is not a supported format. Please upload JPG, PNG, or WEBP images only.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        return NextResponse.json(
          {
            error: `File "${file.name}" is ${sizeMb} MB, which exceeds the 5 MB limit. Please select a smaller image.`,
          },
          { status: 400 }
        );
      }
    }

    const uploadedFiles: Array<{
      url: string;
      name: string;
      size: number;
      type: string;
    }> = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const rawBuffer = Buffer.from(bytes);

      // 1. Optimize & Compress image using Sharp to WebP (max 1200x1200px, quality 80)
      // This compresses phone photos down to ~30-70KB while preserving high visual fidelity
      const compressedBuffer = await sharp(rawBuffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // 2. Generate Persistent Base64 Data URI
      // Guaranteed to persist across Vercel serverless cold starts, deployments, and instances
      const persistentDataUri = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;

      // 3. Optional local disk cache (for local development & debugging)
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'quotations');
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }
        const ext = '.webp';
        const cleanName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9_-]/g, '-');
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const fileName = `quote-${cleanName.slice(0, 30)}-${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadsDir, fileName);
        await writeFile(filePath, compressedBuffer);
      } catch {
        // Read-only filesystem in cloud serverless environment (e.g. Vercel)
        // Persistent Data URI guarantees 100% data persistence without depending on ephemeral disk
      }

      uploadedFiles.push({
        url: persistentDataUri,
        name: file.name,
        size: compressedBuffer.length,
        type: 'image/webp',
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      urls: uploadedFiles.map((f) => f.url),
    });
  } catch (error: unknown) {
    console.error('[Photo Upload Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process photo upload. Please try again.' },
      { status: 500 }
    );
  }
}
