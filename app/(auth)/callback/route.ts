import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = createClient();

  await supabase.auth.exchangeCodeForSession(code);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .maybeSingle();

if (!profile) {
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    '';

  await supabase.from('users').insert({
    id: user.id,
    name: fullName,
    city: '',
    preferred_sports: [],
    location_visible: false,
  });

  return NextResponse.redirect(`${origin}/onboarding`);
}

  return NextResponse.redirect(`${origin}/map`);
}