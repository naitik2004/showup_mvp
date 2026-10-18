'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const result = await signInWithGoogle();
    setSubmitting(false);
    if (!result.success) { toast.error(result.error || 'Sign-in failed'); return; }
    toast.success('Signed in with Google!');
    router.push(result.onboardingComplete ? '/map' : '/onboarding');
  };

  return (
    <main className="wrap" id="app">
      <div className="au">
        <section className="auv"><span className="lb" style={{ color: '#f3efe4aa' }}>Why sign in</span><h2>Your court,<br />your crew.</h2><ul><li>Join matches and hold your spot</li><li>Chat with your group before kickoff</li><li>Build a friends list you can invite</li><li>Get reviewed and earn a reputation</li></ul></section>
        <section className="card fm" aria-label="Sign in or create account">
          <div className="chips"><button type="button" className={`chip ${tab === 'in' ? 'on' : ''}`} onClick={() => setTab('in')}>Sign in</button><button type="button" className={`chip ${tab === 'up' ? 'on' : ''}`} onClick={() => setTab('up')}>Create account</button></div>
          <p>{tab === 'up' ? 'Create your ShowUp account with Google.' : 'Sign in with your Google account.'}</p>
          <button type="button" className="btn hot" onClick={() => void submit()} disabled={submitting}>{submitting ? 'Connecting…' : 'Continue with Google'}</button>
          <p className="mono">By continuing you agree to ShowUp&apos;s terms.</p>
          <Link className="btn gh" href="/">Back to games</Link>
        </section>
      </div>
    </main>
  );
}
