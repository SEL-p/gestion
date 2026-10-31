'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  TrendingDown,
  Search,
  CheckCircle2,
  Plus,
  ArrowRight,
  Package,
  Layers,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { getProductImageSrc } from '@/lib/product-images';
import { calculateStockBreakdown } from '@/lib/stock';
import { updateStock } from '@/actions/product';

interface LowStockProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceHT: number;
  priceTTC: number;
  purchasePrice?: number | null;
  unitsPerCarton?: number;
  stock: number;
  minStock: number;
  images: { id?: string; url: string }[];
}

export default function AlertsClient({
  products: initialProducts,
}: {
  products: LowStockProduct[];
}) {
  const [products, setProducts] = useState<LowStockProduct[]>(initialProducts);
  const [filterType, setFilterType] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [search, setSearch] = useState('');

  // Quick Restock Modal State
  const [restockProduct, setRestockProduct] = useState<LowStockProduct | null>(null);
  const [restockMode, setRestockMode] = useState<'packs' | 'units'>('packs');
  const [restockQty, setRestockQty] = useState<number | ''>('');
  const [restockLoading, setRestockLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const outOfStock = useMemo(() => products.filter((p) => p.stock === 0), [products]);
  const lowStock = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= p.minStock), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matches =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      if (!matches) return false;
      if (filterType === 'out_of_stock') return p.stock === 0;
      if (filterType === 'low_stock') return p.stock > 0 && p.stock <= p.minStock;
      return true;
    });
  }, [products, search, filterType]);

  const handleOpenRestock = (p: LowStockProduct) => {
    const isPack = (p.unitsPerCarton || 1) > 1;
    setRestockProduct(p);
    setRestockMode(isPack ? 'packs' : 'units');
    setRestockQty('');
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;

    const num = typeof restockQty === 'number' && restockQty > 0 ? restockQty : 0;
    if (num <= 0) return;

    const unitsInPack = restockProduct.unitsPerCarton && restockProduct.unitsPerCarton > 1 ? restockProduct.unitsPerCarton : 1;
    const totalUnitsToAdd = restockMode === 'packs' ? num * unitsInPack : num;

    setRestockLoading(true);
    try {
      await updateStock(restockProduct.id, totalUnitsToAdd);

      // Update state locally
      setProducts((prev) =>
        prev
          .map((p) =>
            p.id === restockProduct.id ? { ...p, stock: p.stock + totalUnitsToAdd } : p
          )
          .filter((p) => p.stock <= p.minStock) // Remove if restored above minStock
      );

      setToast({
        type: 'success',
        message: `+${totalUnitsToAdd} pièce(s) ajoutée(s) pour ${restockProduct.name}.`,
      });
      setTimeout(() => setToast(null), 3500);
      setRestockProduct(null);
    } catch {
      setToast({ type: 'error', message: "Erreur lors du réapprovisionnement." });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setRestockLoading(false);
    }
  };

  return (
    <div className="alerts-redesign-page">
      {/* ── 1. Forest Teal Header ─────────────────────────────────────────── */}
      <header className="alerts-top-header">
        <div className="alerts-header-left">
          <Link href="/products" className="alerts-back-btn" title="Retour catalogue">
            ← <span>Catalogue</span>
          </Link>
          <div className="alerts-header-title-wrap">
            <h1 className="alerts-main-title">Alertes & Ruptures</h1>
            <span className="alerts-count-sub">
              {filtered.length} article(s) sous le seuil d&apos;alerte
            </span>
          </div>
        </div>

        <Link href="/pos" className="alerts-cta-pos" title="Ouvrir la caisse">
          Caisse POS
        </Link>
      </header>

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div className={`alerts-toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* ── 2. KPI Summary Cards ─────────────────────────────────────────── */}
      <section className="alerts-kpi-summary">
        <div
          className={`alerts-summary-card ${filterType === 'out_of_stock' ? 'is-active-filter' : ''}`}
          onClick={() => setFilterType(filterType === 'out_of_stock' ? 'all' : 'out_of_stock')}
        >
          <div className="alerts-card-badge-icon icon-danger">
            <TrendingDown size={20} />
          </div>
          <span className="alerts-summary-label">Rupture Totale (0 pc)</span>
          <strong className="alerts-summary-number text-danger">
            {outOfStock.length}
          </strong>
          <span className="alerts-summary-hint">Ventes impossibles</span>
        </div>

        <div
          className={`alerts-summary-card ${filterType === 'low_stock' ? 'is-active-filter' : ''}`}
          onClick={() => setFilterType(filterType === 'low_stock' ? 'all' : 'low_stock')}
        >
          <div className="alerts-card-badge-icon icon-amber">
            <AlertTriangle size={20} />
          </div>
          <span className="alerts-summary-label">Stock Critique (≤ min)</span>
          <strong className="alerts-summary-number text-amber">
            {lowStock.length}
          </strong>
          <span className="alerts-summary-hint">À commander d&apos;urgence</span>
        </div>
      </section>

      {/* ── 3. Search & Filter Bar ─────────────────────────────────────────── */}
      <div className="alerts-toolbar">
        <div className="alerts-search-box">
          <Search size={18} className="alerts-search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, SKU ou rayon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="alerts-search-field"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="alerts-search-clear"
            >
              ×
            </button>
          )}
        </div>

        <div className="alerts-filter-pills">
          <button
            type="button"
            className={`alerts-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Toutes ({products.length})
          </button>
          <button
            type="button"
            className={`alerts-pill ${filterType === 'out_of_stock' ? 'active' : ''}`}
            onClick={() => setFilterType('out_of_stock')}
          >
            Ruptures ({outOfStock.length})
          </button>
          <button
            type="button"
            className={`alerts-pill ${filterType === 'low_stock' ? 'active' : ''}`}
            onClick={() => setFilterType('low_stock')}
          >
            Stock Faible ({lowStock.length})
          </button>
        </div>
      </div>

      {/* ── 4. Main Products List ─────────────────────────────────────────── */}
      <main className="alerts-items-container">
        {filtered.length === 0 ? (
          <div className="alerts-empty-state">
            <CheckCircle2 size={48} color="#059669" />
            <h3>Aucune alerte de stock</h3>
            <p>Tous vos articles sont au-dessus de leur seuil minimal de réapprovisionnement.</p>
            <Link href="/products" className="alerts-empty-link">
              Retourner au catalogue
            </Link>
          </div>
        ) : (
          <div className="alerts-cards-stack">
            {filtered.map((p) => {
              const stockInfo = calculateStockBreakdown(p.stock, p.unitsPerCarton);
              const isRupture = p.stock === 0;
              const mainImg = p.images && p.images.length > 0 ? p.images[0].url : null;
              const isPack = (p.unitsPerCarton || 1) > 1;

              return (
                <div key={p.id} className={`alerts-product-card ${isRupture ? 'is-rupture' : ''}`}>
                  <div className="alerts-card-top">
                    <div className="alerts-card-thumb">
                      {mainImg ? (
                        <Image
                          src={getProductImageSrc(mainImg)}
                          alt={p.name}
                          fill
                          sizes="50px"
                          className="alerts-card-img"
                        />
                      ) : (
                        <span className="alerts-card-thumb-initial">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="alerts-card-main-meta">
                      <h2 className="alerts-card-name">{p.name}</h2>
                      <div className="alerts-card-badges">
                        <span className="alerts-cat-badge">{p.category}</span>
                        {isPack && (
                          <span className="alerts-pack-badge">
                            Casier de {p.unitsPerCarton}
                          </span>
                        )}
                        <span className="alerts-sku-badge">SKU: {p.sku}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Breakdown Box */}
                  <div className="alerts-card-stock-box">
                    <div className="alerts-stock-status-line">
                      <span className="alerts-stock-label">Stock Actuel :</span>
                      <strong className={`alerts-stock-val ${isRupture ? 'text-danger' : 'text-amber'}`}>
                        {p.stock} pièce{p.stock > 1 ? 's' : ''} {isRupture ? '(Rupture)' : ''}
                      </strong>
                    </div>

                    <div className="alerts-stock-detail-sub">
                      <span>{stockInfo.detailedText}</span>
                      <span className="alerts-threshold-tag">
                        Seuil alerte : {p.minStock} pcs
                      </span>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="alerts-card-actions">
                    <Link
                      href={`/products/${p.id}`}
                      className="alerts-btn-view"
                    >
                      Fiche article
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenRestock(p)}
                      className="alerts-btn-restock"
                    >
                      <Plus size={16} />
                      <span>Réapprovisionner</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── 5. Quick Restock Modal ────────────────────────────────────────── */}
      {restockProduct && (
        <div
          className="alerts-modal-overlay"
          onClick={() => setRestockProduct(null)}
        >
          <div
            className="alerts-restock-modal animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="alerts-modal-header">
              <h3>Réapprovisionner le Stock</h3>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="alerts-modal-close"
              >
                ×
              </button>
            </div>

            <div className="alerts-modal-item-summary">
              <strong>{restockProduct.name}</strong>
              <span>
                Stock actuel : {restockProduct.stock} pcs • Seuil : {restockProduct.minStock} pcs
              </span>
            </div>

            <form onSubmit={handleRestockSubmit} className="alerts-restock-form">
              {/* Pack vs Unit mode switcher */}
              {(restockProduct.unitsPerCarton || 1) > 1 && (
                <div className="alerts-restock-mode-tabs">
                  <button
                    type="button"
                    className={`alerts-mode-tab ${restockMode === 'packs' ? 'active' : ''}`}
                    onClick={() => setRestockMode('packs')}
                  >
                    En Packs / Casiers ({restockProduct.unitsPerCarton} pcs)
                  </button>
                  <button
                    type="button"
                    className={`alerts-mode-tab ${restockMode === 'units' ? 'active' : ''}`}
                    onClick={() => setRestockMode('units')}
                  >
                    À l&apos;unité (Pièces)
                  </button>
                </div>
              )}

              <div className="alerts-input-group">
                <label>
                  {restockMode === 'packs'
                    ? `Nombre de casiers / packs à réceptionner (x ${restockProduct.unitsPerCarton} pcs)`
                    : 'Nombre de pièces détachées à ajouter'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  placeholder={restockMode === 'packs' ? 'Ex: 5 packs' : 'Ex: 24 pièces'}
                  value={restockQty}
                  onChange={(e) =>
                    setRestockQty(e.target.value ? parseInt(e.target.value, 10) : '')
                  }
                  className="alerts-qty-field"
                />
              </div>

              {typeof restockQty === 'number' && restockQty > 0 && (
                <div className="alerts-total-preview-box">
                  = +
                  {restockMode === 'packs'
                    ? restockQty * (restockProduct.unitsPerCarton || 1)
                    : restockQty}{' '}
                  pièces ajoutées au stock total
                </div>
              )}

              <div className="alerts-modal-footer">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="alerts-modal-cancel"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={restockLoading || !restockQty}
                  className="alerts-modal-confirm"
                >
                  {restockLoading ? 'Ajout...' : 'Confirmer la réception'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
