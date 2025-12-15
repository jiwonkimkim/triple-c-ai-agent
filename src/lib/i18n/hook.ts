'use client';

import { useI18nContext } from './context';

export function useTranslation() {
  const { locale, setLocale, t, formatMessage } = useI18nContext();

  return {
    locale,
    setLocale,
    t,
    formatMessage,
    // Convenience aliases
    translations: t,
  };
}

// Type-safe translation hook with namespace
export function useNamespacedTranslation<K extends keyof typeof import('./translations').ko>(
  namespace: K
) {
  const { t, formatMessage } = useI18nContext();

  return {
    t: t[namespace],
    formatMessage: (key: string, params?: Record<string, string | number>) =>
      formatMessage(`${namespace}.${key}`, params),
  };
}
