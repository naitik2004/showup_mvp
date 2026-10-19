"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import PlayerHashBoundary from '@/features/players/components/PlayerHashBoundary';
import ShowUpHeader from "@/components/landing/ShowUpHeader";

/** Marketing renders independently from authenticated application providers. */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <PlayerHashBoundary>{children}</PlayerHashBoundary>;
  return (
    <>
      <ShowUpHeader />
      <PlayerHashBoundary>{children}</PlayerHashBoundary>
    </>
  );
}
