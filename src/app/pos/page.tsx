import { prisma } from '@/lib/prisma';
import POSClient from './POSClient';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const products = await prisma.product.findMany({
    include: { images: true },
    where: { stock: { gt: 0 } }, // Only sell products that are in stock
    orderBy: { name: 'asc' }
  });

  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  const cookieStore = await cookies();
  const cashierId = cookieStore.get('auth_id')?.value || 'admin';
  const cashierName = cookieStore.get('auth_name')?.value || 'Admin';

  // Compute today's sales for this cashier
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysOrders = await prisma.order.findMany({
    where: { 
      cashierName,
      createdAt: { gte: today }
    }
  });

  const todayReturns = await prisma.return.findMany({
    where: { createdAt: { gte: today } }
  });
  
  const todaySalesOrders = todaysOrders.reduce((acc, order) => acc + order.totalTTC, 0);
  const todayReturnsTotal = todayReturns.reduce((acc, r) => acc + r.amountTTC, 0);
  const todaySales = todaySalesOrders - todayReturnsTotal;

  return (
    <div style={{ height: 'calc(100vh - 4rem)' }}>
      <POSClient 
        products={products} 
        customers={customers} 
        cashierId={cashierId}
        cashierName={cashierName}
        initialTodaySales={todaySales}
      />
    </div>
  );
}
