'use client';

import { useState } from 'react';
import { processReturn } from '@/actions/returns';

type Product = { id: string; name: string };
type OrderItem = { id: string; productId: string; product: Product; quantity: number; priceTTC: number };
type ReturnRec = { id: string; productId: string; quantity: number; amountTTC: number; approvedBy: string; createdAt: Date; product?: Product };
type Order = {
  id: string;
  totalTTC: number;
  cashierName: string;
  createdAt: Date;
  items: OrderItem[];
  returns: ReturnRec[];
};

export default function HistoryClient({ initialOrders, blindReturns }: { initialOrders: Order[], blindReturns: ReturnRec[] }) {
  const [orders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Return Modal State
  const [returnItem, setReturnItem] = useState<{ orderId: string, item: OrderItem, returnedSoFar: number } | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [adminPin, setAdminPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnItem) return;
    
    setLoading(true);
    setError('');

    const res = await processReturn(returnItem.orderId, returnItem.item.productId, returnQty, adminPin, reason);
    if (res.success) {
      window.location.reload();
    } else {
      setError(res.error || "Erreur inconnue");
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
        >
          Transactions
        </button>
        <button 
          onClick={() => setActiveTab('returns')}
          className={`btn ${activeTab === 'returns' ? 'btn-primary' : 'btn-outline'}`}
        >
          Retours Hors-Facture
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
          
          {/* Liste des commandes */}
          <div className="glass-card" style={{ gridColumn: 'span 2', padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--slate-200)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Référence</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Caissier</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Total</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Retours</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const returnedTotal = order.returns.reduce((acc, r) => acc + r.amountTTC, 0);
              const returnedQtyTotal = order.returns.reduce((acc, r) => acc + r.quantity, 0);
              const dateObj = new Date(order.createdAt);
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--slate-100)', backgroundColor: selectedOrder?.id === order.id ? 'var(--slate-50)' : 'transparent' }}>
                  <td style={{ padding: '1rem', color: 'var(--slate-900)' }}>
                    {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {order.id.split('-')[0].toUpperCase()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-primary">{order.cashierName}</span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    {order.totalTTC.toFixed(0)} FCFA
                  </td>
                  <td style={{ padding: '1rem', color: returnedTotal > 0 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                    {returnedTotal > 0 ? (
                      <div>
                        <div>-{returnedTotal.toFixed(0)} FCFA</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>({returnedQtyTotal} article{returnedQtyTotal > 1 ? 's' : ''})</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => setSelectedOrder(order)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                      Détails
                    </button>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Aucune vente enregistrée pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Détails de la commande */}
      <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
        {selectedOrder ? (
          <>
            <h3 style={{ marginBottom: '1rem', color: 'var(--slate-900)' }}>Détails de la commande</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Réf: {selectedOrder.id}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedOrder.items.map(item => {
                const returnedQty = selectedOrder.returns.filter(r => r.productId === item.productId).reduce((acc, r) => acc + r.quantity, 0);
                const canReturn = returnedQty < item.quantity;
                
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Qté: {item.quantity} (Rendu: {returnedQty}) • {item.priceTTC.toFixed(0)} FCFA/u
                      </div>
                    </div>
                    {canReturn && (
                      <button 
                        onClick={() => setReturnItem({ orderId: selectedOrder.id, item, returnedSoFar: returnedQty })} 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                      >
                        Retourner
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
            Sélectionnez une commande pour voir les détails.
          </div>
        )}
      </div>
      </div>
      ) : (
        <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--slate-900)' }}>Historique des Retours Hors-Facture</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--slate-200)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Produit</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Qté</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Montant Remboursé</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Autorisé par</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Motif</th>
              </tr>
            </thead>
            <tbody>
              {blindReturns.map(ret => {
                const dateObj = new Date(ret.createdAt);
                return (
                  <tr key={ret.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                    <td style={{ padding: '1rem', color: 'var(--slate-900)' }}>
                      {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                      {ret.product?.name || 'Produit inconnu'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {ret.quantity}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                      -{ret.amountTTC.toFixed(0)} FCFA
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-primary">{ret.approvedBy}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {ret.reason || '-'}
                    </td>
                  </tr>
                );
              })}
              {blindReturns.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Aucun retour hors-facture enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Modal Overlay */}
      {returnItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ padding: '2rem', width: '400px', backgroundColor: 'white' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--danger-color)' }}>Retour Produit Autorisé</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--slate-600)' }}>
              Produit: <strong>{returnItem.item.product.name}</strong><br/>
              Acheté: {returnItem.item.quantity} | Déjà retourné: {returnItem.returnedSoFar}
            </p>

            <form onSubmit={handleReturnSubmit}>
              <div className="form-group">
                <label className="form-label">Quantité à retourner</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="1" 
                  max={returnItem.item.quantity - returnItem.returnedSoFar} 
                  value={returnQty} 
                  onChange={e => setReturnQty(parseInt(e.target.value))} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Motif du retour (Optionnel)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder="Ex: Produit défectueux"
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--slate-200)', paddingTop: '1.5rem' }}>
                <label className="form-label" style={{ color: 'var(--danger-color)' }}>Code PIN Administrateur Requis 🔒</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={adminPin} 
                  onChange={e => setAdminPin(e.target.value)} 
                  required 
                  maxLength={4}
                  placeholder="••••"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                />
              </div>

              {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setReturnItem(null)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} disabled={loading}>
                  {loading ? 'Traitement...' : 'Valider le retour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
