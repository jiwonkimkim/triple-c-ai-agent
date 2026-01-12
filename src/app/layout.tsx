import type { Metadata } from 'next';
import { Montserrat, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

// 영어 기본 폰트 - Montserrat (로고와 동일)
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
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
      <body className={`${montserrat.className} ${montserrat.variable} ${playfairDisplay.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
