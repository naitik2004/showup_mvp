import type { Metadata } from 'next';
import './globals.css';
import './showup-reference.css';
import { Toaster } from '@/components/ui/sonner';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'ShowUp — Sports Social Platform',
  description: 'Find players near you, drop a pin, show up and play. Hyperlocal sports social network for urban India.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        <AppShell>
          {children}
          <Toaster theme="dark" position="top-center" closeButton richColors />
        </AppShell>
      </body>
    </html>
  );
}
