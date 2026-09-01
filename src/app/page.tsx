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

        {/* Mobile APK Download Banner */}
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
            href="/zeynarmarket.apk"
            download="zeynarmarket.apk"
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
            <a
              href="/zeynarmarket.apk"
              download="zeynarmarket.apk"
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
              <span>Télécharger l'APK</span>
            </a>
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

        {/* APK Download & Mobile App Info Banner */}
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
                Installez l'application native sur vos smartphones, tablettes ou terminaux de caisse Android.
              </div>
            </div>
          </div>
          <a
            href="/zeynarmarket.apk"
            download="zeynarmarket.apk"
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
            Télécharger l'APK Android (4.1 Mo)
          </a>
        </div>

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
