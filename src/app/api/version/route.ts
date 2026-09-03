import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    versionCode: 2,
    versionName: '1.1',
    apkUrl: '/zeynarmarket.apk',
    releaseDate: '2026-09-03',
    title: 'Mise à jour ZEYNARMARKET v1.1',
    features: [
      'Nouveau logo officiel ZMH transparent sur l’icône de l’application',
      'Mise à jour directe sans désinstaller l’ancienne application',
      'Conservation de toutes vos données locales et sessions de caisse',
    ],
  });
}
