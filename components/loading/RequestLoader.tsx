'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { getPendingRequests, subscribeToRequests } from '@/lib/request-loading';
import LoadingScreen from './LoadingScreen';

export default function RequestLoader() {
  const pending = useSyncExternalStore(subscribeToRequests, getPendingRequests, () => 0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Avoid flashing the full screen for requests that finish immediately.
    if (!pending) { setVisible(false); return; }
    const timer = window.setTimeout(() => setVisible(true), 180);
    return () => window.clearTimeout(timer);
  }, [pending]);
  return visible && pending > 0 ? createPortal(<LoadingScreen />, document.body) : null;
}
