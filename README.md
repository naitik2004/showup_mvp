This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ShowUp structure and current status

The prelaunch homepage at `/` is a native React page. Start with
`app/page.tsx`, `components/prelaunch/`, and `data/prelaunch.ts` for changes.
Styles live in `components/prelaunch/Prelaunch.module.css` and are scoped to
this page. The original HTML reference is in `docs/references/prelaunch.html`.

“Open the app” goes to `/app.html`, which still serves the standalone preview
from `public/showup/`. Preview accounts and data remain in browser localStorage
(`showup.v1`); they are not real Supabase accounts. The demo login shortcut is
removed. The marketing sample board is illustrative and the waitlist does not
save emails yet.

See [architecture and migration](docs/architecture.md) for file responsibilities,
route behavior, and the remaining backend work. Follow `AGENTS.md` when editing.

Run `npm install` and `npm run dev`, then open http://localhost:3000.
Marketing and the standalone preview work without Supabase. Configure
`.env.local` from `.env.example` before testing the older Supabase-backed routes;
never commit credentials.
