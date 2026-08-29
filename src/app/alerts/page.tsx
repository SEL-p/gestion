import { prisma } from '@/lib/prisma';
import AlertsClient from './AlertsClient';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  let lowStockProducts: any[] = [];

  try {
    const allProducts = await prisma.product.findMany({
      include: { images: true },
      orderBy: { stock: 'asc' },
    });

    lowStockProducts = allProducts.filter((p) => p.stock <= p.minStock);
  } catch (error) {
    console.error('Error fetching alerts:', error);
  }

  return <AlertsClient products={lowStockProducts} />;
}
