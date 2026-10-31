'use client';

import { useState } from 'react';
import { updateStock } from '@/actions/product';

export default function RestockForm({ 
  productId, 
  unitsPerCarton = 1 
}: { 
  productId: string;
  unitsPerCarton?: number;
}) {
  const isPack = unitsPerCarton > 1;
  const [restockMode, setRestockMode] = useState<'packs' | 'units'>(isPack ? 'packs' : 'units');
  const [value, setValue] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const numVal = typeof value === 'number' && value > 0 ? value : 0;
  const totalUnitsToAdd = restockMode === 'packs' && isPack ? numVal * unitsPerCarton : numVal;

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalUnitsToAdd <= 0) return;
    
    setLoading(true);
    setSuccess(false);
    try {
      await updateStock(productId, totalUnitsToAdd);
      setSuccess(true);
      setValue('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout de stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem', alignItems: 'flex-end' }}>
      {isPack && (
        <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.05)', padding: '0.2rem', borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => setRestockMode('packs')}
            style={{
              border: 'none',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: restockMode === 'packs' ? '700' : '500',
              background: restockMode === 'packs' ? 'var(--primary-color, #00796B)' : 'transparent',
              color: restockMode === 'packs' ? '#fff' : 'inherit'
            }}
          >
            En Packs ({unitsPerCarton} pcs)
          </button>
          <button
            type="button"
            onClick={() => setRestockMode('units')}
            style={{
              border: 'none',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: restockMode === 'units' ? '700' : '500',
              background: restockMode === 'units' ? 'var(--primary-color, #00796B)' : 'transparent',
              color: restockMode === 'units' ? '#fff' : 'inherit'
            }}
          >
            À l&apos;unité (Pièces)
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input 
          type="number" 
          min="1" 
          value={value} 
          onChange={e => setValue(e.target.value ? parseInt(e.target.value, 10) : '')} 
          placeholder={restockMode === 'packs' && isPack ? "Nb de packs" : "Nb de pièces"} 
          className="form-control" 
          style={{ width: '140px' }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || totalUnitsToAdd <= 0}>
          {loading ? '...' : 'Réapprovisionner'}
        </button>
      </div>

      {isPack && totalUnitsToAdd > 0 && (
        <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
          = +{totalUnitsToAdd} pièces ajoutées au stock total
        </span>
      )}

      {success && <span style={{ color: 'var(--success-color)', fontSize: '0.9rem', fontWeight: 600 }}>Stock mis à jour avec succès !</span>}
    </form>
  );
}
