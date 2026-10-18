'use client';

import { useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { User, Sport } from '@/types';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (fbUser: any) => {
    try {
      const token = await fbUser.getIdToken();
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load your profile.');
      setUser(result.profile as User);
      return result.profile as User;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profile = await fetchProfile(fbUser);
        if (!profile) {
          console.error('The signed-in Firebase user has no ShowUp profile.');
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  const signInWithGoogle = async () => {
    try {
      if (!auth) throw new Error('Firebase sign-in is not configured.');
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Check if onboarding is complete
      const profile = await fetchProfile(fbUser);
      const onboardingComplete = !!(profile?.onboarded);
      return { success: true, onboardingComplete };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google sign-in failed' };
    }
  };

  const signOut = async () => {
    if (!auth) return;
    await fbSignOut(auth);
    router.push('/login');
  };

  const updateProfile = async (name: string, city: string, preferredSports: Sport[]) => {
    if (!firebaseUser) throw new Error('Not authenticated');
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, preferred_sports: preferredSports, onboarded: true }),
      });
      const result = await response.json();
      if (!response.ok) return { data: null, error: new Error(result.error || 'Could not update your profile.') };
      setUser(result.profile as User);
      return { data: result.profile as User, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  // Backward-compat: other pages use sessionUser?.id
  const sessionUser = user ? { id: user.id } : null;

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
