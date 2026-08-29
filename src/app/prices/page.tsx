import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DollarSign, TrendingUp, Package, ArrowLeft } from 'lucide-react';
import PricesClient from './PricesClient';

export const metadata = {
  title: 'Gestion des Prix | ZEYNARMARKET',
  description: 'Modifiez les prix de vente et d\'achat de tous vos articles en une seule vue.',
};

export default async function PricesPage() {
  let products: any[] = [];
  let stats = { totalProducts: 0, withPurchasePrice: 0, avgMargin: 0 };

  try {
    products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        priceTTC: true,
        priceHT: true,
        purchasePrice: true,
        stock: true,
        images: { select: { url: true }, take: 1 },
      },
      orderBy: { name: 'asc' },
    });

    const withPurchase = products.filter((p) => p.purchasePrice && p.purchasePrice > 0);
    const margins = withPurchase.map((p) =>
      ((p.priceTTC - p.purchasePrice!) / p.purchasePrice!) * 100
    );
    const avgMargin =
      margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;

    stats = {
      totalProducts: products.length,
      withPurchasePrice: withPurchase.length,
      avgMargin,
    };
  } catch (err) {
    console.error('Erreur chargement prix:', err);
  }

  return (
    <div className="prices-page-container animate-fade-in">
      {/* Top Bar */}
      <div className="prices-top-bar">
        <Link href="/products" className="new-product-back-btn">
          <ArrowLeft size={16} />
          <span>Catalogue</span>
        </Link>
        <div className="new-product-badge">
          <DollarSign size={14} />
          Gestion des Prix
        </div>
      </div>

      {/* Header */}
      <div className="prices-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="prices-title" style={{ fontSize: '1.85rem', fontWeight: 800 }}>Grille Tarifaire & Marges</h1>
          <p className="prices-subtitle" style={{ color: 'var(--slate-500)' }}>
            Modifiez rapidement les prix de vente TTC et d&apos;achat de tous vos articles.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="prices-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card prices-kpi-card kpi-orders" style={{ padding: '1.25rem' }}>
          <div className="kpi-top">
            <div className="kpi-label">Articles au catalogue</div>
            <div className="kpi-icon-wrap icon-blue">
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats.totalProducts}</div>
          <div className="kpi-footer">références enregistrées</div>
        </div>

        <div className="glass-card prices-kpi-card kpi-revenue" style={{ padding: '1.25rem' }}>
          <div className="kpi-top">
            <div className="kpi-label">Coût d&apos;achat renseigné</div>
            <div className="kpi-icon-wrap icon-green">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats.withPurchasePrice}</div>
          <div className="kpi-footer">
            sur {stats.totalProducts} articles
          </div>
        </div>

        <div className="glass-card prices-kpi-card kpi-stocks" style={{ padding: '1.25rem' }}>
          <div className="kpi-top">
            <div className="kpi-label">Marge Moyenne</div>
            <div className="kpi-icon-wrap icon-orange">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {stats.avgMargin > 0 ? `${stats.avgMargin.toFixed(1)}%` : '—'}
          </div>
          <div className="kpi-footer">calculée sur articles avec coût</div>
        </div>
      </div>

      {/* Price Table Client Component */}
      <PricesClient initialProducts={products} />
    </div>
  );
}
