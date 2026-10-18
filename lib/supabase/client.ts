import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Placeholder values let Next.js prerender client components at build time;
  // middleware and server requests require the real environment values.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient(url, anonKey);
}
