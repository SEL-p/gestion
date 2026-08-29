import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RestockForm from '@/components/RestockForm';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!product) {
    return notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Retour au catalogue</Link>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="grid grid-cols-2">
          {/* Galerie d'images */}
          <div>
            <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
              {product.images.length > 0 ? (
                <Image src={product.images[0].url} alt={product.name} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Aucune image</div>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                {product.images.slice(1).map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden' }}>
                    <Image src={img.url} alt={`${product.name} - ${idx}`} fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informations Produit */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h1>{product.name}</h1>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ 
                  padding: '0.4rem 1rem', 
                  borderRadius: '20px', 
                  backgroundColor: product.stock > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: product.stock > 0 ? '#4ade80' : '#f87171',
                  fontWeight: 'bold'
                }}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
                </span>
                <RestockForm productId={product.id} />
              </div>
            </div>
            
            <p style={{ color: 'var(--accent-color)', fontSize: '1.2rem', marginBottom: '2rem' }}>SKU: {product.sku}</p>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Prix HT</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{product.priceHT.toFixed(0)} FCFA</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Prix TTC</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{product.priceTTC.toFixed(0)} FCFA</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Catégorie</p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '500' }}>{product.category}</p>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3>Description Courte</h3>
              <p>{product.shortDescription || 'Non renseignée'}</p>
            </div>

            <div>
              <h3>Description Longue</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{product.longDescription || 'Non renseignée'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
