import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { sku: { contains: query } },
        { category: { contains: query } },
      ],
    },
    include: {
      images: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Catalogue Produits</h1>
          <p>Gérez votre inventaire et exportez vos données facilement.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <form style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto', maxWidth: '400px', width: '100%' }}>
            <input 
              type="text" 
              name="q" 
              placeholder="Rechercher par nom, SKU ou catégorie..." 
              className="form-control" 
              style={{ flex: 1, minWidth: '200px' }}
              defaultValue={query}
            />
            <button type="submit" className="btn btn-primary">🔍</button>
          </form>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/api/csv" className="btn btn-outline" target="_blank" download>
              📥 Exporter CSV
            </Link>
            <Link href="/api/images" className="btn btn-outline" target="_blank" download>
              🖼️ Exporter Images
            </Link>
          </div>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-secondary)' }}>Aucun produit trouvé</h2>
          {query ? (
            <p>Essayez une autre recherche.</p>
          ) : (
            <div style={{ marginTop: '2rem' }}>
              <Link href="/products/new" className="btn btn-primary">
                Ajouter votre premier produit
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
