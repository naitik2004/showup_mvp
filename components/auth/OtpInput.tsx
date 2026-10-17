'use client';

import { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  onComplete?: (value: string) => void;
  ariaLabel?: string;
}

/**
 * Controlled, accessible, keyboard-friendly segmented OTP input.
 * Only digits are accepted; supports paste and backspace navigation.
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  onComplete,
  ariaLabel = 'Verification code',
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusIndex = (i: number) => refs.current[i]?.focus();

  const commit = (nextChars: string[], caretIndex: number) => {
    const joined = nextChars.join('').slice(0, length);
    onChange(joined);
    if (joined.length === length) onComplete?.(joined);
    if (caretIndex < length) focusIndex(caretIndex);
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      const arr = [...chars];
      arr[index] = '';
      onChange(arr.join('').slice(0, length));
      return;
    }
    const arr = [...chars];
    let idx = index;
    for (let k = 0; k < clean.length && idx < length; k++, idx++) {
      arr[idx] = clean[k];
    }
    commit(arr, idx);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = [...chars];
      if (arr[index]) {
        arr[index] = '';
        onChange(arr.join('').slice(0, length));
      } else if (index > 0) {
        arr[index - 1] = '';
        onChange(arr.join('').slice(0, length));
        focusIndex(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const arr = Array.from({ length }, (_, i) => pasted[i] ?? '');
    commit(arr, Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex items-center justify-between gap-2" role="group" aria-label={ariaLabel}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={c}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`${ariaLabel} digit ${i + 1}`}
          className="w-full h-14 text-center text-2xl font-bold bg-black/40 border border-muted rounded-xl text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-transparent disabled:opacity-50"
        />
      ))}
    </div>
  );
}
