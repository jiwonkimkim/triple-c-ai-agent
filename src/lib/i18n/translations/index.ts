export { ko, type TranslationKeys } from './ko';
export { en } from './en';

import { ko } from './ko';
import { en } from './en';

export type Locale = 'ko' | 'en';

export const translations = {
  ko,
  en,
} as const;

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};

export const defaultLocale: Locale = 'ko';

export const supportedLocales: Locale[] = ['ko', 'en'];
