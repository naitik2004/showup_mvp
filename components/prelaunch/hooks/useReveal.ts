'use client';

import { RefObject, useEffect } from 'react';

/** Observe only this component tree and release the observer on unmount. */
export function useReveal(root: RefObject<HTMLElement>) {
  useEffect(() => {
    const elements = root.current?.querySelectorAll<HTMLElement>('.reveal');
    if (!elements) return;
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [root]);
}
