'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, Info } from 'lucide-react';

interface MobileTopBarProps {
  storeName?: string;
  userName?: string;
  unreadAlertsCount?: number;
  onOpenDrawer: () => void;
}

export default function MobileTopBar({
  storeName = 'SUPERMARCHÉ ZEYNAR',
  userName = 'Admin',
  unreadAlertsCount = 0,
  onOpenDrawer,
}: MobileTopBarProps) {
  const pathname = usePathname();
  const isNewProduct = pathname === '/products/new';
  const isProductsPage = pathname === '/products' || pathname === '/products/list';
  const isPricesPage = pathname === '/prices';
  const isPosPage = pathname === '/pos';

  if (isProductsPage || isPricesPage || isPosPage) {
    return null;
  }

  if (isNewProduct) {
    return (
      <header className="mobile-top-bar mobile-top-bar-new-product">
        <div className="mobile-top-bar-content new-product-header-content">
          <button
            type="button"
            onClick={onOpenDrawer}
            className="mobile-icon-btn hamburger-btn"
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} color="#ffffff" />
          </button>

          <h1 className="new-product-header-title">Ajouter un produit</h1>

          <Link href="/products" className="new-product-header-cancel">
            Annuler
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="mobile-top-bar">
      <div className="mobile-top-bar-content">
        {/* Left: Hamburger Menu Button + Store Name & Greeting */}
        <div className="mobile-top-bar-left">
          <button
            type="button"
            onClick={onOpenDrawer}
            className="mobile-icon-btn hamburger-btn"
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} color="#ffffff" />
          </button>

          <div className="mobile-brand-info">
            <div className="mobile-brand-title">
              <span>{storeName.toUpperCase()}</span>
              <Info size={15} className="info-icon" />
            </div>
            <div className="mobile-user-greeting">
              Bonjour, {userName}
            </div>
          </div>
        </div>

        {/* Right: Notifications Bell with Alert Badge */}
        <div className="mobile-top-actions">
          <Link href="/alerts" className="mobile-icon-btn notif-btn" aria-label="Alertes" title="Alertes de stock">
            <Bell size={22} color="#ffffff" />
            {unreadAlertsCount > 0 && (
              <span className="notif-badge">{unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
