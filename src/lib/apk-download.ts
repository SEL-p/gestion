// Téléchargement direct depuis le domaine officiel zeynamarket.store (sans redirection GitHub)
export const APK_DOWNLOAD_URL = '/api/download/apk';

export function triggerApkDownload(e?: React.MouseEvent) {
  if (e) {
    e.preventDefault();
  }

  if (typeof window === 'undefined') return;

  const fullUrl = `${window.location.origin}${APK_DOWNLOAD_URL}`;

  // Déclencher le téléchargement direct
  try {
    window.open(fullUrl, '_system');
  } catch {
    // fallback
  }

  window.location.href = fullUrl;
}
