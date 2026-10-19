// Privacy/markup regression checks using the actual UI components.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, ...args);
};
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename);
}
require.extensions['.css'] = (module) => { module.exports = { identity: 'identity', code: 'code' }; };
const ProfileIdentity = require('../features/profile/components/ProfileIdentity.tsx').default;
const PlayerName = require('../features/players/components/PlayerName.tsx').default;
const uuid = '00000000-0000-0000-0000-000000000001';
const code = 'SU-7K3Q9X';
const html = renderToStaticMarkup(React.createElement(ProfileIdentity, { user: {
  id: uuid, player_id: code, name: 'Test player', city: 'Delhi NCR',
  email: 'private-canary@example.test', legacy_id: 'private-legacy-canary',
} }));
assert(html.includes(`Copy player ID ${code}`));
assert(html.includes(`/#/p/${code}`));
assert(!html.includes(uuid));
assert(!html.includes('private-canary'));
assert(!html.includes('private-legacy-canary'));
const name = renderToStaticMarkup(React.createElement(PlayerName, { name: 'Test player', code }));
assert(name.includes('<button'));
assert(name.includes('aria-expanded="false"'));
assert(name.includes('aria-controls='));
assert(name.includes(`/#/p/${code}`));
assert(!name.includes(uuid));
console.log('PASS: profile/name markup exposes public IDs, touch/keyboard disclosure and share links; UUID/email/legacy values remain hidden');
