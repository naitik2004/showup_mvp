'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, UserPlus, MapPin, Check, X, Compass } from 'lucide-react';
import { toast } from 'sonner';

export default function FriendsPage() {
  const router = useRouter();
  const { sessionUser, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionUser) {
      setLoading(false);
      return;
    }

    const loadFriends = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('friendships')
          .select(`
            id,
            status,
            created_at,
            user_a,
            user_b
          `)
          .or(`user_a.eq.${sessionUser.id},user_b.eq.${sessionUser.id}`)
          .eq('status', 'accepted');

        if (!error && data) {
          // Collect the friend IDs
          const friendIds = data.map((f) =>
            f.user_a === sessionUser.id ? f.user_b : f.user_a
          );

          if (friendIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('*')
              .in('id', friendIds);

            setFriends(usersData || []);
          } else {
            setFriends([]);
          }
        }
      } catch (err) {
        console.warn('Error loading friends:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [sessionUser, supabase]);

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
          <span className="font-heading font-black text-base text-cream">Friends & Squad</span>
        </div>

        <Link href="/map">
          <Button size="sm" className="bg-primary text-black font-bold rounded-xl text-xs h-9 gap-1 shadow-md">
            <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Find Players</span>
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex-1">
        {loading || authLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Loading friends...
            </p>
          </div>
        ) : !sessionUser ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-cream">
              Sign in to Connect
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add friends you play with to see which matches they are joining and invite them to your runs.
            </p>
            <Link href="/login" className="inline-block pt-2">
              <Button className="bg-primary text-black font-bold rounded-xl px-6 h-11">
                Sign In / Register
              </Button>
            </Link>
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-[#141418] border border-[#2A2A2E] rounded-3xl p-8 text-center space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <UserPlus className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-black text-2xl text-cream">
                Your Squad Is Empty
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                You haven't added any sports buddies yet. Join a match on the live map, meet players on court, and tap their profile to add them to your friends list!
              </p>
            </div>

            <div className="pt-2">
              <Link href="/map">
                <Button className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl px-6 h-11 shadow-[0_0_20px_rgba(232,255,71,0.25)] gap-2">
                  <Compass className="w-4 h-4 stroke-[2.5]" />
                  <span>Join A Match on Live Map</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Active Friends ({friends.length})
            </h3>
            <div className="space-y-2.5">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-[#141418] border border-[#2A2A2E] hover:border-primary/40 rounded-2xl p-4 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-lg">
                      {(friend.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-cream text-base">
                        {friend.name || 'Player'}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary" />
                        {friend.city || 'India'}
                      </p>
                    </div>
                  </div>

                  <Link href={`/profile/${friend.id}`}>
                    <Button variant="outline" size="sm" className="border-[#2A2A2E] bg-[#1A1A1D] hover:border-primary/50 text-cream rounded-xl text-xs font-semibold h-9">
                      View Profile
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}