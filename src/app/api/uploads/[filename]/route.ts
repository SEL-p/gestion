import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!/^[A-Za-z0-9._-]+\.webp$/i.test(filename) || filename.includes('..')) {
    return new NextResponse('Image introuvable', { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

  try {
    const image = await readFile(filePath);
    return new NextResponse(image, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new NextResponse('Image introuvable', { status: 404 });
    }

    console.error('Impossible de lire une image produit :', error);
    return new NextResponse('Impossible de lire cette image', { status: 500 });
  }
}
