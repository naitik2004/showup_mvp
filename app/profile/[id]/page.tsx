'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMockData } from '@/lib/mock-data';
import { getMockPlayer, MOCK_REVIEWS } from '@/data/mock';
import { SPORTS } from '@/types';
import { toast } from 'sonner';

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sessionUser, user } = useAuth();
  const { addFriend } = useMockData();
  const [requested, setRequested] = useState(false);
  const profile = sessionUser?.id === id && user ? user : getMockPlayer(id);
  const name = profile.name || 'Player';
  const sports = profile.preferred_sports || [];
  const isSelf = sessionUser?.id === id;
  const reviews = MOCK_REVIEWS.filter((review) => review.player_id === id);

  const addPlayer = () => {
    if (!sessionUser) { router.push('/login'); return; }
    // TODO: connect backend — friend connections reset when the page is refreshed.
    addFriend(id);
    setRequested(true);
    toast.success('Friend added to your local sample network.');
  };

  return (
    <main className="wrap" id="app">
      <Link className="lb" href="/">← Games</Link>
      <section className="card id" style={{ margin: '14px 0 18px', flexWrap: 'wrap' }}>
        <i className="av">{name[0]?.toUpperCase() || 'P'}</i>
        <div style={{ flex: 1 }}><h2>{name}</h2><span className="mono">{profile.city || 'Nearby'}, Player</span><br /><span className="mono">{reviews.length ? `${reviews.length} review${reviews.length === 1 ? '' : 's'}` : 'No reviews yet'}</span></div>
        {!isSelf && <div className="acts" style={{ margin: 0 }}><button className="btn sm gh" onClick={addPlayer} disabled={requested}>{requested ? 'Added' : 'Add friend'}</button><button className="btn sm gh" disabled>Block</button><button className="btn sm bad" disabled>Report</button></div>}
      </section>
      <div className="tiles"><div><b>12</b><span>Games joined</span></div><div><b>3</b><span>Games hosted</span></div><div><b>4.8</b><span>Rating</span></div><div><b>{sports.length}</b><span>Favourite sports</span></div></div>
      <section className="card"><h3>Plays</h3><div className="chips">{sports.length ? sports.map((sport) => { const item = SPORTS.find((entry) => entry.id === sport); return <span className="chip" key={sport}>{item?.emoji || '🏅'} {item?.name || sport.replace('_', ' ')}</span>; }) : <p>No sports picked yet.</p>}</div></section>
      <section className="card" style={{ marginTop: 18 }}><h3>Reviews</h3>{reviews.length ? reviews.map((review) => <p key={review.id}>{'★'.repeat(review.stars)} · {review.text} <span className="mono">— {review.author}</span></p>) : <p>Reviews appear after a finished match.</p>}</section>
    </main>
  );
}
