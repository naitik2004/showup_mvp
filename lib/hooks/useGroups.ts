'use client';

import { useMockData } from '@/lib/mock-data';

export function useGroups(_lat?: number, _lng?: number) {
  const { games, setGames } = useMockData();
  // TODO: connect backend — nearby games currently come from local placeholder data.
  return { groups: games, setGroups: setGames, loading: false, error: null, refetch: () => undefined };
}
