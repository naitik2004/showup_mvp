import 'server-only';
import { createClient } from '@/lib/supabase/server';

export async function getInviteActor() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sign in to manage invites.');
  return { supabase, userId: user.id };
}

export function apiError(error: any) {
  const message = error?.message || 'The invite request failed.';
  const code = error?.code || '';
  const status = message.startsWith('Sign in') ? 401 : code === 'P0002' ? 404 : 500;
  return Response.json({ error: message }, { status });
}
