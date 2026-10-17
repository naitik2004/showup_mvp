'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Sport, City } from '@/types';
import { useRouter } from 'next/navigation';



export function useAuth() {

  const supabase = createClient();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  

  const fetchProfile = useCallback(async (userId: string) => {

    try {
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();


      if (error) {
        console.error('Error fetching profile:', error);
        setUser(null);
      } else {
        setUser(data as User);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  }, [supabase]);
  

  useEffect(() => {
    // Check initial session

    const getInitialSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setSessionUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error checking initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        if (session?.user) {
          setSessionUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setSessionUser(null);
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signInWithPhone = async (phone: string) => {
    // Standardize Indian phone number format +91XXXXXXXXXX
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+91' + formattedPhone;
      }
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    return { data, error, formattedPhone };
  };

  const verifyOTP = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (data?.user) {
      // Fetch profile to see if user has completed onboarding
      const { data: profile } = await supabase
        .from('users')
        .select('name, city')
        .eq('id', data.user.id)
        .maybeSingle();

      const onboardingComplete = !!(profile && profile.name && profile.city);
      return { data, error, onboardingComplete };
    }

    return { data, error, onboardingComplete: false };
  };

  const signInWithEmailOtp = async (email: string) => {
    return supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
      },
    });
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });

    if (data?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('name, city, onboarded')
        .eq('id', data.user.id)
        .maybeSingle();

      const onboardingComplete = !!(profile && profile.onboarded);
      return { data, error, onboardingComplete };
    }

    return { data, error, onboardingComplete: false };
  };

  const updateProfile = async (
  name: string,
  city: string,
  preferredSports: Sport[]
) => {
  if (!sessionUser) {
    throw new Error('Not authenticated');
  }



  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();



  const profileData = {
    id: sessionUser.id,
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



  if (!error && data) {
    setUser(data as User);
  }

  return { data, error };
};

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };


  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
  };

  const signUpWithEmail = async (email: string, password: string, name?: string, city?: string) => {
    const res = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        data: {
          full_name: name || '',
          city: city || 'Delhi NCR',
        },
      },
    });

    // When email confirmation is required, Supabase returns a user but NO session.
    const requiresEmailConfirmation = !res.data?.session && !!res.data?.user;

    return { ...res, requiresEmailConfirmation };
  };

  const verifySignupOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'signup',
    });

    if (data?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('name, city, onboarded')
        .eq('id', data.user.id)
        .maybeSingle();

      const onboardingComplete = !!(profile && profile.onboarded);
      return { data, error, onboardingComplete };
    }

    return { data, error, onboardingComplete: false };
  };

  const resendSignupOtp = async (email: string) => {
    return supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });
  };

  




  return {
    sessionUser,
    user,
    loading,
    signInWithGoogle,
    signInWithPhone,
    verifyOTP,
    signInWithEmailOtp,
    verifyEmailOtp,
    signInWithEmail,
    signUpWithEmail,
    verifySignupOtp,
    resendSignupOtp,
    updateProfile,
    signOut,
  };
}
