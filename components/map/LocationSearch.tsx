'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

const VENUES = [
  { display_name: 'Old Fort Maidan, Delhi NCR', lat: '28.613', lon: '77.229' },
  { display_name: 'Lakeview Turf, Delhi NCR', lat: '28.621', lon: '77.198' },
  { display_name: 'City Sports Hub, Delhi NCR', lat: '28.604', lon: '77.214' },
  { display_name: 'North Gymkhana, Delhi NCR', lat: '28.629', lon: '77.218' },
  { display_name: 'Sector 9 Arena, Delhi NCR', lat: '28.620', lon: '77.232' },
];

interface Props {
  onSelect: (location: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
}

export default function LocationSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => query.trim().length < 2 ? [] : VENUES.filter((venue) => venue.display_name.toLowerCase().includes(query.toLowerCase())), [query]);

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
                setQuery(result.display_name);
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

    </div>
  );
}
