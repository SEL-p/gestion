'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import MobileTopBar from './MobileTopBar';
import MobileDrawer from './MobileDrawer';
import Sidebar from './Sidebar';

interface ResponsiveNavigationProps {
  userRole?: string;
  storeName?: string;
  userName?: string;
}

export default function ResponsiveNavigation({
  userRole = 'admin',
  storeName = 'SUPERMARCHÉ ZEYNAR',
  userName = 'Admin',
}: ResponsiveNavigationProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const pathname = usePathname();

  // Fetch real-time low stock count
  useEffect(() => {
    fetch('/api/alerts/count')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.count === 'number') {
          setAlertsCount(data.count);
        }
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      {/* Mobile / Tablet Top Bar */}
      <MobileTopBar
        storeName={storeName}
        userName={userName}
        unreadAlertsCount={alertsCount}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      {/* Slide-out Mobile Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        storeName={storeName}
        userRole={userRole}
        alertsCount={alertsCount}
      />

      {/* Desktop Sidebar (visible on screens >= 1024px) */}
      <div className="desktop-sidebar-wrapper">
        <Sidebar userRole={userRole} storeName={storeName} />
      </div>
    </>
  );
}
