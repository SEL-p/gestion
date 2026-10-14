'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Search,
  Plus,
  Filter,
  Download,
  AlertTriangle,
  TrendingUp,
  Tag,
  ArrowUpDown,
  Barcode,
  ShoppingBag,
  Edit3,
  LayoutGrid,
  List,
  Boxes,
  Archive,
} from 'lucide-react';
import { getProductImageSrc } from '@/lib/product-images';

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
  /** Vue ouverte par défaut : "grid" (vitrine de cartes) ou "table" (Liste & Tableau) */
  initialViewMode?: 'grid' | 'table';
  /** Titre affiché en haut de page (personnalisable pour l'onglet Produits) */
  pageTitle?: string;
  /** Sous-titre affiché en haut de page */
  pageSubtitle?: string;
  canManageProducts?: boolean;
  /**
   * "catalog" (défaut) : catalogue complet (titre, actions, KPI, filtres, cartes ou tableau).
   * "products-only" : vitrine des articles enregistrés (bannière, recherche/filtres, cartes par
   * défaut), sans l'en-tête standard ni les KPI du catalogue (cf. .products-only-view).
   */
  variant?: 'catalog' | 'products-only';
}

export default function ProductCatalogClient({
  products,
  categories,
  initialViewMode = 'grid',
  pageTitle = 'Catalogue & Rayons Supermarché',
  pageSubtitle = 'Gérez vos références articles, contrôlez les stocks et préparez vos rayons.',
  canManageProducts = false,
  variant = 'catalog',
}: ProductCatalogClientProps) {
  // Mode "Produits" : on n'affiche que la liste des produits (cf. .products-only-view)
  const isProductsOnly = variant === 'products-only';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name');
  // Mode d'affichage : "Cartes" (vitrine en grille) ou "Liste / Tableau"
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(initialViewMode);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search query
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          (product.shortDescription && product.shortDescription.toLowerCase().includes(q));

        // Category filter
        const matchesCategory =
          selectedCategory === 'all' || product.category === selectedCategory;

        // Stock filter
        let matchesStock = true;
        if (stockFilter === 'in_stock') {
          matchesStock = product.stock > product.minStock;
        } else if (stockFilter === 'low_stock') {
          matchesStock = product.stock > 0 && product.stock <= product.minStock;
        } else if (stockFilter === 'out_of_stock') {
          matchesStock = product.stock === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price_asc') return a.priceTTC - b.priceTTC;
        if (sortBy === 'price_desc') return b.priceTTC - a.priceTTC;
        if (sortBy === 'stock_asc') return a.stock - b.stock;
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  // Overall Statistics
  const totalArticles = products.length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const totalStockValue = products.reduce((acc, p) => acc + p.priceTTC * p.stock, 0);
  const criticalCount = outOfStockCount + lowStockCount;
  // Aucune référence en base : on masque les filtres pour afficher un état d'accueil soigné
  const hasNoProducts = products.length === 0;

  return (
    <div className={`catalog-page-container${isProductsOnly ? ' products-only-view' : ''}${hasNoProducts ? ' is-empty' : ''}`}>
      {/* En-tête : bannière dédiée à l'onglet "Produits", en-tête standard sinon */}
      {isProductsOnly ? (
        <div className="plp-hero">
          <div className="plp-hero-main">
            <div className="plp-hero-icon">
              <Boxes size={26} />
            </div>
            <div className="plp-hero-text">
              <span className="plp-hero-eyebrow">Gestion des références</span>
              <h1 className="plp-hero-title">{pageTitle}</h1>
              <p className="plp-hero-subtitle">{pageSubtitle}</p>
            </div>
          </div>

          <div className="plp-hero-actions">
            {canManageProducts && (
              <Link href="/products/archived" className="btn btn-outline plp-hero-btn">
                <Archive size={16} />
                <span>Archivés</span>
              </Link>
            )}
            <Link href="/api/csv" className="btn btn-outline plp-hero-btn" target="_blank" download>
              <Download size={16} />
              <span>Exporter CSV</span>
            </Link>
            <Link href="/products/new" className="btn btn-primary plp-hero-btn">
              <Plus size={18} />
              <span>Nouvel Article</span>
            </Link>
          </div>

          <div className="plp-hero-stats">
            <div className="plp-hero-stat">
              <strong>{totalArticles}</strong>
              <span>Références</span>
            </div>
            <div className="plp-hero-stat">
              <strong>{categories.length}</strong>
              <span>Rayons</span>
            </div>
            <div className="plp-hero-stat">
              <strong>{criticalCount}</strong>
              <span>En alerte stock</span>
            </div>
            <div className="plp-hero-stat">
              <strong>{totalStockValue.toLocaleString('fr-FR')} FCFA</strong>
              <span>Valeur du stock</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="catalog-header-bar">
          <div>
            <h1 className="catalog-title">{pageTitle}</h1>
            <p className="catalog-subtitle">
              {pageSubtitle}
            </p>
          </div>
          <div className="catalog-actions-group">
            {canManageProducts && (
              <Link href="/products/archived" className="btn btn-outline">
                <Archive size={16} />
                <span>Archivés</span>
              </Link>
            )}
            <Link href="/api/csv" className="btn btn-outline btn-export" target="_blank" download>
              <Download size={16} />
              <span>Exporter CSV</span>
            </Link>
            <Link href="/products/new" className="btn btn-primary btn-add-product">
              <Plus size={18} />
              <span>Nouvel Article</span>
            </Link>
          </div>
        </div>
      )}

      {/* View Mode Tabs : Cartes / Liste & Tableau */}
      <div
        className="catalog-view-tabs"
        role="tablist"
        aria-label="Mode d'affichage du catalogue"
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'grid'}
          className={`catalog-view-tab ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid size={16} />
          <span>Cartes</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'table'}
          className={`catalog-view-tab ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          <List size={16} />
          <span>Liste & Tableau</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="catalog-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-teal">
            <Package size={22} />
          </div>
          <div>
            <div className="kpi-label">Références Totales</div>
            <div className="kpi-value">{totalArticles} articles</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-amber">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="kpi-label">Stock Critique / Ruptures</div>
            <div className="kpi-value text-danger">
              {criticalCount} références
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-purple">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="kpi-label">Valeur Marchande du Stock</div>
            <div className="kpi-value">{totalStockValue.toLocaleString('fr-FR')} FCFA</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="catalog-toolbar-card">
        <div className="toolbar-search-row">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, référence SKU, code-barres, rayon..."
              className="toolbar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="toolbar-select-group">
            <div className="select-wrapper">
              <ArrowUpDown size={15} className="select-icon" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="toolbar-select"
              >
                <option value="name">Trier par Nom (A-Z)</option>
                <option value="price_asc">Prix : Moins cher d'abord</option>
                <option value="price_desc">Prix : Plus cher d'abord</option>
                <option value="stock_asc">Stock : Plus bas d'abord</option>
                <option value="stock_desc">Stock : Plus haut d'abord</option>
              </select>
            </div>

            <div className="select-wrapper">
              <Filter size={15} className="select-icon" />
              <select
                value={stockFilter}
                onChange={(e: any) => setStockFilter(e.target.value)}
                className="toolbar-select"
              >
                <option value="all">Tous les stocks</option>
                <option value="in_stock">En stock normal</option>
                <option value="low_stock">Stock faible (alerte)</option>
                <option value="out_of_stock">Rupture de stock (0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="category-pills-slider">
          <button
            type="button"
            className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Tous les rayons ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des produits (tableau) ou état vide */}
      {filteredProducts.length === 0 ? (
        <div className="catalog-empty-state">
          <div className="empty-icon-wrap">
            {hasNoProducts ? <Package size={44} /> : <Search size={44} />}
          </div>

          {hasNoProducts ? (
            <>
              <span className="empty-eyebrow">Catalogue vide</span>
              <h3>Aucun produit enregistré</h3>
              <p>
                Créez votre première référence : elle s&apos;affichera ici avec son prix HT/TTC,
                son stock, sa marge et son seuil d&apos;alerte automatiquement surveillé.
              </p>

              <div className="empty-actions">
                <Link href="/products/new" className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Créer mon premier article</span>
                </Link>
                <Link href="/categories" className="btn btn-outline btn-sm">
                  <Tag size={16} />
                  <span>Préparer mes rayons</span>
                </Link>
              </div>

              <div className="empty-hints">
                <div className="empty-hint">
                  <div className="empty-hint-icon icon-teal">
                    <Plus size={16} />
                  </div>
                  <strong>1. Créer</strong>
                  <span>Nom, SKU, code-barres, prix d&apos;achat et de vente, seuil d&apos;alerte.</span>
                </div>
                <div className="empty-hint">
                  <div className="empty-hint-icon icon-purple">
                    <Tag size={16} />
                  </div>
                  <strong>2. Classer</strong>
                  <span>Rangez chaque référence dans un rayon pour filtrer le catalogue.</span>
                </div>
                <div className="empty-hint">
                  <div className="empty-hint-icon icon-amber">
                    <AlertTriangle size={16} />
                  </div>
                  <strong>3. Surveiller</strong>
                  <span>Le stock baisse à chaque vente, les ruptures remontent dans Alertes.</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="empty-eyebrow">Aucun résultat</span>
              <h3>Aucun article ne correspond à votre recherche</h3>
              <p>Essayez de modifier vos filtres ou ajoutez une nouvelle référence.</p>
              <div className="empty-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setStockFilter('all');
                  }}
                >
                  Réinitialiser les filtres
                </button>
                <Link href="/products/new" className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Créer un article</span>
                </Link>
              </div>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="catalog-product-grid">
          {filteredProducts.map((product) => {
            const mainImage = product.images.length > 0 ? product.images[0].url : null;
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStock;

            return (
              <div key={product.id} className="catalog-card">
                {/* Image & Status Badge */}
                <div className="catalog-card-image-wrapper">
                  {mainImage ? (
                    <Image
                      src={getProductImageSrc(mainImage)}
                      alt={product.name}
                      fill
                      className="catalog-card-image"
                    />
                  ) : (
                    <div className="catalog-card-no-image">
                      <Package size={36} color="#94A3B8" />
                    </div>
                  )}

                  <span className="card-category-pill">{product.category}</span>

                  {isOutOfStock ? (
                    <span className="card-stock-badge badge-rupture">Rupture</span>
                  ) : isLowStock ? (
                    <span className="card-stock-badge badge-warning">Stock Faible</span>
                  ) : (
                    <span className="card-stock-badge badge-ok">En Stock</span>
                  )}
                </div>

                {/* Body Content */}
                <div className="catalog-card-body">
                  <div className="card-sku-code">
                    <Barcode size={14} />
                    <span>{product.sku}</span>
                  </div>

                  <h3 className="card-product-name" title={product.name}>
                    {product.name}
                  </h3>

                  {product.shortDescription && (
                    <p className="card-product-desc" title={product.shortDescription}>
                      {product.shortDescription}
                    </p>
                  )}

                  {/* Pricing and Margin */}
                  <div className="card-pricing-block">
                    <div>
                      <div className="price-ttc-value">
                        {product.priceTTC.toLocaleString('fr-FR')}{' '}
                        <span className="curr">FCFA</span>
                      </div>
                      {product.priceHT && (
                        <div className="price-ht-value">
                          HT : {product.priceHT.toLocaleString('fr-FR')} FCFA
                        </div>
                      )}
                    </div>

                    <div className="card-stock-indicator">
                      <div className="stock-count">
                        <strong>{product.stock}</strong> en rayon
                      </div>
                      <div className="stock-min">Seuil : {product.minStock}</div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="card-footer-actions">
                    <Link
                      href={`/products/${product.id}`}
                      className="btn-card-action btn-edit"
                      title="Modifier la fiche"
                    >
                      <Edit3 size={15} />
                      <span>Modifier</span>
                    </Link>

                    <Link
                      href="/pos"
                      className="btn-card-action btn-sell"
                      title="Vendre à la caisse"
                    >
                      <ShoppingBag size={15} />
                      <span>Caisse</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="catalog-table-wrapper">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Rayon</th>
                <th style={{ textAlign: 'right' }}>Prix HT</th>
                <th style={{ textAlign: 'right' }}>Prix TTC</th>
                <th style={{ textAlign: 'right' }}>Marge</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'center' }}>Statut</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const mainImage = product.images.length > 0 ? product.images[0].url : null;
                const isOutOfStock = product.stock === 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStock;
                const margin = (product.purchasePrice && product.purchasePrice > 0)
                  ? product.priceTTC - product.purchasePrice
                  : null;

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="catalog-table-product">
                        <div className="catalog-table-thumb">
                          {mainImage ? (
                            <Image
                              src={getProductImageSrc(mainImage)}
                              alt={product.name}
                              fill
                              className="catalog-table-thumb-img"
                            />
                          ) : (
                            <Package size={20} color="#94A3B8" />
                          )}
                        </div>
                        <div className="catalog-table-info">
                          <span className="catalog-table-name" title={product.name}>
                            {product.name}
                          </span>
                          <span className="catalog-table-sku">
                            <Barcode size={12} /> {product.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="catalog-table-cat">{product.category}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {product.priceHT ? `${product.priceHT.toLocaleString('fr-FR')} FCFA` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="catalog-table-price">
                        {product.priceTTC.toLocaleString('fr-FR')} FCFA
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {margin !== null ? (
                        <span className="catalog-table-margin">
                          {margin.toLocaleString('fr-FR')} FCFA
                        </span>
                      ) : (
                        <span className="catalog-table-muted">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="catalog-table-stock">{product.stock}</span>
                      <span className="catalog-table-min">seuil {product.minStock}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isOutOfStock ? (
                        <span className="table-status-pill pill-rupture">Rupture</span>
                      ) : isLowStock ? (
                        <span className="table-status-pill pill-warning">Stock Faible</span>
                      ) : (
                        <span className="table-status-pill pill-ok">En Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="catalog-table-actions">
                        <Link
                          href={`/products/${product.id}`}
                          className="btn-card-action btn-edit"
                          title="Modifier la fiche"
                        >
                          <Edit3 size={15} />
                        </Link>
                        <Link
                          href="/pos"
                          className="btn-card-action btn-sell"
                          title="Vendre à la caisse"
                        >
                          <ShoppingBag size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
