# Friends

`/friends` is the real React feature. Old `/app.html#/friends` bookmarks forward here through the navigation boundary. Home retains the supplied preview design; Friends uses real Supabase authentication.

- `FriendsPage.tsx`: page composition, dismissed suggestions, and loading/error messages.
- `components/FriendsHero.tsx`: heading and real network totals.
- `components/FriendRequestPass.tsx`: ticket layout, deterministic decorative barcode, and server-confirmed accept/decline transitions.
- `components/PlayerSuggestionCard.tsx`: suggestion card and hide action.
- `components/FriendActions.tsx`, `PlayerAvatar.tsx`, `PlayerIdChip.tsx`, and `ConnectionReasons.tsx`: reusable player UI.
- `content.ts`: sport labels and icons.
- `components/PlayerSearchSection.tsx`: name / exact public player ID search.
- `components/FriendRequestsSection.tsx`: incoming and sent requests.
- `components/FriendsNetworkSection.tsx`: accepted friends.
- `components/PlayerSuggestionsSection.tsx`: completed match / mutual friend suggestions.
- `components/PlayerCard.tsx`: shared identity and relationship actions.
- `components/PlayerIdCard.tsx`: permanent public ID and copy action.
- `hooks/useFriends.ts`: debounced search, stale-result protection, refresh on focus/reconnect, mutations.
- `data/friendsRepository.ts`: Supabase queries and readable errors.
- `types.ts` and `friends.module.css`: feature types and scoped presentation.

Apply `supabase/migrations/017_friends_and_player_ids.sql` after 016. It assigns random `SU-` codes to existing and new profiles, preserves existing IDs, prevents changing codes, and adds authenticated search / action RPCs. No service key belongs in the client. Duplicate existing friendship pairs abort the migration for explicit review; nothing is silently removed. Do not replay all migrations with `db push` against an unbaselined hosted project.

Search returns at most 30 matches, accepts partial names and case-insensitive exact IDs (with or without hyphens), and excludes self / blocks in either direction. Suggestions return at most 30 people, prioritize completed matches then mutual friends, and exclude existing friends and pending requests. Only `games.status = 'done'` with a past start and shared membership counts as played together; this reflects recorded match completion, not independently verified attendance. No upcoming, cancelled, or arbitrary seeded players count. Only aggregate mutual friend counts are exposed, not other people's friendship rows. Incoming requests can only be accepted/declined by their recipient. Outgoing requests can only be cancelled by their sender. Crossed requests serialize into one pair. All reads and writes use real database state.

The page refreshes on return to the tab, reconnect, Retry, and successful actions. It does not claim realtime push delivery. Search and layout files can change independently of database rules.

## Local database tests

Use a fresh, isolated PostgreSQL database on `/tmp`, port 55440:

```
psql -h /tmp -p 55440 -d postgres -v ON_ERROR_STOP=1 \
  -f supabase/tests/bootstrap.sql \
  -f supabase/tests/friends_fixture.sql \
  -f supabase/migrations/017_friends_and_player_ids.sql
python3 supabase/tests/test_friends.py
```

The fixtures and tests are never for production. They cover random unique immutable IDs, exact ID / literal name search, request authorization and lifecycle, private graph isolation, blocked players, completed-match suggestions, pending/friend exclusions, and concurrent crossed requests. Hosted installation and two-account UI checks require access to the Supabase project.

## Current verification

TypeScript, lint, and the production build pass (the existing global font warning remains). Five local PostgreSQL test groups pass. Desktop and 390px layout checks used the actual section components rendered with clearly labeled fixtures, with no horizontal overflow at 390px. The legacy Friends route was checked to redirect to real authentication with `next=/friends`.

Migration 017 was installed in hosted project `hmeomzpdwowwagaadkjw` on 19 October 2026 following explicit user approval. The SQL Editor reported success. Read-only verification confirmed all 5 existing profiles have 5 distinct non-null player IDs, friendships RLS is enabled, anonymous RPC execution is denied, and direct authenticated INSERT/UPDATE privileges are absent. All four section RPC modes executed successfully under the authenticated role. A case-insensitive exact ID search returned one player; the automatic player-ID trigger is enabled. Direct DELETE and column-level UPDATE privileges are also absent. No friend requests or hosted test accounts were created by the automated checks. End-to-end acceptance between two signed-in browser accounts remains unverified.


## Reference redesign and short IDs

The Friends-only design is adapted from `/Users/naitikpandey/Downloads/showup 2/js/sections/friends.js` and `css/sections/friends.css` into named React components and a scoped CSS module. No reference application script or raw HTML renderer is used. The layout includes the large heading, stat tiles, search / green identity cards, ticket requests, suggestion cards, and sport-filtered crew. Sports come from real `preferred_sports` values; unsupported skill/rating data is not invented. Public-profile navigation is not fabricated where no public profile route exists. Suggestion dismissals last for this page visit. Acceptance animation only runs after the server confirms acceptance; requests are never automatically accepted.

Migration `018_short_player_ids.sql` follows 017. IDs now use `SU-` and six random characters from an unambiguous alphabet. Allocation is serialized and retries collisions, with the unique constraint as a backstop. Existing long codes remain private aliases usable by the authenticated search RPC. Internal authentication UUIDs and existing friendship keys are unchanged. Both migration 017 and 018 are installed in the hosted project following explicit approvals. Live verification of 018 found 5 valid distinct short IDs and 5 retained aliases, with direct alias-table and allocator access denied.

`python3 supabase/tests/test_short_player_ids.py` applies 018 after the isolated 017 tests and checks ID format/lookup, legacy alias lookup, immutability, private allocator access, a forced random-code collision, 2,000 generated profiles, and 32 concurrent allocations. Those tests create only local disposable profiles. Desktop and 390px ticket layout checks pass with no horizontal overflow.


## Loading and request browsing

`components/FriendsSkeleton.tsx` and its CSS module render the first-load placeholder cards, with accessible loading labels and reduced-motion support. Hero totals use placeholder blocks until real data arrives.

`components/RequestCarousel.tsx` and its CSS module render one visible ticket per request type (Received and Sent). `hooks/useRequestCarousel.ts` owns active selection, wrapping, pointer swipes, horizontal trackpad gestures, and keyboard handling. Empty types have a clear placeholder; arrow controls are disabled for zero/one ticket or during a mutation. Only the visible ticket is mounted, so a large request list does not create a long vertical stack. If the selected request disappears after a refresh, selection safely falls back to the first remaining ticket. No autoplay or automatic acceptance is used.

Browser checks verified actual reload skeletons, next/previous wrapping, drag/swipe wrapping, and keyboard wrapping against existing sent requests. No requests were accepted, declined, or withdrawn during these checks.

A server-render check with 100 fixture requests confirmed only two ticket elements are rendered (one per type), including distinct incoming/outgoing actions. Empty received state and accessible skeleton markup were also checked. The 390px browser layout had no horizontal overflow. Production build, TypeScript and lint passed; existing font/Edge dependency warnings remain.
