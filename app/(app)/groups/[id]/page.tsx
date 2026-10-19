'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { GameGroup, GroupMember, Message, SPORTS, User } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import InviteFriendsDialog from '@/components/groups/InviteFriendsDialog';
import PlayerName from '@/features/players/components/PlayerName';
import { matchProfiles } from '@/features/players/data/playersRepository';
import { RelatedPlayer } from '@/features/players/types';
import { Match, toGroup } from '@/lib/matches';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { sessionUser, user, loading: authLoading } = useAuth();
  const groupId = params.id as string;
  const currentUserId = sessionUser?.id || '';
  const [group, setGroup] = useState<GameGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [busy, setBusy] = useState(false);
  const profileCache = useRef(new Map<string, RelatedPlayer>());
  const roomGeneration = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInviteToken(new URLSearchParams(window.location.search).get('invite') || '');
  }, []);

  const loadRoom = useCallback(async () => {
    const generation = ++roomGeneration.current;
    const { data: groupData, error: groupError } = await supabase
      .from('games_with_counts').select('*').eq('id', groupId).maybeSingle();
    if (groupError || !groupData) {
      setLoadError(groupError?.message || 'This match could not be found.');
      setLoading(false);
      return;
    }

    const { data: memberRows, error: memberError } = await supabase.from('game_members').select('*').eq('game_id', groupId).order('joined_at');
    if (memberError) {
      setLoadError(memberError.message);
      setLoading(false);
      return;
    }

    const accepted = (memberRows || []).map(row => ({ ...row, id: `${row.game_id}:${row.user_id}`, group_id: row.game_id, status: 'accepted' })) as GroupMember[];
    // Authorize one batch for the room, then share this cache across lobby/chat.
    const profileById = await matchProfiles(groupId);
    if (generation !== roomGeneration.current) return;
    profileCache.current = profileById;
    setGroup({
      ...toGroup(groupData as Match),
      host: profileById.get(groupData.host_id) as unknown as User,
      host_name: profileById.get(groupData.host_id)?.name || groupData.host_name || 'Player',
      member_count: accepted.length,
    } as unknown as GameGroup);
    setMembers(accepted.map((member) => ({ ...member, user: profileById.get(member.user_id) as unknown as User })));

    const userIsMember = !!sessionUser?.id && accepted.some((member) => member.user_id === sessionUser.id);
    if (userIsMember) {
      const { data: messageRows, error: messageError } = await supabase
        .from('messages').select('*').eq('game_id', groupId).order('created_at', { ascending: false }).limit(50);
      if (messageError) { setLoadError(messageError.message); setLoading(false); return; }
      if (messageRows) {
        const sendersById = profileCache.current;
        setMessages(messageRows.reverse().map((message) => ({ ...message, group_id: message.game_id, content: message.body, sender: sendersById.get(message.sender_id) as unknown as User })) as Message[]);
      }
    } else {
      setMessages([]);
    }
    setLoadError('');
    setLoading(false);
  }, [groupId, sessionUser?.id, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUserId) {
      const requestedPath = `/groups/${groupId}${inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : ''}`;
      router.replace(`/login?next=${encodeURIComponent(requestedPath)}`);
      return;
    }
    let active = true;
    const refresh = async () => {
      if (!active) return;
      try { await loadRoom(); }
      catch (cause) { if (active) { setLoadError((cause as Error).message); setLoading(false); } }
    };
    const invalidate = () => { profileCache.current.clear(); setMembers([]); setMessages([]); void refresh(); };
    profileCache.current.clear();
    void refresh();
    const channel = supabase.channel(`game:${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `game_id=eq.${groupId}` }, payload => {
        const row = payload.new;
        setMessages(previous => previous.some(message => message.id === row.id) ? previous : [...previous, { ...row, group_id: row.game_id, content: row.body } as Message].slice(-50));
        void refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${groupId}` }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_members' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_visibility_events' }, invalidate)
      .subscribe(status => { if (status === 'SUBSCRIBED') void refresh(); });
    const reconnect = () => void refresh();
    window.addEventListener('online', reconnect);
    window.addEventListener('focus', reconnect);
    window.addEventListener('showup:profiles-changed', invalidate);
    return () => { active = false; roomGeneration.current++; profileCache.current.clear(); window.removeEventListener('showup:profiles-changed', invalidate); void supabase.removeChannel(channel); window.removeEventListener('online', reconnect); window.removeEventListener('focus', reconnect); };
  }, [authLoading, currentUserId, groupId, inviteToken, loadRoom, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: messages.length > 1 ? 'smooth' : 'auto' });
  }, [messages]);

  const isHost = !!group && currentUserId === group.host_id;
  const isMember = members.some((member) => member.user_id === currentUserId);
  const displayStatus = group?.status === 'in_progress' ? 'live' : group?.status === 'expired' ? 'done' : group?.status === 'open' && members.length >= (group.max_players || 0) ? 'full' : group?.status || 'open';
  const sportInfo = group ? SPORTS.find((sport) => sport.id === group.sport) : undefined;
  const formattedDate = group ? new Date(group.scheduled_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formattedTime = group ? new Date(group.scheduled_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

  const joinMatch = async () => {
    if (!sessionUser) { router.push('/login'); return; }
    setBusy(true);
    const { error } = inviteToken ? await supabase.rpc('join_game_with_share_link', { p_token: inviteToken }) : await supabase.rpc('join_game', { p_game_id: groupId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('You are in.');
    setInviteToken('');
    router.replace(`/groups/${groupId}`);
    await loadRoom();
  };

  const copyInviteLink = async () => {
    const { data, error } = await supabase.rpc('create_game_share_link', { p_game_id: groupId });
    if (error) { toast.error(error.message); return false; }
    try { await navigator.clipboard.writeText(`${window.location.origin}/groups/${groupId}?invite=${data}`); toast.success('Invite link copied.'); return true; }
    catch { toast.error('Could not copy invite link.'); return false; }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = chatMessage.trim();
    if (!content || !currentUserId || !isMember) return;
    setBusy(true);
    const optimisticId = crypto.randomUUID();
    setMessages(previous => [...previous, { id: optimisticId, group_id: groupId, sender_id: currentUserId, content, created_at: new Date().toISOString(), expires_at: null }]);
    setChatMessage('');
    const { error } = await supabase.rpc('send_match_message', { p_message_id: optimisticId, p_game_id: groupId, p_body: content });
    if (error) { setMessages(previous => previous.filter(message => message.id !== optimisticId)); setChatMessage(content); }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setChatMessage('');
    await loadRoom();
  };

  const updateStatus = async (status: 'live' | 'done' | 'cancelled') => {
    const { error } = await supabase.rpc(status === 'live' ? 'start_game' : status === 'done' ? 'finish_game' : 'cancel_game', { p_game_id: groupId });
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'live' ? 'Match started.' : status === 'cancelled' ? 'Match cancelled.' : 'Match ended.');
    await loadRoom();
  };

  const kickPlayer = async (code: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('kick_player_by_code', { p_game_id: groupId, p_player_code: code });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.message || 'Could not remove player.');
      toast.success('Player removed.'); await loadRoom();
    } catch (cause) { toast.error((cause as Error).message); }
    finally { setBusy(false); }
  };

  const leaveMatch = async () => {
    if (!currentUserId || isHost || !window.confirm('Are you sure you want to leave this match?')) return;
    const { error } = await supabase.rpc('leave_game', { p_game_id: groupId });
    if (error) { toast.error(error.message); return; }
    toast.success('Left match.');
    await loadRoom();
  };

  if (loading) return <main className="wrap" id="app"><section className="card emp"><p>Loading match…</p></section></main>;
  if (loadError || !group) return <main className="wrap" id="app"><section className="card emp"><h3>Match unavailable</h3><p>{loadError || 'This match could not be found.'}</p><Link className="btn gh" style={{ marginTop: 14 }} href="/">Back home</Link></section></main>;

  return (
    <main className="wrap" id="app">
      <Link className="lb" href="/">← All games</Link>
      <section className="mh" style={{ marginTop: 14 }}>
        <div>
          <span className="lb" style={{ color: '#f3efe4aa' }}>{group.is_permanent ? 'Permanent group' : 'One-off match'} <span className={`pl ${displayStatus}`}>{displayStatus}</span></span>
          <h1>{sportInfo?.emoji} {sportInfo?.name || 'Sports Match'}</h1>
          <p>{group.location_name}, {formattedDate} at {formattedTime}</p>
          <p>{group.skill_level === 'pro' ? 'Advanced' : group.skill_level} level{(group as GameGroup & { notes?: string }).notes ? `, ${(group as GameGroup & { notes?: string }).notes}` : ''}</p>
        </div>
        <div><p className="mono" style={{ color: '#f3efe4aa', marginBottom: 8 }}>{members.length} of {group.max_players} in, {Math.max(0, group.max_players - members.length)} left</p><div className="sd">{Array.from({ length: Math.min(group.max_players, 12) }, (_, index) => <i key={index} className={index < members.length ? 'on' : ''} />)}</div></div>
      </section>
      <div className="acts">
        {!isMember && <button className="btn hot" onClick={() => void joinMatch()} disabled={busy || displayStatus !== 'open'}>{busy ? 'Joining…' : inviteToken ? 'Join match & open chat' : displayStatus === 'open' ? 'Join this match' : displayStatus === 'full' ? 'Match is full' : 'Not joinable'}</button>}
        {isMember && !isHost && ['open', 'full'].includes(displayStatus) && <button className="btn bad" onClick={() => void leaveMatch()}>Leave match</button>}

        {isMember && ['open','full','live'].includes(group.status) && <InviteFriendsDialog gameId={groupId} onCopyLink={copyInviteLink} />}
        {isHost && ['open','full'].includes(group.status) && <><button className="btn hot" onClick={() => void updateStatus('live')}>Start match</button></>}
        {isHost && group.status === 'live' && <button className="btn hot" onClick={() => void updateStatus('done')}>End match</button>}
        {isHost && ['open','full','live'].includes(group.status) && <button className="btn bad" onClick={() => void updateStatus('cancelled')}>Cancel match</button>}
      </div>
      <div className="mg2">
        <section className="card"><h3>Players</h3>
          {members.map((member) => <div className="mem" key={member.id}><i className="av">{(member.user?.name || 'P').charAt(0).toUpperCase()}</i><div><b><PlayerName name={member.user?.name || 'Unavailable player'} code={member.user?.player_id} /></b>{isHost && member.user?.player_id && <p className="mono">{member.user.player_id}</p>}<br /><small>{member.user?.city || 'India'}</small></div>{member.user_id === group.host_id && <span className="tag h">Host</span>}{isHost && member.user_id !== currentUserId && member.user?.player_id && ['open','full'].includes(group.status) && <button className="btn sm bad" disabled={busy} onClick={() => void kickPlayer(member.user!.player_id!)}>Remove</button>}</div>)}
          {!members.length && <p className="sy">No players have joined yet.</p>}
        </section>
        <section className="card cht"><div className="chh"><h3 style={{ margin: 0 }}>Group chat</h3>{isMember && <span className="mono">● {members.length} in room</span>}</div>
          {isMember ? <>
            <div className="msgs">{messages.length ? messages.map((message) => <div className={`mg ${message.sender_id === currentUserId ? 'me' : ''}`} key={message.id}><small><PlayerName name={message.sender_id === currentUserId ? user?.name || 'You' : message.sender?.name || 'Unavailable player'} code={message.sender_id === currentUserId ? user?.player_id : message.sender?.player_id} />, {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small><p>{message.content}</p></div>) : <p className="sy">Match created. Share the plan here.</p>}<div ref={messagesEndRef} /></div>
            <form id="cf" onSubmit={(event) => void sendMessage(event)}><input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Message the group" aria-label="Message the group" maxLength={1000} /><button className="btn" type="submit" disabled={busy || !chatMessage.trim()}>Send</button></form>
          </> : <p className="sy lock">Only players in this match can read and send messages.<br />{sessionUser ? 'Join to unlock the chat.' : <><Link href={`/login?next=${encodeURIComponent(`/groups/${groupId}${inviteToken ? `?invite=${inviteToken}` : ''}`)}`}><u>Sign in</u></Link> to join.</>}</p>}
        </section>
      </div>
    </main>
  );
}
