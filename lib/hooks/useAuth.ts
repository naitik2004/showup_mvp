'use client';

import { useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { createClient } from '@/lib/supabase/client';
import { auth, googleProvider } from '@/lib/firebase';
import { User, Sport } from '@/types';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      setUser(data as User | null);
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profile = await fetchProfile(fbUser.uid);
        if (!profile) {
          // Auto-create profile on first Google login
          const newProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || '',
            city: '',
            preferred_sports: [],
            location_visible: false,
            onboarded: false,
          };
          await supabase.from('users').upsert(newProfile);
          setUser(newProfile as unknown as User);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchProfile, supabase]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Check if onboarding is complete
      const profile = await fetchProfile(fbUser.uid);
      const onboardingComplete = !!(profile?.onboarded);
      return { success: true, onboardingComplete };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google sign-in failed' };
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    router.push('/login');
  };

  const updateProfile = async (name: string, city: string, preferredSports: Sport[]) => {
    if (!firebaseUser) throw new Error('Not authenticated');

    const profileData = {
      id: firebaseUser.uid,
      name,
      city,
      preferred_sports: preferredSports,
      location_visible: false,
      onboarded: true,
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(profileData)
      .select()
      .maybeSingle();

    if (!error && data) setUser(data as User);
    return { data, error };
  };

  // Backward-compat: other pages use sessionUser?.id
  const sessionUser = firebaseUser ? { id: firebaseUser.uid } : null;

  return {
    firebaseUser,
    sessionUser,
    user,
    loading,
    signInWithGoogle,
    signOut,
    updateProfile,
  };
}
