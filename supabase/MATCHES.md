# Match backend

Branch: `matches-backend`. Existing uncommitted invitation/header work is preserved.

Apply new migrations **015 then 016**, after existing 002/011–014, with Supabase CLI migrations or the SQL editor. Back up the database first. 015 copies existing match IDs/members and migrates messages in place; historical messages longer than 1000 characters are retained, while new messages enforce the 1000-character limit. Old match tables remain read-only for rollback and existing ratings foreign keys. Do not run drop_unused_tables.sql.

The supplied `ShowUp_ Find players. Join matches (1).html` was inspected. Hosting uses its card form and sport chips; the profile uses its identity card, stack and stat tiles, with the requested match dashboard. Match notes and action order follow the reference. Existing header/animation styling changes were preserved. Venue remains a free-text input so real venues can be entered without reusing fictional demo locations. `/new` aliases the hosting form; `/profile` adds the dashboard.

## Security policy inventory

- games_read: authenticated users see noncancelled games and cancelled games they belong to.
- games_insert_host, games_update_host, games_delete_host: owner checks; direct table writes are additionally revoked, so clients use RPCs.
- members_read: authenticated users see membership of visible games; helper functions avoid recursive RLS.
- messages_read: members see all messages in their match (sender restriction applies to inserts, allowing teammates to read each other).
- messages_send: member AND sender_id = auth.uid(). No client updates/deletes.
- Views use security_invoker. Anonymous access is revoked. RPCs require auth.uid(), use fixed search_path and have PUBLIC/anon execution revoked.
- Existing invitation/block policies remain in place; 016 retargets invitation foreign keys and functions to canonical games/members.

## Run locally

1. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local. Never put a service key in browser configuration.
2. Apply the migrations to a local Supabase instance. Create two accounts and profiles. Run supabase/seed.sql only locally after creating a profile; it skips seeding when none exists.
3. `npm install`, `npm run dev`. Open localhost:3000 in two separate browser profiles and sign in separately.
4. A hosts via /new; verify Home and /profile Hosting. B joins; verify Joined, live counts, members and chat on A without refresh.
5. For last-spot testing create capacity 2 and use two additional accounts to join simultaneously: only one succeeds.
6. Send messages both ways; test a third nonmember cannot query/insert messages. Cancel as A and verify all status pills and rejected joins. Visit /profile or /groups/ID signed out and check redirect to /login.
7. `npm run build`, `npm run lint`, `npm run typecheck`.
8. Types were regenerated from hosted project `hmeomzpdwowwagaadkjw` using `npx supabase gen types typescript --project-id hmeomzpdwowwagaadkjw`. To regenerate for local development, use `--local` instead. Match presentation types and mapping live in lib/matches.ts.

## Automated database tests

`supabase/tests/bootstrap.sql` is a **minimal legacy test fixture**, not a Supabase migration and never for production. In a fresh isolated PostgreSQL cluster on port 55439:

```
psql -h /tmp -p 55439 -d postgres -v ON_ERROR_STOP=1 \
  -f supabase/tests/bootstrap.sql \
  -f supabase/migrations/015_matches_backend.sql \
  -f supabase/migrations/016_match_invite_compatibility.sql
python3 supabase/tests/test_matches.py
```

Tests cover transactional host membership/Hosting view, concurrent final spot, Joined view/count/status, member/nonmember chat and sender spoofing, message length, leave reopening capacity, host controls, cancellation visibility/join rejection, anonymous/direct writes, past dates/capacity validation, start/finish, and publication entries.

## Realtime / dashboard setup

015 adds games, game_members, messages to supabase_realtime. Confirm those three tables are enabled under Database → Publications and that Realtime is enabled in the project. No scheduled job is required. Board and room subscriptions clean up on unmount and refetch on reconnect, online and focus. Membership events are unfiltered to cover DELETE payloads. Chat loads the newest 50 in ascending display order, sends optimistically and rolls back failures.

## Verification results and limits

Build, lint and TypeScript passed. Existing font lint warning remains; build also warns about font fetching and the Supabase dependency in Edge runtime. Seven database test groups passed on PostgreSQL 16 using the minimal fixture. Migrations 015/016 were applied together in one transaction to hosted project `hmeomzpdwowwagaadkjw` on 19 October 2026 after user approval and a live schema preflight. Verified after migration: 5 games, 7 memberships, 11 messages, and all 5 geographic locations preserved; all three match tables have RLS and realtime publication entries. Read-only grant checks confirm anonymous access and direct game/member writes are blocked, message update/delete privileges are absent, and all three views use security_invoker. Types now come from the actual hosted project.

A restricted local snapshot of the affected legacy rows, function definitions, policies and constraints is saved at `/tmp/showup-before-matches-backup.json` (not a complete database backup). The remote project had no CLI migration-history table; migrations were applied through the Management API. Do not run an unreviewed `supabase db push`: baseline existing remote migrations first to prevent replay.

The rollback-only hosted integration test in `supabase/tests/hosted_rollback.sql` was NOT executed: automatic approval review rejected it because hosted test writes might emit realtime/events or nontransactional effects, and migration approval was not considered sufficient authorization for those tests. Explicit approval is required before executing that test. Full websocket delivery and two-browser UI behavior remain unverified. No hosted seed data was inserted. Frontend changes remain local on the `matches-backend` branch; this work did not deploy the frontend.
