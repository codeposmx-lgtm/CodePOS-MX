const test = require('node:test');
const assert = require('node:assert/strict');
const { isAuthorizedSender, createHandler, isAllowedExternal } = require('../lib/bridge');

const root = 'C:\\App\\resources\\Dashboard';

test('isAuthorizedSender: only main frame inside dashboard root (Review Focus 1)', () => {
  assert.ok(isAuthorizedSender('file:///C:/App/resources/Dashboard/index.html', true, root));
  assert.ok(isAuthorizedSender('file:///c:/app/RESOURCES/dashboard/index.html', true, root));
  assert.ok(!isAuthorizedSender('file:///C:/App/resources/Dashboard/index.html', false, root));
  assert.ok(!isAuthorizedSender('file:///C:/App/resources/DashboardEvil/index.html', true, root));
  assert.ok(!isAuthorizedSender('file:///C:/App/resources/Dashboard/../secrets.html', true, root));
  assert.ok(!isAuthorizedSender('https://facebook.com/', true, root));
  assert.ok(!isAuthorizedSender('', true, root));
  assert.ok(!isAuthorizedSender(undefined, true, root));
});

test('isAllowedExternal only https facebook/instagram', () => {
  assert.ok(isAllowedExternal('https://www.instagram.com/p/x'));
  assert.ok(isAllowedExternal('https://facebook.com/123'));
  assert.ok(!isAllowedExternal('http://facebook.com/'));
  assert.ok(!isAllowedExternal('https://evil.com/'));
  assert.ok(!isAllowedExternal('https://instagram.com.evil.com/'));
  assert.ok(!isAllowedExternal('javascript:alert(1)'));
});

function handlerWith(log = []) {
  const meta = {
    status: () => ({ m: 1 }),
    connect: async parent => { log.push(['meta.connect', parent]); return 'mc'; },
    setAppSecret: async () => 'ms', clearAppSecret: () => 'mcs', disconnect: async () => 'md',
    selectPage: id => { log.push(['meta.selectPage', id]); return 'mp'; },
    fetch: async days => { log.push(['meta.fetch', days]); return 'mf'; },
  };
  const google = {
    status: () => ({ g: 1 }), configure: async () => 'gc', connect: async () => 'gco', disconnect: async () => 'gd',
    fetch: async days => { log.push(['google.fetch', days]); return 'gf'; },
  };
  return createHandler({ meta, google, openExternal: url => log.push(['open', url]), getWindow: () => 'WIN' });
}

test('status shape', async () => {
  assert.deepEqual(await handlerWith()('status', {}), { native: true, meta: { m: 1 }, google: { g: 1 } });
});

test('routes actions and defaults days to 30', async () => {
  const log = [];
  const handle = handlerWith(log);
  assert.equal(await handle('meta.connect', {}), 'mc');
  assert.equal(await handle('meta.fetch', {}), 'mf');
  assert.equal(await handle('google.fetch', { days: 7 }), 'gf');
  assert.equal(await handle('meta.selectPage', { pageID: '42' }), 'mp');
  assert.equal(await handle('meta.selectPage', {}), 'mp');
  assert.equal(await handle('google.configure', {}), 'gc');
  assert.deepEqual(log, [['meta.connect', 'WIN'], ['meta.fetch', 30], ['google.fetch', 7], ['meta.selectPage', '42'], ['meta.selectPage', '']]);
});

test('openExternal only opens https facebook/instagram and always returns true', async () => {
  const log = [];
  const handle = handlerWith(log);
  assert.equal(await handle('openExternal', { url: 'http://facebook.com/' }), true);
  assert.equal(await handle('openExternal', { url: 'https://evil.com/' }), true);
  assert.equal(await handle('openExternal', { url: 'https://www.instagram.com/p/x' }), true);
  assert.deepEqual(log, [['open', 'https://www.instagram.com/p/x']]);
});

test('openExternal opens the normalized parsed URL, not the raw string', async () => {
  const log = [];
  await handlerWith(log)('openExternal', { url: '  https://www.instagram.com/p/x  ' });
  assert.deepEqual(log, [['open', 'https://www.instagram.com/p/x']]);
});

test('unknown action rejects', async () => {
  await assert.rejects(handlerWith()('foo', {}), { message: 'Acción desconocida.' });
});
