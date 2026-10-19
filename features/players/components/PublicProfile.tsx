'use client';

import { useEffect, useState } from 'react';
import { findPlayer, playerError, playerReviews } from '../data/playersRepository';
import { PlayerReview, PublicPlayer } from '../types';
import PlayerCode from './PlayerCode';
import PlayerReviews from './PlayerReviews';
import ProfileStats from '@/features/profile/components/ProfileStats';

export default function PublicProfile({ code }: { code: string }) {
  const [player, setPlayer] = useState<PublicPlayer | null>(null);
  const [reviews, setReviews] = useState<PlayerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPlayer(null);
    setReviews([]);
    setError('');
    setReviewsError('');

    const load = async () => {
      try {
        const next = await findPlayer(code);
        if (!active) return;
        setPlayer(next);
        if (next) {
          try {
            const result = await playerReviews(next.player_id);
            if (active) setReviews(result);
          } catch (cause) {
            if (active) setReviewsError(playerError(cause));
          }
        }
      } catch (cause) {
        if (active) setError(playerError(cause));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [code]);

  if (loading) return <main className="wrap" id="app"><p role="status">Loading player…</p></main>;
  if (error || !player) {
    return (
      <main className="wrap" id="app">
        <section className="card emp">
          <h2>Player unavailable</h2>
          <p role="alert">{error || 'Player not found or unavailable. Check the ID and try again.'}</p>
          <a className="btn gh" href="/app.html">Back to games</a>
        </section>
      </main>
    );
  }

  const stats = player.stats;
  return (
    <main className="wrap" id="app">
      <div className="stack">
        <section className="card id">
          <i className="av" aria-hidden="true">{player.name?.[0] || 'P'}</i>
          <div>
            <h2>{player.name}</h2>
            <PlayerCode code={player.player_id} />
            <p className="mono">{player.city || 'City not shared'}{player.skill ? ` · ${player.skill}` : ''}</p>
          </div>
        </section>
        <ProfileStats
          stats={[
            ['Matches played', stats.played], ['Hosted', stats.hosted],
            ['Joined', stats.joined], ['Upcoming', stats.upcoming],
          ]}
          loading={false}
          error={null}
        />
        <section className="card">
          <h3>Plays</h3>
          <p>{player.preferred_sports?.map((sport) => sport.replaceAll('_', ' ')).join(', ') || 'No favourite sports yet.'}</p>
        </section>
        <PlayerReviews reviews={reviews} error={reviewsError} />
        <a className="btn gh" href="/app.html">Back to games</a>
      </div>
    </main>
  );
}
