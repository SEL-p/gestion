'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { processCheckout } from '@/actions/pos';
import { processBlindReturn } from '@/actions/returns';
import { logout, loginWithPin } from '@/actions/auth';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Menu,
  PauseCircle,
  PlayCircle,
  User,
  ArrowRight,
  Receipt,
  Lock,
} from 'lucide-react';
import { getProductImageSrc } from '@/lib/product-images';
import { calculateStockBreakdown } from '@/lib/stock';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceHT: number;
  priceTTC: number;
  stock: number;
  unitsPerCarton?: number;
  images: { url: string }[];
}

interface CartItem extends Product {
  quantity: number;
  discountPercent: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  code?: string | null;
  debtBalance?: number;
  points?: number;
}

interface POSClientProps {
  products: Product[];
  customers: Customer[];
  cashierId: string;
  cashierName: string;
  initialTodaySales: number;
}

export default function POSClient({
  products,
  customers,
  cashierId,
  cashierName,
  initialTodaySales,
}: POSClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile Drawer & Cart Sheet State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSku, setReturnSku] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnPin, setReturnPin] = useState('');
  const [returnReason, setReturnReason] = useState('Produit défectueux');
  const [returnError, setReturnError] = useState('');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // Auto-lock state (4 minutes inactivity)
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Customer & Hold Cart
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [heldCart, setHeldCart] = useState<CartItem[] | null>(null);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE' | 'CARD' | 'CREDIT'>('CASH');
  const [tableName, setTableName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'CREDIT'>('PAID');
  const [todaySales, setTodaySales] = useState<number>(initialTodaySales || 0);

  // Success Confirmation Modal
  const [completedOrder, setCompletedOrder] = useState<{ id: string; total: number; change: number } | null>(null);

  // Categories list extracted from in-stock products
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedCategory !== 'ALL') {
        if (p.category?.trim().toLowerCase() !== selectedCategory.trim().toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [products, search, selectedCategory]);

  // Auto-lock Inactivity Timer
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      if (!isLocked) {
        timeout = setTimeout(() => setIsLocked(true), 4 * 60 * 1000);
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearTimeout(timeout);
    };
  }, [isLocked]);

  // Unlock Handler
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnlockError('');
    try {
      const res = await loginWithPin(unlockPin);
      if (res.success) {
        setIsLocked(false);
        setUnlockPin('');
      } else {
        setUnlockError('Code PIN incorrect');
      }
    } catch {
      setUnlockError('Erreur de connexion');
    }
    setLoading(false);
  };

  // Cart Operations
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const currentQ = existing ? existing.quantity : 0;
      let effectiveAdd = quantityToAdd;

      if (currentQ + effectiveAdd > product.stock) {
        effectiveAdd = Math.max(0, product.stock - currentQ);
      }
      if (effectiveAdd <= 0) return prev;

      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + effectiveAdd } : item
        );
      }
      return [...prev, { ...product, quantity: effectiveAdd, discountPercent: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQ = item.quantity + delta;
            if (newQ > item.stock) return item;
            if (newQ <= 0) return null;
            return { ...item, quantity: newQ };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setExactQuantity = (productId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const safeQ = Math.max(0, Math.min(item.stock, qty));
            if (safeQ <= 0) return null;
            return { ...item, quantity: safeQ };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          return { ...item, discountPercent: Math.max(0, Math.min(100, discount)) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setGlobalDiscount(0);
  };

  // Cart Totals
  const totals = useMemo(() => {
    let ht = 0;
    let ttc = 0;
    let totalPieces = 0;

    cart.forEach((item) => {
      const multiplier = 1 - (item.discountPercent || 0) / 100;
      ht += item.priceHT * item.quantity * multiplier;
      ttc += item.priceTTC * item.quantity * multiplier;
      totalPieces += item.quantity;
    });

    const globalMultiplier = 1 - (globalDiscount || 0) / 100;
    const finalHT = Math.round(ht * globalMultiplier);
    const finalTTC = Math.round(ttc * globalMultiplier);

    return {
      totalHT: finalHT,
      totalTTC: finalTTC,
      totalPieces,
    };
  }, [cart, globalDiscount]);

  // Hold / Resume Cart
  const toggleHoldCart = () => {
    if (cart.length > 0) {
      setHeldCart(cart);
      setCart([]);
    } else if (heldCart) {
      setCart(heldCart);
      setHeldCart(null);
    }
  };

  // Open Checkout
  const openCheckout = () => {
    if (cart.length === 0) return;
    setAmountReceived(String(totals.totalTTC));
    setPaymentStatus('PAID');
    setShowCheckoutModal(true);
  };

  // Checkout Submission
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;

    if (paymentStatus === 'CREDIT' && !selectedCustomerId) {
      setError('Veuillez sélectionner un client pour une vente à crédit.');
      return;
    }

    setLoading(true);
    setError(null);

    const receivedNum = parseFloat(amountReceived) || 0;
    const changeToReturn = Math.max(0, receivedNum - totals.totalTTC);

    try {
      const payload = cart.map((i) => ({
        productId: i.id,
        quantity: i.quantity,
        discountPercent: i.discountPercent,
      }));

      const res = await processCheckout(
        payload,
        globalDiscount || 0,
        selectedCustomerId || undefined,
        {
          tableName: tableName || undefined,
          status: 'CLOSED',
          paymentStatus,
          paidAmount: paymentStatus === 'PAID' ? totals.totalTTC : 0,
        }
      );

      if (res.success && res.orderId) {
        if (paymentStatus === 'PAID') {
          setTodaySales((prev) => prev + totals.totalTTC);
        }

        setCompletedOrder({
          id: res.orderId,
          total: totals.totalTTC,
          change: changeToReturn,
        });

        // Reset Cart
        setCart([]);
        setGlobalDiscount(0);
        setSelectedCustomerId('');
        setAmountReceived('');
        setTableName('');
        setPaymentStatus('PAID');
        setShowCheckoutModal(false);
        setIsMobileCartOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l’encaissement.');
    } finally {
      setLoading(false);
    }
  };

  // Blind Return Submission
  const handleBlindReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setReturnError('');
    setReturnSuccessMsg('');

    const res = await processBlindReturn(returnSku, returnQty, returnPin, returnReason);
    if (res.success) {
      setReturnSuccessMsg(
        `Retour validé pour ${res.product?.name}. Montant remboursé : ${res.product?.amountRef} FCFA.`
      );
      setTodaySales((prev) => prev - (res.product?.amountRef || 0));
      setReturnSku('');
      setReturnQty(1);
      setReturnPin('');
    } else {
      setReturnError(res.error || 'Erreur lors du traitement du retour.');
    }
    setLoading(false);
  };

  const receivedVal = parseFloat(amountReceived) || 0;
  const changeAmount = Math.max(0, receivedVal - totals.totalTTC);
  const isExactOrMore = receivedVal >= totals.totalTTC;

  // Open Drawer trigger for Mobile
  const handleOpenDrawer = () => {
    window.dispatchEvent(new CustomEvent('open-mobile-drawer'));
  };

  return (
    <div className="pos-redesign-container">
      {/* ── 1. Top POS Header (Forest Teal #004D40) ───────────────────────── */}
      <header className="pos-top-header">
        <div className="pos-header-left">
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="pos-header-btn"
            aria-label="Menu"
            title="Menu principal"
          >
            <Menu size={22} color="#FFFFFF" />
          </button>

          <div className="pos-title-block">
            <h1 className="pos-main-title">Caisse Supermarché</h1>
            <span className="pos-cashier-sub">Caissier : {cashierName}</span>
          </div>
        </div>

        <div className="pos-header-right">
          {/* Today's Sales Counter */}
          <div className="pos-sales-pill">
            <span className="pos-sales-label">Aujourd&apos;hui</span>
            <strong className="pos-sales-amount">
              {todaySales.toLocaleString('fr-FR')} F
            </strong>
          </div>

          {/* Refund Trigger */}
          <button
            type="button"
            onClick={() => setShowReturnModal(true)}
            className="pos-header-btn-refund"
            title="Remboursement / Retour article"
          >
            <RotateCcw size={16} />
            <span className="pos-btn-text">Retour</span>
          </button>
        </div>
      </header>

      {/* ── 2. Search & Category Filters Bar ───────────────────────────────── */}
      <div className="pos-toolbar-strip">
        {/* Search Input */}
        <div className="pos-search-box">
          <Search size={18} className="pos-search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, SKU ou code-barres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pos-search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="pos-search-clear"
              aria-label="Effacer"
            >
              ×
            </button>
          )}
        </div>

        {/* Categories Strip */}
        <div className="pos-category-pills">
          <button
            type="button"
            className={`pos-cat-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            Tous ({products.length})
          </button>
          {categoriesList.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                className={`pos-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Main Workspace: Products Grid + Desktop Cart Sidebar ────────── */}
      <div className="pos-main-workspace">
        {/* Product Catalog Grid */}
        <section className="pos-products-section" aria-label="Articles en stock">
          {filteredProducts.length === 0 ? (
            <div className="pos-empty-catalog">
              <div className="pos-empty-icon">📦</div>
              <h3>Aucun article trouvé</h3>
              <p>Essayez avec un autre nom ou modifiez votre sélection de rayon.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                }}
                className="pos-empty-reset"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="pos-products-grid">
              {filteredProducts.map((p) => {
                const stockInfo = calculateStockBreakdown(p.stock, p.unitsPerCarton);
                const isPack = stockInfo.isPack;
                const unitsInPack = stockInfo.unitsPerPack;
                const inCart = cart.find((item) => item.id === p.id);
                const cartQty = inCart ? inCart.quantity : 0;
                const isMaxStock = cartQty >= p.stock;

                return (
                  <div
                    key={p.id}
                    className={`pos-product-card ${cartQty > 0 ? 'is-in-cart' : ''}`}
                    onClick={() => !isMaxStock && addToCart(p, 1)}
                  >
                    {/* Top: Thumbnail & Stock Breakdown */}
                    <div className="pos-prod-top">
                      <div className="pos-prod-thumb">
                        {p.images && p.images.length > 0 ? (
                          <Image
                            src={getProductImageSrc(p.images[0].url)}
                            alt={p.name}
                            fill
                            sizes="70px"
                            className="pos-prod-img"
                          />
                        ) : (
                          <div className="pos-prod-placeholder">
                            <span>{p.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        {cartQty > 0 && (
                          <span className="pos-cart-badge">{cartQty}</span>
                        )}
                      </div>

                      <div className="pos-prod-badges">
                        <span className="pos-stock-badge" title={stockInfo.detailedText}>
                          {stockInfo.badgeText}
                        </span>
                        {isPack && (
                          <span className="pos-pack-badge">Casier {unitsInPack}</span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pos-prod-info">
                      <h3 className="pos-prod-name" title={p.name}>
                        {p.name}
                      </h3>
                      <span className="pos-prod-sku">SKU: {p.sku}</span>
                      <strong className="pos-prod-price">
                        {p.priceTTC.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>

                    {/* Dual Action Buttons */}
                    <div
                      className="pos-prod-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={isMaxStock}
                        onClick={() => addToCart(p, 1)}
                        className="pos-btn-add-unit"
                        title="Ajouter 1 pièce"
                      >
                        <Plus size={14} /> 1 pc
                      </button>

                      {isPack && (
                        <button
                          type="button"
                          disabled={cartQty + unitsInPack > p.stock}
                          onClick={() => addToCart(p, unitsInPack)}
                          className="pos-btn-add-pack"
                          title={`Ajouter 1 casier complet (${unitsInPack} pcs)`}
                        >
                          <Plus size={14} /> 1 Pack ({unitsInPack})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Desktop Persistent Cart Pane ─────────────────────────────────── */}
        <aside className="pos-desktop-cart-pane">
          <div className="pos-cart-header">
            <div className="pos-cart-title-row">
              <ShoppingCart size={20} color="#004D40" />
              <h2>Panier en cours</h2>
              <span className="pos-cart-count-pill">{cart.length}</span>
            </div>

            {(cart.length > 0 || heldCart) && (
              <button
                type="button"
                onClick={toggleHoldCart}
                className="pos-cart-hold-btn"
                title={cart.length > 0 ? 'Mettre en attente' : 'Reprendre le panier'}
              >
                {cart.length > 0 ? (
                  <>
                    <PauseCircle size={15} /> Attente
                  </>
                ) : (
                  <>
                    <PlayCircle size={15} /> Reprendre
                  </>
                )}
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="pos-cart-items-scroll">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <ShoppingCart size={40} strokeWidth={1.5} color="#CBD5E1" />
                <p>Le panier est vide.</p>
                <span>Touchez un article à gauche pour l&apos;ajouter à la vente.</span>
              </div>
            ) : (
              <div className="pos-cart-items-list">
                {cart.map((item) => {
                  const itemSubtotal = Math.round(
                    item.priceTTC * item.quantity * (1 - (item.discountPercent || 0) / 100)
                  );
                  const isPackItem = item.unitsPerCarton && item.unitsPerCarton > 1;

                  return (
                    <div key={item.id} className="pos-cart-item-row">
                      <div className="pos-cart-item-left">
                        <strong className="pos-cart-item-name">{item.name}</strong>
                        <div className="pos-cart-item-meta">
                          <span>{item.priceTTC.toLocaleString('fr-FR')} F / pc</span>
                          {isPackItem && (
                            <span className="pos-cart-pack-hint">
                              = {Math.floor(item.quantity / item.unitsPerCarton!)} pack(s) +{' '}
                              {item.quantity % item.unitsPerCarton!} pc(s)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="pos-cart-item-actions">
                        <div className="pos-stepper">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="pos-stepper-btn"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="pos-stepper-val">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.stock}
                            onClick={() => updateQuantity(item.id, 1)}
                            className="pos-stepper-btn"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <strong className="pos-cart-item-total">
                          {itemSubtotal.toLocaleString('fr-FR')} F
                        </strong>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="pos-cart-remove-btn"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="pos-cart-footer">
              {/* Customer Selector & Discounts */}
              <div className="pos-cart-options">
                <div className="pos-customer-select-wrap">
                  <User size={15} color="#64748B" />
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="pos-customer-select"
                  >
                    <option value="">Client standard (Comptant)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pos-discount-field">
                  <span>Remise (%) :</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={globalDiscount || ''}
                    onChange={(e) => setGlobalDiscount(parseInt(e.target.value, 10) || 0)}
                    className="pos-discount-input"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pos-cart-totals">
                <div className="pos-total-row">
                  <span>Total HT</span>
                  <span>{totals.totalHT.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="pos-total-row is-grand-total">
                  <span>Total TTC ({totals.totalPieces} pcs)</span>
                  <strong>{totals.totalTTC.toLocaleString('fr-FR')} FCFA</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pos-cart-submit-btns">
                <button
                  type="button"
                  onClick={clearCart}
                  className="pos-cart-clear-btn"
                >
                  Vider
                </button>
                <button
                  type="button"
                  onClick={openCheckout}
                  className="pos-cart-pay-btn"
                >
                  <span>Encaisser</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── 4. Mobile Sticky Bottom Cart Trigger Bar ──────────────────────── */}
      {cart.length > 0 && (
        <div className="pos-mobile-floating-cart-bar">
          <div
            className="pos-floating-bar-info"
            onClick={() => setIsMobileCartOpen(true)}
          >
            <span className="pos-floating-badge">{totals.totalPieces}</span>
            <div className="pos-floating-amounts">
              <strong>{totals.totalTTC.toLocaleString('fr-FR')} FCFA</strong>
              <span>{cart.length} référence(s)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={openCheckout}
            className="pos-floating-pay-btn"
          >
            Payer
          </button>
        </div>
      )}

      {/* ── 5. Mobile Slide-Up Cart Drawer ─────────────────────────────────── */}
      {isMobileCartOpen && (
        <div
          className="pos-sheet-backdrop"
          onClick={() => setIsMobileCartOpen(false)}
        >
          <div
            className="pos-sheet-drawer animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pos-sheet-header">
              <div className="pos-sheet-title">
                <ShoppingCart size={20} color="#004D40" />
                <h3>Panier ({cart.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="pos-sheet-close"
              >
                ×
              </button>
            </div>

            <div className="pos-sheet-body">
              {cart.map((item) => {
                const subtotal = Math.round(
                  item.priceTTC * item.quantity * (1 - (item.discountPercent || 0) / 100)
                );
                return (
                  <div key={item.id} className="pos-sheet-item">
                    <div className="pos-sheet-item-info">
                      <strong>{item.name}</strong>
                      <span>{item.priceTTC.toLocaleString('fr-FR')} F / pc</span>
                    </div>

                    <div className="pos-sheet-stepper">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="pos-stepper-btn"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="pos-stepper-val">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.stock}
                        onClick={() => updateQuantity(item.id, 1)}
                        className="pos-stepper-btn"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <strong className="pos-sheet-total">
                      {subtotal.toLocaleString('fr-FR')} F
                    </strong>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="pos-sheet-del"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pos-sheet-footer">
              <div className="pos-sheet-totals">
                <span>Total à régler ({totals.totalPieces} pcs) :</span>
                <strong>{totals.totalTTC.toLocaleString('fr-FR')} FCFA</strong>
              </div>

              <div className="pos-sheet-actions">
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="pos-sheet-back-btn"
                >
                  Continuer
                </button>
                <button
                  type="button"
                  onClick={openCheckout}
                  className="pos-sheet-checkout-btn"
                >
                  Passer au paiement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Checkout Payment Modal with Fast Money Buttons ──────────────── */}
      {showCheckoutModal && (
        <div
          className="pos-modal-overlay"
          onClick={() => setShowCheckoutModal(false)}
        >
          <div
            className="pos-checkout-modal animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pos-modal-header">
              <h3>Encaissement & Paiement</h3>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="pos-modal-close"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="pos-alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Total Grand Display */}
            <div className="pos-checkout-grand-box">
              <span className="pos-grand-label">Montant Total à Payer</span>
              <strong className="pos-grand-val">
                {totals.totalTTC.toLocaleString('fr-FR')}{' '}
                <span className="pos-currency">FCFA</span>
              </strong>
            </div>

            {/* Payment Method Selector */}
            <div className="pos-payment-methods">
              <button
                type="button"
                className={`pos-pay-method-btn ${paymentStatus === 'PAID' && paymentMethod === 'CASH' ? 'active' : ''}`}
                onClick={() => {
                  setPaymentStatus('PAID');
                  setPaymentMethod('CASH');
                }}
              >
                <Banknote size={18} />
                <span>Espèces</span>
              </button>

              <button
                type="button"
                className={`pos-pay-method-btn ${paymentStatus === 'PAID' && paymentMethod === 'MOBILE' ? 'active' : ''}`}
                onClick={() => {
                  setPaymentStatus('PAID');
                  setPaymentMethod('MOBILE');
                }}
              >
                <CreditCard size={18} />
                <span>Mobile Money</span>
              </button>

              <button
                type="button"
                className={`pos-pay-method-btn ${paymentStatus === 'CREDIT' ? 'active is-credit' : ''}`}
                onClick={() => setPaymentStatus('CREDIT')}
              >
                <User size={18} />
                <span>Vente à Crédit</span>
              </button>
            </div>

            {/* Cash Input & Quick Money Keypad */}
            {paymentStatus === 'PAID' && (
              <div className="pos-cash-calculator">
                <label className="pos-calc-label">Montant Reçu du Client</label>
                <div className="pos-cash-input-wrap">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Montant reçu"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="pos-cash-field"
                  />
                  <span className="pos-cash-curr">FCFA</span>
                </div>

                {/* Quick denomination pills */}
                <div className="pos-money-pills">
                  <button
                    type="button"
                    onClick={() => setAmountReceived(String(totals.totalTTC))}
                    className="pos-pill-money"
                  >
                    Exact
                  </button>
                  {[1000, 2000, 5000, 10000, 20000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountReceived(String(val))}
                      className="pos-pill-money"
                    >
                      {val.toLocaleString('fr-FR')} F
                    </button>
                  ))}
                </div>

                {/* Change Calculation Display */}
                <div
                  className={`pos-change-box ${isExactOrMore ? 'is-good' : 'is-short'}`}
                >
                  <span className="pos-change-label">
                    {isExactOrMore ? 'Monnaie à rendre :' : 'Reste dû :'}
                  </span>
                  <strong className="pos-change-val">
                    {isExactOrMore
                      ? `+${changeAmount.toLocaleString('fr-FR')} FCFA`
                      : `-${Math.abs(totals.totalTTC - receivedVal).toLocaleString('fr-FR')} FCFA`}
                  </strong>
                </div>
              </div>
            )}

            {paymentStatus === 'CREDIT' && (
              <div className="pos-credit-box">
                <p>
                  Sélectionnez le client pour enregistrer cette dette sur son compte :
                </p>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="pos-customer-select-modal"
                >
                  <option value="">Sélectionner un client...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pos-modal-actions">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="pos-modal-cancel"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={loading || (paymentStatus === 'PAID' && !isExactOrMore)}
                onClick={handleCheckoutSubmit}
                className="pos-modal-submit"
              >
                {loading ? 'Validation...' : 'Valider & Imprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Order Complete Success Confirmation Modal ──────────────────── */}
      {completedOrder && (
        <div className="pos-modal-overlay">
          <div className="pos-success-modal animate-scale-up">
            <div className="pos-success-icon-wrap">
              <CheckCircle2 size={48} color="#059669" />
            </div>

            <h2>Vente Enregistrée !</h2>
            <p>
              La transaction de{' '}
              <strong>{completedOrder.total.toLocaleString('fr-FR')} FCFA</strong> a
              été validée avec succès.
            </p>

            {completedOrder.change > 0 && (
              <div className="pos-success-change-card">
                <span>Monnaie remise au client</span>
                <strong>+{completedOrder.change.toLocaleString('fr-FR')} FCFA</strong>
              </div>
            )}

            <div className="pos-success-actions">
              <Link
                href={`/pos/invoice/${completedOrder.id}`}
                target="_blank"
                className="pos-btn-print-receipt"
              >
                <Receipt size={18} />
                <span>Imprimer le Ticket</span>
              </Link>

              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="pos-btn-next-sale"
              >
                Nouvelle Vente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Return / Refund Modal ──────────────────────────────────────── */}
      {showReturnModal && (
        <div
          className="pos-modal-overlay"
          onClick={() => setShowReturnModal(false)}
        >
          <div
            className="pos-refund-modal animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pos-modal-header">
              <h3>Remboursement / Retour Article</h3>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="pos-modal-close"
              >
                ×
              </button>
            </div>

            {returnError && (
              <div className="pos-alert-error">
                <AlertCircle size={16} />
                <span>{returnError}</span>
              </div>
            )}

            {returnSuccessMsg && (
              <div className="pos-alert-success">
                <CheckCircle2 size={16} />
                <span>{returnSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleBlindReturn} className="pos-refund-form">
              <div className="pos-refund-field">
                <label>Code SKU de l&apos;article *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PRD-123456"
                  value={returnSku}
                  onChange={(e) => setReturnSku(e.target.value)}
                  className="pos-refund-input"
                />
              </div>

              <div className="pos-refund-field">
                <label>Quantité retournée (pièces) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={returnQty}
                  onChange={(e) => setReturnQty(parseInt(e.target.value, 10) || 1)}
                  className="pos-refund-input"
                />
              </div>

              <div className="pos-refund-field">
                <label>Motif du retour</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="pos-refund-input"
                />
              </div>

              <div className="pos-refund-field">
                <label>Code PIN Administrateur requis *</label>
                <input
                  type="password"
                  required
                  placeholder="Code PIN"
                  value={returnPin}
                  onChange={(e) => setReturnPin(e.target.value)}
                  className="pos-refund-input"
                />
              </div>

              <div className="pos-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="pos-modal-cancel"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="pos-modal-submit"
                >
                  {loading ? 'Validation...' : 'Valider le retour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 9. Auto-Lock Screen ────────────────────────────────────────────── */}
      {isLocked && (
        <div className="pos-lock-overlay">
          <div className="pos-lock-card">
            <Lock size={44} color="#004D40" />
            <h2>Caisse Verrouillée</h2>
            <p>Session suspendue pour inactivité. Saisissez votre PIN :</p>

            {unlockError && (
              <span className="pos-lock-err">{unlockError}</span>
            )}

            <form onSubmit={handleUnlock} className="pos-lock-form">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="PIN"
                value={unlockPin}
                onChange={(e) => setUnlockPin(e.target.value)}
                className="pos-lock-input"
              />
              <button
                type="submit"
                disabled={loading}
                className="pos-lock-submit-btn"
              >
                {loading ? '...' : 'Déverrouiller'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
