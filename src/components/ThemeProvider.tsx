'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark' | 'high-contrast';

type ThemeContextType = {
  theme: Theme;
  effectiveTheme: 'light' | 'dark' | 'high-contrast';
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Read the stored theme once (synchronously) to avoid flash */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('app-theme') as Theme | null) || 'system';
}

function resolveEffective(t: Theme): 'light' | 'dark' | 'high-contrast' {
  if (t === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise state eagerly so no setState-in-effect needed
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark' | 'high-contrast'>(
    () => resolveEffective(getInitialTheme())
  );

  // Track the current theme in a ref so the event-listener closure stays fresh
  const themeRef = useRef(theme);

  // Apply to DOM whenever effectiveTheme changes, and keep ref in sync
  useEffect(() => {
    themeRef.current = theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme, effectiveTheme]);

  // Subscribe to OS color-scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeRef.current === 'system') {
        const next = mediaQuery.matches ? 'dark' : 'light';
        setEffectiveTheme(next);
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    setEffectiveTheme(resolveEffective(newTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
