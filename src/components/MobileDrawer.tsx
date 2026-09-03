'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import { useTheme } from '@/components/ThemeProvider';
import { triggerApkDownload, APK_DOWNLOAD_URL } from '@/lib/apk-download';
import { getDeviceVersionState, LATEST_APP_VERSION } from '@/lib/version';
import {
  Home,
  ShoppingBag,
  DollarSign,
  Package,
  Tag,
  Users,
  ShoppingCart,
  Receipt,
  Settings,
  X,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Eye,
  Download,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  userRole?: string;
  alertsCount?: number;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  storeName = 'SUPERMARCHÉ ZEYNAR',
  userRole = 'admin',
  alertsCount = 0,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Close drawer automatically on route change
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <aside
        className="mobile-drawer-container animate-drawer-slide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Curved Header */}
        <div className="drawer-header">
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X size={22} color="#ffffff" />
          </button>

          <div className="drawer-header-content">
            <div className="drawer-logo-circle" style={{ overflow: 'hidden', padding: '4px', background: '#fff' }}>
              <img
                src="/logo.png"
                alt="Logo"
                width={56}
                height={56}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <h2 className="drawer-store-title">{storeName}</h2>
          </div>
        </div>

        {/* Drawer Menu Body */}
        <div className="drawer-body">
          {/* Section: Navigation */}
          <div className="drawer-section">
            <div className="drawer-section-title">Navigation</div>
            <Link
              href="/"
              className={`drawer-item ${pathname === '/' ? 'active' : ''}`}
            >
              <div className="drawer-icon-wrap icon-home">
                <Home size={18} />
              </div>
              <span className="drawer-item-label">Accueil</span>
              <ChevronRight size={16} className="drawer-chevron" />
            </Link>
          </div>

          {/* Section: Gestion Produits & Rayons */}
          <div className="drawer-section">
            <div className="drawer-section-title">Gestion Produits & Rayons</div>

            <Link
              href="/products"
              className={`drawer-item ${pathname === '/products' ? 'active' : ''}`}
            >
              <div className="drawer-icon-wrap icon-products">
                <ShoppingBag size={18} />
              </div>
              <span className="drawer-item-label">Rayons & Articles</span>
              <ChevronRight size={16} className="drawer-chevron" />
            </Link>

            <Link
              href="/prices"
              className={`drawer-item ${pathname === '/prices' ? 'active' : ''}`}
            >
              <div className="drawer-icon-wrap icon-prices">
                <DollarSign size={18} />
              </div>
              <span className="drawer-item-label">Gérer mes prix</span>
              <ChevronRight size={16} className="drawer-chevron" />
            </Link>

            <Link
              href="/alerts"
              className={`drawer-item ${pathname === '/alerts' ? 'active' : ''}`}
            >
              <div className="drawer-icon-wrap icon-stocks">
                <Package size={18} />
              </div>
              <span className="drawer-item-label">
                Gérer mes stocks
                {alertsCount > 0 && (
                  <span className="drawer-badge-danger">{alertsCount}</span>
                )}
              </span>
              <ChevronRight size={16} className="drawer-chevron" />
            </Link>

            <Link
              href="/categories"
              className={`drawer-item ${pathname === '/categories' ? 'active' : ''}`}
            >
              <div className="drawer-icon-wrap icon-promos">
                <Tag size={18} />
              </div>
              <span className="drawer-item-label">
                Catégories & Promotions <span className="tag-badge">🛡️</span>
              </span>
              <ChevronRight size={16} className="drawer-chevron" />
            </Link>

            <Link
              href="/customers"
              className={`drawer-item ${pathname === '/customers' ? 'active' : ''}`}
            >
              <div className="drawer-icon-wrap icon-customers">
                <Users size={18} />
              </div>
              <span className="drawer-item-label">Clients & Fidélité</span>
              <ChevronRight size={16} className="drawer-chevron" />
            </Link>
          </div>

          {/* Section: Gestion des Ventes */}
          <div className="drawer-section">
            <div className="drawer-section-title">Gestion des Ventes</div>

            {/* Highlighted New Sale Button */}
            <Link
              href="/pos"
              className="drawer-item-highlighted"
            >
              <div className="drawer-icon-wrap icon-cart-orange">
                <ShoppingCart size={20} color="#ffffff" />
              </div>
              <div className="drawer-highlight-text">
                <span className="drawer-item-label font-bold">Nouvelle vente</span>
                <span className="drawer-item-sub">Caisse tactile rapide</span>
              </div>
              <ChevronRight size={18} className="drawer-chevron-orange" />
            </Link>

            <Link
              href="/history"
              className={`drawer-item ${pathname === '/history' ? 'active' : ''}`}
            >
              <div className="drawer-icon-wrap icon-history">
                <Receipt size={18} />
              </div>
              <span className="drawer-item-label">État des factures & Tickets</span>
              <ChevronRight size={16} className="drawer-chevron" />
            </Link>

            {userRole === 'admin' && (
              <>
                <Link
                  href="/users"
                  className={`drawer-item ${pathname === '/users' ? 'active' : ''}`}
                >
                  <div className="drawer-icon-wrap icon-users">
                    <Users size={18} />
                  </div>
                  <span className="drawer-item-label">Caissiers & Sessions</span>
                  <ChevronRight size={16} className="drawer-chevron" />
                </Link>

                <Link
                  href="/settings"
                  className={`drawer-item ${pathname === '/settings' ? 'active' : ''}`}
                >
                  <div className="drawer-icon-wrap icon-settings">
                    <Settings size={18} />
                  </div>
                  <span className="drawer-item-label">Paramètres du Magasin</span>
                  <ChevronRight size={16} className="drawer-chevron" />
                </Link>
              </>
            )}

            {/* Section: Mise à jour & Version APK */}
            <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--slate-200)' }}>
              <a
                href={APK_DOWNLOAD_URL}
                onClick={triggerApkDownload}
                className="drawer-item"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 121, 107, 0.08) 0%, rgba(0, 77, 64, 0.03) 100%)',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 121, 107, 0.2)',
                }}
              >
                <div className="drawer-icon-wrap" style={{ backgroundColor: '#004D40', color: '#fff' }}>
                  <CheckCircle2 size={17} color="#4ADE80" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <span className="drawer-item-label font-bold" style={{ color: '#004D40', fontSize: '0.88rem' }}>
                    Application v{LATEST_APP_VERSION.versionName}
                  </span>
                  <span className="drawer-item-sub" style={{ fontSize: '0.72rem', color: 'var(--slate-600)' }}>
                    Application installée et à jour
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', backgroundColor: '#10B981', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                  À jour
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <div className="drawer-theme-toggle">
            <button
              type="button"
              onClick={() => {
                if (theme === 'system') setTheme('light');
                else if (theme === 'light') setTheme('dark');
                else if (theme === 'dark') setTheme('high-contrast');
                else setTheme('system');
              }}
              className="drawer-btn-theme"
            >
              {theme === 'system' && <><Sparkles size={16} color="#00796B" /> Auto (OS)</>}
              {theme === 'light' && <><Sun size={16} /> Mode Clair</>}
              {theme === 'dark' && <><Moon size={16} /> Mode Sombre</>}
              {theme === 'high-contrast' && <><Eye size={16} /> Contraste</>}
            </button>
            
            <button
              type="button"
              onClick={() => logout()}
              className="drawer-btn-logout"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="drawer-version-pill">
            Version {LATEST_APP_VERSION.versionName}
          </div>
        </div>
      </aside>
    </div>
  );
}
