'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Bell, Info, Store, ShoppingBag } from 'lucide-react';

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
  return (
    <header className="mobile-top-bar">
      <div className="mobile-top-bar-content">
        {/* Left: Hamburger Menu Button */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="mobile-icon-btn hamburger-btn"
          aria-label="Ouvrir le menu"
        >
          <Menu size={26} color="#ffffff" />
        </button>

        {/* Center: Brand & User Greeting */}
        <div className="mobile-brand-info">
          <div className="mobile-brand-title">
            <img
              src="/logo.png"
              alt="Logo"
              width={26}
              height={26}
              style={{ borderRadius: '6px', objectFit: 'contain', marginRight: '6px', background: '#fff', padding: '1px' }}
            />
            <span>{storeName.toUpperCase()}</span>
            <Info size={14} className="info-icon" />
          </div>
          <div className="mobile-user-greeting">
            Bonjour, {userName}
          </div>
        </div>

        {/* Right: Actions (Caisse Rapide + Notifications Bell) */}
        <div className="mobile-top-actions">
          <Link href="/pos" className="mobile-quick-pos-btn" title="Caisse">
            <ShoppingBag size={18} color="#ffffff" />
          </Link>
          
          <Link href="/alerts" className="mobile-icon-btn notif-btn" aria-label="Alertes">
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
