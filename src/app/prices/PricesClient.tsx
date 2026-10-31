'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { updateProductPrice, bulkUpdatePrices } from '@/actions/prices';
import { getProductImageSrc } from '@/lib/product-images';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  priceTTC: number;
  priceHT: number;
  purchasePrice?: number | null;
  unitsPerCarton?: number;
  stock: number;
  images: { url: string }[];
}

interface PricesClientProps {
  initialProducts: ProductItem[];
  categories: string[];
}

export default function PricesClient({
  initialProducts,
  categories,
}: PricesClientProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [marginFilter, setMarginFilter] = useState<'all' | 'high' | 'low' | 'unset'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Track pending edits: Record<productId, { priceTTC?: number; purchasePrice?: number }>
  const [edits, setEdits] = useState<Record<string, { priceTTC?: number; purchasePrice?: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Extract categories present in products
  const availableCategories = useMemo(() => {
    const fromProducts = Array.from(new Set(products.map((p) => p.category?.trim()).filter(Boolean)));
    const merged = Array.from(new Set([...categories.map((c) => c.trim()).filter(Boolean), ...fromProducts]));
    return merged.sort();
  }, [categories, products]);

  // Overall statistics computed from current prices + edits
  const stats = useMemo(() => {
    let withCostCount = 0;
    let sumMarginPct = 0;
    let validMarginCount = 0;

    for (const p of products) {
      const edit = edits[p.id];
      const cost = edit?.purchasePrice !== undefined ? edit.purchasePrice : (p.purchasePrice || 0);
      const sale = edit?.priceTTC !== undefined ? edit.priceTTC : p.priceTTC;

      if (cost > 0) {
        withCostCount++;
        const pct = ((sale - cost) / cost) * 100;
        sumMarginPct += pct;
        validMarginCount++;
      }
    }

    const avgMargin = validMarginCount > 0 ? sumMarginPct / validMarginCount : 0;

    return {
      total: products.length,
      withCost: withCostCount,
      avgMargin,
    };
  }, [products, edits]);

  // Handle single input edit
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

  // Revert all edits for a single product
  const handleRevertSingle = (id: string) => {
    setEdits((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Revert all edits
  const handleRevertAll = () => {
    setEdits({});
  };

  // Save single product prices
  const handleSaveSingle = async (id: string) => {
    const productEdit = edits[id];
    if (!productEdit) return;

    setSavingId(id);
    setToast(null);

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

      handleRevertSingle(id);
      setToast({ type: 'success', message: 'Prix enregistré avec succès.' });
      setTimeout(() => setToast(null), 3000);
    } else {
      setToast({ type: 'error', message: res.error || 'Erreur lors de la sauvegarde.' });
    }

    setSavingId(null);
  };

  // Save all modified products in one bulk request
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
    setToast(null);

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
      setToast({ type: 'success', message: `${res.count} produit(s) mis à jour avec succès.` });
      setTimeout(() => setToast(null), 3500);
    } else {
      setToast({ type: 'error', message: res.error || 'Erreur lors de la sauvegarde globale.' });
    }

    setIsBulkSaving(false);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();

    return products.filter((p) => {
      // Search check
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category check
      if (selectedCategory !== 'ALL') {
        if (p.category?.toLowerCase().trim() !== selectedCategory.toLowerCase().trim()) {
          return false;
        }
      }

      // Margin filter check
      const currentEdit = edits[p.id];
      const cost = currentEdit?.purchasePrice !== undefined ? currentEdit.purchasePrice : (p.purchasePrice || 0);
      const sale = currentEdit?.priceTTC !== undefined ? currentEdit.priceTTC : p.priceTTC;
      const marginPct = cost > 0 ? ((sale - cost) / cost) * 100 : null;

      if (marginFilter === 'high') return marginPct !== null && marginPct >= 20;
      if (marginFilter === 'low') return marginPct !== null && marginPct < 20;
      if (marginFilter === 'unset') return cost <= 0;

      return true;
    });
  }, [products, search, selectedCategory, marginFilter, edits]);

  const modifiedCount = Object.keys(edits).length;

  return (
    <div className="prices-redesign-page">
      {/* ── 1. Top Header Bar (Dark Forest Teal) ─────────────────────────── */}
      <header className="pr-header">
        <div className="pr-header-left">
          <Link href="/products" className="pr-back-btn" title="Retour au catalogue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Catalogue</span>
          </Link>

          <div className="pr-header-titles">
            <h1 className="pr-header-title">Tarifs & Marges</h1>
            <span className="pr-header-count">
              {filteredProducts.length} référence{filteredProducts.length > 1 ? 's' : ''}
              {modifiedCount > 0 && ` • ${modifiedCount} modifiée${modifiedCount > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div className="pr-header-actions">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`pr-icon-btn ${showSearch ? 'is-active' : ''}`}
            aria-label="Rechercher"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* View Switcher (Cards / Table) */}
          <div className="pr-view-toggle">
            <button
              type="button"
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
              title="Vue Cartes"
            >
              Fiches
            </button>
            <button
              type="button"
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
              title="Vue Tableau"
            >
              Tableau
            </button>
          </div>
        </div>
      </header>

      {/* ── Search Drawer (Expandable) ────────────────────────────────────── */}
      {showSearch && (
        <div className="pr-search-drawer">
          <div className="pr-search-field">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              autoFocus
              placeholder="Rechercher par nom ou code SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="pr-search-clear"
                aria-label="Effacer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Toast Feedback Notification ───────────────────────────────────── */}
      {toast && (
        <div className={`pr-toast ${toast.type === 'success' ? 'success' : 'error'}`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="pr-toast-close">×</button>
        </div>
      )}

      {/* ── 2. KPI Summary Cards ─────────────────────────────────────────── */}
      <section className="pr-kpis-grid" aria-label="Statistiques tarifaires">
        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Articles</span>
          <strong className="pr-kpi-val text-slate">{stats.total}</strong>
          <span className="pr-kpi-hint">au catalogue</span>
        </div>

        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Coût renseigné</span>
          <strong className="pr-kpi-val text-teal">{stats.withCost} / {stats.total}</strong>
          <span className="pr-kpi-hint">
            {stats.total > 0 ? Math.round((stats.withCost / stats.total) * 100) : 0}% des articles
          </span>
        </div>

        <div className="pr-kpi-card">
          <span className="pr-kpi-label">Marge Moyenne</span>
          <strong className={`pr-kpi-val ${stats.avgMargin >= 20 ? 'text-teal' : stats.avgMargin > 0 ? 'text-amber' : 'text-danger'}`}>
            {stats.avgMargin > 0 ? `+${stats.avgMargin.toFixed(1)}%` : '—'}
          </strong>
          <span className="pr-kpi-hint">sur articles avec coût</span>
        </div>
      </section>

      {/* ── 3. Filters Toolbar (Category & Margin filters) ────────────────── */}
      <div className="pr-toolbar">
        {/* Rayon Selector */}
        <div className="pr-select-wrap">
          <select
            className="pr-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filtrer par rayon"
          >
            <option value="ALL">Tous les rayons ({products.length})</option>
            {availableCategories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Margin Pills */}
        <div className="pr-margin-pills">
          <button
            type="button"
            className={`pr-pill ${marginFilter === 'all' ? 'active' : ''}`}
            onClick={() => setMarginFilter('all')}
          >
            Toutes les marges
          </button>
          <button
            type="button"
            className={`pr-pill ${marginFilter === 'high' ? 'active' : ''}`}
            onClick={() => setMarginFilter('high')}
          >
            Marge forte (≥ 20%)
          </button>
          <button
            type="button"
            className={`pr-pill ${marginFilter === 'low' ? 'active' : ''}`}
            onClick={() => setMarginFilter('low')}
          >
            Marge faible (&lt; 20%)
          </button>
          <button
            type="button"
            className={`pr-pill ${marginFilter === 'unset' ? 'active' : ''}`}
            onClick={() => setMarginFilter('unset')}
          >
            Coût non renseigné
          </button>
        </div>
      </div>

      {/* ── 4. Main Body: Products List (Cards or Table) ─────────────────── */}
      <main className="pr-content-container">
        {filteredProducts.length === 0 ? (
          <div className="pr-empty-state">
            <div className="pr-empty-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#94A3B8">
                <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4V6z" opacity="0.9" />
                <path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9zm6 4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-4z" />
              </svg>
            </div>
            <h3>Aucun produit trouvé</h3>
            <p>Essayez de modifier votre recherche ou vos filtres de marge.</p>
            <button
              type="button"
              className="pr-empty-reset-btn"
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setMarginFilter('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* ── Mobile / Card View ────────────────────────────────────────── */
          <div className="pr-cards-stack">
            {filteredProducts.map((p) => {
              const currentEdit = edits[p.id];
              const cost = currentEdit?.purchasePrice !== undefined ? currentEdit.purchasePrice : (p.purchasePrice || 0);
              const sale = currentEdit?.priceTTC !== undefined ? currentEdit.priceTTC : p.priceTTC;
              const isModified = !!currentEdit;
              const unitsInPack = p.unitsPerCarton && p.unitsPerCarton > 1 ? p.unitsPerCarton : 1;
              const isPack = unitsInPack > 1;

              // Margin calculations
              const marginAmt = cost > 0 ? sale - cost : null;
              const marginPct = cost > 0 ? (marginAmt! / cost) * 100 : null;
              const mainImage = p.images.length > 0 ? p.images[0].url : null;

              return (
                <div key={p.id} className={`pr-item-card ${isModified ? 'is-modified' : ''}`}>
                  {/* Top: Thumbnail + Name + SKU + Category */}
                  <div className="pr-card-top">
                    <div className="pr-card-thumb">
                      {mainImage ? (
                        <Image
                          src={getProductImageSrc(mainImage)}
                          alt={p.name}
                          fill
                          sizes="48px"
                          className="pr-card-img"
                        />
                      ) : (
                        <div className="pr-card-box-placeholder">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="#94A3B8">
                            <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4V6z" opacity="0.9" />
                            <path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9zm6 4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-4z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="pr-card-head-info">
                      <h2 className="pr-card-name" title={p.name}>
                        {p.name}
                      </h2>
                      <div className="pr-card-badges">
                        <span className="pr-category-badge">{p.category}</span>
                        {isPack && <span className="pr-pack-badge">Casier {unitsInPack}</span>}
                        <span className="pr-sku-badge">SKU: {p.sku}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Inputs Grid (Purchase Cost & Sale Price) */}
                  <div className="pr-inputs-grid">
                    {/* Prix d'Achat */}
                    <div className="pr-input-cell">
                      <label className="pr-input-label">
                        Coût d&apos;achat / pc
                      </label>
                      <div className="pr-input-wrap">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={currentEdit?.purchasePrice !== undefined ? currentEdit.purchasePrice : (p.purchasePrice ?? '')}
                          onChange={(e) => handlePriceChange(p.id, 'purchasePrice', e.target.value)}
                          className="pr-field-input"
                        />
                        <span className="pr-field-currency">FCFA</span>
                      </div>
                      {isPack && cost > 0 && (
                        <span className="pr-input-pack-sub">
                          = {(cost * unitsInPack).toLocaleString('fr-FR')} F / pack
                        </span>
                      )}
                    </div>

                    {/* Prix de Vente TTC */}
                    <div className="pr-input-cell">
                      <label className="pr-input-label text-teal">
                        Prix de vente TTC / pc
                      </label>
                      <div className="pr-input-wrap is-highlight">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={currentEdit?.priceTTC !== undefined ? currentEdit.priceTTC : p.priceTTC}
                          onChange={(e) => handlePriceChange(p.id, 'priceTTC', e.target.value)}
                          className="pr-field-input text-teal"
                        />
                        <span className="pr-field-currency">FCFA</span>
                      </div>
                      {isPack && sale > 0 && (
                        <span className="pr-input-pack-sub">
                          = {(sale * unitsInPack).toLocaleString('fr-FR')} F / pack
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Margin Indicator & Save Trigger */}
                  <div className="pr-card-footer">
                    <div className="pr-margin-result">
                      {marginPct !== null ? (
                        <span className={`pr-margin-pill ${marginPct >= 20 ? 'good' : marginPct > 0 ? 'medium' : 'bad'}`}>
                          Marge : {marginAmt! >= 0 ? '+' : ''}{marginAmt!.toLocaleString('fr-FR')} F ({marginPct.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="pr-margin-pill unset">
                          Coût non renseigné
                        </span>
                      )}
                    </div>

                    {isModified && (
                      <div className="pr-card-actions">
                        <button
                          type="button"
                          onClick={() => handleRevertSingle(p.id)}
                          className="pr-card-btn-revert"
                          title="Annuler les modifications pour cet article"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={savingId === p.id}
                          onClick={() => handleSaveSingle(p.id)}
                          className="pr-card-btn-save"
                        >
                          {savingId === p.id ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Desktop / Table View ──────────────────────────────────────── */
          <div className="pr-table-wrapper">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Rayon</th>
                  <th>Conditionnement</th>
                  <th style={{ width: '180px' }}>Coût d&apos;Achat unitaire</th>
                  <th style={{ width: '180px' }}>Prix Vente TTC unitaire</th>
                  <th>Marge brute / pc</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const currentEdit = edits[p.id];
                  const cost = currentEdit?.purchasePrice !== undefined ? currentEdit.purchasePrice : (p.purchasePrice || 0);
                  const sale = currentEdit?.priceTTC !== undefined ? currentEdit.priceTTC : p.priceTTC;
                  const isModified = !!currentEdit;
                  const unitsInPack = p.unitsPerCarton && p.unitsPerCarton > 1 ? p.unitsPerCarton : 1;
                  const isPack = unitsInPack > 1;

                  const marginAmt = cost > 0 ? sale - cost : null;
                  const marginPct = cost > 0 ? (marginAmt! / cost) * 100 : null;
                  const mainImage = p.images.length > 0 ? p.images[0].url : null;

                  return (
                    <tr key={p.id} className={isModified ? 'is-modified-row' : ''}>
                      <td>
                        <div className="pr-table-product-cell">
                          <div className="pr-table-thumb">
                            {mainImage ? (
                              <Image
                                src={getProductImageSrc(mainImage)}
                                alt={p.name}
                                fill
                                sizes="36px"
                                className="pr-card-img"
                              />
                            ) : (
                              <span className="pr-table-thumb-init">{p.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <strong className="pr-table-name">{p.name}</strong>
                            <span className="pr-table-sku">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="pr-category-badge">{p.category}</span>
                      </td>

                      <td>
                        <span className="pr-pack-badge">{isPack ? `Casier de ${unitsInPack}` : 'Pièce'}</span>
                      </td>

                      <td>
                        <div className="pr-table-input-wrap">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={currentEdit?.purchasePrice !== undefined ? currentEdit.purchasePrice : (p.purchasePrice ?? '')}
                            placeholder="0"
                            onChange={(e) => handlePriceChange(p.id, 'purchasePrice', e.target.value)}
                            className="pr-table-field"
                          />
                          <span className="pr-field-currency">F</span>
                        </div>
                        {isPack && cost > 0 && (
                          <span className="pr-table-pack-sub">
                            {(cost * unitsInPack).toLocaleString('fr-FR')} F / pack
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="pr-table-input-wrap is-highlight">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={currentEdit?.priceTTC !== undefined ? currentEdit.priceTTC : p.priceTTC}
                            onChange={(e) => handlePriceChange(p.id, 'priceTTC', e.target.value)}
                            className="pr-table-field text-teal font-bold"
                          />
                          <span className="pr-field-currency">F</span>
                        </div>
                        {isPack && sale > 0 && (
                          <span className="pr-table-pack-sub">
                            {(sale * unitsInPack).toLocaleString('fr-FR')} F / pack
                          </span>
                        )}
                      </td>

                      <td>
                        {marginPct !== null ? (
                          <span className={`pr-margin-pill ${marginPct >= 20 ? 'good' : marginPct > 0 ? 'medium' : 'bad'}`}>
                            {marginAmt! >= 0 ? '+' : ''}{marginAmt!.toLocaleString('fr-FR')} F ({marginPct.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="pr-margin-pill unset">—</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isModified ? (
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => handleRevertSingle(p.id)}
                              className="pr-card-btn-revert"
                              title="Annuler"
                            >
                              ×
                            </button>
                            <button
                              type="button"
                              disabled={savingId === p.id}
                              onClick={() => handleSaveSingle(p.id)}
                              className="pr-card-btn-save"
                            >
                              {savingId === p.id ? '...' : 'Sauver'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>À jour</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── 5. Sticky Floating Bulk Save Bar ──────────────────────────────── */}
      {modifiedCount > 0 && (
        <aside className="pr-floating-save-bar" aria-label="Enregistrement groupé">
          <div className="pr-save-bar-info">
            <span className="pr-save-badge">{modifiedCount}</span>
            <span>
              article{modifiedCount > 1 ? 's' : ''} modifié{modifiedCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="pr-save-bar-actions">
            <button
              type="button"
              onClick={handleRevertAll}
              className="pr-save-btn-cancel"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isBulkSaving}
              onClick={handleBulkSave}
              className="pr-save-btn-submit"
            >
              {isBulkSaving ? (
                'Enregistrement...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Enregistrer tout ({modifiedCount})</span>
                </>
              )}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
