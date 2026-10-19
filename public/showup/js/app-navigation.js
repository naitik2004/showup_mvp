/* Navigation boundary for the preserved reference Home page. */
(() => {
  const pages = {
    friends: '/friends',
    invites: '/invites',
    me: '/profile',
    profile: '/profile',
    new: '/groups/create',
    signin: '/login?next=%2Fapp.html',
  };

  window.showupNavigateLegacyRoute = (section) => {
    if (!Object.prototype.hasOwnProperty.call(pages, section)) return false;
    window.location.replace(pages[section]);
    return true;
  };
})();

/* Home consumes the same authenticated endpoint as the React header. */
(() => {
  let generation = 0;
  let summary = null;
  const render = () => {
    for (const [id, count] of [['b1', summary?.friendRequests], ['b2', summary?.invites]]) {
      const badge = document.getElementById(id);
      badge.textContent = count > 0 ? String(count) : '';
    }
    document.querySelectorAll('[data-account-count]').forEach((counter) => {
      const count = summary?.[counter.dataset.accountCount];
      counter.textContent = summary ? String(count || 0).padStart(2, '0') : '--';
    });
    const inviteSummary = document.querySelector('[data-invite-summary]');
    if (inviteSummary) inviteSummary.textContent = summary?.invites > 0
      ? `${summary.invites} pending game ${summary.invites === 1 ? 'invite' : 'invites'} for you.`
      : 'Pick one and show up.';
    const action = document.getElementById('hb');
    action.textContent = summary?.authenticated ? '+ Host a game' : 'Sign in';
    action.href = summary?.authenticated ? '/groups/create' : '/login?next=%2Fapp.html';
  };
  const refresh = async () => {
    const request = ++generation;
    try {
      const response = await fetch('/api/navigation', { cache: 'no-store' });
      if (!response.ok) throw new Error('Navigation unavailable');
      const next = await response.json();
      if (request !== generation) return;
      summary = next;
    } catch {
      if (request !== generation) return;
      summary = null;
    }
    render();
  };
  window.showupRefreshHeader = () => { render(); };
  void refresh();
  window.addEventListener('focus', refresh);
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refresh();
  });
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('showup-navigation');
    channel.onmessage = () => { void refresh(); };
  }
  window.setInterval(() => {
    if (document.visibilityState === 'visible') void refresh();
  }, 10000);
})();
