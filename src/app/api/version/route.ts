import { NextResponse } from 'next/server';
import { LATEST_APP_VERSION } from '@/lib/version';

export async function GET() {
  return NextResponse.json({
    versionCode: LATEST_APP_VERSION.versionCode,
    versionName: LATEST_APP_VERSION.versionName,
    releaseDate: LATEST_APP_VERSION.releaseDate,
    releaseNotes: LATEST_APP_VERSION.releaseNotes,
    apkUrl: LATEST_APP_VERSION.apkDownloadUrl,
  });
}
