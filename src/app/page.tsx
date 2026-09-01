import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Package,
  TrendingUp,
  Users,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Activity,
  DollarSign,
  Box,
  Store,
  Download,
  Smartphone,
} from 'lucide-react';
import MobileBannerCarousel from '@/components/MobileBannerCarousel';
import QuickActionGrid from '@/components/QuickActionGrid';
import MobileInfoAlert from '@/components/MobileInfoAlert';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import {
  ApkHeaderDownloadButton,
  ApkDesktopBanner,
  ApkMobileBanner,
} from '@/components/ApkDownloadLinks';

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayOrders: any[] = [];
  let todayReturns: any[] = [];
  let todayRevenue = 0;
  let todayReturnsTotal = 0;
  let todayReturnsQty = 0;
  let customersCount = 0;
  let lowStockItems: any[] = [];
  let lowStockCount = 0;
  let topProductDetails: any[] = [];

  try {
    // Stats du jour
    todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' },
    });

    todayReturns = await prisma.return.findMany({
      where: { createdAt: { gte: today } },
    });

    todayReturnsTotal = todayReturns.reduce((sum, r) => sum + r.amountTTC, 0);
    todayReturnsQty = todayReturns.reduce((sum, r) => sum + r.quantity, 0);
    todayRevenue =
      todayOrders.reduce((sum, order) => sum + order.totalTTC, 0) - todayReturnsTotal;

    // Clients totaux
    customersCount = await prisma.customer.count();

    // Produits en rupture
    const allProducts = await prisma.product.findMany({
      select: { id: true, name: true, stock: true, minStock: true },
    });
    lowStockItems = allProducts.filter((p) => p.stock <= p.minStock);
    lowStockCount = lowStockItems.length;

    // Top 5 produits
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, priceTTC: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    topProductDetails = await Promise.all(
      topProducts.map(async (tp) => {
        const p = await prisma.product.findUnique({ where: { id: tp.productId } });
        return {
          ...p,
          soldQty: tp._sum.quantity || 0,
          revenue: tp._sum.priceTTC || 0,
        };
      })
    );
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
  }

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Mobile / Tablet View Experience */}
      <div className="mobile-dashboard-layout">
        {/* 1. Top Carousel Promotional Banners */}
        <MobileBannerCarousel />

        {/* 2. Quick Action Grid (Rayons, Stock, Vente, Facture) */}
        <QuickActionGrid alertsCount={lowStockCount} />

        {/* 3. Contextual Help / Status Banner */}
        <MobileInfoAlert
          message="Pour commencer une transaction, appuyez sur 'Vente' puis scannez ou choisissez vos articles."
          actionText="Ouvrir la Caisse"
          actionHref="/pos"
        />

        {/* Mobile APK Download Banner (Hidden inside native APK) */}
        <ApkMobileBanner />

        {/* 4. Live Activity Feed */}
        <LiveActivityFeed
          recentOrders={todayOrders}
          lowStockItems={lowStockItems}
          todayRevenue={todayRevenue}
        />
      </div>

      {/* Desktop Analytics View (Optimized for larger screens) */}
      <div className="desktop-analytics-layout">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Tableau de bord Supermarché
            </h1>
            <p className="dashboard-subtitle">
              Gestion des rayons, encaissements et stocks en temps réel.
            </p>
          </div>
          <div className="dashboard-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <ApkHeaderDownloadButton />
            <Link
              href="/pos"
              className="btn btn-primary btn-lg"
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '1rem',
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'center',
                backgroundColor: '#00796B',
                boxShadow: '0 10px 25px -5px rgba(0, 121, 107, 0.4)',
                borderRadius: '12px',
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              <ShoppingBag size={20} />
              Accéder à la Caisse
            </Link>
          </div>
        </header>

        {/* APK Download & Mobile App Info Banner (Hidden inside native APK) */}
        <ApkDesktopBanner />

        {/* KPI Cards */}
        <div className="grid grid-cols-4 kpi-grid">
          <div className="glass-card kpi-card kpi-revenue">
            <div className="kpi-top">
              <div className="kpi-label">Chiffre d'Affaires</div>
              <div className="kpi-icon-wrap icon-green">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="kpi-value">
              {todayRevenue.toLocaleString('fr-FR')}{' '}
              <span className="kpi-currency">FCFA</span>
            </div>
            <div className="kpi-footer">
              <TrendingUp size={14} color="var(--success-color)" /> Aujourd'hui
              {todayReturnsTotal > 0 && (
                <span className="text-danger">
                  (-{todayReturnsTotal.toLocaleString('fr-FR')} FCFA retours)
                </span>
              )}
            </div>
          </div>

          <div className="glass-card kpi-card kpi-orders">
            <div className="kpi-top">
              <div className="kpi-label">Tickets de Caisse</div>
              <div className="kpi-icon-wrap icon-blue">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="kpi-value">{todayOrders.length}</div>
            <div className="kpi-footer">Émis aujourd'hui</div>
          </div>

          <div className="glass-card kpi-card kpi-returns">
            <div className="kpi-top">
              <div className="kpi-label">Remboursements</div>
              <div className="kpi-icon-wrap icon-red">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="kpi-value">
              {todayReturnsTotal.toLocaleString('fr-FR')}{' '}
              <span className="kpi-currency">FCFA</span>
            </div>
            <div className="kpi-footer text-danger">
              {todayReturnsQty} article(s) retourné(s)
            </div>
          </div>

          <div className="glass-card kpi-card kpi-stocks">
            <div className="kpi-top">
              <div className="kpi-label">Ruptures de Stock</div>
              <div className="kpi-icon-wrap icon-orange">
                <Box size={20} />
              </div>
            </div>
            <div className="kpi-value">{lowStockCount}</div>
            <div className="kpi-footer text-warning">
              <Activity size={14} /> Attention requise
            </div>
          </div>
        </div>

        {/* Detailed Analytics Grid */}
        <div className="grid grid-cols-2 analytics-grid">
          {/* Top Products Table */}
          <div className="glass-card analytics-card">
            <div className="analytics-card-header">
              <h3 className="analytics-card-title">Meilleures Ventes Rayons</h3>
              <span className="badge badge-primary">Historique</span>
            </div>

            <div className="table-responsive">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Article</th>
                    <th style={{ textAlign: 'center' }}>Quantité</th>
                    <th style={{ textAlign: 'right' }}>Revenus</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductDetails.map((tp, i) => (
                    <tr key={i}>
                      <td>
                        <div className="product-cell-name">{tp.name}</div>
                        <div className="product-cell-sku">SKU: {tp.sku}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="qty-badge">{tp.soldQty}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#00796B' }}>
                        {tp.revenue?.toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  ))}
                  {topProductDetails.length === 0 && (
                    <tr>
                      <td colSpan={3} className="empty-table-cell">
                        <Box size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                        Aucune vente enregistrée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-card analytics-card">
            <div className="analytics-card-header">
              <h3 className="analytics-card-title">Raccourcis Gestion</h3>
            </div>

            <div className="shortcuts-list">
              <Link href="/products" className="shortcut-card">
                <div className="shortcut-icon icon-purple">
                  <Package size={20} />
                </div>
                <div className="shortcut-info">
                  <div className="shortcut-title">Gestion des Rayons & Prix</div>
                  <div className="shortcut-desc">Ajouter ou modifier des articles</div>
                </div>
                <ArrowRight size={18} className="shortcut-arrow" />
              </Link>

              <Link href="/history" className="shortcut-card">
                <div className="shortcut-icon icon-teal">
                  <Activity size={20} />
                </div>
                <div className="shortcut-info">
                  <div className="shortcut-title">Historique des Tickets</div>
                  <div className="shortcut-desc">Consulter les encaissements & retours</div>
                </div>
                <ArrowRight size={18} className="shortcut-arrow" />
              </Link>

              <Link href="/customers" className="shortcut-card">
                <div className="shortcut-icon icon-amber">
                  <Users size={20} />
                </div>
                <div className="shortcut-info">
                  <div className="shortcut-title">Clients & Ardoises / Dettes</div>
                  <div className="shortcut-desc">Gérer la fidélité et les paiements</div>
                </div>
                <ArrowRight size={18} className="shortcut-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
