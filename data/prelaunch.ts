/** Marketing content and illustrative data. These are not live player records. */
export const APP_ENTRY_URL = '/app.html';

// Carried over from the supplied design; confirm this date before launch.
export const PREVIEW_LAUNCH_DATE = '2027-01-26T18:00:00+05:30';

export const FEATURES = [
  { title: 'Discover', description: 'See nearby games on a map and filter by sport before you decide.' },
  { title: 'Organize', description: 'Create a match with sport, place, time, skill and capacity in about a minute.' },
  { title: 'Participate', description: 'Join or leave in one tap. Spots left are always true, enforced by the database.' },
  { title: 'Coordinate', description: 'Group chat with live presence for every match, so plans never get buried.' },
  { title: 'Connect', description: 'Turn people you meet into friends, then invite them to your next game.' },
  { title: 'Represent', description: 'A player profile with city, skill level, favourite sports and games played.' },
] as const;

export const MATCH_STAGES = [
  { title: 'Open', description: 'A host posts the game and it appears for everyone nearby.' },
  { title: 'Full', description: 'The last spot goes to exactly one player. If someone drops, it reopens.' },
  { title: 'Live', description: 'The host starts the match and everyone can see it is under way.' },
  { title: 'Done', description: 'The game lands on every player’s profile. New friends, ready to invite.' },
] as const;

export const SAMPLE_PASSES = [
  { sport: 'Badminton', color: '#d9532b', venue: 'Riverside Courts', time: '19:30', skill: 'Intermediate', host: 'Riya', seat: '3/4' },
  { sport: 'Football', color: '#12392b', venue: 'Metro Park Turf', time: '20:00', skill: 'All levels', host: 'Aman', seat: '7/10' },
  { sport: 'Basketball', color: '#d8f03c', venue: 'Sector 9 Arena', time: '18:45', skill: 'Advanced', host: 'Kabir', seat: '5/6' },
  { sport: 'Tennis', color: '#15130f', venue: 'Garden Club', time: '06:30', skill: 'Beginner', host: 'Meera', seat: '1/4' },
  { sport: 'Cricket', color: '#d9532b', venue: 'Old Fort Ground', time: '17:30', skill: 'All levels', host: 'Kabir', seat: '8/12' },
  { sport: 'Volleyball', color: '#12392b', venue: 'Lakeside Pitch', time: '16:30', skill: 'Beginner', host: 'Riya', seat: '8/12' },
] as const;

export interface SampleGame {
  id: string;
  sport: string;
  venue: string;
  time: string;
  capacity: number;
  joined: number;
  live?: boolean;
}

export const SAMPLE_GAMES: SampleGame[] = [
  { id: 'badminton', sport: 'BADMINTON', venue: 'RIVERSIDE COURTS', time: '19:30', capacity: 4, joined: 3 },
  { id: 'football', sport: 'FOOTBALL', venue: 'METRO PARK TURF', time: '20:00', capacity: 10, joined: 7 },
  { id: 'basketball', sport: 'BASKETBALL', venue: 'SECTOR 9 ARENA', time: '18:45', capacity: 6, joined: 5 },
  { id: 'cricket', sport: 'CRICKET', venue: 'OLD FORT GROUND', time: '17:30', capacity: 12, joined: 12, live: true },
  { id: 'tennis', sport: 'TENNIS', venue: 'GARDEN CLUB', time: '06:30', capacity: 4, joined: 1 },
  { id: 'football-2', sport: 'FOOTBALL', venue: 'RIVERBANK FIELD', time: '17:00', capacity: 14, joined: 9 },
  { id: 'basketball-2', sport: 'BASKETBALL', venue: 'SECTOR 14 COURTS', time: '21:00', capacity: 8, joined: 5 },
  { id: 'badminton-2', sport: 'BADMINTON', venue: 'COMMUNITY HALL', time: '06:00', capacity: 6, joined: 2 },
  { id: 'volleyball', sport: 'VOLLEYBALL', venue: 'LAKESIDE PITCH', time: '16:30', capacity: 12, joined: 8 },
  { id: 'padel', sport: 'PADEL', venue: 'CITY SPORTS HUB', time: '19:00', capacity: 4, joined: 3 },
  { id: 'tennis-2', sport: 'TENNIS', venue: 'NORTH GYMKHANA', time: '07:15', capacity: 4, joined: 2 },
  { id: 'cricket-2', sport: 'CRICKET', venue: 'UNIVERSITY OVAL', time: '15:00', capacity: 14, joined: 10 },
];
