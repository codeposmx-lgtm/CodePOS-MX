const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { isRedirect, isAllowed, parseRedirect, CHROME_UA } = require('../lib/meta-login');
const { createMetaService, insightSeries, sumSeries, instagramWindows, totalValue, META_APP_ID, GRAPH_VERSION, META_SCOPES } = require('../lib/meta');
const { createStore } = require('../lib/store');

const CB = 'https://www.facebook.com/connect/login_success.html';
const fakeSafeStorage = {
  isEncryptionAvailable: () => true,
  encryptString: s => Buffer.from(Buffer.from(s, 'utf8').map(b => b ^ 0x5a)),
  decryptString: b => Buffer.from(Buffer.from(b).map(x => x ^ 0x5a)).toString('utf8'),
};
const newStore = () => createStore({ dir: fs.mkdtempSync(path.join(os.tmpdir(), 'codepos-m-')), safeStorage: fakeSafeStorage });
const service = (store, { answers = null, confirmed = true } = {}) =>
  createMetaService({ store, ask: async () => answers, confirm: async () => confirmed, login: async () => { throw new Error('no login in tests'); } });

test('constants match the Meta app configuration', () => {
  assert.equal(META_APP_ID, '4913773975558748');
  assert.equal(GRAPH_VERSION, 'v26.0');
  assert.deepEqual(META_SCOPES, ['pages_show_list', 'pages_read_engagement', 'read_insights', 'instagram_basic', 'instagram_manage_insights']);
  assert.ok(!CHROME_UA.includes('Electron'));
  assert.match(CHROME_UA, /Chrome\/\d+/);
});

test('isRedirect accepts only exact login_success on facebook.com/www', () => {
  assert.ok(isRedirect(`${CB}#access_token=x`));
  assert.ok(isRedirect('https://facebook.com/connect/login_success.html'));
  assert.ok(!isRedirect('https://m.facebook.com/connect/login_success.html'));
  assert.ok(!isRedirect('https://evil.com/connect/login_success.html'));
  assert.ok(!isRedirect('https://www.facebook.com/connect/login_success.htmlx'));
  assert.ok(!isRedirect('not a url'));
});

test('parseRedirect: token with matching state', () => {
  assert.deepEqual(parseRedirect(`${CB}#access_token=T&expires_in=3600&state=S`, 'S'), { kind: 'token', token: 'T', expiresIn: 3600 });
  assert.deepEqual(parseRedirect(`${CB}#access_token=T&state=S`, 'S'), { kind: 'token', token: 'T', expiresIn: 0 });
});

test('parseRedirect: wrong state discards token (Review Focus 3)', () => {
  assert.deepEqual(parseRedirect(`${CB}#access_token=T&state=X`, 'S'), { kind: 'error', message: 'Respuesta de Meta no válida (state no coincide). Se descartó el token.' });
  assert.deepEqual(parseRedirect(`${CB}#access_token=T`, 'S'), { kind: 'error', message: 'Respuesta de Meta no válida (state no coincide). Se descartó el token.' });
});

test('parseRedirect: no params → null; user_denied → Spanish cancel; other error → description', () => {
  assert.equal(parseRedirect(CB, 'S'), null);
  assert.equal(parseRedirect(`${CB}?foo=bar`, 'S'), null);
  assert.deepEqual(parseRedirect(`${CB}?error=access_denied&error_reason=user_denied`, 'S'), { kind: 'error', message: 'Cancelaste la autorización en Meta.' });
  assert.deepEqual(parseRedirect(`${CB}?error=server_error&error_description=Algo+fall%C3%B3`, 'S'), { kind: 'error', message: 'Meta rechazó el inicio de sesión: Algo falló' });
});

test('isAllowed: https facebook/fbcdn/meta subdomains and about: only', () => {
  assert.ok(isAllowed('https://www.facebook.com/v26.0/dialog/oauth'));
  assert.ok(isAllowed('https://static.xx.fbcdn.net/x.js'));
  assert.ok(isAllowed('https://accountscenter.meta.com/'));
  assert.ok(isAllowed('about:blank'));
  assert.ok(!isAllowed('http://www.facebook.com/'));
  assert.ok(!isAllowed('https://notfacebook.com/'));
  assert.ok(!isAllowed('https://facebook.com.evil.com/'));
  assert.ok(!isAllowed('file:///C:/x'));
});

