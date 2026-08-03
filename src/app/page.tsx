import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Package, TrendingUp, Users, ShoppingBag, AlertTriangle, ArrowRight, Activity, DollarSign, Box } from 'lucide-react';

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Stats du jour
  const todayOrders = await prisma.order.findMany({
    where: { createdAt: { gte: today } }
  });
  const todayReturns = await prisma.return.findMany({
    where: { createdAt: { gte: today } }
  });
  const todayReturnsTotal = todayReturns.reduce((sum, r) => sum + r.amountTTC, 0);
  const todayReturnsQty = todayReturns.reduce((sum, r) => sum + r.quantity, 0);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalTTC, 0) - todayReturnsTotal;

  // Clients totaux
  const customersCount = await prisma.customer.count();

  // Produits en rupture (Fix Prisma column comparison by fetching & filtering)
  const allProducts = await prisma.product.findMany({
    select: { stock: true, minStock: true }
  });
  const lowStockCount = allProducts.filter(p => p.stock <= p.minStock).length;

  // Top 5 produits
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, priceTTC: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5
  });

  const topProductDetails = await Promise.all(
    topProducts.map(async (tp) => {
      const p = await prisma.product.findUnique({ where: { id: tp.productId } });
      return { 
        ...p, 
        soldQty: tp._sum.quantity || 0, 
        revenue: tp._sum.priceTTC || 0 
      };
    })
  );

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: 'var(--slate-900)' }}>
            Vue d'ensemble
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '1.1rem', margin: 0 }}>
            Les performances de votre boutique en temps réel.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/pos" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 10px 25px -5px var(--accent-glow)' }}>
            <ShoppingBag size={18} />
            Accéder à la Caisse
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '3rem', gap: '1.5rem' }}>
        <div className="glass-card kpi-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success-color)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--slate-500)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chiffre d'Affaires</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success-color)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--slate-900)', lineHeight: 1 }}>{todayRevenue.toLocaleString('fr-FR')} <span style={{ fontSize: '1rem', color: 'var(--slate-400)' }}>FCFA</span></div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
            <TrendingUp size={14} color="var(--success-color)" /> Aujourd'hui
            {todayReturnsTotal > 0 && (
              <span style={{ color: 'var(--danger-color)' }}>(-{todayReturnsTotal} FCFA de retours)</span>
            )}
          </div>
        </div>

        <div className="glass-card kpi-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-color)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--slate-500)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commandes</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '8px', color: 'var(--accent-color)' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--slate-900)', lineHeight: 1 }}>{todayOrders.length}</div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 500 }}>
            Tickets émis aujourd'hui
          </div>
        </div>

        <div className="glass-card kpi-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--slate-500)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remboursements</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: 'var(--danger-color)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--slate-900)', lineHeight: 1 }}>{todayReturnsTotal.toLocaleString('fr-FR')} <span style={{ fontSize: '1rem', color: 'var(--slate-400)' }}>FCFA</span></div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--danger-color)', fontWeight: 500 }}>
            {todayReturnsQty} article(s) retourné(s) au total
          </div>
        </div>

        <div className="glass-card kpi-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--slate-500)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ruptures de Stock</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--warning-color)' }}>
              <Box size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--slate-900)', lineHeight: 1 }}>{lowStockCount}</div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
            <Activity size={14} /> Attention requise
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
        {/* Top Products Table */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--slate-900)' }}>Meilleures Ventes</h3>
            <div style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--slate-100)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)' }}>Historique</div>
          </div>
          
          <div style={{ flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--slate-400)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0 0 1rem 0', textAlign: 'left', fontWeight: 600 }}>Produit</th>
                  <th style={{ padding: '0 0 1rem 0', textAlign: 'center', fontWeight: 600 }}>Quantité</th>
                  <th style={{ padding: '0 0 1rem 0', textAlign: 'right', fontWeight: 600 }}>Revenus</th>
                </tr>
              </thead>
              <tbody>
                {topProductDetails.map((tp, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--slate-100)' }}>
                    <td style={{ padding: '1rem 0' }}>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{tp.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>SKU: {tp.sku}</div>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'center' }}>
                      <span style={{ backgroundColor: 'var(--slate-100)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                        {tp.soldQty}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 700, color: 'var(--accent-color)' }}>
                      {tp.revenue.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                ))}
                {topProductDetails.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--slate-400)' }}>
                      <Box size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                      Aucune donnée de vente pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--slate-900)' }}>Actions Rapides</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/products/new" className="quick-action-card">
              <div className="icon-wrap" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--accent-color)' }}>
                <Package size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>Ajouter un Produit</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Enrichir votre catalogue</div>
              </div>
              <ArrowRight size={18} color="var(--slate-400)" />
            </Link>

            <Link href="/history" className="quick-action-card">
              <div className="icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                <Activity size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>Historique des Ventes</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Consulter les transactions</div>
              </div>
              <ArrowRight size={18} color="var(--slate-400)" />
            </Link>

            <Link href="/settings" className="quick-action-card">
              <div className="icon-wrap" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>Ajuster les Paramètres</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Gérer la boutique et les tickets</div>
              </div>
              <ArrowRight size={18} color="var(--slate-400)" />
            </Link>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .quick-action-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background-color: var(--slate-50);
          border: 1px solid var(--slate-100);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .quick-action-card:hover {
          background-color: white;
          border-color: var(--accent-color);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
          transform: translateX(5px);
        }
        .kpi-card:hover {
          transform: translateY(-5px);
        }
        .icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
