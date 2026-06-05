'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SPORTS, CITIES, Sport } from '@/types';
import { ArrowRight, Check } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState<string>('');
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleNextStep = () => {
    if (!name.trim()) {
      toast.error('Please enter your first name');
      return;
    }
    if (!city) {
      toast.error('Please select your city');
      return;
    }
    setStep(2);
  };

  const handleToggleSport = (sportId: Sport) => {
    setSelectedSports((prev) =>
      prev.includes(sportId)
        ? prev.filter((s) => s !== sportId)
        : [...prev, sportId]
    );
  };

  const handleSubmit = async () => {
    if (selectedSports.length === 0) {
      toast.error('Please select at least one sport to continue');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await updateProfile(name, city, selectedSports);
      if (error) {
        toast.error(error.message || 'Failed to complete onboarding. Try again.');
      } else {
        toast.success('Onboarding complete! Welcome to ShowUp.');
        router.push('/map');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-[#0A0A0B] px-4 py-8">
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] right-[5%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(232,255,71,0.06)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(232,255,71,0.04)_0%,transparent_70%)] blur-[90px]" />
      </div>

      <div className="w-full max-w-xl z-10 space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Onboarding</span>
            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">Step {step} of 2</span>
          </div>
          <div className="flex gap-1 w-24">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>

        <div className="bg-surface/40 backdrop-blur-xl border border-muted p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-heading font-extrabold tracking-tight text-cream">
                    Who are you?
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Enter your name and pick your city so players nearby know who they're playing with.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      First Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Rahul"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 bg-black/40 border-muted text-cream font-medium focus-visible:ring-primary text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Select City
                    </label>
                    <Select value={city} onValueChange={(val) => setCity(val || '')}>
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
                    onClick={handleNextStep}
                    className="w-full h-12 bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 mt-4"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-heading font-extrabold tracking-tight text-cream">
                    What do you play?
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Select the sports you play. You can choose more than one. We'll show you games for these sports.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SPORTS.map((sport) => {
                    const isSelected = selectedSports.includes(sport.id);
                    return (
                      <motion.button
                        key={sport.id}
                        onClick={() => handleToggleSport(sport.id)}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all relative overflow-hidden h-32 ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5'
                            : 'bg-black/30 border-muted hover:border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        <span className="text-3xl mb-2">{sport.emoji}</span>
                        <span className="text-sm font-semibold tracking-wide text-cream">{sport.name}</span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 h-12 border-muted hover:bg-muted text-cream font-bold"
                    disabled={submitting}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-[2] h-12 bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all rounded-xl shadow-lg shadow-primary/10"
                    disabled={selectedSports.length === 0 || submitting}
                  >
                    {submitting ? 'Setting up...' : 'Get Started'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
