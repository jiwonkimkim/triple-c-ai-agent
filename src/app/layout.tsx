import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
