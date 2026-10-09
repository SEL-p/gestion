'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithPin } from '@/actions/auth';
import { Delete } from 'lucide-react';

// Bouton du numpad — fonctionne aussi bien sur mobile (touch) que desktop (mouse)
function PadButton({
  children,
  onClick,
  disabled,
  variant = 'digit',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'digit' | 'delete';
}) {
  const [pressed, setPressed] = useState(false);

  const baseStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s ease, background-color 0.1s ease',
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    // Supprime le délai de 300ms et le highlight bleu sur mobile
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transform: pressed && !disabled ? 'scale(0.84)' : 'scale(1)',
  };

  const digitStyle: React.CSSProperties = {
    ...baseStyle,
    border: `1.5px solid ${pressed && !disabled ? 'var(--accent-color)' : 'var(--slate-200)'}`,
    backgroundColor: pressed && !disabled ? 'rgba(0, 121, 107, 0.08)' : 'var(--slate-50)',
    color: 'var(--slate-900)',
    fontSize: 'clamp(1.2rem, 5vw, 1.5rem)',
    fontWeight: '600',
    boxShadow: pressed && !disabled
      ? '0 1px 3px rgba(0,0,0,0.04)'
      : '0 2px 6px rgba(0,0,0,0.05)',
  };

  const deleteStyle: React.CSSProperties = {
    ...baseStyle,
    border: 'none',
    backgroundColor: 'transparent',
    color: pressed && !disabled ? 'var(--danger-color)' : 'var(--slate-400)',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      style={variant === 'digit' ? digitStyle : deleteStyle}
      onPointerDown={() => { if (!disabled) setPressed(true); }}
      onPointerUp={() => { setPressed(false); if (!disabled) onClick(); }}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePress = (num: string) => {
    if (pin.length < 4 && !loading) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    if (!loading) setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4 || loading) return;
    setLoading(true);
    try {
      const res = await loginWithPin(pin);
      if (res.success) {
        router.push(res.role === 'admin' ? '/' : '/pos');
      } else {
        setError('PIN incorrect. Réessayez.');
        setPin('');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit dès que 4 chiffres sont saisis
  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const isFull = pin.length === 4;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // 100dvh : hauteur dynamique (évite les problèmes avec la barre d'URL mobile).
      // Les styles inline React ne permettent pas de dupliquer une propriété :
      // on ne conserve donc que dvh (l'ancien "minHeight: 100vh" était écrasé).
      minHeight: '100dvh',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: 'var(--bg-color)',
      backgroundImage:
        'radial-gradient(at 50% 0%, rgba(0, 121, 107, 0.14) 0px, transparent 55%), ' +
        'radial-gradient(at 50% 100%, rgba(16, 185, 129, 0.07) 0px, transparent 55%)',
      zIndex: 1000,
      // Safe area pour les iPhones avec encoche
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }}>
      <div
        className="glass-card"
        style={{
          // Padding adaptatif : spacieux sur desktop, compact sur mobile
          padding: 'clamp(1.5rem, 5vw, 2.5rem) clamp(1.25rem, 5vw, 2rem)',
          margin: 'clamp(0.5rem, 3vw, 1rem)',
          width: '100%',
          maxWidth: '380px',
          textAlign: 'center',
        }}
      >

        {/* ── Logo ── */}
        <div style={{ marginBottom: 'clamp(1rem, 4vw, 1.75rem)' }}>
          <div style={{
            width: 'clamp(80px, 22vw, 100px)',
            height: 'clamp(80px, 22vw, 100px)',
            borderRadius: '22px',
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 28px -4px rgba(0, 77, 64, 0.2), 0 2px 8px rgba(0,0,0,0.06)',
            border: '1.5px solid rgba(0, 121, 107, 0.18)',
            margin: '0 auto clamp(0.75rem, 3vw, 1.25rem) auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <img
              src="/logo.png"
              alt="Logo ZEYNARMARKET"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
          <h1 style={{
            margin: 0,
            color: 'var(--slate-900)',
            fontSize: 'clamp(1.2rem, 5vw, 1.55rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}>
            ZEYNARMARKET
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            margin: '0.35rem 0 0 0',
            fontSize: 'clamp(0.82rem, 3.5vw, 0.9rem)',
          }}>
            Saisissez votre code PIN
          </p>
        </div>

        {/* ── Indicateurs PIN ── */}
        <div style={{
          display: 'flex',
          gap: 'clamp(0.6rem, 3vw, 1rem)',
          justifyContent: 'center',
          marginBottom: 'clamp(1rem, 4vw, 2rem)',
        }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                width: 'clamp(12px, 3.5vw, 15px)',
                height: 'clamp(12px, 3.5vw, 15px)',
                borderRadius: '50%',
                backgroundColor: pin.length > i ? 'var(--accent-color)' : 'var(--slate-200)',
                boxShadow: pin.length > i ? '0 0 10px var(--accent-glow)' : 'none',
                transform: pin.length > i ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.18s ease',
              }}
            />
          ))}
        </div>

        {/* ── Feedback erreur / chargement ── */}
        <div style={{ minHeight: '1.4rem', marginBottom: 'clamp(0.75rem, 3vw, 1.25rem)' }}>
          {loading && (
            <span style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 500 }}>
              Vérification…
            </span>
          )}
          {error && !loading && (
            <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: 500 }}>
              {error}
            </span>
          )}
        </div>

        {/* ── Numpad ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          // Gap et taille adaptive selon l'écran
          gap: 'clamp(0.5rem, 2.5vw, 0.85rem)',
          width: '100%',
          // Le numpad prend 80% de la largeur de la carte, borné entre 200px et 260px
          maxWidth: 'min(260px, 80%)',
          margin: '0 auto',
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <PadButton key={num} onClick={() => handlePress(num.toString())} disabled={loading}>
              {num}
            </PadButton>
          ))}

          {/* Cellule vide */}
          <div />

          {/* Touche 0 */}
          <PadButton onClick={() => handlePress('0')} disabled={loading}>
            0
          </PadButton>

          {/* Touche effacer */}
          <PadButton onClick={handleBackspace} disabled={loading} variant="delete">
            <Delete size={20} />
          </PadButton>
        </div>

        {/* ── Bouton Connexion ── */}
        <button
          onClick={handleSubmit}
          disabled={!isFull || loading}
          className="btn btn-primary"
          style={{
            width: '100%',
            marginTop: 'clamp(1.25rem, 4vw, 1.75rem)',
            padding: 'clamp(0.75rem, 3vw, 0.9rem)',
            fontSize: 'clamp(0.9rem, 3.5vw, 1rem)',
            fontWeight: 700,
            opacity: isFull && !loading ? 1 : 0.45,
            cursor: isFull && !loading ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s ease',
            // Taille tactile minimale recommandée : 48px
            minHeight: '48px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {loading ? 'Connexion…' : 'Connexion'}
        </button>

      </div>
    </div>
  );
}
