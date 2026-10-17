'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { SPORTS, CITIES, Sport } from '@/types';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, sessionUser, loading: authLoading, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCity(user.city || '');
      setSelectedSports(user.preferred_sports || []);
    } else if (sessionUser) {
      setName(sessionUser.user_metadata?.full_name || '');
    }
  }, [user, sessionUser]);

  const toggleSport = (sportId: Sport) => {
    setSelectedSports((prev) =>
      prev.includes(sportId)
        ? prev.filter((s) => s !== sportId)
        : [...prev, sportId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionUser) {
      toast.error('You must be logged in to update your profile');
      router.push('/login');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateProfile(name, city, selectedSports);
      if (error) {
        toast.error(error.message || 'Failed to update profile');
      } else {
        toast.success('Profile updated successfully!');
        router.push('/profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-cream">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-cream flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2A2A2E] bg-[#111114]/80 backdrop-blur-md px-4 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="text-cream hover:bg-[#1A1A1D]">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Button>
          </Link>
          <span className="font-heading font-black text-base text-cream">Edit Profile</span>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex-1">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-[#141418] border border-[#2A2A2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-black/40 border-[#2A2A2E] text-cream font-medium focus-visible:ring-primary text-base rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Home City
              </label>
              <Select value={city} onValueChange={(val) => setCity(val || '')}>
                <SelectTrigger className="h-12 bg-black/40 border-[#2A2A2E] text-cream text-base font-medium rounded-xl focus:ring-primary">
                  <SelectValue placeholder="Select where you play" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1D] border-[#2A2A2E] text-cream">
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c} className="hover:bg-[#2A2A2E] focus:bg-[#2A2A2E] focus:text-primary">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Preferred Sports
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SPORTS.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id);
                  return (
                    <button
                      type="button"
                      key={sport.id}
                      onClick={() => toggleSport(sport.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                          : 'bg-[#1A1A1D]/60 border-[#2A2A2E] text-muted-foreground hover:border-[#3A3A3E]'
                      }`}
                    >
                      <span className="text-xl">{sport.emoji}</span>
                      <span className="text-xs truncate flex-1">{sport.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="flex gap-3">
            <Link href="/profile" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-[#2A2A2E] bg-[#141418] hover:bg-[#1A1A1D] text-cream font-bold rounded-xl"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="flex-[2] h-12 bg-primary text-black hover:bg-primary/90 font-bold rounded-xl shadow-[0_0_20px_rgba(232,255,71,0.25)] gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}