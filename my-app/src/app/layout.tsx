import { Header } from '@/composites/Header';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Spending Tracker',
  description: 'A simple spending tracker',
};

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
