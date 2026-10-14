'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Archive, Barcode, Package } from 'lucide-react';
import { getProductImageSrc } from '@/lib/product-images';
import ProductArchiveButton from '@/components/ProductArchiveButton';

interface ArchivedProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  archivedAt: Date | null;
  images: { id: string; url: string }[];
}

export default function ArchivedProductsClient({ products }: { products: ArchivedProduct[] }) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.35rem' }}>Produits archivés</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Les ventes et les retours historiques sont conservés.
          </p>
        </div>
        <Link href="/products/list" className="btn btn-outline">Retour aux produits</Link>
      </div>

      {products.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <Archive size={32} style={{ marginBottom: '0.75rem' }} />
          <h2>Aucun produit archivé</h2>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {products.map((product) => {
            const image = product.images[0]?.url;
            return (
              <div
                key={product.id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ position: 'relative', width: 64, height: 64, flex: '0 0 64px', overflow: 'hidden', borderRadius: 8 }}>
                  {image ? (
                    <Image src={getProductImageSrc(image)} alt={product.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Link href={`/products/${product.id}`} style={{ fontWeight: 700, color: 'inherit' }}>
                    {product.name}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    <Barcode size={14} />
                    <span>{product.sku}</span>
                    <span>· {product.category}</span>
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {product.archivedAt
                      ? `Archivé le ${new Date(product.archivedAt).toLocaleDateString('fr-FR')}`
                      : 'Archivé'}
                  </small>
                </div>
                <ProductArchiveButton
                  productId={product.id}
                  productName={product.name}
                  archived
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
