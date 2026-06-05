import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No auth gating for now so the app can be used without login/signup.

  return (
    <div className="relative min-h-screen bg-[#0A0A0B]">
      {children}
    </div>
  );
}
