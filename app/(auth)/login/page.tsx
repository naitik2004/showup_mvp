'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const { error } = await signInWithGoogle();

      if (error) {
        toast.error(error.message || 'Failed to sign in with Google');
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
      setLoading(false);
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

          <h1 className="text-4xl font-extrabold text-cream">
            ShowUp
          </h1>

          <p className="mt-3 text-muted-foreground">
            Find players. Join games. Show up.
          </p>
        </div>

        <Card className="border-muted bg-surface/40 backdrop-blur-xl">
          <CardContent className="p-6">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-white text-black hover:bg-white/90 font-semibold rounded-xl"
            >
              {loading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Browse games without an account.
              Login only when you want to join or create one.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}