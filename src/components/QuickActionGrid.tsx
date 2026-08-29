'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Package, ShoppingCart, Receipt } from 'lucide-react';

interface QuickActionGridProps {
  alertsCount?: number;
}

export default function QuickActionGrid({ alertsCount = 0 }: QuickActionGridProps) {
  const actions = [
    {
      id: 'products',
      label: 'Rayons',
      sublabel: 'Articles',
      href: '/products',
      icon: <ShoppingBag size={26} color="#7C3AED" />,
      bgColor: '#F5F3FF',
      borderColor: '#DDD6FE',
    },
    {
      id: 'stock',
      label: 'Stock',
      sublabel: 'Inventaire',
      href: '/alerts',
      icon: <Package size={26} color="#059669" />,
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      badge: alertsCount > 0 ? alertsCount : null,
    },
    {
      id: 'pos',
      label: 'Vente',
      sublabel: 'Caisse',
      href: '/pos',
      icon: <ShoppingCart size={26} color="#EA580C" />,
      bgColor: '#FFF7ED',
      borderColor: '#FED7AA',
      isPrimary: true,
    },
    {
      id: 'history',
      label: 'Facture',
      sublabel: 'Tickets',
      href: '/history',
      icon: <Receipt size={26} color="#0284C7" />,
      bgColor: '#F0F9FF',
      borderColor: '#BAE6FD',
    },
  ];

  return (
    <div className="quick-action-grid">
      {actions.map((act) => (
        <Link
          key={act.id}
          href={act.href}
          className={`quick-action-card ${act.isPrimary ? 'quick-action-primary' : ''}`}
          style={{
            backgroundColor: act.bgColor,
            borderColor: act.borderColor,
          }}
        >
          <div className="quick-action-icon-wrap">
            {act.icon}
            {act.badge && <span className="quick-action-badge">{act.badge}</span>}
          </div>
          <span className="quick-action-label">{act.label}</span>
          <span className="quick-action-sublabel">{act.sublabel}</span>
        </Link>
      ))}
    </div>
  );
}
