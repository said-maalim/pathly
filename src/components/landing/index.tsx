/**
 * Landing page — composes all sections.
 *
 * Uses a dedicated CSS file (landing.css) scoped under .landing to avoid
 * conflicts with the rest of the app's Tailwind / globals.css styles.
 */
import './landing.css';

import { LandingHeader } from './LandingHeader';
import { Hero } from './Hero';
import { ProofStrip } from './ProofStrip';
import { AudienceTabs } from './AudienceTabs';
import { Capabilities } from './Capabilities';
import { HowItWorks } from './HowItWorks';
import { Security } from './Security';
import { CtaBand } from './CtaBand';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="landing">
      <LandingHeader onNavigate={onNavigate} />

      <main id="top">
        <Hero />
        <ProofStrip />
        <AudienceTabs />
        <Capabilities />
        <HowItWorks />
        <Security />
        <CtaBand />
      </main>

      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
}
