# ShowUp development conventions

ShowUp is a sports startup. Use the product specification for intended behavior
and supplied HTML/screenshots as visual references, not production architecture.

Player identity work across all features must follow
`docs/plans/player-identifiers.md`: UUIDs are internal relationship keys;
immutable public player IDs are for display and server-resolved discovery.

- Implement new UI as named React/TypeScript components with clear responsibilities.
- Keep page composition, reusable UI, styles, content, hooks, and data access separate.
- Use descriptive identifiers and readable formatting. Do not paste complete HTML
  documents or inline application scripts into React or hide them in raw HTML strings.
- Preserve approved appearance and interactions while refactoring. Check responsive
  layouts and contrast, including hover states.
- Keep marketing sample data separate from real application data. Never present
  simulated activity, local browser storage, or unsaved submissions as live features.
- Enforce authentication, membership, capacity, and permissions in the backend.
  Client button visibility alone is not authorization.
- Any current match member may invite their own friends, subject to backend rules.
- Never expose credentials in logs, commits, examples, or browser screenshots.
- Make small reviewable changes. Run TypeScript, lint, and relevant interaction
  checks. Report what is implemented, what was tested, and what is still pending.
- The current app preview at /app.html is temporary legacy code. New work should
  use the structured Next.js implementation rather than expand the legacy script.
