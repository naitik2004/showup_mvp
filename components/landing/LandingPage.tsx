'use client';

import Navbar from './Navbar';
import HeroSection from './HeroSection';
import HowItWorks from './HowItWorks';
import SportsShowcase from './SportsShowcase';
import FeatureGrid from './FeatureGrid';
import CityCoverage from './CityCoverage';
import TestimonialsFAQ from './TestimonialsFAQ';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground flex flex-col selection:bg-primary selection:text-black">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <SportsShowcase />
        <FeatureGrid />
        <CityCoverage />
        <TestimonialsFAQ />
      </main>
      <Footer />
    </div>
  );
}
