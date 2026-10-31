'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProductImageSrc } from '@/lib/product-images';
import { calculateStockBreakdown } from '@/lib/stock';

interface ProductWithImages {
  id: string;
  sku: string;
  name: string;
  category: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  priceHT: number;
  priceTTC: number;
  purchasePrice?: number | null;
  unitsPerCarton?: number;
  stock: number;
  minStock: number;
  images: { id: string; url: string }[];
}

interface ProductCatalogClientProps {
  products: ProductWithImages[];
  categories: string[];
  initialViewMode?: 'grid' | 'table';
  pageTitle?: string;
  pageSubtitle?: string;
  canManageProducts?: boolean;
  variant?: 'catalog' | 'products-only';
}

const SYSTEM_DEFAULT_CATEGORIES = [
  'Boissons & Jus',
  'Alimentaire & Épicerie',
  'Produits Frais & Laitiers',
  'Entretien & Ménage',
  'Hygiène & Beauté',
  'Boulangerie & Snacks',
  'Bazar & Divers',
];

export default function ProductCatalogClient({
  products,
  categories,
  canManageProducts = false,
}: ProductCatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductAction, setSelectedProductAction] = useState<ProductWithImages | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Trigger mobile drawer menu
  const handleOpenDrawer = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-mobile-drawer'));
    }
  };

  // Build category tabs strictly according to the user's system:
  // 1. "Tout" as the first tab
  // 2. Categories from the database (prisma.category) and existing products
  // 3. Fallback to system presets if the store has very few categories
  const allCategoryTabs = useMemo(() => {
    const existingCatsInProducts = Array.from(
      new Set(products.map((p) => p.category?.trim()).filter(Boolean))
    );

    // Merge categories from props, products, and system presets
    const mergedNames = Array.from(
      new Set([
        ...categories.map((c) => c.trim()).filter(Boolean),
        ...existingCatsInProducts,
        ...SYSTEM_DEFAULT_CATEGORIES,
      ])
    );

    // Tab "Tout"
    const tabs = [
      {
        id: 'all',
        label: 'Tout',
        iconType: 'grid',
        count: products.length,
      },
    ];

    for (const name of mergedNames) {
      const count = products.filter(
        (p) => p.category?.toLowerCase().trim() === name.toLowerCase().trim()
      ).length;

      tabs.push({
        id: name,
        label: name,
        iconType: getIconTypeForCategory(name),
        count,
      });
    }

    return tabs;
  }, [categories, products]);

  // Filter products by search and system category
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      // Search filter
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Category filter based on the user's system category
      if (selectedCategory !== 'all') {
        const matchesCategory =
          p.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
        if (!matchesCategory) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  // Overall store stats
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const totalStockValue = products.reduce((acc, p) => acc + p.priceTTC * p.stock, 0);

  // Active category tab object
  const activeTabObj = allCategoryTabs.find((t) => t.id === selectedCategory) || allCategoryTabs[0];

  return (
    <div className="zeynar-products-mobile-page">
      {/* ── 1. Top Header Bar (Dark Teal) ─────────────────────────────────── */}
      <header className="z-header">
        <div className="z-header-left">
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="z-icon-btn z-hamburger-btn"
            aria-label="Ouvrir le menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="z-header-titles">
            <div className="z-title-row">
              <h1 className="z-header-title">Produits</h1>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="z-info-trigger"
                aria-label="Informations catalogue"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2.5" />
                </svg>
              </button>
            </div>
            <span className="z-header-count">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="z-header-actions">
          {/* Search Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`z-icon-btn ${showSearch ? 'is-active' : ''}`}
            aria-label="Rechercher"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* New Product Button (Teal rounded square) */}
          <Link
            href="/products/new"
            className="z-teal-plus-btn"
            title="Ajouter un produit"
            aria-label="Ajouter un produit"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>

          {/* Pricing Button (Orange rounded square) */}
          <button
            type="button"
            onClick={() => setShowPriceModal(true)}
            className="z-orange-price-btn"
            title="Gérer les prix"
            aria-label="Gérer les prix"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <circle cx="12" cy="14" r="1.5" fill="#FFFFFF" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Search Bar Drawer (Slide down when search active) ─────────────── */}
      {showSearch && (
        <div className="z-search-drawer">
          <div className="z-search-field">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              autoFocus
              placeholder="Rechercher par nom, marque, référence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="z-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="z-search-clear"
                aria-label="Effacer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main className="z-content-container">
        {/* Active Category Banner Card (Matching Screenshot) */}
        <div className="z-active-cat-card">
          <div className="z-cat-card-icon">
            {renderCategoryIcon(activeTabObj.iconType, 24, '#00796B')}
          </div>
          <span className="z-cat-card-label">{activeTabObj.label}</span>
          <span className="z-cat-card-sub">
            {activeTabObj.id === 'all'
              ? `${products.length} référence${products.length > 1 ? 's' : ''} au catalogue`
              : `${activeTabObj.count} référence${activeTabObj.count > 1 ? 's' : ''} dans ce rayon`}
          </span>
        </div>

        {/* Product Cards Stack (Matching Screenshot) */}
        {filteredProducts.length === 0 ? (
          <div className="z-empty-state">
            <div className="z-empty-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#94A3B8">
                <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4V6z" opacity="0.9" />
                <path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9zm6 4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-4z" />
              </svg>
            </div>
            <h3>Aucun produit trouvé</h3>
            <p>
              {searchQuery
                ? `Aucun article ne correspond à "${searchQuery}".`
                : `Aucun produit enregistré pour le moment dans le rayon « ${activeTabObj.label} ».`}
            </p>
            <div className="z-empty-actions">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="z-empty-btn-reset"
                >
                  Effacer la recherche
                </button>
              ) : selectedCategory !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="z-empty-btn-reset"
                >
                  Voir tous les rayons
                </button>
              ) : null}
              <Link href="/products/new" className="z-empty-btn-add">
                + Ajouter un produit
              </Link>
            </div>
          </div>
        ) : (
          <div className="z-product-list">
            {filteredProducts.map((product) => {
              const mainImage = product.images.length > 0 ? product.images[0].url : null;
              const stockInfo = calculateStockBreakdown(product.stock, product.unitsPerCarton);
              const unitsInPack = product.unitsPerCarton || 1;

              // Format packaging description line: e.g. "Casier 24 - Bière blonde" ou "Casier 24 - 600 FCFA"
              const packagingLabel = unitsInPack > 1 ? `Casier ${unitsInPack}` : 'Pièce';
              const detailSnippet = product.shortDescription
                ? `${packagingLabel} - ${product.shortDescription}`
                : `${packagingLabel} - ${product.priceTTC.toLocaleString('fr-FR')} FCFA`;

              return (
                <div key={product.id} className="z-product-card">
                  {/* Left: Thumbnail or Box SVG */}
                  <div className="z-card-thumb">
                    {mainImage ? (
                      <Image
                        src={getProductImageSrc(mainImage)}
                        alt={product.name}
                        fill
                        sizes="60px"
                        className="z-card-img"
                      />
                    ) : (
                      <div className="z-card-box-placeholder">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="#94A3B8">
                          <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4V6z" opacity="0.95" />
                          <path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9zm6 4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Middle: Details */}
                  <div className="z-card-info">
                    <h2 className="z-card-name" title={product.name}>
                      <Link href={`/products/${product.id}`}>{product.name}</Link>
                    </h2>

                    <div className="z-card-brand-row">
                      <span className="z-brand-badge-dot" />
                      <span className="z-card-brand">{product.category}</span>
                    </div>

                    <div className="z-card-details-line" title={stockInfo.detailedText}>
                      <span className="z-card-desc">{detailSnippet}</span>
                      <span className="z-card-stock-pill">
                        {stockInfo.shortText}
                      </span>
                    </div>
                  </div>

                  {/* Right: Plus Button for Quick Actions */}
                  <button
                    type="button"
                    onClick={() => setSelectedProductAction(product)}
                    className="z-card-plus-btn"
                    title="Actions rapides"
                    aria-label={`Actions pour ${product.name}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── 2. Floating Action Button: "Gérer les prix" ───────────────────── */}
      <button
        type="button"
        onClick={() => setShowPriceModal(true)}
        className="z-floating-price-btn"
        aria-label="Gérer les prix"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <circle cx="12" cy="14" r="1.5" fill="#FFFFFF" />
        </svg>
        <span>Gérer les prix</span>
      </button>

      {/* ── 3. Bottom Category Bar (Basée sur les rayons du système) ───────── */}
      <nav className="z-bottom-nav" aria-label="Rayons du magasin">
        <div className="z-bottom-nav-inner">
          {allCategoryTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`z-nav-item ${isActive ? 'is-active' : ''}`}
                aria-selected={isActive}
                title={`${tab.label} (${tab.count} référence${tab.count > 1 ? 's' : ''})`}
              >
                <div className="z-nav-icon-wrap">
                  {renderCategoryIcon(tab.iconType, 20, isActive ? '#004D40' : '#FFFFFF')}
                </div>
                <span className="z-nav-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Modal / Bottom Sheet: Quick Product Actions ───────────────────── */}
      {selectedProductAction && (
        <div className="z-modal-overlay" onClick={() => setSelectedProductAction(null)}>
          <div className="z-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="z-sheet-drag-handle" />

            <div className="z-sheet-header">
              <div>
                <h3 className="z-sheet-title">{selectedProductAction.name}</h3>
                <span className="z-sheet-sku">{selectedProductAction.category} • SKU: {selectedProductAction.sku}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductAction(null)}
                className="z-sheet-close"
              >
                ×
              </button>
            </div>

            <div className="z-sheet-stock-summary">
              <div className="z-sheet-stat">
                <span className="z-sheet-stat-label">Prix de vente TTC</span>
                <strong className="z-sheet-stat-val text-teal">
                  {selectedProductAction.priceTTC.toLocaleString('fr-FR')} FCFA
                </strong>
              </div>
              <div className="z-sheet-stat">
                <span className="z-sheet-stat-label">Stock disponible</span>
                <strong className="z-sheet-stat-val">
                  {calculateStockBreakdown(selectedProductAction.stock, selectedProductAction.unitsPerCarton).summaryText}
                </strong>
              </div>
            </div>

            <div className="z-sheet-actions-list">
              <Link
                href={`/products/${selectedProductAction.id}`}
                className="z-sheet-action-link"
              >
                <span className="z-action-icon">✏️</span>
                <div>
                  <strong>Modifier la fiche article</strong>
                  <span>Modifier nom, prix, seuil d&apos;alerte, conditionnement</span>
                </div>
              </Link>

              <Link
                href="/pos"
                className="z-sheet-action-link"
              >
                <span className="z-action-icon">🛒</span>
                <div>
                  <strong>Aller à la caisse (Vente)</strong>
                  <span>Encaisser cet article à la caisse du supermarché</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Info Catalogue ─────────────────────────────────────────── */}
      {showInfoModal && (
        <div className="z-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="z-info-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="z-sheet-header">
              <h3 className="z-sheet-title">Informations Catalogue</h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="z-sheet-close"
              >
                ×
              </button>
            </div>

            <div className="z-info-stats-grid">
              <div className="z-info-stat-box">
                <span>Total Références</span>
                <strong>{products.length}</strong>
              </div>
              <div className="z-info-stat-box">
                <span>Unités en Stock</span>
                <strong>{totalStockUnits.toLocaleString('fr-FR')} pcs</strong>
              </div>
              <div className="z-info-stat-box warn">
                <span>Stock Faible</span>
                <strong>{lowStockCount}</strong>
              </div>
              <div className="z-info-stat-box danger">
                <span>Ruptures</span>
                <strong>{outOfStockCount}</strong>
              </div>
            </div>

            <div className="z-info-value-banner">
              <span>Valeur Marchande Totale</span>
              <strong>{totalStockValue.toLocaleString('fr-FR')} FCFA</strong>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="z-btn-modal-done"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Gérer les prix ─────────────────────────────────────────── */}
      {showPriceModal && (
        <div className="z-modal-overlay" onClick={() => setShowPriceModal(false)}>
          <div className="z-info-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="z-sheet-header">
              <h3 className="z-sheet-title">Gestion Rapide des Prix</h3>
              <button
                type="button"
                onClick={() => setShowPriceModal(false)}
                className="z-sheet-close"
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 1rem' }}>
              Pour modifier les prix d&apos;achat ou de vente d&apos;un article, sélectionnez le produit dans la liste pour accéder à sa fiche de tarification, ou rendez-vous en caisse.
            </p>

            <div className="z-sheet-actions-list">
              <Link
                href="/products/new"
                onClick={() => setShowPriceModal(false)}
                className="z-sheet-action-link"
              >
                <span className="z-action-icon">➕</span>
                <div>
                  <strong>Nouvel Article</strong>
                  <span>Enregistrer une nouvelle référence avec son prix de vente</span>
                </div>
              </Link>

              <Link
                href="/pos"
                onClick={() => setShowPriceModal(false)}
                className="z-sheet-action-link"
              >
                <span className="z-action-icon">💳</span>
                <div>
                  <strong>Ouvrir la Caisse POS</strong>
                  <span>Consulter les tarifs appliqués et scanner les codes-barres</span>
                </div>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setShowPriceModal(false)}
              className="z-btn-modal-done"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: Intelligent Category Icon Renderer ──────────────────────────────
function renderCategoryIcon(iconType: string, size: number = 20, color: string = 'currentColor') {
  switch (iconType) {
    case 'grid':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <rect x="3" y="3" width="4.5" height="4.5" rx="1" />
          <rect x="9.75" y="3" width="4.5" height="4.5" rx="1" />
          <rect x="16.5" y="3" width="4.5" height="4.5" rx="1" />
          <rect x="3" y="9.75" width="4.5" height="4.5" rx="1" />
          <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1" />
          <rect x="16.5" y="9.75" width="4.5" height="4.5" rx="1" />
          <rect x="3" y="16.5" width="4.5" height="4.5" rx="1" />
          <rect x="9.75" y="16.5" width="4.5" height="4.5" rx="1" />
          <rect x="16.5" y="16.5" width="4.5" height="4.5" rx="1" />
        </svg>
      );

    case 'beer':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 6v12a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V6" />
          <path d="M17 9h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3" />
          <path d="M7 6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2" />
          <line x1="10" y1="10" x2="10" y2="16" />
          <line x1="14" y1="10" x2="14" y2="16" />
        </svg>
      );

    case 'drink':
    case 'soda':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9h12l-1.5 11h-9L6 9z" />
          <path d="M5 9a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1" />
          <path d="M12 4v4" />
          <path d="m15 2-3 2" />
          <circle cx="10" cy="14" r="0.8" fill={color} />
          <circle cx="14" cy="16" r="0.8" fill={color} />
        </svg>
      );

    case 'wine':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 22h8" />
          <path d="M12 15v7" />
          <path d="M12 15a5 5 0 0 0 5-5V4H7v6a5 5 0 0 0 5 5z" />
        </svg>
      );

    case 'water':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4h10l-1.2 16H8.2L7 4z" />
          <path d="M8 10c1.5.8 2.5-.8 4 0s2.5.8 4 0" />
        </svg>
      );

    case 'grocery':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );

    case 'fresh':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="m17 7-5 5-5-5" />
          <path d="m17 17-5-5-5 5" />
          <path d="M2 12h20" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case 'fruit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c-1.5 0-3 1.5-3 3 0 1 .5 2 1.5 2.5C8 9 6 11 6 14c0 4 3 7 6 7s6-3 6-7c0-3-2-5-4.5-5.5C14.5 8 15 7 15 6c0-1.5-1.5-3-3-3z" />
          <path d="M12 3v3" />
        </svg>
      );

    case 'bakery':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14a8 8 0 0 1 16 0c0 3-2 5-8 5s-8-2-8-5Z" />
          <path d="M8 12c1-2 2-3 4-3s3 1 4 3" />
        </svg>
      );

    case 'cleaning':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m14 4 3 3-8 8H6v-3l8-8Z" />
          <path d="m18 8 2-2" />
          <path d="m20 14 1 1" />
          <path d="m15 19 1 1" />
        </svg>
      );

    case 'hygiene':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6v4H9z" />
          <path d="M10 7v3" />
          <path d="M6 10h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10z" />
          <circle cx="12" cy="15" r="1.5" />
        </svg>
      );

    case 'baby':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2h4v3h-4z" />
          <path d="M7 5h10v3H7z" />
          <path d="M7 8h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z" />
          <line x1="10" y1="12" x2="14" y2="12" />
          <line x1="10" y1="16" x2="14" y2="16" />
        </svg>
      );

    case 'general':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="4" width="10" height="16" rx="3" />
          <ellipse cx="12" cy="4" rx="5" ry="1.5" />
          <ellipse cx="12" cy="20" rx="5" ry="1.5" />
          <path d="M10 2h4" />
        </svg>
      );
  }
}

function getIconTypeForCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('bière') || n.includes('biere') || n.includes('beer')) return 'beer';
  if (n.includes('vin') || n.includes('alcool') || n.includes('liqueur') || n.includes('whisky')) return 'wine';
  if (n.includes('eau') || n.includes('water')) return 'water';
  if (n.includes('boisson') || n.includes('jus') || n.includes('soda') || n.includes('drink')) return 'drink';
  if (n.includes('frais') || n.includes('lait') || n.includes('fromage') || n.includes('yaourt')) return 'fresh';
  if (n.includes('fruit') || n.includes('légume') || n.includes('legume')) return 'fruit';
  if (n.includes('boulangerie') || n.includes('snack') || n.includes('pâtisserie') || n.includes('patisserie') || n.includes('pain') || n.includes('biscuit') || n.includes('confiserie') || n.includes('chocolat')) return 'bakery';
  if (n.includes('boucherie') || n.includes('viande') || n.includes('charcuterie') || n.includes('poisson')) return 'meat';
  if (n.includes('entretien') || n.includes('ménage') || n.includes('menage') || n.includes('nettoyage') || n.includes('lessive')) return 'cleaning';
  if (n.includes('hygiène') || n.includes('hygiene') || n.includes('beauté') || n.includes('beaute') || n.includes('santé') || n.includes('sante') || n.includes('cosmétique')) return 'hygiene';
  if (n.includes('bébé') || n.includes('bebe') || n.includes('puériculture')) return 'baby';
  if (n.includes('alimentaire') || n.includes('épicerie') || n.includes('epicerie') || n.includes('conserve') || n.includes('riz') || n.includes('pâte')) return 'grocery';
  return 'general';
}
