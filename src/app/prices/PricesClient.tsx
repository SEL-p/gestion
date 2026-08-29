'use client';

import React, { useState } from 'react';
import { updateProductPrice, bulkUpdatePrices } from '@/actions/prices';
import { Search, Save, CheckCircle2, AlertCircle, RefreshCw, DollarSign, Package } from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  priceTTC: number;
  priceHT: number;
  purchasePrice?: number | null;
  stock: number;
  images: { url: string }[];
}

export default function PricesClient({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [edits, setEdits] = useState<Record<string, { priceTTC?: number; purchasePrice?: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const handlePriceChange = (id: string, field: 'priceTTC' | 'purchasePrice', val: string) => {
    const numVal = parseFloat(val);
    if (isNaN(numVal) && val !== '') return;

    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val === '' ? undefined : numVal,
      },
    }));
  };

  const handleSaveSingle = async (id: string) => {
    const productEdit = edits[id];
    if (!productEdit) return;

    setSavingId(id);
    setMessage(null);

    const res = await updateProductPrice(id, {
      ...(productEdit.priceTTC !== undefined && { priceTTC: productEdit.priceTTC }),
      ...(productEdit.purchasePrice !== undefined && { purchasePrice: productEdit.purchasePrice }),
    });

    if (res.success) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                priceTTC: productEdit.priceTTC ?? p.priceTTC,
                purchasePrice: productEdit.purchasePrice !== undefined ? productEdit.purchasePrice : p.purchasePrice,
              }
            : p
        )
      );

      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      setMessage({ type: 'success', text: 'Prix mis à jour avec succès.' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.error || 'Erreur lors de la mise à jour.' });
    }

    setSavingId(null);
  };

  const handleBulkSave = async () => {
    const updateList = Object.entries(edits).map(([id, edit]) => {
      const prod = products.find((p) => p.id === id);
      return {
        id,
        priceTTC: edit.priceTTC ?? prod?.priceTTC ?? 0,
        purchasePrice: edit.purchasePrice !== undefined ? edit.purchasePrice : (prod?.purchasePrice ?? undefined),
      };
    });

    if (updateList.length === 0) return;

    setIsBulkSaving(true);
    setMessage(null);

    const res = await bulkUpdatePrices(updateList);
    if (res.success) {
      setProducts((prev) =>
        prev.map((p) => {
          const edit = edits[p.id];
          if (!edit) return p;
          return {
            ...p,
            priceTTC: edit.priceTTC ?? p.priceTTC,
            purchasePrice: edit.purchasePrice !== undefined ? edit.purchasePrice : p.purchasePrice,
          };
        })
      );
      setEdits({});
      setMessage({ type: 'success', text: `${res.count} produit(s) mis à jour avec succès.` });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.error || 'Erreur lors de la sauvegarde globale.' });
    }

    setIsBulkSaving(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const modifiedCount = Object.keys(edits).length;

  return (
    <div className="prices-client-wrapper">
      {/* Messages */}
      {message && (
        <div className={`alert-box ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.25rem' }}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Toolbar / Filters & Global Action */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          {/* Search */}
          <div className="customer-search-bar" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom ou code SKU..."
              className="customer-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '160px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">Tous les rayons</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Global Save Button */}
        {modifiedCount > 0 && (
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleBulkSave}
            disabled={isBulkSaving}
            style={{ animation: 'pulse-ring 2s infinite' }}
          >
            {isBulkSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Enregistrer tout ({modifiedCount})</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="users-list-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive-wrapper">
          <table className="pro-table">
            <thead>
              <tr style={{ background: 'var(--slate-50)' }}>
                <th style={{ paddingLeft: '1.25rem' }}>Article</th>
                <th>Rayon</th>
                <th style={{ width: '150px' }}>Coût d&apos;Achat (FCFA)</th>
                <th style={{ width: '160px' }}>Prix Vente TTC (FCFA)</th>
                <th>Marge %</th>
                <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty-row">
                    <Package size={36} color="#94A3B8" />
                    <p>Aucun article trouvé.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const currentEdit = edits[p.id];
                  const currentPurchase = currentEdit?.purchasePrice !== undefined ? currentEdit.purchasePrice : (p.purchasePrice || 0);
                  const currentPriceTTC = currentEdit?.priceTTC !== undefined ? currentEdit.priceTTC : p.priceTTC;
                  const isModified = !!currentEdit;

                  // Calculate margin
                  const marginAmt = currentPriceTTC - currentPurchase;
                  const marginPct = currentPurchase > 0 ? (marginAmt / currentPurchase) * 100 : 0;

                  return (
                    <tr key={p.id} style={{ backgroundColor: isModified ? 'rgba(0, 121, 107, 0.04)' : undefined }}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <div className="customer-avatar-cell">
                          <div className="avatar-circle" style={{ background: 'linear-gradient(135deg, #00796B, #10B981)', width: 34, height: 34 }}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="customer-cell-name">{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>SKU: {p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{p.category}</span>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                          value={currentEdit?.purchasePrice !== undefined ? currentEdit.purchasePrice : (p.purchasePrice ?? '')}
                          placeholder="0"
                          onChange={(e) => handlePriceChange(p.id, 'purchasePrice', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-ttc"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.95rem', fontWeight: 700 }}
                          value={currentEdit?.priceTTC !== undefined ? currentEdit.priceTTC : p.priceTTC}
                          onChange={(e) => handlePriceChange(p.id, 'priceTTC', e.target.value)}
                        />
                      </td>
                      <td>
                        {currentPurchase > 0 ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: marginPct >= 20 ? 'rgba(16, 185, 129, 0.12)' : marginPct > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: marginPct >= 20 ? '#059669' : marginPct > 0 ? '#D97706' : '#DC2626',
                              fontWeight: 700,
                            }}
                          >
                            {marginPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        {isModified && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={savingId === p.id}
                            onClick={() => handleSaveSingle(p.id)}
                          >
                            {savingId === p.id ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            <span>Sauver</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
