'use client';

import { useState } from 'react';
import { updateStock } from '@/actions/product';

export default function RestockForm({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    
    setLoading(true);
    setSuccess(false);
    try {
      await updateStock(productId, quantity);
      setSuccess(true);
      setQuantity(0);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout de stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRestock} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
      <input 
        type="number" 
        min="1" 
        value={quantity || ''} 
        onChange={e => setQuantity(parseInt(e.target.value) || 0)} 
        placeholder="Qté à ajouter" 
        className="form-control" 
        style={{ width: '150px' }}
      />
      <button type="submit" className="btn btn-primary" disabled={loading || quantity <= 0}>
        {loading ? '...' : 'Réapprovisionner'}
      </button>
      {success && <span style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>Stock mis à jour !</span>}
    </form>
  );
}