test('insightSeries maps end_time to previous day and skips bad values', () => {
  assert.deepEqual(insightSeries({ data: [{ values: [
    { end_time: '2026-11-10T08:00:00+0000', value: 7 },
    { end_time: 'bad', value: 1 },
    { end_time: '2026-11-11T08:00:00+0000', value: { x: 1 } },
  ] }] }), [{ date: '2026-11-09', value: 7 }]);
  assert.deepEqual(insightSeries({}), []);
});

test('sumSeries returns null for missing/empty series', () => {
  assert.equal(sumSeries(undefined), null);
  assert.equal(sumSeries([]), null);
  assert.equal(sumSeries([{ value: 2 }, { value: 3 }]), 5);
});

test('totalValue reads total_value.value', () => {
  assert.equal(totalValue({ data: [{ total_value: { value: 42 } }] }), 42);
  assert.equal(totalValue({ data: [] }), null);
});

test('instagramWindows splits 90 days into 30-day chunks without gaps', () => {
  const until = Date.UTC(2026, 10, 18);
  const since = until - 90 * 86_400_000 + 600_000;
  const windows = instagramWindows(since, until);
  assert.equal(windows.length, 3);
  assert.equal(windows[0][0], since);
  assert.equal(windows.at(-1)[1], until);
  for (let i = 0; i < windows.length; i++) {
    assert.ok(windows[i][1] - windows[i][0] <= 30 * 86_400_000 - 60_000);
    if (i > 0) assert.equal(windows[i][0], windows[i - 1][1]);
  }
  assert.equal(instagramWindows(until - 7 * 86_400_000, until).length, 1);
});

test('status when nothing stored', () => {
  assert.deepEqual(service(newStore()).status(), {
    appID: '4913773975558748', graphVersion: 'v26.0', scopes: META_SCOPES, hasAppSecret: false,
    connected: false, expired: false, longLived: false, expiresAt: null, selectedPageID: null,
  });
});

test('status reports expired token as not connected', () => {
  const store = newStore();
  store.setSecret('meta.user_token', JSON.stringify({ token: 't', expiresAt: Date.now() / 1000 - 10, longLived: false }));
  const s = service(store).status();
  assert.equal(s.connected, false);
  assert.equal(s.expired, true);
});

test('status: long-lived token without expiry', () => {
  const store = newStore();
  store.setSecret('meta.user_token', JSON.stringify({ token: 't', expiresAt: 0, longLived: true }));
  const s = service(store).status();
  assert.equal(s.connected, true);
  assert.equal(s.longLived, true);
  assert.equal(s.expiresAt, 'sin caducidad');
});

test('setAppSecret rejects non-hex secret and stores nothing', async () => {
  const store = newStore();
  await assert.rejects(service(store, { answers: ['zzz'] }).setAppSecret(), /32 caracteres hexadecimales/);
  assert.equal(store.getSecret('meta.app_secret'), null);
});

test('setAppSecret stores valid secret; cancel leaves status unchanged; clearAppSecret removes it', async () => {
  const store = newStore();
  assert.deepEqual(await service(store, { answers: null }).setAppSecret(), service(store).status());
  const s = await service(store, { answers: ['0123456789abcdef0123456789abcdef'] }).setAppSecret();
  assert.equal(s.hasAppSecret, true);
  assert.deepEqual(s.notes, ['App Secret guardado en el almacenamiento cifrado de Windows.']);
  assert.equal(service(store).clearAppSecret().hasAppSecret, false);
});

test('selectPage only stores numeric ids', () => {
  const store = newStore();
  assert.equal(service(store).selectPage('abc').selectedPageID, null);
  assert.equal(service(store).selectPage('12345').selectedPageID, '12345');
});

test('disconnect cancelled keeps token', async () => {
  const store = newStore();
  store.setSecret('meta.user_token', JSON.stringify({ token: 't', expiresAt: 0, longLived: true }));
  await service(store, { confirmed: false }).disconnect();
  assert.notEqual(store.getSecret('meta.user_token'), null);
});

test('fetch without token fails', async () => {
  await assert.rejects(service(newStore()).fetch(30), { message: 'Meta no está conectado.' });
});
