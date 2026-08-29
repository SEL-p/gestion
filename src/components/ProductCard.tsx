import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductImage } from '@prisma/client';

type ProductWithImages = Product & { images: ProductImage[] };

export default function ProductCard({ product }: { product: ProductWithImages }) {
  const mainImage = product.images.length > 0 ? product.images[0].url : null;

  const cartons = product.unitsPerCarton > 1 ? Math.floor(product.stock / product.unitsPerCarton) : 0;
  const remainingUnits = product.unitsPerCarton > 1 ? product.stock % product.unitsPerCarton : product.stock;
  
  const stockText = product.stock <= 0 ? 'Rupture' : 
    (product.unitsPerCarton > 1 
      ? (cartons > 0 ? `${cartons} casier(s)` : '') + (remainingUnits > 0 ? ` ${remainingUnits} btl` : '')
      : `${product.stock} en stock`);

  return (
    <div className="glass-card">
      <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: 'var(--slate-800)' }}>
        {mainImage ? (
          <Image src={mainImage} alt={product.name} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--slate-500)', fontSize: '2rem' }}>
            ðŸ“¦
          </div>
        )}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-danger'}`} style={{ backdropFilter: 'blur(8px)' }}>
            {stockText}
          </span>
        </div>
      </div>
      
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={product.name}>
            {product.name}
          </h3>
        </div>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '1.25rem', fontFamily: 'monospace' }}>
          #{product.sku}
        </p>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--slate-900)', lineHeight: 1 }}>
            {product.priceTTC.toFixed(0)} <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-color)' }}>FCFA</span>
          </span>
        </div>

        <Link href={`/products/${product.id}`} className="btn btn-outline" style={{ width: '100%' }}>
          Voir dÃ©tails
        </Link>
      </div>
    </div>
  );
}
