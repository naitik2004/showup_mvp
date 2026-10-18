'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import ShowUpHeader from '@/components/landing/ShowUpHeader';
import { MockDataProvider } from '@/lib/mock-data';

/** Marketing renders independently from authenticated application providers. */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/') return <>{children}</>;

  return (
    <MockDataProvider>
      <ShowUpHeader />
      {children}
    </MockDataProvider>
  );
}
