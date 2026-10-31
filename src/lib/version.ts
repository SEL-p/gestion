export interface AppVersionInfo {
  versionName: string;
  versionCode: number; // Compteur officiel du nombre de mises à jour effectuées
  releaseDate: string;
  releaseNotes: string;
  requiresUninstall: boolean;
  apkDownloadUrl: string;
}

// Source unique de vérité pour la version de l'application
export const LATEST_APP_VERSION: AppVersionInfo = {
  versionName: '1.5',
  versionCode: 6, // Mise à jour #6 : Supermarché Tout-en-Un & Gestion de tous les rayons
  releaseDate: '24/10/2026',
  releaseNotes:
    'Mise à jour Supermarché ZEYNARMARKET : Prise en charge intégrale de tous vos rayons (Alimentaire, Épicerie, Boissons, Frais, Hygiène, Entretien), ajout rapide avec conversion automatique prix gros / détail et suivi des marges en temps réel.',
  requiresUninstall: false,
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
    /\bwv\b|Android.*Version\/[\d.]+/i.test(ua);

  if (isNativeWebView) {
    return {
      isNativeApp: true,
      installedVersionName: 'inconnue',
      installedVersionCode: 0,
      hasUpdateAvailable: true,
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
