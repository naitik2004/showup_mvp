import { NextResponse } from 'next/server';

// Firebase popup auth doesn't use this route — kept as a fallback redirect.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/map`);
}
