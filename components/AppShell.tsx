"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ShowUpHeader from "@/components/landing/ShowUpHeader";
import RequestLoader from '@/components/loading/RequestLoader';

/** Marketing renders independently from authenticated application providers. */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return (
    <>
      <ShowUpHeader />
      <RequestLoader />
      {children}
    </>
  );
}
