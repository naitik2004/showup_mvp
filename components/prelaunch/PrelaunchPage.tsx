'use client';

import { useRef } from 'react';
import FeatureList from './FeatureList';
import MatchLifecycle from './MatchLifecycle';
import MatchPassPreview from './MatchPassPreview';
import PrelaunchHero from './PrelaunchHero';
import PrelaunchNavigation from './PrelaunchNavigation';
import WaitlistSection from './WaitlistSection';
import { useReveal } from './hooks/useReveal';
import styles from './Prelaunch.module.css';

export default function PrelaunchPage() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  return (
    <div className={styles.page} ref={root}>
      <PrelaunchNavigation />
      <main id="top">
        <PrelaunchHero />
        <MatchPassPreview />
        <FeatureList />
        <MatchLifecycle />
        <WaitlistSection />
      </main>
      <footer>
        <div className="container"><span>© 2026 ShowUp</span><span>Find players. Join matches. Build your sports network.</span></div>
      </footer>
    </div>
  );
}
