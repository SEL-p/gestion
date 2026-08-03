import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true }
      },
      customer: true
    }
  });

  const settings = await prisma.storeSettings.findFirst() || {
    storeName: 'ZEYNARMARKET',
    address: 'Adresse de la boutique',
    phone: '',
    receiptMessage: 'Merci de votre visite et à bientôt !'
  };

  if (!order) {
    return notFound();
  }

  // Calculate gross total (before global discount) to show the discount properly
  let rawTotalTTC = 0;
  order.items.forEach(item => {
    rawTotalTTC += item.priceTTC * item.quantity;
  });

  const globalDiscountAmount = rawTotalTTC - order.totalTTC;

  return (
    <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#333' }}>FACTURE</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>N° {order.id.split('-')[0].toUpperCase()}</p>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Vendeur : {order.cashierName}</p>
            {order.customer && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #eee' }}>
                <strong style={{ display: 'block', color: '#333' }}>Client :</strong>
                <span style={{ color: '#555' }}>{order.customer.name}</span>
                {order.customer.phone && <span style={{ color: '#888', marginLeft: '0.5rem' }}>({order.customer.phone})</span>}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111' }}>{settings.storeName}</h2>
            <p style={{ margin: 0, color: '#666', whiteSpace: 'pre-wrap' }}>{settings.address}</p>
            {settings.phone && <p style={{ margin: 0, color: '#666' }}>Tel: {settings.phone}</p>}
            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
              Date : {new Date(order.createdAt).toLocaleDateString('fr-FR')} à {new Date(order.createdAt).toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>

        {/* ITEMS */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Produit</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qté</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Prix Unitaire</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Remise</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Ligne</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{item.product.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>SKU: {item.product.sku}</div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.product.priceTTC.toFixed(0)} FCFA</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {item.discount > 0 ? `${item.discount}%` : '-'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                  {(item.priceTTC * item.quantity).toFixed(0)} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              <span>Sous-total TTC:</span>
              <span>{rawTotalTTC.toFixed(0)} FCFA</span>
            </div>
            
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee', color: '#d9534f' }}>
                <span>Remise globale ({order.discount}%):</span>
                <span>-{globalDiscountAmount.toFixed(0)} FCFA</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
              <span>TOTAL NET À PAYER:</span>
              <span>{order.totalTTC.toFixed(0)} FCFA</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: '4rem', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
          <p style={{ whiteSpace: 'pre-wrap' }}>{settings.receiptMessage}</p>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `window.onload = function() { window.print(); }`
        }}
      />
    </div>
  );
}
