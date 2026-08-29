'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  AlertTriangle,
  Receipt,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RecentOrder {
  id: string;
  totalTTC: number;
  cashierName: string;
  createdAt: Date | string;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
}

interface LiveActivityFeedProps {
  recentOrders?: RecentOrder[];
  lowStockItems?: LowStockItem[];
  todayRevenue?: number;
}

export default function LiveActivityFeed({
  recentOrders = [],
  lowStockItems = [],
  todayRevenue = 0,
}: LiveActivityFeedProps) {
  return (
    <div className="activity-feed-section">
      <div className="activity-feed-header d-flex align-items-center justify-content-between mb-2">
        <h3 className="activity-feed-title fs-6 fw-bold text-dark m-0">ActualitÃ©s & ActivitÃ©s en direct</h3>
        <span className="activity-feed-badge badge rounded-pill bg-success-subtle text-success border border-success-subtle fw-bold px-2 py-1">EN DIRECT</span>
      </div>

      <div className="activity-feed-list">
        {/* Item 1: Stock Alert (if any) */}
        {lowStockItems.length > 0 ? (
          <Link href="/alerts" className="activity-feed-card card-alert">
            <div className="activity-icon-wrap icon-alert">
              <AlertTriangle size={22} color="#DC2626" />
            </div>
            <div className="activity-card-content">
              <div className="activity-card-title">
                Attention : {lowStockItems.length} article(s) sous le seuil critique
              </div>
              <p className="activity-card-desc">
                {lowStockItems.slice(0, 2).map((item) => `${item.name} (${item.stock} restants)`).join(', ')}
                {lowStockItems.length > 2 ? ' et plus...' : ''}
              </p>
              <div className="activity-card-meta">
                <Clock size={12} />
                <span>Action recommandÃ©e : RÃ©approvisionner</span>
              </div>
            </div>
            <ChevronRight size={18} className="activity-card-chevron" />
          </Link>
        ) : (
          <div className="activity-feed-card card-success">
            <div className="activity-icon-wrap icon-success">
              <Sparkles size={22} color="#059669" />
            </div>
            <div className="activity-card-content">
              <div className="activity-card-title">Tous les stocks sont Ã  niveau</div>
              <p className="activity-card-desc">
                Aucune rupture critique dÃ©tectÃ©e dans vos rayons actuellement.
              </p>
            </div>
          </div>
        )}

        {/* Item 2: Sales Summary Card */}
        <Link href="/history" className="activity-feed-card">
          <div className="activity-icon-wrap icon-sales">
            <TrendingUp size={22} color="#00796B" />
          </div>
          <div className="activity-card-content">
            <div className="activity-card-title">
              Chiffre du jour : {todayRevenue.toLocaleString('fr-FR')} FCFA
            </div>
            <p className="activity-card-desc">
              {recentOrders.length} ticket(s) de caisse Ã©mis aujourd'hui.
            </p>
            <div className="activity-card-meta">
              <Clock size={12} />
              <span>Mis Ã  jour en temps rÃ©el</span>
            </div>
          </div>
          <ChevronRight size={18} className="activity-card-chevron" />
        </Link>

        {/* Item 3: Recent Orders list preview */}
        {recentOrders.slice(0, 3).map((order) => {
          const dateObj = new Date(order.createdAt);
          const timeStr = dateObj.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <Link
              key={order.id}
              href="/history"
              className="activity-feed-card"
            >
              <div className="activity-icon-wrap icon-receipt">
                <Receipt size={22} color="#2563EB" />
              </div>
              <div className="activity-card-content">
                <div className="activity-card-title">
                  Vente #{order.id.slice(0, 8).toUpperCase()} â€¢ {order.totalTTC.toLocaleString('fr-FR')} FCFA
                </div>
                <p className="activity-card-desc">
                  Caissier : {order.cashierName || 'Caisse Principale'}
                </p>
                <div className="activity-card-meta">
                  <Clock size={12} />
                  <span>Aujourd'hui Ã  {timeStr}</span>
                </div>
              </div>
              <ChevronRight size={18} className="activity-card-chevron" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
