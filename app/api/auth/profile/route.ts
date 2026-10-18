import { NextResponse } from 'next/server';
import { getFirebaseUserFromRequest } from '@/lib/firebase-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: Request) {
  try {
    const firebaseUser = await getFirebaseUserFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const supabase = createAdminClient();
    const firebaseUid = firebaseUser.uid;
    let userId: string | null = null;

    const { data: link } = await supabase.from('firebase_user_links').select('user_id').eq('firebase_uid', firebaseUid).maybeSingle();
    userId = link?.user_id || null;

    if (!userId && isUuid(firebaseUid)) {
      const { data: legacyProfile } = await supabase.from('users').select('id').eq('id', firebaseUid).maybeSingle();
      if (legacyProfile) userId = legacyProfile.id;
    }

    if (!userId && firebaseUser.email) {
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      userId = authUsers.users.find((candidate) => candidate.email?.toLowerCase() === firebaseUser.email?.toLowerCase())?.id || null;
    }

    if (!userId) {
      const { data: created, error: authError } = await supabase.auth.admin.createUser({
        email: firebaseUser.email || `${firebaseUid}@firebase-user.invalid`,
        email_confirm: true,
        user_metadata: { firebase_uid: firebaseUid, name: firebaseUser.name || '' },
      });
      if (authError) throw authError;
      userId = created.user.id;
    }

    const { data: previousProfile, error: previousProfileError } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (previousProfileError) throw previousProfileError;
    const { data: profile, error: profileError } = await supabase.from('users').upsert({
      id: userId,
      name: typeof body.name === 'string' ? body.name : previousProfile?.name || firebaseUser.name || 'Player',
      city: typeof body.city === 'string' ? body.city : previousProfile?.city || 'Delhi NCR',
      preferred_sports: Array.isArray(body.preferred_sports) ? body.preferred_sports : previousProfile?.preferred_sports || [],
      location_visible: previousProfile?.location_visible ?? false,
      onboarded: typeof body.onboarded === 'boolean' ? body.onboarded : previousProfile?.onboarded ?? false,
    }, { onConflict: 'id' }).select('*').single();
    if (profileError) throw profileError;

    const { error: linkError } = await supabase.from('firebase_user_links').upsert({ firebase_uid: firebaseUid, user_id: userId }, { onConflict: 'firebase_uid' });
    if (linkError) throw linkError;
    return NextResponse.json({ profile });
  } catch (error: any) {
    const message = error?.message || 'Could not load your profile.';
    const status = message.startsWith('Sign in') || error?.code?.startsWith('auth/') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
