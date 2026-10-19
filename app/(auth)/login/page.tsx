'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

function readableAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes('invalid login credentials') || value.includes('invalid email or password')) return 'Email or password is incorrect. Check both and try again.';
  if (value.includes('already registered') || value.includes('user already registered')) return 'That email is already registered. Sign in instead.';
  if (value.includes('password') && (value.includes('weak') || value.includes('least'))) return 'Password must be at least 8 characters.';
  if (value.includes('fetch') || value.includes('network') || value.includes('failed to fetch')) return 'Could not reach the sign-in service. Check the Supabase project URL and your connection, then try again.';
  return message || 'Authentication failed. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, signUp } = useAuth();
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (tab === 'up' && !name.trim()) { setError('Add your name so other players recognise you.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSubmitting(true);
    try {
      const result = tab === 'up'
        ? await signUp(name, email.trim(), password, city)
        : await signInWithPassword(email.trim(), password);
      if (!result.success) { setError(readableAuthError(result.error)); return; }
      if ('needsEmailConfirmation' in result && result.needsEmailConfirmation) {
        setNotice('Check your email to confirm your account.');
        return;
      }
      const next = new URLSearchParams(window.location.search).get('next');
      const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/app.html';
      router.replace(destination);
      router.refresh();
    } catch (cause: any) {
      setError(readableAuthError(cause?.message || 'Could not reach the sign-in service. Check the Supabase project URL and your connection, then try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="wrap" id="app">
      <div className="au">
        <section className="auv"><span className="lb" style={{ color: '#f3efe4aa' }}>Why sign in</span><h2>Your court,<br />your crew.</h2><ul><li>Join matches and hold your spot</li><li>Chat with your group before kickoff</li><li>Build a friends list you can invite</li><li>Get reviewed and earn a reputation</li></ul></section>
        <form className="card fm" aria-label="Sign in or create account" onSubmit={(event) => void submit(event)} noValidate>
          <div className="chips"><button type="button" className={`chip ${tab === 'in' ? 'on' : ''}`} onClick={() => { setTab('in'); setError(''); setNotice(''); }}>Sign in</button><button type="button" className={`chip ${tab === 'up' ? 'on' : ''}`} onClick={() => { setTab('up'); setError(''); setNotice(''); }}>Create account</button></div>
          {tab === 'up' && <div className="fl"><label htmlFor="auth-name">NAME</label><input id="auth-name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></div>}
          <div className="fl"><label htmlFor="auth-email">EMAIL</label><input id="auth-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="fl"><label htmlFor="auth-password">PASSWORD</label><input id="auth-password" name="password" type="password" autoComplete={tab === 'up' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></div>
          {tab === 'up' && <div className="fl"><label htmlFor="auth-city">CITY</label><input id="auth-city" name="city" autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} /></div>}
          {error && <p className="er" id="auth-error" role="alert">{error}</p>}
          {notice && <p className="sy" role="status">{notice}</p>}
          <button className="btn hot" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : tab === 'up' ? 'Create account' : 'Sign in'}</button>
          <p className="mono">By continuing you agree to ShowUp&apos;s terms.</p>
          <Link className="btn gh" href="/app.html">Back to games</Link>
        </form>
      </div>
    </main>
  );
}
