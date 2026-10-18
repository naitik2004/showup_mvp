import { Metadata } from 'next';
import PrelaunchPage from '@/components/prelaunch/PrelaunchPage';

export const metadata: Metadata = {
  title: 'ShowUp — Find players. Join matches. Build your sports network.',
  description: 'Find nearby sports games, meet your next crew, and get ready to show up. Explore the ShowUp preview.',
};

export default function HomePage() {
  return <PrelaunchPage />;
}
