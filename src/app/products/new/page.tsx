import ProductForm from '@/components/ProductForm';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  let categories: string[] = [];
  try {
    const cats = await prisma.category.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    categories = cats.map((c) => c.name);
  } catch (e) {
    console.error('Error fetching categories:', e);
  }

  if (categories.length === 0) {
    categories = [
      'Boissons & Jus',
      'Bières & Alcools',
      'Eaux & Sodas',
      'Vins & Spiritueux',
      'Boissons Énergisantes',
      'Champagnes & Liqueurs',
      'Alimentaire',
      'Divers',
    ];
  }

  return (
    <div className="drink-new-page-container animate-fade-in">
      <ProductForm existingCategories={categories} />
    </div>
  );
}
