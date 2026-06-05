import { Sport, SPORTS } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FilterBarProps {
  selectedSport: Sport | 'all';
  onChange: (sport: Sport | 'all') => void;
}

export default function FilterBar({ selectedSport, onChange }: FilterBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-[999] flex justify-center pointer-events-none">
      <div className="w-full max-w-lg overflow-x-auto pb-1.5 flex gap-2 no-scrollbar pointer-events-auto px-4 py-2 bg-black/40 backdrop-blur-md border border-muted/50 rounded-2xl shadow-xl">
        <button
          onClick={() => onChange('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wider',
            selectedSport === 'all'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
              : 'bg-black/30 border border-muted hover:border-muted-foreground text-cream'
          )}
        >
          All Sports
        </button>

        {SPORTS.map((sport) => {
          const isSelected = selectedSport === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => onChange(sport.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all uppercase tracking-wider',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                  : 'bg-black/30 border border-muted hover:border-muted-foreground text-cream'
              )}
            >
              <span>{sport.emoji}</span>
              <span>{sport.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
