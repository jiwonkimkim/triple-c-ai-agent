import type { Metadata } from 'next';
import { Noto_Sans_KR, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

// 한글 기본 폰트
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

// Collette theme serif font
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Triple C - Marketing Contents Agent',
  description:
    'AI-powered service to create professional product detail pages and promotional creatives',
  keywords: ['marketing', 'AI', 'content generation', 'detail page', 'e-commerce'],
  authors: [{ name: 'Triple C Team' }],
  openGraph: {
    title: 'Triple C - Marketing Contents Agent',
    description:
      'Create professional-level product detail pages within 10 minutes with AI',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKR.className} ${playfairDisplay.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
