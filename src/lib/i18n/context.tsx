'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  translations,
  type Locale,
  type TranslationKeys,
  defaultLocale,
  supportedLocales,
} from './translations';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
  formatMessage: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'triple-c-locale';

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && supportedLocales.includes(savedLocale as Locale)) {
      setLocaleState(savedLocale as Locale);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (supportedLocales.includes(browserLang as Locale)) {
        setLocaleState(browserLang as Locale);
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);

    // Update document lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  const t = translations[locale];

  const formatMessage = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let message = getNestedValue(t, key);

      if (!message) {
        console.warn(`Missing translation: ${key}`);
        return key;
      }

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          message = message!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
        });
      }

      return message;
    },
    [t]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatMessage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18nContext() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within I18nProvider');
  }
  return context;
}
