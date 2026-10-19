'use client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PlayerCode({ code }: { code?: string }) {
  const [copiedCode, setCopiedCode] = useState('');
  if (!code) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopiedCode(code); toast.success('Player ID copied.'); }
    catch { toast.error('Could not copy. Select the player ID to copy it.'); }
  };
  return <button className="tag mono" type="button" aria-label={`Copy player ID ${code}`} onClick={() => void copy()}>{code} · {copiedCode === code ? 'Copied' : 'Copy'}</button>;
}
