import type { NavigationSummary } from "../types";

/** Embed verified display data before the preserved Home scripts first render. */
export function renderHomeDocument(template: string, summary: NavigationSummary | null) {
  const data = JSON.stringify(summary).replace(/</g, "\\u003c");
  const action = summary === null
    ? '<a class="btn" id="hb" aria-disabled="true">Loading account…</a>'
    : summary.authenticated
      ? '<a class="btn" id="hb" href="/groups/create">+ Host a game</a>'
      : '<a class="btn" id="hb" href="/login?next=%2Fapp.html">Sign in</a>';
  return template
    .replace('<!-- showup-account-bootstrap -->', `<script type="application/json" id="showup-account-bootstrap">${data}</script>`)
    .replace('<a class="btn" id="hb" href="/groups/create">+ Host a game</a>', action);
}
