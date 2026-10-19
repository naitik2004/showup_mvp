# Invites

`app/invites/page.tsx` composes `InvitesPage.tsx`. Cards and the empty state live in `components/`; `hooks/useInvites.ts` owns loading, focus/reconnect refresh and response state; `data/invitesRepository.ts` owns Supabase reads and the existing transaction-safe response RPC. Types and scoped CSS are separate. No browser-local invitations are used. The shared header, heading, and Browse matches link return to `/app.html`.
