const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createManualStore } = require('../lib/manual');

const tempDir = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'codepos-manual-')), 'data');
const FILE = 'manual-metrics.json';

test('load without file returns empty entries', () => {
  assert.deepEqual(createManualStore({ dir: tempDir() }).load(), { entries: [] });
});

test('save normalizes, persists with version 1 and load returns the same', () => {
  const dir = tempDir();
  const store = createManualStore({ dir });
  const result = store.save([
    { channel: 'instagram', date: '2026-11-10', views: 120, reach: null, extra: 'ignored' },
    { channel: 'website', date: '2026-11-12', periodStart: '2026-11-06', sessions: 40, users: 31 },
  ]);
  assert.deepEqual(result.entries, [
    { id: 'website:2026-11-06:2026-11-12', date: '2026-11-12', channel: 'website', periodStart: '2026-11-06',
      views: null, reach: null, interactions: null, newFollowers: null, followers: null, sessions: 40, users: 31, pageViews: null },
    { id: 'instagram:2026-11-10:2026-11-10', date: '2026-11-10', channel: 'instagram',
      views: 120, reach: null, interactions: null, newFollowers: null, followers: null, sessions: null, users: null, pageViews: null },
  ]);
  const onDisk = JSON.parse(fs.readFileSync(path.join(dir, FILE), 'utf8'));
  assert.equal(onDisk.version, 1);
  assert.deepEqual(onDisk.entries, result.entries);
  assert.deepEqual(createManualStore({ dir }).load(), { entries: result.entries });
});

test('same channel and period: the last capture wins', () => {
  const r = createManualStore({ dir: tempDir() }).save([
    { channel: 'facebook', date: '2026-11-01', views: 1 },
    { channel: 'facebook', date: '2026-11-01', views: 2 },
  ]);
  assert.equal(r.entries.length, 1);
  assert.equal(r.entries[0].views, 2);
});

test('same date sorts by channel ascending; dates descending', () => {
  const r = createManualStore({ dir: tempDir() }).save([
    { channel: 'website', date: '2026-11-01', sessions: 1 },
    { channel: 'facebook', date: '2026-11-01', views: 1 },
    { channel: 'instagram', date: '2026-11-03', views: 1 },
  ]);
  assert.deepEqual(r.entries.map(e => `${e.date}/${e.channel}`), ['2026-11-03/instagram', '2026-11-01/facebook', '2026-11-01/website']);
});

test('non-string periodStart is ignored like Swift', () => {
  const r = createManualStore({ dir: tempDir() }).save([{ channel: 'facebook', date: '2026-11-01', periodStart: null, views: 3 }]);
  assert.equal(r.entries[0].id, 'facebook:2026-11-01:2026-11-01');
  assert.equal('periodStart' in r.entries[0], false);
});

test('invalid channel or date is rejected', () => {
  const store = createManualStore({ dir: tempDir() });
  const message = 'Una captura tiene una fecha o canal inválido.';
  assert.throws(() => store.save([{ channel: 'tiktok', date: '2026-11-01', views: 1 }]), { message });
  assert.throws(() => store.save([{ channel: 'facebook', date: '2026-02-30', views: 1 }]), { message });
  assert.throws(() => store.save([{ channel: 'facebook', date: '2026-1-01', views: 1 }]), { message });
  assert.throws(() => store.save([{ channel: 'facebook', views: 1 }]), { message });
});

test('periodStart after date or invalid is rejected', () => {
  const store = createManualStore({ dir: tempDir() });
  const message = 'El inicio del periodo debe ser una fecha válida anterior o igual al final.';
  assert.throws(() => store.save([{ channel: 'facebook', date: '2026-11-01', periodStart: '2026-11-02', views: 1 }]), { message });
  assert.throws(() => store.save([{ channel: 'facebook', date: '2026-11-01', periodStart: '2026-13-01', views: 1 }]), { message });
});

test('metrics must be integers between 0 and 1,000,000,000', () => {
  const store = createManualStore({ dir: tempDir() });
  for (const bad of [-1, 1.5, true, '5', 1_000_000_001, Number.NaN]) {
    assert.throws(() => store.save([{ channel: 'facebook', date: '2026-11-01', views: bad }]),
      { message: 'La métrica views debe ser un entero entre 0 y 1,000,000,000.' }, String(bad));
  }
  assert.equal(store.save([{ channel: 'facebook', date: '2026-11-01', views: 0, reach: 1_000_000_000 }]).entries[0].reach, 1_000_000_000);
});

test('a capture without metrics is rejected', () => {
  assert.throws(() => createManualStore({ dir: tempDir() }).save([{ channel: 'facebook', date: '2026-11-01', views: null }]),
    { message: 'Cada captura debe incluir al menos una métrica.' });
});

test('non-array or more than 1,000 captures is rejected and nothing is written', () => {
  const dir = tempDir();
  const store = createManualStore({ dir });
  const message = 'El archivo debe contener como máximo 1,000 capturas.';
  assert.throws(() => store.save({}), { message });
  assert.throws(() => store.save(Array.from({ length: 1001 }, () => ({ channel: 'facebook', date: '2026-11-01', views: 1 }))), { message });
  assert.equal(fs.existsSync(path.join(dir, FILE)), false);
});

test('an invalid capture leaves the previous file untouched', () => {
  const dir = tempDir();
  const store = createManualStore({ dir });
  store.save([{ channel: 'facebook', date: '2026-11-01', views: 1 }]);
  assert.throws(() => store.save([{ channel: 'facebook', date: 'x', views: 1 }]));
  assert.equal(store.load().entries.length, 1);
});

test('corrupt file gives the Spanish damaged-file error', () => {
  const dir = tempDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, FILE), '{no json');
  assert.throws(() => createManualStore({ dir }).load(), { message: 'El archivo de capturas está dañado y no se pudo leer.' });
  fs.writeFileSync(path.join(dir, FILE), '{"version":1}');
  assert.throws(() => createManualStore({ dir }).load(), { message: 'El archivo de capturas está dañado y no se pudo leer.' });
});
