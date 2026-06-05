import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  onRequest: () => void;
}

export default function LocationPermissionPrompt({ onRequest }: Props) {
  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-w-sm w-full bg-surface border border-muted p-6 rounded-3xl text-center space-y-4 shadow-2xl">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-heading font-extrabold text-cream">Location Access Required</h3>
          <p className="text-sm text-muted-foreground">
            ShowUp uses your location to discover active matches and sports groups playing near you.
          </p>
        </div>
        <Button
          onClick={onRequest}
          className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/10 hover:bg-primary/95 transition-all"
        >
          Enable Location
        </Button>
      </div>
    </div>
  );
}
