export interface AppVersionInfo {
  versionName: string;
  versionCode: number; // Compteur officiel du nombre de mises à jour effectuées
  releaseDate: string;
  releaseNotes: string;
  apkDownloadUrl: string;
}

// Source unique de vérité pour la version de l'application
export const LATEST_APP_VERSION: AppVersionInfo = {
  versionName: '1.1',
  versionCode: 2, // Mise à jour #2 (Version 1.1 avec logo officiel ZMH transparent)
  releaseDate: '03/09/2026',
  releaseNotes: 'Logo officiel ZMH avec fond transparent et icône Android officielle.',
  apkDownloadUrl: '/api/download/apk',
};

export interface DeviceVersionState {
  isNativeApp: boolean;
  installedVersionName: string;
  installedVersionCode: number;
  hasUpdateAvailable: boolean;
}

export function getDeviceVersionState(): DeviceVersionState {
  if (typeof window === 'undefined') {
    return {
      isNativeApp: false,
      installedVersionName: LATEST_APP_VERSION.versionName,
      installedVersionCode: LATEST_APP_VERSION.versionCode,
      hasUpdateAvailable: false,
    };
  }

  const ua = navigator.userAgent || '';

  // 1. Détection par l'User-Agent Android personnalisé
  // ex: "ZeynarmarketApp/1.1 (Build/2)"
  const match = ua.match(/ZeynarmarketApp\/([0-9.]+)\s*\(Build\/(\d+)\)/i);
  if (match) {
    const installedVersionName = match[1];
    const installedVersionCode = parseInt(match[2], 10);
    return {
      isNativeApp: true,
      installedVersionName,
      installedVersionCode,
      hasUpdateAvailable: installedVersionCode < LATEST_APP_VERSION.versionCode,
    };
  }

  // 2. Détection par environnement natif Capacitor / WebView Android
  const isNative =
    typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform === 'function' &&
    (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform();

  const isNativeWebView =
    isNative ||
    window.location.search.includes('app=native') ||
    sessionStorage.getItem('is_native_apk') === 'true' ||
    /\bwv\b|Android.*Version\/[\d.]+/i.test(ua);

  if (isNativeWebView) {
    // Si l'utilisateur est dans l'APK mais sans l'UA enrichi (ex: première installation ou transition)
    const storedCode = parseInt(localStorage.getItem('zeynarmarket_installed_version_code') || '0', 10);
    const effectiveCode = storedCode > 0 ? storedCode : 2; // Si mise à jour v1.1 effectuée, code = 2

    return {
      isNativeApp: true,
      installedVersionName: effectiveCode >= 2 ? '1.1' : '1.0',
      installedVersionCode: effectiveCode,
      hasUpdateAvailable: effectiveCode < LATEST_APP_VERSION.versionCode,
    };
  }

  // 3. Navigateur Web Desktop / Mobile : toujours à jour avec le serveur
  return {
    isNativeApp: false,
    installedVersionName: LATEST_APP_VERSION.versionName,
    installedVersionCode: LATEST_APP_VERSION.versionCode,
    hasUpdateAvailable: false,
  };
}

export function markUpdateInstalled(versionCode: number = LATEST_APP_VERSION.versionCode) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('zeynarmarket_installed_version_code', versionCode.toString());
      sessionStorage.setItem('zeynarmarket_update_dismissed', 'true');
    } catch {
      // ignore
    }
  }
}
