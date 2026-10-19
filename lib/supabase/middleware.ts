import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before starting the app.');
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const protectedPath = path === '/me'
    || path === '/profile' || path.startsWith('/profile/')
    || path === '/new' || path === '/groups' || path.startsWith('/groups/')
    || path === '/friends' || path.startsWith('/friends/')
    || path === '/invites' || path.startsWith('/invites/')
    || path === '/notifications' || path.startsWith('/notifications/')
    || path === '/onboarding';
  if (!user && protectedPath) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = '/login';
    signInUrl.search = '';
    signInUrl.searchParams.set('next', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (user && (path === '/login' || path === '/signin')) {
    const destination = request.nextUrl.searchParams.get('next');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = destination?.startsWith('/') && !destination.startsWith('//') ? destination : '/app.html';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
