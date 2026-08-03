import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

export default async function AlertsPage() {
  // Fetch all products to evaluate low stock manually if fieldRef is not supported
  const allProducts = await prisma.product.findMany({
    include: { images: true },
    orderBy: { stock: 'asc' }
  });

  const lowStockProducts = allProducts.filter(p => p.stock <= p.minStock);

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--danger-color)' }}>Alertes de Stock ⚠️</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Produits dont le stock est inférieur ou égal à leur seuil d'alerte.
          </p>
        </div>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2>Tout va bien !</h2>
          <p>Aucun produit n'est en rupture ou sous le seuil d'alerte critique.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4">
          {lowStockProducts.map(product => {
            const mainImage = product.images.length > 0 ? product.images[0].url : null;
            return (
              <div key={product.id} className="glass-card" style={{ border: '2px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ position: 'relative', width: '100%', height: '150px', backgroundColor: 'var(--slate-100)' }}>
                  {mainImage ? (
                    <Image src={mainImage} alt={product.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--slate-400)', fontSize: '2rem' }}>
                      📦
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                    <span className="badge badge-danger" style={{ backdropFilter: 'blur(8px)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      ⚠️ {product.stock} restants (Min: {product.minStock})
                    </span>
                  </div>
                </div>
                
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={product.name}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '1rem', fontFamily: 'monospace' }}>
                    #{product.sku}
                  </p>

                  <Link href={`/products/${product.id}`} className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
                    Réapprovisionner
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
