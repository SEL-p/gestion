'use client';

import React, { useState, useMemo } from 'react';
import { processReturn } from '@/actions/returns';

type Product = { id: string; name: string };
type OrderItem = { id: string; productId: string; product: Product; quantity: number; priceTTC: number };
type ReturnRec = {
  id: string;
  productId: string;
  quantity: number;
  amountTTC: number;
  approvedBy: string;
  createdAt: Date | string;
  reason?: string | null;
  product?: Product;
};

type Order = {
  id: string;
  totalTTC: number;
  totalHT?: number;
  discount?: number;
  paidAmount?: number;
  cashierName: string;
  tableName?: string | null;
  createdAt: Date | string;
  items: OrderItem[];
  returns: ReturnRec[];
};

export default function HistoryClient({
  initialOrders,
  blindReturns,
}: {
  initialOrders: Order[];
  blindReturns: ReturnRec[];
}) {
  const [orders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');

  // Mobile detail sheet visibility
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Return Modal State
  const [returnItem, setReturnItem] = useState<{
    orderId: string;
    item: OrderItem;
    returnedSoFar: number;
  } | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [adminPin, setAdminPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter orders by search & date
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      // Date check
      if (dateFilter === 'today' && orderDate < startOfToday) return false;
      if (dateFilter === 'yesterday' && (orderDate < startOfYesterday || orderDate >= startOfToday)) return false;
      if (dateFilter === 'week' && orderDate < startOfWeek) return false;
      if (dateFilter === 'month' && orderDate < startOfMonth) return false;

      // Search query check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchId = order.id.toLowerCase().includes(q);
      const matchCashier = order.cashierName.toLowerCase().includes(q);
      const matchProduct = order.items.some((it) => it.product?.name?.toLowerCase().includes(q));

      return matchId || matchCashier || matchProduct;
    });
  }, [orders, searchQuery, dateFilter]);

  // Overall KPIs
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((acc, o) => acc + o.totalTTC, 0);
  }, [filteredOrders]);

  const totalRefunded = useMemo(() => {
    return filteredOrders.reduce((acc, o) => {
      const orderReturns = o.returns?.reduce((rAcc, r) => rAcc + r.amountTTC, 0) || 0;
      return acc + orderReturns;
    }, 0);
  }, [filteredOrders]);

  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowMobileDetail(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnItem) return;

    setLoading(true);
    setError('');

    const res = await processReturn(
      returnItem.orderId,
      returnItem.item.productId,
      returnQty,
      adminPin,
      reason
    );
    if (res.success) {
      window.location.reload();
    } else {
      setError(res.error || 'Erreur lors du traitement du retour.');
      setLoading(false);
    }
  };

  return (
    <div className="history-container">
      {/* ── 1. KPI Cards Bar ────────────────────────────────────────────── */}
      <div className="history-kpis-grid">
        <div className="history-kpi-card">
          <span className="history-kpi-label">Chiffre d&apos;Affaires</span>
          <strong className="history-kpi-value text-teal">
            {totalRevenue.toLocaleString('fr-FR')} FCFA
          </strong>
          <span className="history-kpi-hint">
            {filteredOrders.length} vente{filteredOrders.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="history-kpi-card">
          <span className="history-kpi-label">Ventes réalisées</span>
          <strong className="history-kpi-value text-slate">
            {filteredOrders.length}
          </strong>
          <span className="history-kpi-hint">Transactions</span>
        </div>

        <div className="history-kpi-card">
          <span className="history-kpi-label">Retours / Remboursements</span>
          <strong className="history-kpi-value text-danger">
            {totalRefunded > 0 ? `-${totalRefunded.toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
          </strong>
          <span className="history-kpi-hint">Montant recrédité</span>
        </div>
      </div>

      {/* ── 2. Tabs Switcher ────────────────────────────────────────────── */}
      <div className="history-tabs-bar">
        <button
          type="button"
          onClick={() => {
            setActiveTab('orders');
            setSelectedOrder(null);
          }}
          className={`history-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
        >
          Transactions & Ventes ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('returns');
            setSelectedOrder(null);
          }}
          className={`history-tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
        >
          Retours Hors-Facture ({blindReturns.length})
        </button>
      </div>

      {/* ── 3. Filters & Search Bar (Mobile-first) ───────────────────────── */}
      {activeTab === 'orders' && (
        <div className="history-filters-bar">
          <div className="history-search-input-wrap">
            <input
              type="text"
              placeholder="Rechercher référence, caissier, article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="history-search-clear"
                aria-label="Effacer"
              >
                ×
              </button>
            )}
          </div>

          <div className="history-date-pills">
            <button
              type="button"
              className={`history-date-pill ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              Toutes les dates
            </button>
            <button
              type="button"
              className={`history-date-pill ${dateFilter === 'today' ? 'active' : ''}`}
              onClick={() => setDateFilter('today')}
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              className={`history-date-pill ${dateFilter === 'yesterday' ? 'active' : ''}`}
              onClick={() => setDateFilter('yesterday')}
            >
              Hier
            </button>
            <button
              type="button"
              className={`history-date-pill ${dateFilter === 'week' ? 'active' : ''}`}
              onClick={() => setDateFilter('week')}
            >
              7 jours
            </button>
            <button
              type="button"
              className={`history-date-pill ${dateFilter === 'month' ? 'active' : ''}`}
              onClick={() => setDateFilter('month')}
            >
              Ce mois
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Main Body: Orders List & Details ─────────────────────────── */}
      {activeTab === 'orders' ? (
        <div className="history-main-layout">
          {/* Orders List (Cards on Mobile, Responsive Table/Cards on Desktop) */}
          <div className="history-orders-list-col">
            {filteredOrders.length === 0 ? (
              <div className="history-empty-state">
                <p>Aucune transaction trouvée.</p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDateFilter('all');
                    }}
                    className="history-reset-btn"
                  >
                    Réinitialiser la recherche
                  </button>
                )}
              </div>
            ) : (
              <div className="history-cards-stack">
                {filteredOrders.map((order) => {
                  const dateObj = new Date(order.createdAt);
                  const returnedTotal = order.returns?.reduce((acc, r) => acc + r.amountTTC, 0) || 0;
                  const totalItemsCount = order.items.reduce((acc, it) => acc + it.quantity, 0);
                  const isSelected = selectedOrder?.id === order.id;

                  return (
                    <div
                      key={order.id}
                      onClick={() => handleOpenOrderDetails(order)}
                      className={`history-order-card ${isSelected ? 'selected' : ''}`}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Top row: Ref + Time + Cashier */}
                      <div className="history-card-top">
                        <div className="history-card-ref-wrap">
                          <span className="history-card-ref">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="history-card-cashier">
                            {order.cashierName}
                          </span>
                        </div>
                        <span className="history-card-date">
                          {dateObj.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          à {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Middle row: Items preview */}
                      <div className="history-card-items-preview">
                        <span className="history-items-count-badge">
                          {totalItemsCount} article{totalItemsCount > 1 ? 's' : ''}
                        </span>
                        <span className="history-items-text-snippet">
                          {order.items
                            .slice(0, 2)
                            .map((it) => `${it.product?.name || 'Article'} (x${it.quantity})`)
                            .join(', ')}
                          {order.items.length > 2 ? ` + ${order.items.length - 2} autre(s)` : ''}
                        </span>
                      </div>

                      {/* Bottom row: Total price + Return alert + Details action */}
                      <div className="history-card-bottom">
                        <div>
                          <strong className="history-card-total">
                            {order.totalTTC.toLocaleString('fr-FR')} FCFA
                          </strong>
                          {returnedTotal > 0 && (
                            <span className="history-card-refund-pill">
                              Retour: -{returnedTotal.toLocaleString('fr-FR')} F
                            </span>
                          )}
                        </div>

                        <span className="history-card-action-text">
                          Voir ticket →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Right Side Panel (Hidden on Mobile) */}
          <div className="history-desktop-details-col">
            {selectedOrder ? (
              <OrderReceiptDetail
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onStartReturn={(item, returnedSoFar) =>
                  setReturnItem({ orderId: selectedOrder.id, item, returnedSoFar })
                }
              />
            ) : (
              <div className="history-details-placeholder">
                <p>Sélectionnez une vente pour consulter son ticket complet et gérer les retours éventuels.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── 5. Retours Hors-Facture List ─────────────────────────────── */
        <div className="history-blind-returns-wrap">
          {blindReturns.length === 0 ? (
            <div className="history-empty-state">
              <p>Aucun retour hors-facture enregistré.</p>
            </div>
          ) : (
            <div className="history-cards-stack">
              {blindReturns.map((ret) => {
                const dateObj = new Date(ret.createdAt);
                return (
                  <div key={ret.id} className="history-blind-card">
                    <div className="history-card-top">
                      <div>
                        <strong className="history-blind-product-name">
                          {ret.product?.name || 'Produit inconnu'}
                        </strong>
                        <div className="history-blind-sub">
                          Quantité : <strong>{ret.quantity}</strong> • Approuvé par :{' '}
                          <span className="history-card-cashier">{ret.approvedBy}</span>
                        </div>
                      </div>

                      <strong className="history-blind-amount text-danger">
                        -{ret.amountTTC.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>

                    <div className="history-blind-bottom">
                      <span className="history-card-date">
                        {dateObj.toLocaleDateString('fr-FR')} à{' '}
                        {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {ret.reason && (
                        <span className="history-blind-reason">
                          Motif : {ret.reason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 6. Mobile Bottom Sheet / Modal for Order Receipt ────────────── */}
      {showMobileDetail && selectedOrder && (
        <div className="history-mobile-modal-overlay" onClick={() => setShowMobileDetail(false)}>
          <div
            className="history-mobile-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-sheet-handle" />
            <OrderReceiptDetail
              order={selectedOrder}
              onClose={() => setShowMobileDetail(false)}
              onStartReturn={(item, returnedSoFar) => {
                setShowMobileDetail(false);
                setReturnItem({ orderId: selectedOrder.id, item, returnedSoFar });
              }}
            />
          </div>
        </div>
      )}

      {/* ── 7. Return Authorization Modal (PIN-Protected) ───────────────── */}
      {returnItem && (
        <div className="history-modal-overlay" onClick={() => setReturnItem(null)}>
          <div className="history-return-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-return-header">
              <h3 className="history-return-title">Retour Produit en Rayon</h3>
              <button
                type="button"
                onClick={() => setReturnItem(null)}
                className="history-modal-close"
              >
                ×
              </button>
            </div>

            <p className="history-return-info">
              Article : <strong>{returnItem.item.product?.name}</strong>
              <br />
              Acheté : <strong>{returnItem.item.quantity}</strong> | Déjà rendu :{' '}
              <strong>{returnItem.returnedSoFar}</strong>
            </p>

            <form onSubmit={handleReturnSubmit} className="history-return-form">
              <div className="history-form-group">
                <label className="history-form-label">Quantité à retourner</label>
                <input
                  type="number"
                  className="history-form-input"
                  min="1"
                  max={returnItem.item.quantity - returnItem.returnedSoFar}
                  value={returnQty}
                  onChange={(e) => setReturnQty(parseInt(e.target.value, 10) || 1)}
                  required
                />
              </div>

              <div className="history-form-group">
                <label className="history-form-label">Motif du retour (Optionnel)</label>
                <input
                  type="text"
                  className="history-form-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Emballage abîmé, erreur client..."
                />
              </div>

              <div className="history-form-group pin-group">
                <label className="history-form-label text-danger">
                  Code PIN Administrateur Requis
                </label>
                <input
                  type="password"
                  className="history-form-input history-pin-input"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  required
                  maxLength={4}
                  placeholder="••••"
                  autoFocus
                />
              </div>

              {error && <div className="history-return-error">{error}</div>}

              <div className="history-modal-actions">
                <button
                  type="button"
                  onClick={() => setReturnItem(null)}
                  className="history-cancel-btn"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="history-submit-return-btn"
                >
                  {loading ? 'Traitement...' : 'Valider le retour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponent: Detailed Order Ticket ─────────────────────────────────────────
function OrderReceiptDetail({
  order,
  onClose,
  onStartReturn,
}: {
  order: Order;
  onClose: () => void;
  onStartReturn: (item: OrderItem, returnedSoFar: number) => void;
}) {
  const dateObj = new Date(order.createdAt);
  const totalReturned = order.returns?.reduce((acc, r) => acc + r.amountTTC, 0) || 0;

  return (
    <div className="history-receipt-card">
      <div className="history-receipt-header">
        <div>
          <h3 className="history-receipt-title">Ticket #{order.id.slice(0, 8).toUpperCase()}</h3>
          <span className="history-receipt-meta">
            {dateObj.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}{' '}
            à {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="history-receipt-submeta">
            Caissier : <strong>{order.cashierName}</strong>
            {order.tableName && <> • Emplacement : <strong>{order.tableName}</strong></>}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="history-receipt-close-btn"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>

      <div className="history-receipt-items">
        <h4 className="history-receipt-items-heading">Articles achetés</h4>
        {order.items.map((item) => {
          const returnedQty =
            order.returns
              ?.filter((r) => r.productId === item.productId)
              .reduce((acc, r) => acc + r.quantity, 0) || 0;
          const canReturn = returnedQty < item.quantity;

          return (
            <div key={item.id} className="history-receipt-item-row">
              <div className="history-item-left">
                <span className="history-item-name">{item.product?.name || 'Produit'}</span>
                <span className="history-item-desc">
                  {item.quantity} x {item.priceTTC.toLocaleString('fr-FR')} FCFA
                  {returnedQty > 0 && (
                    <span className="history-item-returned-badge">
                      (Déjà rendu : {returnedQty})
                    </span>
                  )}
                </span>
              </div>

              <div className="history-item-right">
                <span className="history-item-total">
                  {(item.quantity * item.priceTTC).toLocaleString('fr-FR')} F
                </span>
                {canReturn && (
                  <button
                    type="button"
                    onClick={() => onStartReturn(item, returnedQty)}
                    className="history-item-return-btn"
                  >
                    Retourner
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="history-receipt-totals">
        {order.totalHT && (
          <div className="history-total-line">
            <span>Montant HT</span>
            <span>{order.totalHT.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
        {order.discount && order.discount > 0 && (
          <div className="history-total-line text-teal">
            <span>Remise appliquée</span>
            <span>-{order.discount}%</span>
          </div>
        )}
        <div className="history-total-line history-grand-total">
          <span>Total TTC payé</span>
          <span>{order.totalTTC.toLocaleString('fr-FR')} FCFA</span>
        </div>
        {totalReturned > 0 && (
          <div className="history-total-line text-danger">
            <span>Total remboursé</span>
            <span>-{totalReturned.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
      </div>
    </div>
  );
}
