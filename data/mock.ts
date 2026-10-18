import type { GameGroup, GroupMember, Message, Sport, User } from '@/types';

const todayAt = (hour: number, minute: number) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  return date.toISOString();
};

const makePlayer = (id: string, name: string, city: string, sports: Sport[]): User => ({
  id,
  name,
  city,
  avatar_url: null,
  location: null,
  location_visible: false,
  preferred_sports: sports,
  created_at: new Date().toISOString(),
});

export const MOCK_PLAYERS: User[] = [
  makePlayer('player-aarav', 'Aarav', 'Delhi NCR', ['cricket', 'football']),
  makePlayer('player-maya', 'Maya', 'Delhi NCR', ['football', 'tennis']),
  makePlayer('player-dev', 'Dev', 'Delhi NCR', ['tennis', 'basketball']),
  makePlayer('player-rohan', 'Rohan', 'Delhi NCR', ['badminton', 'football']),
  makePlayer('player-isha', 'Isha', 'Delhi NCR', ['table_tennis', 'tennis']),
  makePlayer('player-kabir', 'Kabir', 'Delhi NCR', ['basketball', 'cricket']),
];

const game = (
  id: string,
  hostIndex: number,
  sport: Sport,
  venue: string,
  hour: number,
  minute: number,
  maxPlayers: number,
  memberCount: number,
  status: GameGroup['status'] = 'open',
): GameGroup => ({
  id,
  host_id: MOCK_PLAYERS[hostIndex].id,
  sport,
  location: { lat: 28.6139 + hostIndex * 0.004, lng: 77.209 + hostIndex * 0.003 },
  location_name: venue,
  max_players: maxPlayers,
  skill_level: 'intermediate',
  scheduled_at: todayAt(hour, minute),
  expires_at: null,
  is_permanent: false,
  status,
  created_at: new Date().toISOString(),
  host: MOCK_PLAYERS[hostIndex],
  host_name: MOCK_PLAYERS[hostIndex].name,
  member_count: memberCount,
});

// TODO: connect backend — these reference-inspired games are local placeholders only.
export const MOCK_GAMES: GameGroup[] = [
  game('mock-cricket-old-fort', 0, 'cricket', 'Old Fort Maidan', 18, 30, 14, 4),
  game('mock-football-lakeview', 1, 'football', 'Lakeview Turf', 19, 0, 10, 5),
  game('mock-tennis-city-hub', 2, 'tennis', 'City Sports Hub', 20, 0, 4, 1),
  game('mock-tennis-gymkhana', 3, 'tennis', 'North Gymkhana', 17, 15, 4, 4, 'full'),
  game('mock-volleyball-lakeside', 4, 'table_tennis', 'Lakeside Pitch', 18, 45, 8, 8, 'full'),
  game('mock-basketball-sector-9', 5, 'basketball', 'Sector 9 Arena', 20, 15, 6, 6, 'full'),
];

export type MockInvite = {
  id: string;
  game_id: string;
  created_at: string;
  member_count: number;
  game: {
    sport: Sport;
    location_name: string;
    scheduled_at: string;
    max_players: number;
    status: string;
  };
  sender: { name: string };
};

export const MOCK_INVITES: MockInvite[] = [
  {
    id: 'mock-invite-1',
    game_id: 'mock-football-lakeview',
    created_at: new Date().toISOString(),
    member_count: 5,
    game: { sport: 'football', location_name: 'Lakeview Turf', scheduled_at: todayAt(19, 0), max_players: 10, status: 'open' },
    sender: { name: 'Maya' },
  },
];

export const MOCK_MEMBERS: Record<string, GroupMember[]> = Object.fromEntries(
  MOCK_GAMES.map((item, index) => [item.id, Array.from({ length: Math.min(item.member_count || 1, item.max_players) }, (_, memberIndex) => {
    const player = memberIndex === 0 ? MOCK_PLAYERS[index] : MOCK_PLAYERS[(index + memberIndex) % MOCK_PLAYERS.length];
    return {
      id: `${item.id}-${player.id}`,
      group_id: item.id,
      user_id: player.id,
      status: 'accepted' as const,
      joined_at: new Date().toISOString(),
      user: player,
    };
  })]),
);

export const MOCK_MESSAGES: Record<string, Message[]> = {
  'mock-football-lakeview': [
    { id: 'mock-message-1', group_id: 'mock-football-lakeview', sender_id: 'player-maya', content: 'See you all at the north entrance.', created_at: new Date(Date.now() - 28 * 60_000).toISOString(), expires_at: null, sender: MOCK_PLAYERS[1] },
    { id: 'mock-message-2', group_id: 'mock-football-lakeview', sender_id: 'player-aarav', content: 'I can bring an extra ball.', created_at: new Date(Date.now() - 12 * 60_000).toISOString(), expires_at: null, sender: MOCK_PLAYERS[0] },
  ],
};

export const MOCK_NOTIFICATIONS = [
  { id: 'mock-notification-1', kind: 'match', title: 'A new game near you', detail: 'Football at Lakeview Turf' },
  { id: 'mock-notification-2', kind: 'friend', title: 'Players are nearby', detail: 'Find your next crew on the live board.' },
];

export const MOCK_REVIEWS = [
  { id: 'mock-review-1', player_id: 'player-aarav', author: 'Maya', text: 'Great teammate and always on time.', stars: 5 },
];

export const getMockPlayer = (id: string) => MOCK_PLAYERS.find((player) => player.id === id) || MOCK_PLAYERS[0];
