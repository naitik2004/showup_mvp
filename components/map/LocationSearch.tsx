'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  onSelect: (location: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
}

export default function LocationSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&countrycodes=in&format=json&limit=5`
        );

        const data = await response.json();

        setResults(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <Input
        placeholder="Search venue, park, stadium..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-11 bg-black/40 border-muted text-cream"
      />

      {results.length > 0 && (
        <div className="absolute top-12 left-0 right-0 z-50 bg-surface border border-muted rounded-xl overflow-hidden shadow-xl">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onSelect({
                  lat: Number(result.lat),
                  lng: Number(result.lon),
                  name: result.display_name,
                });

                setQuery(result.display_name);
                setResults([]);
              }}
              className="w-full px-3 py-3 text-left hover:bg-muted flex gap-2 items-start"
            >
              <MapPin className="w-4 h-4 mt-1 shrink-0 text-primary" />

              <span className="text-xs text-cream">
                {result.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute top-3 right-3 text-xs text-muted-foreground">
          Searching...
        </div>
      )}
    </div>
  );
}