'use client';

import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';

export type StyleTheme = 'default' | 'smile' | 'sapporo' | 'fluid' | 'collette';

interface StyleThemeContextType {
  styleTheme: StyleTheme;
  setStyleTheme: (theme: StyleTheme) => void;
  isLoaded: boolean;
}

const StyleThemeContext = createContext<StyleThemeContextType | undefined>(undefined);

// Use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function applyStyleTheme(theme: StyleTheme) {
  const html = document.documentElement;
  html.classList.remove('style-smile', 'style-sapporo', 'style-fluid', 'style-collette');
  if (theme === 'smile') {
    html.classList.add('style-smile');
  } else if (theme === 'sapporo') {
    html.classList.add('style-sapporo');
  } else if (theme === 'fluid') {
    html.classList.add('style-fluid');
  } else if (theme === 'collette') {
    html.classList.add('style-collette');
  }
}

export function StyleThemeProvider({ children }: { children: ReactNode }) {
  // Always start with 'default' for SSR consistency
  const [styleTheme, setStyleThemeState] = useState<StyleTheme>('default');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on client mount
  useIsomorphicLayoutEffect(() => {
    const saved = localStorage.getItem('style-theme') as StyleTheme;
    if (saved === 'default' || saved === 'smile' || saved === 'sapporo' || saved === 'fluid' || saved === 'collette') {
      setStyleThemeState(saved);
      applyStyleTheme(saved);
    }
    setIsLoaded(true);
  }, []);

  // Apply theme when it changes (after initial load)
  useIsomorphicLayoutEffect(() => {
    if (isLoaded) {
      applyStyleTheme(styleTheme);
    }
  }, [styleTheme, isLoaded]);

  // Save to localStorage when theme changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('style-theme', styleTheme);
    }
  }, [styleTheme, isLoaded]);

  const setStyleTheme = (theme: StyleTheme) => {
    setStyleThemeState(theme);
  };

  return (
    <StyleThemeContext.Provider value={{ styleTheme, setStyleTheme, isLoaded }}>
      {children}
    </StyleThemeContext.Provider>
  );
}

export function useStyleTheme() {
  const context = useContext(StyleThemeContext);
  if (context === undefined) {
    throw new Error('useStyleTheme must be used within a StyleThemeProvider');
  }
  return context;
}
