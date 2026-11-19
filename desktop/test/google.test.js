const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createLoopbackReceiver, parseGAReports, createGoogleService, GOOGLE_SCOPE } = require('../lib/google');
const { createStore } = require('../lib/store');

const fakeSafeStorage = {
  isEncryptionAvailable: () => true,
  encryptString: s => Buffer.from(Buffer.from(s, 'utf8').map(b => b ^ 0x5a)),
  decryptString: b => Buffer.from(Buffer.from(b).map(x => x ^ 0x5a)).toString('utf8'),
};
const newStore = () => createStore({ dir: fs.mkdtempSync(path.join(os.tmpdir(), 'codepos-g-')), safeStorage: fakeSafeStorage });
const service = (store, answers) => createGoogleService({ store, ask: async () => answers, openExternal: () => {}, focus: () => {} });

test('GOOGLE_SCOPE is analytics.readonly', () => {
  assert.equal(GOOGLE_SCOPE, 'https://www.googleapis.com/auth/analytics.readonly');
});

test('loopback returns 404 for /favicon.ico and keeps waiting (Review Focus 4)', async () => {
  const receiver = createLoopbackReceiver();
  const port = await receiver.start();
  try {
    const waiting = receiver.waitForCallback(5000);
    const notFound = await fetch(`http://127.0.0.1:${port}/favicon.ico`);
    assert.equal(notFound.status, 404);
    const empty = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(empty.status, 404);
    const ok = await fetch(`http://127.0.0.1:${port}/?code=c&state=s`);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('cache-control'), 'no-store');
    assert.match(await ok.text(), /Autorización recibida/);
    assert.deepEqual(await waiting, { code: 'c', state: 's' });
  } finally { receiver.stop(); }
});

test('loopback delivers a callback that arrived before waitForCallback', async () => {
  const receiver = createLoopbackReceiver();
  const port = await receiver.start();
  try {
    await fetch(`http://127.0.0.1:${port}/?error=access_denied`);
    assert.deepEqual(await receiver.waitForCallback(1000), { error: 'access_denied' });
  } finally { receiver.stop(); }
});

test('loopback times out with Spanish message', async () => {
  const receiver = createLoopbackReceiver();
  await receiver.start();
  try {
    await assert.rejects(receiver.waitForCallback(50), { message: 'Tiempo agotado esperando la autorización de Google.' });
  } finally { receiver.stop(); }
});

test('loopback binds to 127.0.0.1 only on a random port', async () => {
  const receiver = createLoopbackReceiver();
  const port = await receiver.start();
  try {
    assert.ok(port > 0);
    assert.equal(receiver.address().address, '127.0.0.1');
  } finally { receiver.stop(); }
});

test('parseGAReports builds series, totals, previous and topPages', () => {
  const r = parseGAReports({
    days: 7, property: '123456', now: new Date('2026-11-18T00:00:00Z'),
    daily: {
      rows: [{ dimensionValues: [{ value: '20261117' }], metricValues: [{ value: '5' }, { value: '4' }, { value: '9' }] }],
      totals: [{ metricValues: [{ value: '5' }, { value: '4' }, { value: '9' }] }],
    },
    prior: { rows: [{ metricValues: [{ value: '2' }, { value: '2' }, { value: '3' }] }] },
    pages: { rows: [{ dimensionValues: [{ value: '/' }], metricValues: [{ value: '9' }] }] },
  });
  assert.equal(r.verifiedAt, '2026-11-18T00:00:00Z');
  assert.equal(r.days, 7);
  assert.equal(r.propertyID, '123456');
  assert.deepEqual(r.series.sessions, [{ date: '2026-11-17', value: 5 }]);
  assert.deepEqual(r.series.screenPageViews, [{ date: '2026-11-17', value: 9 }]);
  assert.deepEqual(r.totals, { sessions: 5, activeUsers: 4, screenPageViews: 9 });
  assert.deepEqual(r.previous, { sessions: 2, activeUsers: 2, screenPageViews: 3 });
  assert.deepEqual(r.topPages, [{ path: '/', views: 9 }]);
});

test('parseGAReports with empty reports: totals from series (null if none), previous 0', () => {
  const r = parseGAReports({ days: 30, property: '1', now: new Date(), daily: {}, prior: {}, pages: {} });
  assert.deepEqual(r.series, {});
  assert.deepEqual(r.totals, { sessions: null, activeUsers: null, screenPageViews: null });
  assert.deepEqual(r.previous, { sessions: 0, activeUsers: 0, screenPageViews: 0 });
  assert.deepEqual(r.topPages, []);
});

test('status reflects store', () => {
  const store = newStore();
  assert.deepEqual(service(store).status(), { configured: false, connected: false, propertyID: null, scope: GOOGLE_SCOPE });
  store.setSecret('google.client_id', 'x.apps.googleusercontent.com');
  store.setSecret('google.client_secret', 's');
  store.setSecret('google.refresh_token', 'r');
  store.setSetting('ga4.propertyID', '123456');
  assert.deepEqual(service(store).status(), { configured: true, connected: true, propertyID: '123456', scope: GOOGLE_SCOPE });
});

test('configure saves valid credentials', async () => {
  const store = newStore();
  const status = await service(store, ['abc.apps.googleusercontent.com', 'GOCSPX-x', '123456']).configure();
  assert.equal(status.configured, true);
  assert.equal(status.propertyID, '123456');
  assert.equal(store.getSecret('google.client_secret'), 'GOCSPX-x');
});

test('configure rejects client id without .apps.googleusercontent.com and saves nothing', async () => {
  const store = newStore();
  await assert.rejects(service(store, ['x', 's', '123456']).configure(), { message: 'El ID de cliente debe terminar en .apps.googleusercontent.com. No se guardó nada.' });
  assert.equal(store.getSecret('google.client_id'), null);
  assert.equal(store.getSetting('ga4.propertyID'), null);
});

test('configure rejects G- measurement id as property', async () => {
  const store = newStore();
  await assert.rejects(service(store, ['a.apps.googleusercontent.com', 's', 'G-ABC123']).configure(), /solo números \(no el ID de medición G-…\)/);
  assert.equal(store.getSecret('google.client_id'), null);
});

test('configure keeps stored secret when left empty and clears refresh token when client id changes', async () => {
  const store = newStore();
  await service(store, ['a.apps.googleusercontent.com', 'sec1', '123456']).configure();
  store.setSecret('google.refresh_token', 'r');
  await service(store, ['a.apps.googleusercontent.com', '', '']).configure();
  assert.equal(store.getSecret('google.client_secret'), 'sec1');
  assert.equal(store.getSecret('google.refresh_token'), 'r');
  assert.equal(store.getSetting('ga4.propertyID'), null);
  await service(store, ['b.apps.googleusercontent.com', '', '']).configure();
  assert.equal(store.getSecret('google.refresh_token'), null);
});

test('configure returns status unchanged when cancelled', async () => {
  const store = newStore();
  assert.deepEqual(await service(store, null).configure(), service(store).status());
});

test('connect without credentials asks to configure first', async () => {
  await assert.rejects(service(newStore()).connect(), { message: 'Primero configura el ID y el secreto del cliente OAuth.' });
});

test('fetch without property fails with Spanish message', async () => {
  await assert.rejects(service(newStore()).fetch(30), { message: 'Falta el ID de propiedad GA4.' });
});
