'use client';

import { ReactNode, useEffect, useState } from 'react';
import PublicProfile from './PublicProfile';
import { createClient } from '@/lib/supabase/client';

export default function PlayerHashBoundary({ children }: { children: ReactNode }) {
  const [code, setCode] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const sync = () => {
      const match = /^#\/p\/([^/]+)$/.exec(window.location.hash);
      try { setCode(match ? decodeURIComponent(match[1]) : ''); }
      catch { setCode('invalid'); }
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (!code) return;
    const invalidate = () => setRevision((value) => value + 1);
    const client = createClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) invalidate();
    });
    const visibility = client.channel('public-profile-visibility')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_visibility_events' }, invalidate)
      .subscribe();
    window.addEventListener('focus', invalidate);
    window.addEventListener('showup:profiles-changed', invalidate);
    return () => {
      void client.removeChannel(visibility);
      subscription.unsubscribe();
      window.removeEventListener('focus', invalidate);
      window.removeEventListener('showup:profiles-changed', invalidate);
    };
  }, [code]);

  return code ? <PublicProfile key={`${code}:${revision}`} code={code} /> : <>{children}</>;
}
