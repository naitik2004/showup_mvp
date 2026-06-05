'use client';

import { useRouter } from 'next/navigation';

export default function ClientHomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold">ShowUp</h1>

      <p className="mt-4 text-zinc-400">
        Find players. Join games. Show up.
      </p>

      <button
        onClick={() => router.push('/map')}
        className="mt-8 px-6 py-3 rounded-xl bg-lime-300 text-black font-semibold"
      >
        Enter App
      </button>
    </main>
  );
}