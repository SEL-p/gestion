import { prisma } from '@/lib/prisma';
import HistoryClient from './HistoryClient';

export default async function HistoryPage() {
  // Fetch all orders with their items, products, and returns
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: true
        }
      },
      returns: true
    }
  });

  const blindReturns = await prisma.return.findMany({
    where: { orderId: null },
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ backgroundColor: 'var(--accent-color)', color: 'white', padding: '0.5rem', borderRadius: '12px', display: 'flex' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </span>
            Historique des Ventes
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>Consultez les transactions et gérez les retours.</p>
        </div>
        <div className="header-actions">
          <a href="/pos" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Retour à la Caisse
          </a>
        </div>
      </header>
      
      <HistoryClient initialOrders={orders} blindReturns={blindReturns} />
    </div>
  );
}
