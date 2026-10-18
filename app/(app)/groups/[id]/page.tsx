'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { GameGroup, GroupMember, SPORTS } from '@/types';
import { toast } from 'sonner';
import { useGroupChat } from '@/lib/hooks/useGroupChat';
import { useAuth } from '@/lib/hooks/useAuth';
import InviteFriendsDialog from '@/components/groups/InviteFriendsDialog';

import { usePresence } from '@/lib/hooks/usePresence';



export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { sessionUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);
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
    messagesEndRef.current?.scrollIntoView({
      behavior: messages.length > 1 ? 'smooth' : 'auto',
    });
  }, [messages]);


  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'auto',
        });
      }, 100);
    }
  }, [loading]);


  useEffect(() => {
    if (!groupId) return;

    const fetchGroupDetails = async () => {
      setCurrentUserId(sessionUser?.id || '');

      const { data: profile } = sessionUser ? await supabase
      .from('users')
      .select('name')
      .eq('id', sessionUser.id)
      .single() : { data: null };

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
  }, [groupId, supabase, router, sessionUser?.id]);


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
    return <main className="wrap" id="app"><section className="card emp"><p>Loading match…</p></section></main>;
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

      if (!currentUserId) return;

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUserId);

      if (error) {
        toast.error('Failed to leave group');
        return;
      }
      setMembers((prev) =>
        prev.filter((m) => m.user_id !== currentUserId)
      );

      toast.success('Left group');

      router.push('/');
    };


    const kickPlayer = async (userId: string) => {
      if (!confirm("Remove this player?")) {
        return;
      }

      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to remove player");
        return;
      }

      toast.success("Player removed");
    };

    const isHost = currentUserId === group.host_id;
    const isMember = members.some((member) => member.user_id === currentUserId);
    const joinMatch = async () => {
      if (!sessionUser) { router.push('/login'); return; }
      if (group.status !== 'open' || members.length >= group.max_players) {
        toast.error(`This match is ${group.status === 'in_progress' ? 'live' : group.status === 'expired' ? 'done' : 'full'} and cannot be joined.`);
        return;
      }
      const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: currentUserId, status: 'accepted' });
      if (error) { toast.error(error.message); return; }
      setMembers((previous) => [...previous, { id: `${groupId}-${currentUserId}`, group_id: groupId, user_id: currentUserId, status: 'accepted', user: { id: currentUserId, name: currentUserName } } as GroupMember]);
      toast.success('You are in.');
    };
    
    const updateGroupStatus = async (
      status: 'in_progress' | 'expired'
    ) => {
      const { error } = await supabase
        .from("game_groups")
        .update({
          status,
          ...(status === "in_progress"
            ? { started_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", groupId);

      if (error) {
        toast.error("Failed to update status");
        return;
      }

      setGroup((prev) =>
        prev ? { ...prev, status } : prev
      );

      toast.success(`Game marked as ${status}`);
    };



  const displayStatus = group.status === 'in_progress' ? 'live' : group.status === 'expired' ? 'done' : group.status === 'open' && members.length >= group.max_players ? 'full' : group.status;
  return (
    <main className="wrap" id="app">
      <Link className="lb" href="/">← All games</Link>
      <section className="mh" style={{ marginTop: 14 }}>
        <div>
          <span className="lb" style={{ color: '#f3efe4aa' }}>{group.is_permanent ? 'Permanent group' : 'One-off match'} <span className={`pl ${displayStatus}`}>{displayStatus}</span></span>
          <h1>{sportInfo?.emoji} {sportInfo?.name || 'Sports Match'}</h1>
          <p>{group.location_name}, {formattedDate} at {formattedTime}</p>
          <p>{group.skill_level} level</p>
        </div>
        <div><p className="mono" style={{ color: '#f3efe4aa', marginBottom: 8 }}>{members.length} of {group.max_players} in, {Math.max(0, group.max_players - members.length)} left</p><div className="sd">{Array.from({ length: Math.min(group.max_players, 12) }, (_, index) => <i key={index} className={index < members.length ? 'on' : ''} />)}</div></div>
      </section>
      <div className="acts">
        {!isMember && <button className="btn hot" onClick={() => void joinMatch()} disabled={displayStatus !== 'open'}>{displayStatus === 'open' ? 'Join this match' : displayStatus === 'full' ? 'Match is full' : 'Not joinable'}</button>}
        {isMember && !isHost && ['open', 'full'].includes(displayStatus) && <button className="btn bad" onClick={handleLeaveGroup}>Leave match</button>}
        {isMember && ['open', 'full', 'live'].includes(displayStatus) && <InviteFriendsDialog gameId={groupId} />}
        {isHost && group.status === 'open' && <><button className="btn hot" onClick={() => updateGroupStatus('in_progress')}>Start match</button><button className="btn bad" onClick={() => updateGroupStatus('expired')}>Cancel match</button></>}
        {isHost && group.status === 'in_progress' && <button className="btn gh" onClick={() => updateGroupStatus('expired')}>End match</button>}
      </div>
      <div className="mg2">
        <section className="card"><h3>Players</h3>
          {members.map((member) => <div className="mem" key={member.id}><i className="av">{(member.user?.name || 'P').charAt(0).toUpperCase()}</i><div><b>{member.user?.name || 'Player'}</b><br /><small>{member.user?.city || 'India'}</small></div>{member.user_id === group.host_id && <span className="tag h">Host</span>}{isHost && member.user_id !== group.host_id && <button className="btn sm bad" onClick={() => void kickPlayer(member.user_id)}>Remove</button>}</div>)}
          {!members.length && <p className="sy">No players have joined yet.</p>}
        </section>
        <section className="card cht"><div className="chh"><h3 style={{ margin: 0 }}>Group chat</h3>{isMember && <span className="mono">● {onlineCount} online</span>}</div>
          {isMember ? <>
            <div className="msgs">{messages.length ? messages.map((message) => <div className={`mg ${message.sender_id === currentUserId ? 'me' : ''}`} key={message.id}><small>{message.sender_id === currentUserId ? 'You' : message.sender?.name || 'Player'}, {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small><p>{message.content}</p></div>) : <p className="sy">No messages yet. Ask who is bringing the gear.</p>}<div ref={messagesEndRef} /></div>
            {typingUsers.length > 0 && <div className="ty on">{typingUsers[0]} is typing</div>}
            <form id="cf" onSubmit={handleSendMessage}><input value={chatMessage} onChange={(event) => { setChatMessage(event.target.value); setTyping(); }} placeholder="Message the group" aria-label="Message the group" /><button className="btn" type="submit">Send</button></form>
          </> : <p className="sy lock">Only players in this match can read and send messages.<br />{sessionUser ? 'Join to unlock the chat.' : <><Link href="/login"><u>Sign in</u></Link> to join.</>}</p>}
        </section>
      </div>
    </main>
  );
}
