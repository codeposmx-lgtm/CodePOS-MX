const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('../lib/store');

// safeStorage simulado: XOR con un byte (suficiente para comprobar que no hay texto plano en disco).
const fakeSafeStorage = (available = true) => ({
  isEncryptionAvailable: () => available,
  encryptString: s => Buffer.from(Buffer.from(s, 'utf8').map(b => b ^ 0x5a)),
  decryptString: b => Buffer.from(Buffer.from(b).map(x => x ^ 0x5a)).toString('utf8'),
});
const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'codepos-store-'));

test('secret round-trip is encrypted on disk', () => {
  const dir = tempDir();
  const s = createStore({ dir, safeStorage: fakeSafeStorage() });
  s.setSecret('meta.app_secret', 'abcdef0123');
  assert.equal(s.getSecret('meta.app_secret'), 'abcdef0123');
  assert.ok(!fs.readFileSync(path.join(dir, 'secrets.json'), 'utf8').includes('abcdef0123'));
  // Persistente entre instancias.
  assert.equal(createStore({ dir, safeStorage: fakeSafeStorage() }).getSecret('meta.app_secret'), 'abcdef0123');
});

test('deleteSecret removes only that entry', () => {
  const s = createStore({ dir: tempDir(), safeStorage: fakeSafeStorage() });
  s.setSecret('a', '1'); s.setSecret('b', '2');
  s.deleteSecret('a');
  assert.equal(s.getSecret('a'), null);
  assert.equal(s.getSecret('b'), '2');
  s.deleteSecret('missing');
});

test('setSecret throws when encryption unavailable and writes nothing', () => {
  const dir = tempDir();
  const s = createStore({ dir, safeStorage: fakeSafeStorage(false) });
  assert.throws(() => s.setSecret('x', 'y'), /cifrado de Windows no está disponible/);
  assert.ok(!fs.existsSync(path.join(dir, 'secrets.json')));
  assert.equal(s.getSecret('x'), null);
});

test('undecryptable entry reads as null (Review Focus 2)', () => {
  const dir = tempDir();
  createStore({ dir, safeStorage: fakeSafeStorage() }).setSecret('meta.user_token', 'tok');
  const broken = { ...fakeSafeStorage(), decryptString: () => { throw new Error('Error while decrypting'); } };
  assert.equal(createStore({ dir, safeStorage: broken }).getSecret('meta.user_token'), null);
});

test('corrupt secrets.json reads as empty and is rewritten by setSecret', () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, 'secrets.json'), '{no json');
  const s = createStore({ dir, safeStorage: fakeSafeStorage() });
  assert.equal(s.getSecret('a'), null);
  s.setSecret('a', 'b');
  assert.equal(s.getSecret('a'), 'b');
});

test('settings round-trip and remove, stored as plain JSON', () => {
  const dir = tempDir();
  const s = createStore({ dir, safeStorage: fakeSafeStorage() });
  assert.equal(s.getSetting('ga4.propertyID'), null);
  s.setSetting('ga4.propertyID', '123456');
  assert.equal(createStore({ dir, safeStorage: fakeSafeStorage() }).getSetting('ga4.propertyID'), '123456');
  s.removeSetting('ga4.propertyID');
  assert.equal(s.getSetting('ga4.propertyID'), null);
});

test('write failure gives a Spanish AppError without the user path', () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, 'secrets.json')); // un directorio donde debería ir el archivo
  const s = createStore({ dir, safeStorage: fakeSafeStorage() });
  assert.throws(() => s.setSecret('a', 'b'), err => err.name === 'AppError'
    && /^No se pudo guardar en el almacenamiento cifrado de Windows \([A-Z]+\)\.$/.test(err.message)
    && !err.message.includes(dir));
});

test('creates the directory if missing', () => {
  const dir = path.join(tempDir(), 'nested', 'deeper');
  createStore({ dir, safeStorage: fakeSafeStorage() }).setSetting('k', 'v');
  assert.ok(fs.existsSync(path.join(dir, 'settings.json')));
});
