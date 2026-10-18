import 'server-only';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirebaseUserFromRequest } from '@/lib/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function getInviteActor(request: Request) {
  const firebaseUser: DecodedIdToken = await getFirebaseUserFromRequest(request);
  const supabase = createAdminClient();
  const { data: link, error } = await supabase.from('firebase_user_links').select('user_id').eq('firebase_uid', firebaseUser.uid).maybeSingle();
  if (error) throw error;
  if (!link?.user_id) throw new Error('Your ShowUp profile is not ready. Sign in again.');
  return { supabase, firebaseUser, userId: link.user_id as string };
}

export function apiError(error: any) {
  const message = error?.message || 'The invite request failed.';
  const code = error?.code || '';
  const status = message.startsWith('Sign in') || code.startsWith('auth/') ? 401 : message.includes('not ready') ? 409 : 500;
  return Response.json({ error: message }, { status });
}
