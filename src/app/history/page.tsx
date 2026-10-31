import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HistoryClient from './HistoryClient';

export const metadata = {
  title: 'Historique des Ventes',
};

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
    <div className="history-page-wrapper">
      <header className="history-page-header">
        <div className="history-header-title-wrap">
          <h1 className="history-header-title">
            Historique des Ventes
          </h1>
          <p className="history-header-subtitle">
            Consultez vos transactions, tickets de caisse et retours.
          </p>
        </div>
        <div className="history-header-actions">
          <Link href="/pos" className="history-pos-btn">
            Retour Caisse
          </Link>
        </div>
      </header>
      
      <HistoryClient initialOrders={orders} blindReturns={blindReturns} />
    </div>
  );
}
