'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { processCheckout } from '@/actions/pos';
import { processBlindReturn } from '@/actions/returns';
import { logout, loginWithPin } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { Undo, CheckCircle, Lock, LogOut, Sun, Moon, Eye } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceHT: number;
  priceTTC: number;
  stock: number;
  images: { url: string }[];
};

type CartItem = Product & { quantity: number; discountPercent: number };

export default function POSClient({ 
  products, 
  customers, 
  cashierId, 
  cashierName,
  initialTodaySales 
}: { 
  products: Product[], 
  customers: any[],
  cashierId: string,
  cashierName: string,
  initialTodaySales: number
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSku, setReturnSku] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnPin, setReturnPin] = useState('');
  const [returnReason, setReturnReason] = useState('Produit défectueux');
  const [returnError, setReturnError] = useState('');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // Auto-lock state
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // POS Enhancements
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [heldCart, setHeldCart] = useState<CartItem[] | null>(null);
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [amountReceived, setAmountReceived] = useState<string>('');

  const [todaySales, setTodaySales] = useState<number>(initialTodaySales || 0);

  // Auto-lock timer (4 minutes = 240,000 ms)
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
        setUnlockError('PIN incorrect');
      }
    } catch (err) {
      setUnlockError('Erreur de connexion');
    }
    setLoading(false);
  };

  const handleBlindReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setReturnError('');
    setReturnSuccessMsg('');

    const res = await processBlindReturn(returnSku, returnQty, returnPin, returnReason);
    if (res.success) {
      setReturnSuccessMsg(`Retour validé pour ${res.product?.name}. Montant: ${res.product?.amountRef} FCFA.`);
      setTodaySales(prev => prev - (res.product?.amountRef || 0));
      setReturnSku('');
      setReturnQty(1);
      setReturnPin('');
    } else {
      setReturnError(res.error || 'Erreur inconnue.');
    }
    setLoading(false);
  };

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, discountPercent: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQ = item.quantity + delta;
        if (newQ > item.stock) return item;
        if (newQ < 1) return item;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, discountPercent: Math.max(0, Math.min(100, discount)) };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const calculateTotals = () => {
    let ht = 0;
    let ttc = 0;
    cart.forEach(item => {
      const multiplier = 1 - (item.discountPercent / 100);
      ht += (item.priceHT * item.quantity) * multiplier;
      ttc += (item.priceTTC * item.quantity) * multiplier;
    });

    const globalMultiplier = 1 - ((globalDiscount || 0) / 100);
    return {
      totalHT: ht * globalMultiplier,
      totalTTC: ttc * globalMultiplier
    };
  };

  const { totalHT, totalTTC } = calculateTotals();

  const toggleHoldCart = () => {
    if (cart.length > 0) {
      setHeldCart(cart);
      setCart([]);
    } else if (heldCart) {
      setCart(heldCart);
      setHeldCart(null);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const payload = cart.map(i => ({ 
        productId: i.id, 
        quantity: i.quantity, 
        discountPercent: i.discountPercent 
      }));
      
      const res = await processCheckout(payload, globalDiscount || 0, selectedCustomerId || undefined);
      
      if (res.success && res.orderId) {
        setTodaySales(prev => prev + totalTTC);
        setCart([]);
        setGlobalDiscount(0);
        setSelectedCustomerId('');
        setAmountReceived('');
        setShowCheckoutModal(false);
        // Open invoice in new tab or navigate
        window.open(`/pos/invoice/${res.orderId}`, '_blank');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'encaissement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-layout">
      
      {/* LEFT PANE: Products */}
      <div className="glass-panel" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Rechercher un produit (Nom, SKU)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ flex: '1 1 200px' }}
          />
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>Ventes du jour ({cashierName}) :</span>
            <span style={{ color: 'var(--success-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>{todaySales.toFixed(0)} FCFA</span>
          </div>

          <button onClick={() => setShowReturnModal(true)} className="btn btn-outline" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Undo size={16} /> Remboursement
          </button>
          
          <button 
            onClick={() => {
              if (theme === 'light') setTheme('dark');
              else if (theme === 'dark') setTheme('high-contrast');
              else setTheme('light');
            }} 
            className="btn btn-outline" 
            style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            title="Changer le thème visuel"
          >
            {theme === 'light' && <Sun size={16} />}
            {theme === 'dark' && <Moon size={16} />}
            {theme === 'high-contrast' && <Eye size={16} />}
            Thème
          </button>

          <button onClick={() => logout()} className="btn btn-outline" style={{ color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
        
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', alignContent: 'start' }}>
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="glass-panel" 
              style={{ cursor: 'pointer', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.1s' }}
              onClick={() => addToCart(product)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ width: '100px', height: '100px', position: 'relative', marginBottom: '0.5rem', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                {product.images.length > 0 ? (
                  <Image src={product.images[0].url} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="100px" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    Pas d'image
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.9rem' }}>{product.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{product.sku}</div>
              <div style={{ color: 'var(--slate-900)', fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: 'var(--slate-100)', padding: '0.2rem 0.5rem', borderRadius: '6px', marginTop: '0.2rem', border: '1px solid var(--slate-200)' }}>
                {product.priceTTC.toFixed(0)} FCFA
              </div>
              <div style={{ fontSize: '0.75rem', color: product.stock > 5 ? 'var(--success-color)' : 'var(--warning-color)' }}>
                Stock: {product.stock}
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Aucun produit trouvé en stock.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Cart */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Panier ({cart.length})</h2>
          {(cart.length > 0 || heldCart) && (
            <button onClick={toggleHoldCart} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
              {cart.length > 0 ? '⏸️ Mettre en attente' : '▶️ Reprendre panier'}
            </button>
          )}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
              Le panier est vide
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.priceTTC.toFixed(0)} FCFA /u
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>-</button>
                      <span style={{ width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ marginLeft: '0.5rem', border: 'none', background: 'transparent', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Remise unitaire:</span>
                    <input 
                      type="number" 
                      min="0" max="100" 
                      value={item.discountPercent || ''} 
                      onChange={e => updateItemDiscount(item.id, parseInt(e.target.value) || 0)}
                      className="form-control"
                      style={{ width: '60px', padding: '0.2rem', fontSize: '0.85rem' }}
                      placeholder="%"
                    />
                    <span>%</span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>Remise Globale (%) :</span>
            <input 
              type="number" 
              min="0" max="100" 
              value={globalDiscount || ''} 
              onChange={e => setGlobalDiscount(parseInt(e.target.value) || 0)}
              className="form-control"
              style={{ width: '80px', textAlign: 'right' }}
              placeholder="%"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <span>Total HT:</span>
            <span>{totalHT.toFixed(0)} FCFA</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span>Total TTC:</span>
            <span style={{ color: 'var(--accent-color)' }}>{totalTTC.toFixed(0)} FCFA</span>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
            disabled={cart.length === 0}
            onClick={() => setShowCheckoutModal(true)}
          >
            Passer à l'encaissement
          </button>
        </div>
      </div>
      
      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ padding: '2rem', width: '450px', maxWidth: '90%', backgroundColor: 'white' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Encaissement</h3>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--slate-50)', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Montant à payer</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-color)', lineHeight: 1 }}>{totalTTC.toFixed(0)} FCFA</div>
            </div>

            <div className="form-group">
              <label className="form-label">Associer à un client (Optionnel)</label>
              <select className="form-control" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                <option value="">-- Client Anonyme --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || 'Sans tel'})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Espèces reçues (Calculateur monnaie)</label>
              <input 
                type="number" 
                className="form-control" 
                value={amountReceived} 
                onChange={e => setAmountReceived(e.target.value)} 
                placeholder="Ex: 10000"
                style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
              />
              {parseFloat(amountReceived) >= totalTTC && (
                <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', color: 'var(--success-color)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                  <span>Monnaie à rendre :</span>
                  <span>{(parseFloat(amountReceived) - totalTTC).toFixed(0)} FCFA</span>
                </div>
              )}
            </div>

            {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowCheckoutModal(false)} className="btn btn-outline" style={{ flex: 1 }} disabled={loading}>Annuler</button>
              <button onClick={handleCheckout} className="btn btn-primary" style={{ flex: 2, fontSize: '1.1rem' }} disabled={loading}>
                {loading ? 'Validation...' : 'Valider & Imprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Return Modal Overlay */}
      {showReturnModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ padding: '2rem', width: '400px', maxWidth: '90%', backgroundColor: 'white' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--danger-color)' }}>Remboursement Produit</h3>

            {returnSuccessMsg ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--success-color)', marginBottom: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={24} /> {returnSuccessMsg}
                </div>
                <button type="button" onClick={() => { setShowReturnModal(false); setReturnSuccessMsg(''); }} className="btn btn-outline" style={{ width: '100%' }}>Fermer</button>
              </div>
            ) : (
              <form onSubmit={handleBlindReturn}>
                <div className="form-group">
                  <label className="form-label">Code Produit (SKU)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={returnSku} 
                    onChange={e => setReturnSku(e.target.value)} 
                    required 
                    placeholder="Scanner ou taper le code..."
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantité à retourner</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="1" 
                    value={returnQty} 
                    onChange={e => setReturnQty(parseInt(e.target.value))} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Motif du remboursement</label>
                  <select 
                    className="form-control" 
                    value={returnReason} 
                    onChange={e => setReturnReason(e.target.value)}
                    required
                  >
                    <option value="Produit défectueux">Produit défectueux</option>
                    <option value="Erreur de taille/couleur">Erreur de taille/couleur</option>
                    <option value="Changement d'avis du client">Changement d'avis du client</option>
                    <option value="Produit expiré / endommagé">Produit expiré / endommagé</option>
                    <option value="Autre erreur caisse">Autre erreur caisse</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--slate-200)', paddingTop: '1.5rem' }}>
                  <label className="form-label" style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Code PIN Administrateur Requis <Lock size={16} /></label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={returnPin} 
                    onChange={e => setReturnPin(e.target.value)} 
                    required 
                    maxLength={4}
                    placeholder="••••"
                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                  />
                </div>

                {returnError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>{returnError}</div>}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowReturnModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-color)' }} disabled={loading}>
                    {loading ? 'Traitement...' : 'Rembourser'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lock Screen Overlay */}
      {isLocked && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-card" style={{ padding: '2rem', width: '400px', maxWidth: '90%', textAlign: 'center', backgroundColor: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <Lock size={40} color="var(--accent-color)" />
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--slate-900)' }}>Caisse Verrouillée</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Inactivité détectée (4 min).<br/>Entrez votre PIN pour reprendre.</p>
            
            <form onSubmit={handleUnlock}>
              <input 
                type="password" 
                className="form-control" 
                value={unlockPin} 
                onChange={e => setUnlockPin(e.target.value)} 
                required 
                maxLength={4}
                placeholder="••••"
                style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '1rem', marginBottom: '1rem' }}
                autoFocus
              />
              {unlockError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontWeight: 500 }}>{unlockError}</div>}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginBottom: '1rem' }} disabled={loading}>
                {loading ? 'Déverrouillage...' : 'Déverrouiller'}
              </button>
            </form>
            
            <button onClick={() => logout()} className="btn btn-outline" style={{ width: '100%', color: 'var(--slate-500)', borderColor: 'var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <LogOut size={18} /> Se déconnecter complètement
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
