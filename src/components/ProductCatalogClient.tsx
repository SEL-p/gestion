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
  Layers,
  TrendingUp,
  Tag,
  ArrowUpDown,
  Barcode,
  ShoppingBag,
  ExternalLink,
  Edit3,
} from 'lucide-react';

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
}

export default function ProductCatalogClient({
  products,
  categories,
}: ProductCatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name');

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

  return (
    <div className="catalog-page-container">
      {/* Top Header */}
      <div className="catalog-header-bar">
        <div>
          <h1 className="catalog-title">Catalogue & Rayons SupermarchÃ©</h1>
          <p className="catalog-subtitle">
            GÃ©rez vos rÃ©fÃ©rences articles, contrÃ´lez les stocks et prÃ©parez vos rayons.
          </p>
        </div>
        <div className="catalog-actions-group">
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

      {/* KPI Stats Bar */}
      <div className="catalog-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper icon-teal">
            <Package size={22} />
          </div>
          <div>
            <div className="kpi-label">RÃ©fÃ©rences Totales</div>
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
              {outOfStockCount + lowStockCount} rÃ©fÃ©rences
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
              placeholder="Rechercher par nom, rÃ©fÃ©rence SKU, code-barres, rayon..."
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
                Ã—
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

      {/* Product Grid / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="catalog-empty-state">
          <div className="empty-icon-wrap">
            <ShoppingBag size={48} />
          </div>
          <h3>Aucun article ne correspond Ã  votre recherche</h3>
          <p>Essayez de modifier vos filtres ou ajoutez une nouvelle rÃ©fÃ©rence.</p>
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
              RÃ©initialiser les filtres
            </button>
            <Link href="/products/new" className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>CrÃ©er un article</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="catalog-product-grid">
          {filteredProducts.map((product) => {
            const mainImage = product.images.length > 0 ? product.images[0].url : null;
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStock;
            const margin = (product.purchasePrice && product.purchasePrice > 0)
              ? product.priceTTC - product.purchasePrice
              : null;

            return (
              <div key={product.id} className="catalog-card">
                {/* Image & Status Badge */}
                <div className="catalog-card-image-wrapper">
                  {mainImage ? (
                    <Image
                      src={mainImage}
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
                      title="Vendre Ã  la caisse"
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
      )}
    </div>
  );
}
