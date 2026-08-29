import { prisma } from '@/lib/prisma';
import ProductCatalogClient from '@/components/ProductCatalogClient';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  let products: any[] = [];
  let categories: string[] = [];

  try {
    products = await prisma.product.findMany({
      include: {
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const categoryRecords = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    categories = categoryRecords.map((c) => c.name);

    if (categories.length === 0) {
      const distinctCategories = await prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
      });
      categories = distinctCategories.map((p) => p.category).filter(Boolean);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  return (
    <ProductCatalogClient
      products={products}
      categories={categories}
    />
  );
}
