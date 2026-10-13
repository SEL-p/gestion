'use client';

import { useSyncExternalStore } from 'react';
import { Download } from 'lucide-react';
import { triggerApkDownload, APK_DOWNLOAD_URL } from '@/lib/apk-download';
import { getDeviceVersionState, LATEST_APP_VERSION } from '@/lib/version';

function subscribe() {
  return () => {};
}

function mustInstallUpdate() {
  if (typeof window === 'undefined') return false;
  const state = getDeviceVersionState();
  return state.isNativeApp && state.hasUpdateAvailable;
}

export default function AppUpdateBanner() {
  const updateRequired = useSyncExternalStore(subscribe, mustInstallUpdate, () => false);

  if (!updateRequired) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="required-app-update-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'grid',
        placeItems: 'center',
        overflowY: 'auto',
        padding: '1rem',
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
      }}
    >
      <section
        style={{
          width: 'min(100%, 520px)',
          maxHeight: '100%',
          overflowY: 'auto',
          padding: '1.5rem',
          borderRadius: '18px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            marginBottom: '1rem',
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: '#fff3cd',
            color: '#8a5a00',
          }}
        >
          <Download size={24} />
        </div>
        <h1 id="required-app-update-title" style={{ margin: '0 0 0.65rem', fontSize: '1.35rem' }}>
          Mise à jour obligatoire
        </h1>
        <p style={{ margin: '0 0 1rem', color: '#475569', lineHeight: 1.55 }}>
          Cette version de l’application n’est plus prise en charge. Installez la version {LATEST_APP_VERSION.versionName}
          pour continuer à utiliser ZEYNARMARKET.
        </p>
        <ol style={{ margin: '0 0 1.25rem', paddingLeft: '1.35rem', color: '#334155', lineHeight: 1.6 }}>
          <li>Téléchargez le nouvel APK.</li>
          <li>Désinstallez l’ancienne application, puis ouvrez le fichier téléchargé pour installer la mise à jour.</li>
          <li>Vos produits et ventes restent enregistrés sur le serveur.</li>
        </ol>
        <a
          href={APK_DOWNLOAD_URL}
          onClick={triggerApkDownload}
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backgroundColor: '#00796b',
            color: '#ffffff',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <Download size={18} />
          Télécharger la version {LATEST_APP_VERSION.versionName}
        </a>
      </section>
    </div>
  );
}
