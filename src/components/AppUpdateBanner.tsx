'use client';

import { useState, useSyncExternalStore } from 'react';
import { Download, Sparkles, X } from 'lucide-react';
import { triggerApkDownload, APK_DOWNLOAD_URL } from '@/lib/apk-download';

function subscribe() {
  return () => {};
}

function getIsDismissed() {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem('zeynarmarket_update_v1_1_dismissed') === 'true';
  } catch {
    return false;
  }
}

export default function AppUpdateBanner() {
  const isDismissedStored = useSyncExternalStore(subscribe, getIsDismissed, () => false);
  const [dismissedLocally, setDismissedLocally] = useState(false);

  if (isDismissedStored || dismissedLocally) return null;

  const handleDismiss = () => {
    setDismissedLocally(true);
    try {
      sessionStorage.setItem('zeynarmarket_update_v1_1_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        margin: '0 0 1.25rem 0',
        padding: '0.9rem 1.2rem',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(0, 77, 64, 0.95) 0%, rgba(0, 121, 107, 0.95) 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 4px 20px rgba(0, 77, 64, 0.2)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '240px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={20} color="#FFD54F" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Mise à jour APK disponible (v1.1)</span>
            <span
              style={{
                fontSize: '0.7rem',
                backgroundColor: 'rgba(255, 213, 79, 0.25)',
                color: '#FFE082',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Logo ZMH inclus
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', opacity: 0.92, marginTop: '2px' }}>
            Installez cette mise à jour par-dessus votre ancienne application sans la désinstaller. Vos données sont conservées.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <a
          href={APK_DOWNLOAD_URL}
          onClick={triggerApkDownload}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{
            backgroundColor: '#ffffff',
            color: '#004D40',
            fontWeight: 700,
            fontSize: '0.86rem',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
          }}
        >
          <Download size={16} />
          Mettre à jour (v1.1)
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
