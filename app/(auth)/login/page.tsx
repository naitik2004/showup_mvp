'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Mail } from 'lucide-react';

const OTP_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmailOtp, verifyEmailOtp } = useAuth();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendCode = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      setSending(true);
      const { error } = await signInWithEmailOtp(value);
      if (error) {
        toast.error(error.message || 'Failed to send code. Try again.');
        return;
      }
      setDigits(Array(OTP_LENGTH).fill(''));
      setStep('code');
      setCooldown(30);
      toast.success('Sign-in code sent! Check your inbox.');
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setSending(false);
    }
  };

  const setDigit = useCallback((index: number, val: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  }, []);

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      setDigit(index, '');
      return;
    }
    // Handle multiple characters (e.g. paste into a single box)
    if (clean.length > 1) {
      const next = [...digits];
      for (let i = 0; i < clean.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = clean[i];
      }
      setDigits(next);
      const focusIdx = Math.min(index + clean.length, OTP_LENGTH - 1);
      inputsRef.current[focusIdx]?.focus();
      return;
    }
    setDigit(index, clean);
    if (index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setDigit(index - 1, '');
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const token = digits.join('');

  const handleVerify = async () => {
    if (token.length !== OTP_LENGTH) {
      toast.error('Enter the full 6-digit code');
      return;
    }
    try {
      setVerifying(true);
      const { error, onboardingComplete } = await verifyEmailOtp(email, token);
      if (error) {
        toast.error(error.message || 'Invalid or expired code');
        setDigits(Array(OTP_LENGTH).fill(''));
        inputsRef.current[0]?.focus();
        return;
      }
      toast.success('Signed in!');
      router.push(onboardingComplete ? '/map' : '/onboarding');
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      const { error } = await signInWithEmailOtp(email);
      if (error) {
        toast.error(error.message || 'Could not resend code');
        return;
      }
      setDigits(Array(OTP_LENGTH).fill(''));
      setCooldown(30);
      toast.success('A new code is on its way.');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0B] px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,rgba(232,255,71,0.08)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle_at_center,rgba(232,255,71,0.05)_0%,transparent_75%)] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-surface border border-muted mb-4">
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="text-4xl font-extrabold text-cream">ShowUp</h1>
          <p className="mt-3 text-muted-foreground">Find players. Join games. Show up.</p>
        </div>

        <Card className="border-muted bg-surface/40 backdrop-blur-xl">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === 'email' ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-cream">Sign in or create account</h2>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll email you a 6-digit code. No password needed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                        className="h-12 pl-10 bg-black/40 border-muted text-cream font-medium focus-visible:ring-primary text-base"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSendCode}
                    disabled={sending}
                    className="w-full h-12 bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                  >
                    {sending ? 'Sending code...' : 'Continue'}
                    {!sending && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <button
                    onClick={() => setStep('email')}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cream transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change email
                  </button>

                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-cream">Enter your code</h2>
                    <p className="text-sm text-muted-foreground">
                      Sent to <span className="text-cream font-medium">{email}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputsRef.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={OTP_LENGTH}
                        value={d}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        className="w-full aspect-square h-14 text-center text-2xl font-bold bg-black/40 border border-muted rounded-xl text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-transparent"
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleVerify}
                    disabled={verifying || token.length !== OTP_LENGTH}
                    className="w-full h-12 bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verifying ? 'Verifying...' : 'Verify & continue'}
                    {!verifying && <Check className="w-4 h-4" />}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={handleResend}
                      disabled={cooldown > 0}
                      className="text-sm text-muted-foreground hover:text-cream transition-colors disabled:opacity-50"
                    >
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-sm text-center text-muted-foreground mt-5">
          New to ShowUp?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Create an account
          </Link>
        </p>

        <p className="text-xs text-center text-muted-foreground mt-2">
          By continuing you agree to ShowUp&apos;s terms. Browse games without an account.
        </p>
      </motion.div>
    </div>
  );
}
