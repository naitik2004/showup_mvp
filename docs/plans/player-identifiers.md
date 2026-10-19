# Player identifiers implementation plan

Status: migrations 019/020 are applied to the hosted ShowUp database after a
verified export. Local acceptance tests, hosted rollback checks and the existing
authenticated browser session pass. Frontend source changes remain local; a
matching frontend release is still required for the deployed website.
Applies to every real player feature. Preserve existing styling and routes.

## Identity contract

- `profiles.id = auth.users.id` is the internal UUID primary key. All player
  foreign keys reference it: hosts, memberships, message senders, friendship
  participants, invites, reviewers and blocks. Public IDs are never foreign keys.
- `profiles.player_id` is the public, immutable text identifier. Format is `SU-`
  followed by exactly six characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`.
  Exclude O, 0, I, 1 and L. Store uppercase; exact lookups normalize with `upper()`.
- Require UNIQUE, NOT NULL and a format constraint; the unique index supports
  exact uppercase lookup. The database generates IDs and retries collisions,
  including concurrent allocations. Never accept a client-selected public ID.
- Derive the acting user exclusively from `auth.uid()`. A target's public ID may
  be supplied for discovery/actions; the server resolves that target to a UUID.
  Never accept a supplied actor UUID as identity or authorization.

## Current repository findings

- Migrations 017 and 018 already separate UUIDs from public IDs, generate short
  IDs, preserve older public codes in `player_id_aliases`, and reject ID changes.
- Migration 018's alphabet and format constraint allow L, contrary to this
  contract. Add a forward migration; do not rewrite applied migrations.
- Existing aliases reference `profiles.id`, which is the correct UUID relation.
- `friends_players` supports names and case-insensitive codes/aliases and filters
  blocks. `friend_action(p_player_id uuid, ...)` confusingly names a UUID argument
  as a player ID. Add a text-code entry point that resolves the target server-side
  and delegates to the existing permission-checked friendship operation.
- `ProfileIdentity` currently shows name and city, without a public-ID copy tag.
- The legacy Home preview uses browser-local players such as p0 and p1. These are
  sample identities, not evidence of real auth accounts; never fabricate an auth
  mapping or import them as real users. Audit every reference before migration.
- Existing short-ID tests cover uniqueness, forced collisions, alias search,
  immutability and concurrent generation, but still permit L. Extend them.
- These findings come from source files, not verification of hosted schema/data.

## 1. Audit and migrate safely

1. Inventory the actual schema, auth-profile creation trigger, foreign keys,
   grants/RLS, profile projections, and every UUID/public-ID consumer. Reconcile
   old group/member models with current games/member models before changing them.
2. Record existing player codes and any pre-auth legacy identities. Add
   `profiles.legacy_id` for the prior per-player identifier where present; retain
   the alias table for additional historical codes. Only map a legacy identity
   to a real auth UUID when ownership is verified. Preserve all references.
3. Add a forward migration with the corrected alphabet, collision retry and
   concurrency protection. Preserve valid public IDs. Before replacing an invalid
   old code, preserve it in legacy_id/aliases. This migration-only change must
   not leave users able to alter IDs afterward.
4. Backfill missing public IDs before enforcing NOT NULL. Keep every profile UUID
   and existing match, chat, friendship, invite, review and block relationship.
5. Generate the code in the same transaction as the first-sign-in trigger that
   creates the profile row. Verify signup and first-sign-in provider behavior;
   retain idempotency and prevent partially created profiles.
6. Enforce immutable IDs on every UPDATE, including setting to NULL. Allow name
   updates independently. Reject manual ID allocation by ordinary clients.
7. Compare UUID relationship counts and orphan checks before/after migration.

## 2. Public lookup and authorization

- Add `find_player(player_id text)` with exact `upper(trim(...))` matching.
  Return only public ID, name, avatar, skill, favourite sports, coarse city and
  approved stats. Do not return email, auth metadata or private profile fields.
- Return no row for blocked players in either direction. Apply the same block
  rules to search, cached data, profiles, invites, reviews and related actions.
- Enforce lookup rate limits on the server using atomic counters, including
  misses and legacy aliases. Choose explicit windows/quotas during implementation;
  return a clear retry response. Client debounce alone is insufficient.
- Rate-limit name search and all alternate lookup paths too. Anonymous public
  profiles need a trusted server request boundary with anonymous rate limiting;
  do not expose an unrestricted definer RPC that bypasses it.
- Audit direct profiles SELECT policies/column grants so callers cannot bypass
  lookup privacy or rate limits. Keep privileged helpers inaccessible to clients.
- Friendship and invitation entry points accept the target public code, resolve
  UUIDs internally, derive the actor from auth.uid(), and recheck self/block,
  membership, capacity and action permissions server-side.

## 3. UI and data integration

- Profile: show player_id beneath the name in the existing mono tag style, with
  an accessible copy button and success/failure feedback. Names remain editable;
  IDs do not. Reuse existing fonts/layout.
- Friends: add an explicit “Add friend by ID” field with exact case-insensitive
  lookup and the existing friend-request operation through a text-code wrapper.
  Preserve name search. Use clear toasts for unknown IDs, self, blocked/unavailable
  players, duplicates and rate limits without disclosing block details.
- Invites: support public-ID lookup and existing friends-list selection; both
  resolve the target on the server and preserve match invitation rules.
- Match lobby and chat: show names normally, with public IDs on hover, tap and
  keyboard focus. Include IDs in host kick/approval management views.
- Chat: persist sender_id UUIDs. Batch and cache public profile lookups by UUID
  for existing authorized message senders; avoid one request per message. Scope
  cache to the viewer/session, invalidate after profile/block changes, and never
  let cached records bypass block/privacy rules.
- Reviews and blocks: retain UUID relationships and show public IDs in the UI.
- Shareable read-only public profile: support `#/p/<player_id>` without replacing
  existing routes. Since URL fragments are not sent to the server, use a small
  client routing boundary and a structured React public-profile feature, rather
  than expanding the legacy application script. Resolve codes through the safe
  lookup boundary. Share the same stats calculation as the owner's profile.
