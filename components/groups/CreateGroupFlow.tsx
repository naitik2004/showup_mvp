'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMap } from '@/lib/hooks/useMap';
import { createClient } from '@/lib/supabase/client';
import { Sport, SPORTS, SkillLevel, CreateGameFormData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Calendar, Users, MapPin, Check, Plus, Minus, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import LocationSearch from '@/components/map/LocationSearch';

// Dynamic import of MiniMapView to avoid SSR issues
const MiniMapView = dynamic(() => import('@/components/map/MiniMapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-muted/40 animate-pulse rounded-2xl flex items-center justify-center border border-muted">
      <span className="text-xs text-muted-foreground">Loading Mini Map...</span>
    </div>
  ),
});

export default function CreateGroupFlow() {
  const router = useRouter();
  const { sessionUser } = useAuth();
  const { coords: userCoords } = useMap();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<CreateGameFormData>({
    sport: null,
    location: null,
    location_name: '',
    max_players: 10,
    skill_level: 'beginner',
    scheduled_at: new Date().toISOString().split('T')[0],
    scheduled_time: new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }),
    is_permanent: false,
  });

  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize location coordinates with user's position when available
  useEffect(() => {
    if (userCoords && !formData.location) {
      setFormData((prev) => ({ ...prev, location: userCoords }));
      triggerReverseGeocode(userCoords);
    }
  }, [userCoords]);

  const triggerReverseGeocode = async (coords: { lat: number; lng: number }) => {
    setReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`,
        {
          headers: {
            'User-Agent': 'ShowUpApp/1.0 (contact@showup.com)',
          },
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        const address = data.address;
        const road = address.road || address.pedestrian || '';
        const suburb = address.suburb || address.neighbourhood || address.village || '';
        const city = address.city || address.town || address.county || '';
        const shortAddress = [road, suburb, city].filter(Boolean).slice(0, 2).join(', ');
        setFormData((prev) => ({
          ...prev,
          location_name: shortAddress || data.display_name,
        }));
      }
    } catch (err) {
      console.warn('Nominatim geocoding error:', err);
    } finally {
      setReverseGeocoding(false);
    }
  };

  const handleCoordsChange = (coords: { lat: number; lng: number }) => {
    setFormData((prev) => ({ ...prev, location: coords }));
    triggerReverseGeocode(coords);
  };

  const handleNextStep = () => {
    if (step === 1 && !formData.sport) {
      toast.error('Please pick a sport');
      return;
    }
    if (step === 2 && !formData.location_name.trim()) {
      toast.error('Please provide a landmark or address');
      return;
    }
    setStep((prev) => (prev + 1) as any);
  };

  const handlePrevStep = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const handleSubmit = async () => {

    if (!sessionUser) {
      toast.error('You must be logged in to create a game');
      return;
    }

    setSubmitting(true);
    try {
      const dateTimeStr = `${formData.scheduled_at}T${formData.scheduled_time}:00`;
      const scheduledAt = new Date(dateTimeStr);
      
      if (scheduledAt.getTime() <= Date.now()) {
        toast.error('Scheduled time must be in the future');
        setSubmitting(false);
        return;
      }

      // 2 hours expiry for temporary groups
      const expiresAt = formData.is_permanent
        ? null
        : new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000).toISOString();

      // PostGIS Point Format
      if (!formData.location) {
        toast.error('Please select a location');
        setSubmitting(false);
        return;
      }

      const pointLocation = `POINT(${formData.location.lng} ${formData.location.lat})`;// DEBUGGING: Ensure sessionUser and sessionUser.id are correct before DB operations--------------------------------------------
      // Write game_groups
      const { data: groupData, error: groupError } = await supabase
        .from('game_groups')
        .insert({
          host_id: sessionUser.id,
          sport: formData.sport,
          location: pointLocation,
          location_name: formData.location_name,
          max_players: formData.max_players,
          skill_level: formData.skill_level,
          scheduled_at: scheduledAt.toISOString(),
          expires_at: expiresAt,
          is_permanent: formData.is_permanent,
          status: 'open',
        })
        .select()
        .single();

      if (groupError) {
        console.error('Error creating group:', groupError);
        toast.error(groupError.message);
        setSubmitting(false);
        return;
      }

      // Add host to group members list
      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: groupData.id,
        user_id: sessionUser.id,
        status: 'accepted',
      });

      if (memberError) {
        console.error('Error joining group after creation:', memberError);
      }

      toast.success('Game group created successfully!');
      router.push(`/groups/${groupData.id}`);
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during submission');
    } finally {
      setSubmitting(false);
    }
  };

  const currentSport = SPORTS.find((s) => s.id === formData.sport);
  const progressPercentage = (step / 4) * 100;

  return (
    <div className="relative min-h-screen bg-[#0A0A0B] flex flex-col items-center py-6 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[35%] h-[35%] rounded-full bg-[radial-gradient(circle_at_center,rgba(232,255,71,0.04)_0%,transparent_60%)] blur-[70px]" />
      </div>

      <div className="w-full max-w-lg z-10 flex-1 flex flex-col">
        {/* Progress & Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-heading font-extrabold text-cream">Create Game</h1>
            <span className="text-xs text-primary font-bold uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
              Step {step} of 4
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5 bg-muted" />
        </div>

        {/* Form Container */}
        <div className="bg-surface/50 border border-muted p-6 rounded-3xl shadow-xl flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <h2 className="text-2xl font-heading font-extrabold text-cream">Pick a Sport</h2>
                  <p className="text-muted-foreground text-xs mt-1">Select the sport for this game group.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {SPORTS.map((sport) => {
                    const isSelected = formData.sport === sport.id;
                    return (
                      <motion.button
                        key={sport.id}
                        onClick={() => setFormData((prev) => ({ ...prev, sport: sport.id }))}
                        whileTap={{ scale: 0.96 }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-28 relative ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-black/20 border-muted hover:border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        <span className="text-3xl mb-1">{sport.emoji}</span>
                        <span className="text-xs font-semibold text-cream">{sport.name}</span>
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <h2 className="text-2xl font-heading font-extrabold text-cream">Set Location</h2>
                  <p className="text-muted-foreground text-xs mt-1">Drag the pin to your exact playing spot.</p>
                </div>
                <div className="space-y-3 mt-4">
                  <LocationSearch
                    onSelect={(location) => {
                      setFormData((prev) => ({
                        ...prev,
                        location: {
                          lat: location.lat,
                          lng: location.lng,
                        },
                        location_name: location.name,
                      }));
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (!userCoords) {
                        toast.error('Location unavailable');
                        return;
                      }

                      setFormData((prev) => ({
                        ...prev,
                        location: userCoords,
                      }));

                      triggerReverseGeocode(userCoords);
                    }}
                  >
                    📍 Use My Current Location
                  </Button>
                </div>

                <MiniMapView
                  key={`${formData.location?.lat}-${formData.location?.lng}`}
                  initialCenter={
                    formData.location ||
                    userCoords || {
                      lat: 28.6139,
                      lng: 77.2090,
                    }
                  }
                  onCoordsChange={handleCoordsChange}
                />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Landmark / Venue Name
                  </label>
                  <Input
                    type="text"
                    placeholder={reverseGeocoding ? 'Locating...' : 'e.g. Sector 14 Park, Turf Ground'}
                    value={formData.location_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location_name: e.target.value }))}
                    className="h-11 bg-black/40 border-muted text-cream font-medium text-sm focus-visible:ring-primary"
                    disabled={reverseGeocoding}
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    You can override this with the specific court or landmark.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5 flex-1"
              >
                <div>
                  <h2 className="text-2xl font-heading font-extrabold text-cream">Game Details</h2>
                  <p className="text-muted-foreground text-xs mt-1">Configure player limits and match settings.</p>
                </div>

                {/* Player Stepper */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Max Players
                  </label>
                  <div className="flex items-center gap-4 bg-black/30 border border-muted p-2 rounded-xl w-fit">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormData((p) => ({ ...p, max_players: Math.max(2, p.max_players - 1) }))}
                      className="w-8 h-8 rounded-lg hover:bg-muted text-cream"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-base font-bold text-cream w-8 text-center">{formData.max_players}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormData((p) => ({ ...p, max_players: Math.min(30, p.max_players + 1) }))}
                      className="w-8 h-8 rounded-lg hover:bg-muted text-cream"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Skill Level Toggles */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Skill Level Required
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'pro'] as SkillLevel[]).map((level) => {
                      const isActive = formData.skill_level === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, skill_level: level }))}
                          className={`h-10 text-xs font-bold rounded-lg border uppercase tracking-wider transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-black/20 border-muted hover:border-muted-foreground text-cream'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData((p) => ({ ...p, scheduled_at: e.target.value }))}
                      className="h-11 bg-black/40 border-muted text-cream focus-visible:ring-primary text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Time
                    </label>
                    <Input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData((p) => ({ ...p, scheduled_time: e.target.value }))}
                      className="h-11 bg-black/40 border-muted text-cream focus-visible:ring-primary text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Persistence Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Group Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, is_permanent: false }))}
                      className={`flex-1 p-3 border rounded-xl flex flex-col text-left transition-all ${
                        !formData.is_permanent
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-black/20 border-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-xs font-bold text-cream">Temporary Group</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Auto-deletes 2 hrs after scheduled play.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, is_permanent: true }))}
                      className={`flex-1 p-3 border rounded-xl flex flex-col text-left transition-all ${
                        formData.is_permanent
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-black/20 border-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-xs font-bold text-cream">Permanent Group</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Persists indefinitely until host deletes.</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <h2 className="text-2xl font-heading font-extrabold text-cream">Review details</h2>
                  <p className="text-muted-foreground text-xs mt-1">Review matches parameters before publishing.</p>
                </div>

                <div className="bg-black/40 border border-muted p-5 rounded-2xl space-y-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-2.5 bg-surface border border-muted rounded-xl">
                      {currentSport?.emoji || '⚽'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-cream">{currentSport?.name} Group</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                        {formData.skill_level}
                      </span>
                    </div>
                  </div>

                  <hr className="border-muted" />

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 text-cream text-xs">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="font-semibold">{formData.location_name}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-cream text-xs">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold">
                        {new Date(`${formData.scheduled_at}T${formData.scheduled_time}`).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-cream text-xs">
                      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold">Max {formData.max_players} players</span>
                    </div>
                  </div>

                  <hr className="border-muted" />

                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl">
                    <p className="text-[10px] text-muted-foreground">
                      {formData.is_permanent
                        ? 'This group is permanent. It will not expire and can be reuse by members for future meetups.'
                        : 'This group is temporary. It will automatically delete from the map 2 hours after game starts.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav Buttons */}
          <div className="flex gap-3 pt-6 border-t border-muted mt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-11 border-muted hover:bg-muted text-cream font-bold rounded-xl"
                disabled={submitting}
              >
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex-[2] h-11 bg-primary text-primary-foreground font-bold hover:bg-primary/95 rounded-xl flex items-center justify-center gap-1"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-[2] h-11 bg-primary text-primary-foreground font-bold hover:bg-primary/95 rounded-xl"
              >
                {submitting ? 'Creating game...' : 'Publish Game Pin'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
