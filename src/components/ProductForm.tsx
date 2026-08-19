'use client';

import { useState } from 'react';
import { createProduct } from '@/actions/product';

export default function ProductForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      await createProduct(formData);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Ajouter un Produit</h2>
      
      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '8px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Nom du produit *</label>
        <input type="text" name="name" required className="form-control" placeholder="T-shirt Noir" />
      </div>

      <div className="grid grid-cols-4">
        <div className="form-group">
          <label className="form-label">Catégorie *</label>
          <input type="text" name="category" required className="form-control" placeholder="Bières, Sucreries..." />
        </div>
        
        <div className="form-group">
          <label className="form-label">Unité par Casier</label>
          <input type="number" name="unitsPerCarton" className="form-control" defaultValue="1" min="1" title="Ex: 24 pour un casier" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Stock initial (en Unités) *</label>
          <input type="number" name="stock" required className="form-control" defaultValue="0" min="0" />
        </div>

        <div className="form-group">
          <label className="form-label">Seuil Alerte Stock *</label>
          <input type="number" name="minStock" required className="form-control" defaultValue="5" min="1" />
        </div>
      </div>

      <div className="grid grid-cols-3">
        <div className="form-group">
          <label className="form-label">Prix d'achat</label>
          <input type="number" step="0.01" name="purchasePrice" className="form-control" placeholder="0.00" />
        </div>

        <div className="form-group">
          <label className="form-label">Prix de Vente (HT) *</label>
          <input type="number" step="0.01" name="priceHT" required className="form-control" placeholder="0.00" 
            onChange={(e) => {
              const ttcInput = document.getElementById('priceTTC') as HTMLInputElement;
              if (ttcInput && e.target.value) {
                ttcInput.value = (parseFloat(e.target.value) * 1.2).toFixed(2);
              }
            }}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Prix de Vente (TTC) *</label>
          <input type="number" step="0.01" name="priceTTC" id="priceTTC" required className="form-control" placeholder="0.00" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Description Courte</label>
        <input type="text" name="shortDescription" className="form-control" />
      </div>

      <div className="form-group">
        <label className="form-label">Description Longue</label>
        <textarea name="longDescription" className="form-control" rows={5}></textarea>
      </div>

      <div className="form-group">
        <label className="form-label">Images (PNG, JPG, WEBP)</label>
        <input type="file" name="images" multiple accept="image/png, image/jpeg, image/webp" className="form-control" style={{ padding: '0.5rem' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Création en cours...' : 'Sauvegarder le produit'}
        </button>
      </div>
    </form>
  );
}
