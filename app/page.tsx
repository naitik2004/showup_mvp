import { Metadata } from 'next';
import ClientHomePage from '@/components/home/ClientHomePage';

export const metadata: Metadata = {
  title: 'ShowUp — Find Your Next Game',
  description: 'Drop a pin on a live map, find nearby players, and show up. Sports social platform for urban India.',
};

export default function HomePage() {
  return <ClientHomePage />;
}
