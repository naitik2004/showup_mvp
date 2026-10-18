# ShowUp architecture and migration

## Current routes

- `/`: native Next.js marketing page, composed by `app/page.tsx`.
- `/app.html`: original standalone application preview, served through a rewrite
  to `public/showup/app.html`. It still uses browser-local accounts and sample
  match/social data. It is not the production application backend.
- Existing `/login`, `/profile`, `/map`, `/groups/*`, and social routes: older
  Next.js implementation. Authentication uses Supabase; many other flows still
  use `lib/mock-data.tsx`. They are not yet the replacement for the app preview.

## Marketing structure

```text
app/page.tsx                         Page metadata and composition entry
components/prelaunch/
  PrelaunchPage.tsx                  Section composition and reveal boundary
  Prelaunch.module.css              Scoped, readable styles
  PrelaunchNavigation.tsx           Scroll-aware navigation
  PrelaunchHero.tsx                  Hero content
  SampleGamesBoard.tsx               Explicitly illustrative match board
  FlipText.tsx                       Reusable split-flap animation
  MatchPassPreview.tsx               Sport selection and sample ticket
  FeatureList.tsx                    Six product features
  MatchLifecycle.tsx                 Scroll-driven timeline
  LaunchCountdown.tsx                Countdown display
  WaitlistSection.tsx                Form and truthful unavailable state
  BallIcon.tsx                       Shared SVG artwork
  SqueezableBall.tsx                 Keyboard/click hero-ball interaction
  PlayfulBall.module.css             Logo ricochet and hero squeeze motion
  LockedWaitlistButton.tsx           Decorative metallic chains and padlock
  LockedWaitlistButton.module.css    Scoped chain and lock animation
  SectionLabel.tsx                   Shared gate label
  hooks/useReveal.ts                 Scoped intersection observer with cleanup
data/prelaunch.ts                    Content, sample data, app URL, preview date
components/AppShell.tsx              Keeps app providers off the marketing page
```

Marketing classes have descriptive names and are scoped by the CSS Module's
page boundary. Timers, scroll handlers, and observers release resources on
unmount. React owns rendering; no HTML injection, document-wide router, or
inline script tags are used by the native landing page.

The original landing document is retained under `docs/references/` solely as a
visual reference. It is not served as the homepage. Older landing components
under `components/landing/` belong to the prior implementation and are not used
by the native prelaunch page (except the old app header).

## Intentional changes from the reference

- Sample board joins open the app instead of claiming a real seat was reserved.
- The waitlist never reports that an email was saved without a working endpoint.
- The unverified waiting-player count has been replaced with an invitation.
- The reference launch date remains in `data/prelaunch.ts`; confirm it before
  announcing a public launch. Countdown days support more than two digits.
- All six feature rows retain the corrected readable hover background.
- The logo ball makes four controlled side contacts on hover. The hero O is a
  keyboard-accessible squeezable ball. Motion respects reduced-motion settings.
- Waitlist submission shows a local chain-and-lock sequence before the closed
  registration notice; it never sends or saves the email address.

## Backend configuration and remaining work

Project configuration belongs in git-ignored `.env.local`, following
`.env.example`. The existing project has been configured locally and its auth
settings endpoint confirms email authentication is enabled. This is a connection
check, not proof of successful signup, profile creation, or authorization.
Local preview and marketing also work without backend configuration.
Never commit project keys or require a service-role key in browser code.

Before replacing the app preview, audit the actual schema against migrations.
The existing hooks/screens and the product document use differing table and
status conventions; migrate them together instead of silently mixing them.

Next increments:

1. Extract the reference app UI into structured React features, keeping approved
   styling and routes. Centralize session and data access.
2. Connect and verify Supabase accounts and profiles. Handle missing configuration
   explicitly and stop treating browser-local preview accounts as real identity.
3. Add database-backed discovery, creation, and membership with atomic capacity
   enforcement and consistent match states.
4. Add member-only chat, actual presence, mutual friendships, and invitations
   from any current member. Validate with two independent accounts.
5. Connect a real waitlist endpoint, verify mobile layouts and permission errors,
   and complete the specification's release checklist.

No remote database migration is applied as part of the landing-page refactor.

## Initial integration audit

Read-only checks against the existing project on 18 October 2026 confirmed:

- Email authentication is enabled.
- Zero-row API queries accept the expected profile fields (`id`, `name`, `city`,
  `onboarded`, `preferred_sports`), match fields, membership fields, invite fields
  (`from_user`, `to_user`), message fields, and the `friendships` fields
  (`user_a`, `user_b`, `status`).
- `friends` and `friend_requests` return a table-not-found response. Adapt the
  intended mutual-request behavior to `friendships` or propose a reviewed
  migration, rather than assuming the specification's illustrative names exist.
- OpenAPI schema introspection requires an administrative key. A secret key
  must not be added to browser code to enable introspection.

Zero-row queries do not prove that RLS protects real records, that transactions
are safe under concurrent requests, or that signup creates profiles. Those
checks require authenticated integration tests. No records were read, created,
changed, or deleted during this audit.
