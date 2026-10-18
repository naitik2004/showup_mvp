'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { GameGroup, GroupMember, Message, User } from '@/types';
import { MOCK_GAMES, MOCK_INVITES, MOCK_MEMBERS, MOCK_MESSAGES, MOCK_PLAYERS, type MockInvite } from '@/data/mock';

type MockData = {
  games: GameGroup[];
  setGames: React.Dispatch<React.SetStateAction<GameGroup[]>>;
  members: Record<string, GroupMember[]>;
  messages: Record<string, Message[]>;
  invites: MockInvite[];
  friends: User[];
  joinGame: (gameId: string, user: User) => boolean;
  leaveGame: (gameId: string, userId: string) => void;
  addGame: (game: GameGroup, host: User) => void;
  updateGameStatus: (gameId: string, status: GameGroup['status']) => void;
  addMessage: (gameId: string, sender: User, content: string) => void;
  answerInvite: (inviteId: string, action: 'accept' | 'decline', user: User) => string | null;
  sendInvite: (gameId: string, friendId: string) => void;
  isInvited: (gameId: string, friendId: string) => boolean;
  addFriend: (friendId: string) => void;
};

const MockDataContext = createContext<MockData | null>(null);

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<GameGroup[]>(MOCK_GAMES.map((game) => ({ ...game })));
  const [members, setMembers] = useState<Record<string, GroupMember[]>>(() => structuredClone(MOCK_MEMBERS));
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => structuredClone(MOCK_MESSAGES));
  const [invites, setInvites] = useState<MockInvite[]>(MOCK_INVITES.map((invite) => ({ ...invite, game: { ...invite.game }, sender: { ...invite.sender } })));
  const [friendIds, setFriendIds] = useState<string[]>([MOCK_PLAYERS[0].id, MOCK_PLAYERS[1].id, MOCK_PLAYERS[2].id]);
  const [sentInvites, setSentInvites] = useState<string[]>([]);

  const value = useMemo<MockData>(() => ({
    games,
    setGames,
    members,
    messages,
    invites,
    friends: MOCK_PLAYERS.filter((player) => friendIds.includes(player.id)),
    joinGame: (gameId, user) => {
      const current = members[gameId] || [];
      if (current.some((member) => member.user_id === user.id)) return true;
      const game = games.find((item) => item.id === gameId);
      if (!game || game.status !== 'open' || current.length >= game.max_players) return false;
      setMembers((previous) => ({ ...previous, [gameId]: [...current, { id: `${gameId}-${user.id}`, group_id: gameId, user_id: user.id, status: 'accepted', joined_at: new Date().toISOString(), user }] }));
      setGames((previous) => previous.map((item) => item.id === gameId ? { ...item, member_count: current.length + 1 } : item));
      return true;
    },
    leaveGame: (gameId, userId) => setMembers((previous) => ({ ...previous, [gameId]: (previous[gameId] || []).filter((member) => member.user_id !== userId) })),
    addGame: (game, host) => {
      setGames((previous) => [game, ...previous]);
      setMembers((previous) => ({ ...previous, [game.id]: [{ id: `${game.id}-${host.id}`, group_id: game.id, user_id: host.id, status: 'accepted', joined_at: new Date().toISOString(), user: host }] }));
    },
    updateGameStatus: (gameId, status) => setGames((previous) => previous.map((game) => game.id === gameId ? { ...game, status } : game)),
    addMessage: (gameId, sender, content) => setMessages((previous) => ({ ...previous, [gameId]: [...(previous[gameId] || []), { id: `${gameId}-${Date.now()}`, group_id: gameId, sender_id: sender.id, content, created_at: new Date().toISOString(), expires_at: null, sender }] })),
    answerInvite: (inviteId, action, user) => {
      const invite = invites.find((item) => item.id === inviteId);
      if (!invite) return null;
      if (action === 'accept') {
        const game = games.find((item) => item.id === invite.game_id);
        if (game?.status !== 'open') return `Too late. That match is ${game?.status || 'unavailable'}.`;
        if (!members[invite.game_id]?.some((member) => member.user_id === user.id) && !value.joinGame(invite.game_id, user)) return 'Too late. That match is full.';
      }
      setInvites((previous) => previous.filter((item) => item.id !== inviteId));
      return action === 'accept' ? invite.game_id : '';
    },
    sendInvite: (gameId, friendId) => {
      const friend = MOCK_PLAYERS.find((player) => player.id === friendId);
      const game = games.find((item) => item.id === gameId);
      if (!friend || !game) return;
      if (!sentInvites.includes(`${gameId}:${friendId}`)) setSentInvites((previous) => [...previous, `${gameId}:${friendId}`]);
      setInvites((previous) => [...previous, { id: `${gameId}:${friendId}`, game_id: gameId, created_at: new Date().toISOString(), member_count: game.member_count || 0, game: { sport: game.sport, location_name: game.location_name, scheduled_at: game.scheduled_at, max_players: game.max_players, status: game.status }, sender: { name: 'You' } }]);
    },
    isInvited: (gameId, friendId) => sentInvites.includes(`${gameId}:${friendId}`),
    addFriend: (friendId) => setFriendIds((previous) => previous.includes(friendId) ? previous : [...previous, friendId]),
  }), [games, members, messages, invites, friendIds, sentInvites, setGames]);

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockData() {
  const value = useContext(MockDataContext);
  if (!value) throw new Error('useMockData must be used within MockDataProvider.');
  return value;
}
