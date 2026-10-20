"use client";

import type { NavigationSummary } from "@/features/navigation/types";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import PlayerHashBoundary from '@/features/players/components/PlayerHashBoundary';
import ShowUpHeader from "@/components/landing/ShowUpHeader";

/** Marketing renders independently from authenticated application providers. */
export default function AppShell({ children, initialNavigation }: {
  children: ReactNode;
  initialNavigation: NavigationSummary | null;
}) {
  const pathname = usePathname();
  if (pathname === "/") return <PlayerHashBoundary>{children}</PlayerHashBoundary>;
  return (
    <>
      <ShowUpHeader initialSummary={initialNavigation} />
      <PlayerHashBoundary>{children}</PlayerHashBoundary>
    </>
  );
}
