import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'ShowUp — Sports Social Platform MVP',
  description: 'Find players near you, drop a pin, show up and play. Sports social app for urban India.',
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en" className={cn('dark', inter.variable, spaceGrotesk.variable)}>
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster theme="dark" position="top-center" closeButton richColors />
      </body>
    </html>
  );
}
