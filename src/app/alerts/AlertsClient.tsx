'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  Package,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Search,
  CheckCircle2,
  Box,
  ShoppingCart,
  DollarSign,
  Barcode,
} from 'lucide-react';

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
  images: { id: string; url: string }[];
}

export default function AlertsClient({
  products,
}: {
  products: LowStockProduct[];
}) {
  const [filterType, setFilterType] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [search, setSearch] = useState('');

  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'out_of_stock') return matchesSearch && p.stock === 0;
    if (filterType === 'low_stock') return matchesSearch && p.stock > 0;
    return matchesSearch;
  });

  return (
    <div className="alerts-page-container">
      {/* Header */}
      <div className="alerts-header-bar">
        <div>
          <div className="alerts-badge-title">
            <AlertTriangle size={18} />
            <span>Centre de Réapprovisionnement</span>
          </div>
          <h1 className="alerts-title">Alertes & Ruptures de Stock</h1>
          <p className="alerts-subtitle">
            Surveillez les articles en rupture ou sous le seuil critique pour éviter les pertes de ventes en caisse.
          </p>
        </div>
        <Link href="/products" className="btn btn-outline">
          <span>Voir tout l'inventaire</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="alerts-kpi-grid">
        <div
          className={`alerts-kpi-card ${filterType === 'out_of_stock' ? 'active-filter' : ''}`}
          onClick={() => setFilterType(filterType === 'out_of_stock' ? 'all' : 'out_of_stock')}
        >
          <div className="alerts-kpi-icon-wrap icon-rupture">
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="alerts-kpi-label">Ruptures Totales (Stock 0)</div>
            <div className="alerts-kpi-val text-rupture">{outOfStock.length} articles</div>
          </div>
        </div>

        <div
          className={`alerts-kpi-card ${filterType === 'low_stock' ? 'active-filter' : ''}`}
          onClick={() => setFilterType(filterType === 'low_stock' ? 'all' : 'low_stock')}
        >
          <div className="alerts-kpi-icon-wrap icon-warning">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="alerts-kpi-label">Sous Seuil d'Alerte</div>
            <div className="alerts-kpi-val text-warning">{lowStock.length} articles</div>
          </div>
        </div>

        <div className="alerts-kpi-card">
          <div className="alerts-kpi-icon-wrap icon-teal">
            <Package size={24} />
          </div>
          <div>
            <div className="alerts-kpi-label">Total Articles Critiques</div>
            <div className="alerts-kpi-val">{products.length} références</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="alerts-toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Filtrer les alertes par nom, SKU ou catégorie..."
            className="toolbar-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content Grid */}
      {products.length === 0 ? (
        <div className="alerts-all-good-card">
          <div className="all-good-icon">
            <CheckCircle2 size={54} color="#10B981" />
          </div>
          <h2>Tout est en ordre !</h2>
          <p>Tous les articles de votre supermarché ont un stock suffisant supérieur au seuil d'alerte.</p>
          <Link href="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Consulter le catalogue
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="alerts-empty-search">
          <p>Aucun article critique ne correspond à votre filtre.</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearch('');
              setFilterType('all');
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="alerts-items-grid">
          {filtered.map((item) => {
            const isZero = item.stock === 0;
            const mainImg = item.images.length > 0 ? item.images[0].url : null;
            const unitsPerCarton = item.unitsPerCarton || 1;
            const recommendedCartons = Math.max(1, Math.ceil((item.minStock * 3 - item.stock) / unitsPerCarton));

            return (
              <div key={item.id} className={`alert-product-card ${isZero ? 'border-rupture' : 'border-warning'}`}>
                <div className="alert-card-header">
                  <div className="alert-img-wrap">
                    {mainImg ? (
                      <Image src={mainImg} alt={item.name} fill className="alert-img" />
                    ) : (
                      <Package size={28} color="#94A3B8" />
                    )}
                  </div>
                  <div className="alert-item-info">
                    <span className="alert-category-tag">{item.category}</span>
                    <h3 className="alert-item-name" title={item.name}>{item.name}</h3>
                    <div className="alert-item-sku">
                      <Barcode size={13} />
                      <span>{item.sku}</span>
                    </div>
                  </div>
                </div>

                <div className="alert-stock-metrics">
                  <div className="metric-box current-stock">
                    <span className="metric-lbl">Stock Actuel</span>
                    <span className={`metric-num ${isZero ? 'num-zero' : 'num-low'}`}>
                      {item.stock} unités
                    </span>
                  </div>
                  <div className="metric-box min-stock">
                    <span className="metric-lbl">Seuil Minimum</span>
                    <span className="metric-num">{item.minStock} unités</span>
                  </div>
                </div>

                {/* Replenishment suggestion */}
                <div className="alert-reorder-suggestion">
                  <Box size={14} color="#00796B" />
                  <span>
                    Conseil : Commander <strong>{recommendedCartons} carton(s)</strong> ({recommendedCartons * unitsPerCarton} unités)
                  </span>
                </div>

                <div className="alert-card-actions">
                  <Link href={`/products/${item.id}`} className="btn-alert-restock">
                    <RefreshCw size={15} />
                    <span>Mettre à jour le stock</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
