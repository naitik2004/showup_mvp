'use client';

import { useState, useEffect, useRef } from 'react';

import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GameGroup, GroupMember, SPORTS } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users, ArrowLeft, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useGroupChat } from '@/lib/hooks/useGroupChat';

import { usePresence } from '@/lib/hooks/usePresence';



export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const groupId = params.id as string;


  const [group, setGroup] = useState<GameGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage } = useGroupChat(groupId);
  const {onlineCount,typingUsers,setTyping,stopTyping} = usePresence(groupId, currentUserName);
  
  useEffect(() => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);


  useEffect(() => {
    if (!groupId) return;

    const fetchGroupDetails = async () => {
      const {data: { user },} = await supabase.auth.getUser();

      setCurrentUserId(user?.id || '');

      const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', user?.id)
      .single();

      setCurrentUserName(profile?.name || 'Player');
      setLoading(true);

      try {
        // Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from('game_groups')
          .select('*, host:users(*)')
          .eq('id', groupId)
          .single();

        if (groupError) {
          toast.error('Game group not found');
          router.push('/map');
          return;
        }

        // Parse location coordinates
        let groupCoords = { lat: 0, lng: 0 };
        if (groupData.location && groupData.location.coordinates) {
          groupCoords = {
            lat: groupData.location.coordinates[1],
            lng: groupData.location.coordinates[0],
          };
        }

        setGroup({
          ...groupData,
          location: groupCoords,
        } as any);

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select('*, user:users(*)')
          .eq('group_id', groupId);

        if (!membersError) {
          setMembers(membersData as GroupMember[]);
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId, supabase, router]);


  // useEffect(() => {
  //   if (!groupId) return;

  //   const channel = supabase
  //     .channel(`group-members-${groupId}`)
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'group_members',
  //         filter: `group_id=eq.${groupId}`,
  //       },
  //       async () => {
  //         const { data } = await supabase
  //           .from('group_members')
  //           .select('*, user:users(*)')
  //           .eq('group_id', groupId);

  //         if (data) {
  //           setMembers(data as GroupMember[]);
  //         }
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [groupId]);



  useEffect(() => {
  const channel = supabase
    .channel(`group-members-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      },
      async (payload) => {
        console.log('GROUP MEMBERS UPDATED');
        console.log(payload);

        const { data } = await supabase
          .from('group_members')
          .select('*, user:users(*)')
          .eq('group_id', groupId);

        console.log('NEW MEMBERS DATA', data);

        setMembers(data || []);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [groupId]);



  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] p-6">
        <div className="max-w-5xl mx-auto animate-pulse space-y-6">

          {/* Header */}
          <div className="h-10 w-48 bg-muted rounded-lg" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Side */}
            <div className="md:col-span-2 space-y-6">

              <div className="bg-surface/30 border border-muted rounded-3xl p-6 space-y-4">
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-5 w-64 bg-muted rounded" />
                <div className="h-5 w-52 bg-muted rounded" />
                <div className="h-5 w-40 bg-muted rounded" />
              </div>

              <div>
                <div className="h-5 w-40 bg-muted rounded mb-4" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-24 bg-surface/30 border border-muted rounded-2xl"
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Chat Skeleton */}
            <div className="h-[75vh] bg-surface/30 border border-muted rounded-3xl p-4 flex flex-col">
              <div className="h-6 w-28 bg-muted rounded mb-6" />

              <div className="flex-1 space-y-3">
                <div className="h-12 w-2/3 bg-muted rounded-xl" />
                <div className="h-12 w-1/2 bg-muted rounded-xl ml-auto" />
                <div className="h-12 w-3/4 bg-muted rounded-xl" />
              </div>

              <div className="h-12 bg-muted rounded-xl mt-4" />
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  const sportInfo = SPORTS.find((s) => s.id === group.sport);

  const formattedDate = new Date(group.scheduled_at).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(group.scheduled_at).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!chatMessage.trim()) return;

      const { error } = await sendMessage(
        currentUserId,
        chatMessage
      );

      if (error) {
        toast.error(error.message);
        return;
      }

      setChatMessage('');
      await stopTyping();
    };




    const handleLeaveGroup = async () => {

      if (!confirm('Are you sure you want to leave this group?')) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to leave group');
        return;
      }
      setMembers((prev) =>
        prev.filter((m) => m.user_id !== user.id)
      );

      toast.success('Left group');

      router.push('/map');
    };

    const isHost = currentUserId === group.host_id;



  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col">
      {/* Top Header */}
      <header className="border-b border-muted bg-surface/30 backdrop-blur-md sticky top-0 z-10 px-4 h-14 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/map')}
          className="text-cream hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{sportInfo?.emoji}</span>
          <h1 className="font-heading font-extrabold text-cream truncate max-w-[200px]">
            {sportInfo?.name || 'Sports Match'}
          </h1>
        </div>
      </header>

      <div className="max-w-4xl w-full mx-auto p-4 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Game details & Players list */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-surface/40 border-muted">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {group.skill_level}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.is_permanent ? 'Permanent Group' : 'Temporary Group'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Location</h4>
                    <p className="text-base font-bold text-cream mt-0.5">{group.location_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date & Time</h4>
                    <p className="text-base font-bold text-cream mt-0.5">
                      {formattedDate} at {formattedTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />

                  <div>
                    <h4 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Players count</h4>
                    <p className="text-base font-bold text-cream mt-0.5">
                      {members.length} / {group.max_players} joined
                    </p>
                  </div>

                </div>
                {!isHost && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleLeaveGroup}
                    >
                      Leave Group
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
              Joined Players ({members.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((member) => (
                <Card key={member.id} className="bg-surface/30 border-muted hover:border-muted-foreground transition-all">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shrink-0">
                      {(member.user?.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-cream truncate">{member.user?.name || 'Player'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{member.user?.city || 'India'}</p>
                    </div>
                    {member.user_id === group.host_id && (
                      <span className="text-[9px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        Host
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      

      {/* Right Side: Group Chat */}
        <div className="flex flex-col h-[75vh] border border-muted bg-surface/20 rounded-3xl overflow-hidden shadow-2xl">

        <div className="p-4 bg-surface border-b border-muted flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-heading font-extrabold text-cream">
              Group Chat
            </h3>

            <p className="text-xs text-muted-foreground">
              🟢 {onlineCount} online
            </p>
          </div>
        </div>

        <div ref={messagesEndRef} className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3">

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-muted rounded-full text-muted-foreground mb-2">
                <MessageSquare className="w-6 h-6" />
              </div>

              <p className="text-sm font-bold text-cream">
                Match Chat Group
              </p>

              <p className="text-xs text-muted-foreground max-w-[200px]">
                No messages yet. Start the conversation.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender_id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isMine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-3 ${
                      isMine
                        ? 'bg-primary text-black'
                        : 'bg-black/40 border border-muted'
                    }`}
                  >
                    {!isMine && (
                      <p className="text-xs font-bold text-primary mb-1">
                        {message.sender?.name || 'Player'}
                      </p>
                    )}

                    <p className="text-sm">
                      {message.content}
                    </p>
                    <p className="text-[10px] opacity-60 mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}

        </div>

        {typingUsers.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-2">
            {/* Sender name */}
            <span className="text-xs text-muted-foreground font-semibold">
              {typingUsers[0]}
            </span>

            {/* Animated typing bubble */}
            <div className="flex items-center gap-1 bg-black/40 border border-muted px-3 py-2 rounded-xl">
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '900ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: '150ms', animationDuration: '900ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: '300ms', animationDuration: '900ms' }}
              />
            </div>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-surface border-t border-muted flex gap-2"
        >
          <input
            type="text"
            placeholder="Send message..."
            value={chatMessage}


            onChange={(e) => {
              console.log("INPUT CHANGED");

              setChatMessage(e.target.value);

              setTyping();
            }}
            
            className="flex-1 bg-black/40 border border-muted text-cream px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary"
          />

          <Button
            type="submit"
            size="icon"
            className="bg-primary text-primary-foreground rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
      </div>
      </div>
  );
}
