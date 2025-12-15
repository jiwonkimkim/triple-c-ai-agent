'use client';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/i18n';
import { localeNames, supportedLocales, type Locale } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function LanguageSelector({
  className,
  variant = 'ghost',
  size = 'sm',
  showLabel = false,
}: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
        >
          <Globe className="h-4 w-4" />
          {showLabel && <span>{localeNames[locale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLocales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={cn(locale === loc && 'bg-muted font-medium')}
          >
            <span className="mr-2">{getLocaleFlag(loc)}</span>
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getLocaleFlag(locale: Locale): string {
  const flags: Record<Locale, string> = {
    ko: '🇰🇷',
    en: '🇺🇸',
  };
  return flags[locale] || '🌐';
}
