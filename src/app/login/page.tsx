'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithPin } from '@/actions/auth';
import { Diamond, Delete } from 'lucide-react';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length === 0) return;

    try {
      const res = await loginWithPin(pin);
      if (res.success) {
        if (res.role === 'admin') {
          router.push('/');
        } else {
          router.push('/pos');
        }
      } else {
        setError('Erreur inconnue');
        setPin('');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur');
      setPin('');
    }
  };

  const isFull = pin.length === 4;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: 'var(--bg-color)',
      backgroundImage: 'radial-gradient(at 50% 0%, rgba(79, 70, 229, 0.2) 0px, transparent 60%), radial-gradient(at 50% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 60%)',
      zIndex: 1000
    }}>
      <div className="glass-card" style={{ padding: '2rem', margin: '1rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'var(--accent-color)', color: 'white', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <Diamond size={32} />
          </div>
          <h1 style={{ margin: 0, color: 'var(--slate-900)' }}>ZEYNARMARKET</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Saisissez votre code PIN</p>
        </div>

        {/* PIN Indicators */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              style={{
                width: '16px', 
                height: '16px', 
                borderRadius: '50%',
                backgroundColor: pin.length > i ? 'var(--accent-color)' : 'var(--slate-200)',
                boxShadow: pin.length > i ? '0 0 10px var(--accent-glow)' : 'none',
                transition: 'all 0.2s ease'
              }} 
            />
          ))}
        </div>

        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%', maxWidth: '260px', margin: '0 auto' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num}
              type="button"
              onClick={() => handlePress(num.toString())}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%',
                border: '1px solid var(--slate-200)',
                backgroundColor: 'var(--slate-50)',
                color: 'var(--slate-900)',
                fontSize: '1.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s ease',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--slate-200)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {num}
            </button>
          ))}
          
          {/* Empty space */}
          <div />
          
          <button 
            type="button"
            onClick={() => handlePress('0')}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '50%',
              border: '1px solid var(--slate-200)',
              backgroundColor: 'var(--slate-50)',
              color: 'var(--slate-900)',
              fontSize: '1.5rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--slate-200)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            0
          </button>
          
          <button 
            type="button"
            onClick={handleBackspace}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--slate-500)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger-color)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--slate-500)'; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Delete size={24} />
          </button>
        </div>

        <button 
          onClick={() => handleSubmit()}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.1rem', opacity: isFull ? 1 : 0.5, pointerEvents: isFull ? 'auto' : 'none' }}
        >
          Connexion
        </button>

      </div>
    </div>
  );
}
