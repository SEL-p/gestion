'use client';

import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, Smartphone } from 'lucide-react';
import { triggerApkDownload, APK_DOWNLOAD_URL } from '@/lib/apk-download';

function checkIsNative(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Check if cached in sessionStorage
    if (sessionStorage.getItem('is_native_apk') === 'true') return true;

    // 2. Check query param (?app=native or ?platform=android)
    if (window.location.search.includes('app=native') || window.location.search.includes('platform=android')) {
      sessionStorage.setItem('is_native_apk', 'true');
      return true;
    }

    // 3. Check Capacitor Native Platform
    const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } };
    if (win.Capacitor) {
      if (win.Capacitor.isNativePlatform?.() || win.Capacitor.getPlatform?.() === 'android') {
        sessionStorage.setItem('is_native_apk', 'true');
        return true;
      }
    }
    if (Capacitor.isNativePlatform()) {
      sessionStorage.setItem('is_native_apk', 'true');
      return true;
    }

    // 4. Check Android WebView User-Agent
    const ua = navigator.userAgent || '';
    if (/\bwv\b|Android.*Version\/[\d.]+/i.test(ua)) {
      sessionStorage.setItem('is_native_apk', 'true');
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function subscribe() {
  return () => {};
}

function useIsNative(): boolean {
  return useSyncExternalStore(subscribe, checkIsNative, () => false);
}

export function ApkHeaderDownloadButton() {
  const isNative = useIsNative();

  if (isNative) return null;

  return (
    <a
      href={APK_DOWNLOAD_URL}
      onClick={triggerApkDownload}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline-secondary"
      style={{
        padding: '0.85rem 1.35rem',
        fontSize: '0.95rem',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        borderRadius: '12px',
        border: '1px solid var(--slate-300)',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--slate-800)',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <Download size={19} style={{ color: '#00796B' }} />
      <span>Télécharger l&apos;APK</span>
    </a>
  );
}

export function ApkDesktopBanner() {
  const isNative = useIsNative();

  if (isNative) return null;

  return (
    <div
      className="apk-download-banner glass-card"
      style={{
        margin: '0 0 2rem 0',
        padding: '1.1rem 1.6rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(0, 121, 107, 0.08) 0%, rgba(0, 77, 64, 0.03) 100%)',
        border: '1px solid rgba(0, 121, 107, 0.22)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px -2px rgba(0, 77, 64, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '13px',
            backgroundColor: '#004D40',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(0, 77, 64, 0.25)',
            flexShrink: 0,
          }}
        >
          <Smartphone size={24} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--slate-900)' }}>
            Application Android ZEYNARMARKET disponible
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: '2px' }}>
            Installez l&apos;application native sur vos smartphones, tablettes ou terminaux de caisse Android.
          </div>
        </div>
      </div>
      <a
        href={APK_DOWNLOAD_URL}
        onClick={triggerApkDownload}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary"
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '0.92rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.55rem',
          backgroundColor: '#00796B',
          borderRadius: '12px',
          color: '#ffffff',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 15px rgba(0, 121, 107, 0.25)',
          transition: 'all 0.2s ease',
        }}
      >
        <Download size={18} />
        Télécharger l&apos;APK Android (4.1 Mo)
      </a>
    </div>
  );
}

export function ApkMobileBanner() {
  const isNative = useIsNative();

  if (isNative) return null;

  return (
    <div
      className="glass-card"
      style={{
        margin: '0.85rem 0',
        padding: '0.9rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        background: 'linear-gradient(135deg, rgba(0, 121, 107, 0.09) 0%, rgba(0, 77, 64, 0.04) 100%)',
        border: '1px solid rgba(0, 121, 107, 0.25)',
        borderRadius: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#004D40',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Smartphone size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-900)' }}>
            Application Android APK
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--slate-600)' }}>
            Caisse & Stocks tactile (4.1 Mo)
          </div>
        </div>
      </div>
      <a
        href={APK_DOWNLOAD_URL}
        onClick={triggerApkDownload}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm"
        style={{
          padding: '0.5rem 0.95rem',
          fontSize: '0.82rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: '#00796B',
          borderRadius: '8px',
          color: '#ffffff',
          fontWeight: 600,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <Download size={15} />
        Télécharger
      </a>
    </div>
  );
}
