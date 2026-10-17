import { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'ShowUp — Find Players. Drop A Pin. Show Up.',
  description: 'The real-time sports matchmaking network for urban India. Discover pickup football, badminton, basketball runs, and cricket nets near you in seconds.',
};

export default function HomePage() {
  return <LandingPage />;
}
