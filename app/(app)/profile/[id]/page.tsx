import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-heading font-extrabold text-cream">Player Profile</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          Player stats, match history, and reliability scores will appear here.
        </p>
        <Link href="/map">
          <Button className="bg-primary text-primary-foreground font-bold rounded-xl gap-2 mt-4">
            <ArrowLeft className="w-4 h-4" /> Go back to Map
          </Button>
        </Link>
      </div>
    </div>
  );
}
