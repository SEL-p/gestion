'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, ArrowRight } from 'lucide-react';
import { triggerApkDownload, APK_DOWNLOAD_URL } from '@/lib/apk-download';
import { getDeviceVersionState, LATEST_APP_VERSION } from '@/lib/version';

export default function AppUpdateBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const isDismissed = localStorage.getItem(`dismissed_update_${LATEST_APP_VERSION.versionCode}`) === 'true';
      if (isDismissed) {
        setDismissed(true);
        return;
      }
      const state = getDeviceVersionState();
      setDismissed(!state.hasUpdateAvailable);
    } catch {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`dismissed_update_${LATEST_APP_VERSION.versionCode}`, 'true');
      }
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  if (dismissed) return null;

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
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={handleDismiss}
    >
      <section
        style={{
          position: 'relative',
          width: 'min(100%, 480px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.6rem',
          borderRadius: '22px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer (×) en haut à droite */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '1.1rem',
            right: '1.1rem',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
            transition: 'background 0.2s',
          }}
          aria-label="Fermer la notification de mise à jour"
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: '48px',
            height: '48px',
            marginBottom: '1rem',
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
          }}
        >
          <Download size={24} />
        </div>

        <h1 id="required-app-update-title" style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800 }}>
          Mise à jour Supermarché v{LATEST_APP_VERSION.versionName}
        </h1>

        <p style={{ margin: '0 0 1rem', color: '#475569', fontSize: '0.9rem', lineHeight: 1.55 }}>
          Cette nouvelle version active la prise en charge de tous les rayons de votre supermarché (Alimentaire, Épicerie, Boissons, Frais, Hygiène, Entretien) avec calcul instantané du prix de gros au détail et des marges.
        </p>

        <ol style={{ margin: '0 0 1.25rem', paddingLeft: '1.25rem', color: '#334155', fontSize: '0.85rem', lineHeight: 1.6 }}>
          <li>Téléchargez la nouvelle version pour votre terminal ou smartphone.</li>
          <li>Installez le fichier pour accéder aux nouveaux rayons et fonctionnalités.</li>
          <li>Tous vos produits, stocks et ventes restent synchronisés en toute sécurité.</li>
        </ol>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <a
            href={APK_DOWNLOAD_URL}
            onClick={(e) => {
              triggerApkDownload(e);
              handleDismiss();
            }}
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#004D40',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0, 77, 64, 0.3)',
            }}
          >
            <Download size={18} />
            Télécharger la version {LATEST_APP_VERSION.versionName}
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            style={{
              width: '100%',
              minHeight: '42px',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <span>Continuer vers l&apos;application</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
