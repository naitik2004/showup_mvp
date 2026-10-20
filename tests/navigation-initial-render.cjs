// Regression: account display must be correct before browser fetches finish.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, ...args);
};
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename);
}
const Header = require('../components/landing/ShowUpHeader.tsx').default;
const { renderHomeDocument } = require('../features/navigation/server/renderHomeDocument.ts');
const template = fs.readFileSync(path.join(root, 'public/showup/app.html'), 'utf8');
const signedIn = { authenticated: true, greetingName: 'Noick', friendRequests: 2, invites: 1, friends: 3 };
const guest = { authenticated: false, greetingName: null, friendRequests: 0, invites: 0, friends: 0 };
for (const [summary, expected] of [[signedIn, '+ Host a game'], [guest, 'Sign in'], [null, 'Loading account…']]) {
  const header = renderToStaticMarkup(React.createElement(Header, { initialSummary: summary }));
  assert(header.includes(expected));
  if (summary?.authenticated) assert(!header.includes('Sign in'));
  if (summary === null) assert(!header.includes('Sign in'));
  const home = renderHomeDocument(template, summary);
  const bootstrap = home.match(/id="showup-account-bootstrap">(.*?)<\/script>/s)[1];
  assert.deepEqual(JSON.parse(bootstrap), summary);
  assert(home.match(/id="hb"[^>]*>(.*?)<\/a>/)[1].includes(expected));
}
const maliciousName = '</script><script>window.bad=true</script>';
const safe = renderHomeDocument(template, { ...signedIn, greetingName: maliciousName });
assert(!safe.includes(maliciousName));
assert(safe.includes('\\u003c/script>'));

// An in-flight refresh cannot restore a signed-in header after sign-out.
const vm = require('node:vm');
let state = signedIn, effect, authEvent, finishFetch;
const hook = { exports: {} };
const source = ts.transpileModule(fs.readFileSync(path.join(root, 'features/navigation/hooks/useNavigationSummary.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(source, {
  exports: hook.exports,
  require(name) {
    if (name === 'react') return { useState: () => [state, value => { state = typeof value === 'function' ? value(state) : value; }], useEffect: fn => { effect = fn; } };
    if (name === 'next/navigation') return { usePathname: () => '/friends' };
    return { createClient: () => ({ auth: { onAuthStateChange: fn => { authEvent = fn; return { data: { subscription: { unsubscribe() {} } } }; } } }) };
  },
  fetch: () => new Promise(resolve => { finishFetch = resolve; }),
  window: { setInterval() {}, clearInterval() {}, addEventListener() {}, removeEventListener() {} },
  document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
});
hook.exports.useNavigationSummary(signedIn);
effect();
assert.equal(state.authenticated, true);
finishFetch({ ok: false });
setImmediate(() => {
  assert.equal(state.authenticated, true);
  authEvent('SIGNED_IN');
  authEvent('SIGNED_OUT');
  finishFetch({ ok: true, json: async () => signedIn });
  setImmediate(() => {
    assert.equal(state.authenticated, false);
    console.log('PASS: signed-in/guest/unknown initial headers, Home bootstrap, escaped names, refresh failure, and sign-out race.');
  });
});
