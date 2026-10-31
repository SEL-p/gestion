import { prisma } from '@/lib/prisma';
import PricesClient from './PricesClient';

export const metadata = {
  title: 'Gestion des Prix & Marges | Supermarché',
  description: 'Modifiez rapidement les prix de vente et d\'achat de tous vos articles.',
};

export const dynamic = 'force-dynamic';

export default async function PricesPage() {
  let products: any[] = [];
  let categories: string[] = [];

  try {
    products = await prisma.product.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        priceTTC: true,
        priceHT: true,
        purchasePrice: true,
        unitsPerCarton: true,
        stock: true,
        images: { select: { url: true }, take: 1 },
      },
      orderBy: { name: 'asc' },
    });

    const categoryRecords = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    categories = categoryRecords.map((c) => c.name);

    if (categories.length === 0) {
      const distinctCategories = await prisma.product.findMany({
        where: { archivedAt: null },
        select: { category: true },
        distinct: ['category'],
      });
      categories = distinctCategories.map((p) => p.category).filter(Boolean);
    }
  } catch (err) {
    console.error('Erreur chargement prix:', err);
  }

  return <PricesClient initialProducts={products} categories={categories} />;
}
