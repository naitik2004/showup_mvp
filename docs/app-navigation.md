Routing and page extraction checked on 19 October 2026:
- TypeScript, lint, and production build pass (existing font/Edge dependency warnings remain).
- Browser: Invites and Profile open as /invites and /profile with the shared account.
- Browser: logo and Profile/Friends main headings return to /app.html; Home nav does the same.
- Browser: old #/invites and #/me bookmarks reach their standalone pages.
- Browser: Profile Joined tab loads the existing membership record.
- Mobile: navigation sits at the bottom of a 390px viewport without header overlap or horizontal overflow.
- Home loads no /showup/js/ legacy scripts. Its match/network data comes from Supabase.
- Thirteen pure compatibility-route checks cover native anchors, legacy sections, UUID match links, and unknown hash names.
No invite was accepted/declined and no account was signed out during these read-only navigation checks.

Correction: the user requested restoring the original supplied Home after the alternative React Home was substituted. `/app.html` again rewrites to `public/showup/app.html`; separate React social pages and app Home destinations remain. The earlier no-legacy-script/shared-Home-auth checks describe the reverted alternative, not the restored preview.

### Shared header and account counters

Application headers use `public/showup/css/app-header.css` for the same spacing on
Home, Friends, Invites, and Profile. The preserved Home adapter and React
`useNavigationSummary` both read `/api/navigation`. Its server repository uses the
authenticated Supabase account and RLS to count pending received friend requests,
pending received game invites, and accepted friendships. Zero attention badges
are hidden; sent requests do not contribute to the Friends badge. Responses are
private and uncached. Counts refresh on navigation, focus, reconnect, every 10
seconds while visible, and after native friendship/invitation actions. A BroadcastChannel refreshes
other open ShowUp tabs after local actions. Failures hide badges
rather than falling back to preview counts. Home's friend/invite tiles and invite
sentence also use these counts; the rest of the original Home remains a legacy
preview and is not a fully migrated backend dashboard.

Verified zero counts against the signed-in account, matching desktop header
spacing, mobile navigation without horizontal overflow, and Received above Sent.
Repository checks cover anonymous, zero/nonzero counts, recipient filters and
query failures without database writes.

### Action feedback

`features/notifications/components/AppToaster.tsx` owns the shared black, bottom
center popup for React pages, using Sonner so existing match actions and errors
use the same surface. Friend actions, player-ID copying, invite actions, sign-out,
and profile saves also report their result there. Success is emitted after the
backend confirms a write; validation and failed writes report errors. The
preserved Home uses its existing toast with the same placement and colors, and
its empty box stays visible as a 43 by 25 pixel black pill. React pages,
including the marketing root, show the same idle pill between notifications.
On mobile the pill sits above the bottom navigation. Popups dismiss after 2.8 seconds; pending header badges
remain until the server no longer reports an item as pending. These badges count
friend requests and game invites, not chat messages.

### Signed-in Home greeting

The Home greeting reads the first part of the authenticated player's
`profiles.name` through the private navigation endpoint. It no longer reads a
browser-local preview name. Guest and missing-profile responses leave the name
blank, and the adapter inserts profile text with `textContent`. Profile saves
refresh the navigation summary across open tabs.
