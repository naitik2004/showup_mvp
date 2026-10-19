'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { notifyNavigationChanged } from '@/lib/navigation-events';
import { createClient } from '@/lib/supabase/client';
import { User, Sport } from '@/types';

export function useAuth() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('id,name,city,avatar_url,preferred_sports,onboarded,created_at,player_id').eq('id', userId).maybeSingle();
    if (error) throw error;
    setUser(data as User | null);
    return data as User | null;
  }, [supabase]);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!alive) return;
      setEmail(authUser?.email || null);
      try {
        if (authUser) await loadProfile(authUser.id);
        else setUser(null);
      } catch (error) {
        console.error('Could not load profile:', error);
        setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void sync();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setEmail(authSession?.user.email || null);
      if (!authSession) {
        setUser(null);
        setLoading(false);
      } else {
        setLoading(true);
        window.setTimeout(() => { void loadProfile(authSession.user.id).finally(() => setLoading(false)); }, 0);
      }
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [loadProfile, supabase]);

  const signInWithPassword = async (emailAddress: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailAddress, password });
    if (error) return { success: false as const, error: error.message };
    setEmail(data.user.email || null);
    const profile = await loadProfile(data.user.id);
    return { success: true as const, onboardingComplete: !!profile?.onboarded };
  };

  const signUp = async (name: string, emailAddress: string, password: string, city: string) => {
    const requestedNext = new URLSearchParams(window.location.search).get('next');
    const safeNext = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/app.html';
    const { data, error } = await supabase.auth.signUp({
      email: emailAddress,
      password,
      options: {
        data: { name: name.trim(), city: city.trim() },
        emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(safeNext)}`,
      },
    });
    if (error) return { success: false as const, error: error.message };
    if (data.user && data.user.identities?.length === 0) {
      return { success: false as const, error: 'That email is already registered. Sign in instead.' };
    }
    if (!data.session) return { success: true as const, needsEmailConfirmation: true as const };
    setEmail(data.user?.email || null);
    if (data.user) await loadProfile(data.user.id);
    return { success: true as const, needsEmailConfirmation: false as const };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setEmail(null);
    notifyNavigationChanged();
    toast.success('Signed out.');
    router.push('/login');
    router.refresh();
  };

  const updateProfile = async (name: string, city: string, preferredSports: Sport[]) => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return { data: null, error: authError || new Error('Not authenticated') };
    const { data, error } = await supabase.from('profiles').update({
      name, city, preferred_sports: preferredSports, onboarded: true,
    }).eq('id', authUser.id).select('id,name,city,avatar_url,preferred_sports,onboarded,created_at,player_id').single();
    if (error) { toast.error(error.message); return { data: null, error }; }
    setUser(data as User);
    toast.success('Profile updated.');
    return { data: data as User, error: null };
  };

  return {
    sessionUser: user ? { id: user.id } : null,
    user,
    email,
    loading,
    signInWithPassword,
    signUp,
    signOut,
    updateProfile,
  };
}
