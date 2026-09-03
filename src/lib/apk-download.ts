export const APK_DOWNLOAD_URL = 'https://github.com/SEL-p/gestion/raw/main/public/zeynarmarket.apk';
export const APK_DIRECT_URL = '/zeynarmarket.apk';

export function triggerApkDownload(e?: React.MouseEvent) {
  if (e) {
    e.preventDefault();
  }

  if (typeof window === 'undefined') return;

  // External host (github.com) triggers Capacitor Bridge's Intent.ACTION_VIEW,
  // opening the phone's native browser (Chrome/Samsung) which immediately downloads the APK!
  try {
    window.open(APK_DOWNLOAD_URL, '_system');
  } catch {
    // fallback
  }

  window.location.href = APK_DOWNLOAD_URL;
}
