'use client';

import { useEffect, useState } from 'react';
import { APP_ENTRY_URL, SAMPLE_GAMES } from '@/data/prelaunch';
import FlipText from './FlipText';

/** Illustrative marketing board, deliberately independent of real match data. */
export default function SampleGamesBoard() {
  const [games, setGames] = useState(() => SAMPLE_GAMES.slice(0, 6));
  const [clock, setClock] = useState('--:--');

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    updateClock();
    const clockTimer = window.setInterval(updateClock, 10_000);
    // Keep a static board for people who request reduced animation.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => window.clearInterval(clockTimer);
    }
    const fillTimer = window.setInterval(() => setGames((current) => {
      const eligible = current.filter((game) => !game.live && game.joined < game.capacity);
      if (!eligible.length) return current;
      const selected = eligible[Math.floor(Math.random() * eligible.length)];
      return current.map((game) => game.id === selected.id ? { ...game, joined: game.joined + 1 } : game);
    }), 2_600);
    const rotateTimer = window.setInterval(() => setGames((current) => {
      const available = SAMPLE_GAMES.filter((candidate) => !current.some((game) => game.id === candidate.id));
      const replacement = available[Math.floor(Math.random() * available.length)];
      if (!replacement) return current;
      const index = Math.floor(Math.random() * current.length);
      return current.map((game, position) => position === index ? { ...replacement } : game);
    }), 5_600);
    return () => [clockTimer, fillTimer, rotateTimer].forEach(window.clearInterval);
  }, []);

  return (
    <div className="board" id="board" role="region" aria-label="Live games board, sample data">
      <div className="boardHeader"><span><b>Games near you</b> · sample data</span><span>{clock}</span></div>
      <div>
        {games.map((game, index) => {
          const full = game.joined >= game.capacity;
          const status = game.live ? 'LIVE' : full ? 'FULL' : 'OPEN';
          return (
            <div className={`boardRow ${game.live || full ? 'full' : ''}`} key={game.id}>
              <FlipText text={game.time} width={5} delay={index * 220} />
              <FlipText text={game.sport} width={10} delay={index * 220 + 60} />
              <FlipText text={game.venue} width={16} delay={index * 220 + 120} className="venue" />
              <FlipText text={game.live ? 'LIVE' : full ? 'FULL' : `${game.capacity - game.joined} LEFT`} width={7} />
              <FlipText text={status} width={4} className={`status ${status.toLowerCase()}`} />
              <button className="joinButton" disabled={game.live || full} onClick={() => { window.location.assign(APP_ENTRY_URL); }} aria-label={`Open app to join ${game.sport.toLowerCase()}`}>
                {game.live ? 'LIVE' : full ? 'FULL' : 'JOIN →'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
