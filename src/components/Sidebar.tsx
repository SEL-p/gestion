'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import { useEffect, useState } from 'react';
import { Package, History, PlusCircle, Users, AlertTriangle, CheckCircle, Diamond, ShoppingCart, LogOut, Sun, Moon, Eye, DollarSign, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function Sidebar({ userRole = 'admin', storeName = 'Boutique' }: { userRole?: string, storeName?: string }) {
  const pathname = usePathname();
  const role = userRole; // derived directly from prop â€“ no need for state
  const [alertsCount, setAlertsCount] = useState(0);
  const { theme, setTheme } = useTheme();

  // Simulation: Un appel fetch rÃ©el devrait vÃ©rifier le nombre d'alertes de stock
  useEffect(() => {
    // on va implÃ©menter un endpoint pour Ã§a
    fetch('/api/alerts/count')
      .then(res => res.json())
      .then(data => {
        if(data && typeof data.count === 'number') setAlertsCount(data.count);
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Package size={20} />, roles: ['admin'] },
    { name: 'Catalogue', path: '/products', icon: <Package size={20} />, roles: ['admin', 'cashier'] },
    { name: 'GÃ©rer les Prix', path: '/prices', icon: <DollarSign size={20} />, roles: ['admin', 'manager'] },
    { name: 'CatÃ©gories', path: '/categories', icon: <PlusCircle size={20} />, roles: ['admin'] },
    { name: 'Clients', path: '/customers', icon: <Users size={20} />, roles: ['admin'] },
    { name: 'Historique', path: '/history', icon: <History size={20} />, roles: ['admin'] },
    { name: 'Caissiers', path: '/users', icon: <Users size={20} />, roles: ['admin'] },
    { name: 'ParamÃ¨tres', path: '/settings', icon: <Diamond size={20} />, roles: ['admin'] },
    { name: 'Alertes Stock', path: '/alerts', icon: alertsCount > 0 ? <AlertTriangle size={20} color="var(--danger-color)" /> : <CheckCircle size={20} color="var(--success-color)" />, roles: ['admin'], badge: alertsCount },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-header" style={{ marginBottom: '3rem', padding: '0 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--slate-900)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ backgroundColor: 'var(--accent-color)', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Diamond size={18} />
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storeName}</span>
        </h2>
        
        {/* Mobile Logout Button (hidden on desktop via CSS) */}
        <button onClick={() => logout()} className="btn btn-outline mobile-logout" style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--slate-200)', color: 'var(--danger-color)', display: 'none' }} title="DÃ©connexion">
          <LogOut size={18} />
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map(item => {
          if (!item.roles.includes(role)) return null;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--border-radius-sm)',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-color)' : 'var(--slate-600)',
                backgroundColor: isActive ? 'var(--slate-100)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                transition: 'all var(--transition-speed) ease'
              }}
              onMouseEnter={(e) => {
                if(!isActive) {
                  e.currentTarget.style.color = 'var(--slate-900)';
                  e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                }
              }}
              onMouseLeave={(e) => {
                if(!isActive) {
                  e.currentTarget.style.color = 'var(--slate-600)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              {item.name}
              {item.badge && item.badge > 0 ? (
                <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{item.badge}</span>
              ) : null}
            </Link>
          );
        })}

        <div style={{ margin: '1rem 0', height: '1px', backgroundColor: 'var(--slate-200)' }} />

        <Link 
          href="/pos" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--border-radius-sm)',
            textDecoration: 'none',
            color: 'white',
            backgroundColor: 'var(--accent-color)',
            boxShadow: '0 4px 14px 0 var(--accent-glow)',
            fontWeight: 600,
            transition: 'all var(--transition-speed) ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-color)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ShoppingCart size={20} />
          Interface Caisse
        </Link>
      </nav>
      
      <div className="logout-section" style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          onClick={() => {
            if (theme === 'system') setTheme('light');
            else if (theme === 'light') setTheme('dark');
            else if (theme === 'dark') setTheme('high-contrast');
            else setTheme('system');
          }} 
          className="btn btn-outline" 
          style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          {theme === 'system' && <><Sparkles size={18} color="#00796B" /> ThÃ¨me: Auto (OS)</>}
          {theme === 'light' && <><Sun size={18} /> ThÃ¨me: Clair</>}
          {theme === 'dark' && <><Moon size={18} /> ThÃ¨me: Sombre</>}
          {theme === 'high-contrast' && <><Eye size={18} /> Contraste Ã‰levÃ©</>}
        </button>

        <button onClick={() => logout()} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--danger-color)', borderColor: 'var(--slate-300)' }}>
          <LogOut size={18} /> DÃ©connexion
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
          <span>Version 2.5</span>
          <span>â€¢</span>
          <span>Zeynarmarket</span>
        </div>
      </div>
    </aside>
  );
}