- Handle unknown, blocked, rate-limited and missing profiles cleanly. Public
  profile output must not include account controls or private account data.

## 4. Acceptance tests

Run database tests in an isolated database, with migrations and real trigger/RLS
behavior. Keep the local app running during implementation and UI verification.

- Two new authenticated signups receive distinct correctly formatted IDs; force
  a collision and prove a retry succeeds. Exercise concurrent creation and ensure
  every generated character belongs to the corrected alphabet.
- Changing player_id or nulling it fails. Updating name succeeds and preserves
  the ID. Client-supplied IDs cannot override server generation.
- Add a friend by lowercase/mixed-case ID. Unknown IDs produce a clear toast;
  self and blocked targets fail server-side. Existing friend actions still work.
- Every preexisting real profile has a valid ID after backfill. Legacy values
  survive; historical links resolve. Matches, chats, friendships, invites,
  reviews and blocks still reference the same UUID owners with no orphans.
- Public profile stats match the owner's profile for the same player/fixtures.
- Lookup and direct-access attempts never expose email/auth/private fields.
  Both directions of blocking are enforced; cached profiles cannot bypass them.
- Excess lookup attempts, including misses and anonymous requests, are throttled.
- Invite by ID and friend selection resolve the same target and obey permissions.
- Lobby/chat ID disclosure works by hover, touch and keyboard. Copy feedback and
  profile links work on mobile and desktop without redesigning existing layouts.

## Completion evidence

Record migration/rollback rehearsal results, database acceptance output, relevant
UI checks, TypeScript/lint checks and any hosted deployment still pending. Do not
claim database changes are live merely because migration files exist.


## Implementation evidence (19 October 2026)

- Forward migrations: `supabase/migrations/019_player_identity_contract.sql`
  and `supabase/migrations/020_public_city_aliases.sql`.
- Ordered application and verification: `supabase/APPLY.md`.
- Isolated database acceptance suite: `supabase/tests/test_player_identity.py`.
  Uses the real auth-profile trigger, tests data preservation, concurrent signup,
  forced collision, immutable IDs, case-insensitive/legacy lookup, friendship and
  invite actions, blocked messages/reviews, host-only removal, scoped profile
  batches, public/owner stats parity, private-field/coarse-city protection and
  quota exhaustion/recovery. Failed actions retain their quota consumption.
- UI privacy/markup checks: `node tests/player-identity-render.cjs`.
- TypeScript/lint and production compilation pass; existing font and Supabase
  Edge-runtime warnings remain. Production compilation uses an isolated source
  copy so the local development server can stay running on port 3000.
- Browser checks against the updated hosted database pass for the owner profile,
  ID copying, public hash profile/stats parity, lowercase ID and name search,
  unknown/self error toasts, lobby/chat ID disclosure and the friend/ID invite
  dialog. Mobile public profile fits a 390px viewport without horizontal overflow.
  No real friend requests, invitations or chat messages were sent during checks.
  Independent two-session message delivery/provider signup was not exercised.
- Block changes invalidate cached profile data through viewer-owned Realtime
  version events. The private block graph is not published by this migration.
- Public city output is restricted to the app's six supported coarse cities;
  unrecognized free-form values remain private instead of risking address leaks.
- The current match model has immediate joins rather than pending approvals.
  Public IDs are included in lobby/host removal views; no new approval workflow
  or artificial pending requests were introduced.
- Browser-local p0/p1 sample keys remain in the legacy preview. No real ownership
  mapping was available, so they were not converted into fabricated auth accounts.
  Real historical public IDs are preserved in legacy_id and player_id_aliases.
- Anonymous lookup traffic shares one global 60/minute budget; authenticated
  lookups use a separate 60/minute budget per auth user. This prevents an anon
  caller from bypassing quotas with spoofed IP headers, at the cost of shared
  anonymous availability.
- Hosted migrations 019 and 020 completed successfully in order. Existing schema
  already included migration 018; older files were not replayed. Email sign-in is
  enabled, Google is disabled, and existing provider settings were preserved.
  Realtime includes messages, games, game_members, legacy group_members and the
  new viewer-owned player_visibility_events table.
- Before application, exported all 13 application/legacy tables plus columns,
  constraints, policies, triggers, functions, views and grants. Export was parsed
  and verified outside the repository. Post-migration fingerprints match for
  profile names/cities/UUIDs, all relationship keys and message content.
- Hosted rollback-only checks pass for immutable IDs, editable names, lookup
  casing, self/unknown/blocked rejection, public/owner stats parity and owner RLS.
  See `supabase/tests/hosted_identity_rollback.sql`.
