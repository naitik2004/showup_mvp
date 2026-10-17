'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OtpInput from '@/components/auth/OtpInput';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { CITIES } from '@/types';

const OTP_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, verifySignupOtp, resendSignupOtp } = useAuth();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState<string>('Delhi NCR');

  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleRegister = async () => {
    if (!name.trim()) return toast.error('Please enter your name');
    if (!EMAIL_RE.test(email.trim())) return toast.error('Please enter a valid email address');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    try {
      setSubmitting(true);
      const { data, error, requiresEmailConfirmation } = await signUpWithEmail(
        email,
        password,
        name.trim(),
        city
      );

      if (error) {
        const msg = error.message || 'Registration failed. Please try again.';
        // Supabase may return a generic "User already registered".
        toast.error(/already/i.test(msg) ? 'An account with this email already exists. Try signing in.' : msg);
        return;
      }

      if (requiresEmailConfirmation) {
        setToken('');
        setStep('verify');
        setCooldown(30);
        toast.success('Check your inbox — we sent a verification code.');
        return;
      }

      // No confirmation required (autoconfirm): a session was created.
      if (data?.session) {
        toast.success('Account created!');
        router.push('/onboarding');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (code?: string) => {
    const otp = (code ?? token).trim();
    if (otp.length !== OTP_LENGTH) {
      toast.error('Enter the full 6-digit code');
      return;
    }
    try {
      setVerifying(true);
      const { error, onboardingComplete } = await verifySignupOtp(email, otp);
      if (error) {
        toast.error(error.message || 'Invalid or expired code');
        setToken('');
        return;
      }
      toast.success('Email verified!');
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
      const { error } = await resendSignupOtp(email);
      if (error) {
        toast.error(error.message || 'Could not resend the code. Please wait a moment.');
        return;
      }
      setToken('');
      setCooldown(30);
      toast.success('A new code is on its way.');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0B] px-4 py-8">
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
          <p className="mt-3 text-muted-foreground">
            {step === 'form' ? 'Create your account and start playing.' : 'Verify your email to finish signing up.'}
          </p>
        </div>

        <Card className="border-muted bg-surface/40 backdrop-blur-xl">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Full name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Rahul"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 bg-black/40 border-muted text-cream font-medium focus-visible:ring-primary text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Email address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-black/40 border-muted text-cream font-medium focus-visible:ring-primary text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-black/40 border-muted text-cream font-medium focus-visible:ring-primary text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      City
                    </label>
                    <Select value={city} onValueChange={(val) => setCity(val || 'Delhi NCR')}>
                      <SelectTrigger className="h-12 bg-black/40 border-muted text-cream text-base font-medium focus:ring-primary">
                        <SelectValue placeholder="Where do you play?" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-muted text-cream">
                        {CITIES.map((c) => (
                          <SelectItem key={c} value={c} className="hover:bg-muted focus:bg-muted focus:text-primary">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleRegister}
                    disabled={submitting}
                    className="w-full h-12 bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 mt-2"
                  >
                    {submitting ? 'Creating account...' : 'Create account'}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <button
                    onClick={() => setStep('form')}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cream transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Edit details
                  </button>

                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-cream">Enter your verification code</h2>
                    <p className="text-sm text-muted-foreground">
                      We sent a 6-digit code to <span className="text-cream font-medium">{email.trim().toLowerCase()}</span>
                    </p>
                  </div>

                  <OtpInput
                    value={token}
                    onChange={setToken}
                    length={OTP_LENGTH}
                    disabled={verifying}
                    onComplete={(code) => handleVerify(code)}
                  />

                  <Button
                    onClick={() => handleVerify()}
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
      </motion.div>
    </div>
  );
}
