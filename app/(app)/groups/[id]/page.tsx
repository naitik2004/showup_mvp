'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GameGroup, SPORTS } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMockData } from '@/lib/mock-data';
import InviteFriendsDialog from '@/components/groups/InviteFriendsDialog';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { sessionUser, user } = useAuth();
  const { games, members: allMembers, messages: allMessages, joinGame, leaveGame, addMessage, updateGameStatus } = useMockData();
  const groupId = params.id as string;
  const group = games.find((item) => item.id === groupId) || null;
  const members = allMembers[groupId] || [];
  const messages = allMessages[groupId] || [];
  const [chatMessage, setChatMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: messages.length > 1 ? 'smooth' : 'auto' });
  }, [messages]);

  if (!group) return <main className="wrap" id="app"><section className="card emp"><h3>Sample match not found</h3><p>Choose a game from the live board to view its details.</p><Link className="btn gh" style={{ marginTop: 14 }} href="/">Back to games</Link></section></main>;

  const sportInfo = SPORTS.find((sport) => sport.id === group.sport);
  const formattedDate = new Date(group.scheduled_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const formattedTime = new Date(group.scheduled_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const isHost = !!sessionUser && sessionUser.id === group.host_id;
  const isMember = !!sessionUser && members.some((member) => member.user_id === sessionUser.id);
  const displayStatus = group.status === 'in_progress' ? 'live' : group.status === 'expired' ? 'done' : group.status === 'open' && members.length >= group.max_players ? 'full' : group.status;

  const joinMatch = () => {
    if (!sessionUser || !user) { router.push('/login'); return; }
    if (displayStatus !== 'open') { toast.error(`This match is ${displayStatus} and cannot be joined.`); return; }
    // TODO: connect backend — membership changes are temporary local state.
    if (!joinGame(groupId, user)) { toast.error('This match is full.'); return; }
    toast.success('You are in.');
  };

  const handleLeaveGroup = () => {
    if (!sessionUser || !confirm('Are you sure you want to leave this group?')) return;
    // TODO: connect backend — leaving only updates local React state.
    leaveGame(groupId, sessionUser.id);
    toast.success('Left group');
    router.push('/');
  };

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!chatMessage.trim()) return;
    if (!user) { router.push('/login'); return; }
    // TODO: connect backend — messages are held only in client memory.
    addMessage(groupId, user, chatMessage.trim());
    setChatMessage('');
  };

  const handleStatus = (status: GameGroup['status']) => {
    // TODO: connect backend — match status resets on refresh.
    updateGameStatus(groupId, status);
    toast.success(`Game marked as ${status}`);
  };

  const kickPlayer = (userId: string) => {
    if (!confirm('Remove this player?')) return;
    leaveGame(groupId, userId);
    toast.success('Player removed');
  };

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
        {!isMember && <button className="btn hot" onClick={joinMatch} disabled={displayStatus !== 'open'}>{displayStatus === 'open' ? 'Join this match' : displayStatus === 'full' ? 'Match is full' : 'Not joinable'}</button>}
        {isMember && !isHost && ['open', 'full'].includes(displayStatus) && <button className="btn bad" onClick={handleLeaveGroup}>Leave match</button>}
        {isMember && ['open', 'full', 'live'].includes(displayStatus) && <InviteFriendsDialog gameId={groupId} />}
        {isHost && group.status === 'open' && <><button className="btn hot" onClick={() => handleStatus('in_progress')}>Start match</button><button className="btn bad" onClick={() => handleStatus('expired')}>Cancel match</button></>}
        {isHost && group.status === 'in_progress' && <button className="btn gh" onClick={() => handleStatus('expired')}>End match</button>}
      </div>
      <div className="mg2">
        <section className="card"><h3>Players</h3>
          {members.map((member) => <div className="mem" key={member.id}><i className="av">{(member.user?.name || 'P').charAt(0).toUpperCase()}</i><div><b>{member.user?.name || 'Player'}</b><br /><small>{member.user?.city || 'India'}</small></div>{member.user_id === group.host_id && <span className="tag h">Host</span>}{isHost && member.user_id !== group.host_id && <button className="btn sm bad" onClick={() => kickPlayer(member.user_id)}>Remove</button>}</div>)}
          {!members.length && <p className="sy">No players have joined yet.</p>}
        </section>
        <section className="card cht"><div className="chh"><h3 style={{ margin: 0 }}>Group chat</h3>{isMember && <span className="mono">● {members.length} online</span>}</div>
          {isMember ? <>
            <div className="msgs">{messages.length ? messages.map((message) => <div className={`mg ${message.sender_id === sessionUser?.id ? 'me' : ''}`} key={message.id}><small>{message.sender_id === sessionUser?.id ? 'You' : message.sender?.name || 'Player'}, {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small><p>{message.content}</p></div>) : <p className="sy">No messages yet. Ask who is bringing the gear.</p>}<div ref={messagesEndRef} /></div>
            <form id="cf" onSubmit={handleSendMessage}><input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Message the group" aria-label="Message the group" /><button className="btn" type="submit">Send</button></form>
          </> : <p className="sy lock">Only players in this match can read and send messages.<br />{sessionUser ? 'Join to unlock the chat.' : <><Link href="/login"><u>Sign in</u></Link> to join.</>}</p>}
        </section>
      </div>
    </main>
  );
}
