import ProductForm from '@/components/ProductForm';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Store } from 'lucide-react';

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

  // Default suggested categories for supermarket if empty
  if (categories.length === 0) {
    categories = [
      'Alimentaire',
      'Boissons & Jus',
      'Frais & Surgelés',
      'Entretien & Ménage',
      'Hygiène & Beauté',
      'Épicerie & Condiments',
      'Snacks & Confiseries',
      'Boulangerie',
      'Divers',
    ];
  }

  return (
    <div className="new-product-page-wrapper animate-fade-in">
      <div className="new-product-top-bar">
        <Link href="/products" className="new-product-back-btn">
          <ArrowLeft size={18} />
          <span>Retour au Catalogue</span>
        </Link>
        <div className="new-product-badge">
          <Store size={14} />
          <span>Rayon Supermarché</span>
        </div>
      </div>

      <ProductForm existingCategories={categories} />
    </div>
  );
}
