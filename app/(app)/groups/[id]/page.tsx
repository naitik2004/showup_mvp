'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { GameGroup, GroupMember, Message, SPORTS, User } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import InviteFriendsDialog from '@/components/groups/InviteFriendsDialog';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { sessionUser, user, loading: authLoading } = useAuth();
  const groupId = params.id as string;
  const [group, setGroup] = useState<GameGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInviteToken(new URLSearchParams(window.location.search).get('invite') || '');
  }, []);

  const loadRoom = useCallback(async () => {
    const { data: groupData, error: groupError } = await supabase
      .from('game_groups').select('*').eq('id', groupId).maybeSingle();
    if (groupError || !groupData) {
      setLoadError(groupError?.message || 'This match could not be found.');
      setLoading(false);
      return;
    }

    const [{ data: host }, { data: memberRows, error: memberError }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', groupData.host_id).maybeSingle(),
      supabase.from('group_members').select('*').eq('group_id', groupId).eq('status', 'accepted').order('joined_at'),
    ]);
    if (memberError) {
      setLoadError(memberError.message);
      setLoading(false);
      return;
    }

    const accepted = (memberRows || []) as GroupMember[];
    const profileIds = Array.from(new Set([groupData.host_id, ...accepted.map((member) => member.user_id)]));
    const { data: profiles } = profileIds.length
      ? await supabase.from('profiles').select('*').in('id', profileIds)
      : { data: [] as User[] };
    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile as User]));
    setGroup({
      ...groupData,
      host: (host as User | null) || profileById.get(groupData.host_id),
      host_name: host?.name || 'Player',
      member_count: accepted.length,
    } as unknown as GameGroup);
    setMembers(accepted.map((member) => ({ ...member, user: profileById.get(member.user_id) })));

    const userIsMember = !!sessionUser?.id && accepted.some((member) => member.user_id === sessionUser.id);
    if (userIsMember) {
      const { data: messageRows, error: messageError } = await supabase
        .from('messages').select('*').eq('group_id', groupId).order('created_at', { ascending: true }).limit(100);
      if (!messageError && messageRows) {
        const senderIds = Array.from(new Set(messageRows.map((message) => message.sender_id)));
        const { data: senders } = senderIds.length
          ? await supabase.from('profiles').select('*').in('id', senderIds)
          : { data: [] as User[] };
        const sendersById = new Map((senders || []).map((profile) => [profile.id, profile as User]));
        setMessages(messageRows.map((message) => ({ ...message, sender: sendersById.get(message.sender_id) })) as Message[]);
      }
    } else {
      setMessages([]);
    }
    setLoadError('');
    setLoading(false);
  }, [groupId, sessionUser?.id, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!sessionUser) {
      const requestedPath = `/groups/${groupId}${inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : ''}`;
      router.replace(`/login?next=${encodeURIComponent(requestedPath)}`);
      return;
    }
    let active = true;
    const refresh = async () => { if (active) await loadRoom(); };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 6000);
    return () => { active = false; window.clearInterval(timer); };
  }, [authLoading, groupId, inviteToken, loadRoom, router, sessionUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: messages.length > 1 ? 'smooth' : 'auto' });
  }, [messages]);

  const currentUserId = sessionUser?.id || '';
  const isHost = !!group && currentUserId === group.host_id;
  const isMember = members.some((member) => member.user_id === currentUserId);
  const displayStatus = group?.status === 'in_progress' ? 'live' : group?.status === 'expired' ? 'done' : group?.status === 'open' && members.length >= (group.max_players || 0) ? 'full' : group?.status || 'open';
  const sportInfo = group ? SPORTS.find((sport) => sport.id === group.sport) : undefined;
  const formattedDate = group ? new Date(group.scheduled_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formattedTime = group ? new Date(group.scheduled_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

  const joinMatch = async () => {
    if (!sessionUser) { router.push('/login'); return; }
    setBusy(true);
    const { error } = inviteToken
      ? await supabase.rpc('join_game_with_share_link', { p_token: inviteToken })
      : await supabase.rpc('join_game', { p_game_id: groupId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('You are in.');
    setInviteToken('');
    router.replace(`/groups/${groupId}`);
    await loadRoom();
  };

  const copyInviteLink = async () => {
    if (!isMember) return false;
    setBusy(true);
    const { data: token, error } = await supabase.rpc('create_game_share_link', { p_game_id: groupId });
    setBusy(false);
    if (error || !token) { toast.error(error?.message || 'Could not create an invite link.'); return false; }
    const link = `${window.location.origin}/groups/${groupId}?invite=${encodeURIComponent(token)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Match link copied. Send it to your friend to join.');
    } catch {
      window.prompt('Copy this match invite link', link);
    }
    return true;
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = chatMessage.trim();
    if (!content || !currentUserId || !isMember) return;
    setBusy(true);
    const { error } = await supabase.from('messages').insert({ group_id: groupId, sender_id: currentUserId, content });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setChatMessage('');
    await loadRoom();
  };

  const updateStatus = async (status: 'in_progress' | 'expired') => {
    const { error } = await supabase.from('game_groups').update({ status }).eq('id', groupId).eq('host_id', currentUserId);
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'in_progress' ? 'Match started.' : 'Match ended.');
    await loadRoom();
  };

  const leaveMatch = async () => {
    if (!currentUserId || isHost || !window.confirm('Are you sure you want to leave this match?')) return;
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', currentUserId);
    if (error) { toast.error(error.message); return; }
    toast.success('Left match.');
    await loadRoom();
  };

  if (loading) return <main className="wrap" id="app"><section className="card emp"><p>Loading match…</p></section></main>;
  if (loadError || !group) return <main className="wrap" id="app"><section className="card emp"><h3>Match unavailable</h3><p>{loadError || 'This match could not be found.'} Apply the match-room migration if this is a newly restored room.</p><Link className="btn gh" style={{ marginTop: 14 }} href="/">Back home</Link></section></main>;

  return (
    <main className="wrap" id="app">
      <Link className="lb" href="/">← Home</Link>
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
        {!isMember && <button className="btn hot" onClick={() => void joinMatch()} disabled={busy || displayStatus !== 'open'}>{busy ? 'Joining…' : inviteToken ? 'Join match & open chat' : displayStatus === 'open' ? 'Join this match' : 'Match is full'}</button>}
        {isMember && !isHost && ['open', 'full'].includes(displayStatus) && <button className="btn bad" onClick={() => void leaveMatch()}>Leave match</button>}
        {isMember && <InviteFriendsDialog gameId={groupId} onCopyLink={copyInviteLink} />}
        {isHost && group.status === 'open' && <><button className="btn hot" onClick={() => void updateStatus('in_progress')}>Start match</button><button className="btn bad" onClick={() => void updateStatus('expired')}>Cancel match</button></>}
        {isHost && group.status === 'in_progress' && <button className="btn gh" onClick={() => void updateStatus('expired')}>End match</button>}
      </div>
      <div className="mg2">
        <section className="card"><h3>Players</h3>
          {members.map((member) => <div className="mem" key={member.id}><i className="av">{(member.user?.name || 'P').charAt(0).toUpperCase()}</i><div><b>{member.user?.name || 'Player'}</b><br /><small>{member.user?.city || 'India'}</small></div>{member.user_id === group.host_id && <span className="tag h">Host</span>}</div>)}
          {!members.length && <p className="sy">No players have joined yet.</p>}
        </section>
        <section className="card cht"><div className="chh"><h3 style={{ margin: 0 }}>Group chat</h3>{isMember && <span className="mono">● {members.length} in room</span>}</div>
          {isMember ? <>
            <div className="msgs">{messages.length ? messages.map((message) => <div className={`mg ${message.sender_id === currentUserId ? 'me' : ''}`} key={message.id}><small>{message.sender_id === currentUserId ? 'You' : message.sender?.name || 'Player'}, {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small><p>{message.content}</p></div>) : <p className="sy">Match created. Share the plan here.</p>}<div ref={messagesEndRef} /></div>
            <form id="cf" onSubmit={(event) => void sendMessage(event)}><input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Message the group" aria-label="Message the group" maxLength={2000} /><button className="btn" type="submit" disabled={busy || !chatMessage.trim()}>Send</button></form>
          </> : <p className="sy lock">Only players in this match can read and send messages.<br />{sessionUser ? 'Join to unlock the chat.' : <><Link href={`/login?next=${encodeURIComponent(`/groups/${groupId}${inviteToken ? `?invite=${inviteToken}` : ''}`)}`}><u>Sign in</u></Link> to join.</>}</p>}
        </section>
      </div>
    </main>
  );
}
