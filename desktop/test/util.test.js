const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { AppError, errorMessage, formBody, requestJSON } = require('../lib/http');
const { randomURLSafe, sha256URL, hmacHex } = require('../lib/crypto');
const { dayFromGraphEndTime, iso } = require('../lib/dates');

test('errorMessage formats Graph and OAuth errors', () => {
  assert.equal(errorMessage({ error: { message: 'Bad', code: 190 } }), 'Bad (código 190)');
  assert.equal(errorMessage({ error: { message: 'Bad' } }), 'Bad');
  assert.equal(errorMessage({ error: 'invalid_grant', error_description: 'expired' }), 'invalid_grant: expired');
  assert.equal(errorMessage({ error: 'invalid_grant' }), 'invalid_grant');
  assert.equal(errorMessage({ ok: 1 }), null);
  assert.equal(errorMessage(null), null);
});

test('formBody percent-encodes (only alnum and -._~ unescaped)', () => {
  assert.equal(formBody({ a: 'x y/z', b: '~-._' }), 'a=x%20y%2Fz&b=~-._');
  assert.equal(formBody({ c: 'ñ+&=' }), 'c=%C3%B1%2B%26%3D');
});

test('sha256URL matches RFC 7636 example', () => {
  assert.equal(sha256URL('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('hmacHex is HMAC-SHA256 hex', () => {
  assert.equal(hmacHex('key', 'The quick brown fox jumps over the lazy dog'), 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
});

test('randomURLSafe has no padding or unsafe chars', () => {
  assert.match(randomURLSafe(24), /^[A-Za-z0-9_-]{32}$/);
  assert.match(randomURLSafe(), /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(randomURLSafe(), randomURLSafe());
});

test('dayFromGraphEndTime subtracts one day (UTC)', () => {
  assert.equal(dayFromGraphEndTime('2026-11-10T08:00:00+0000'), '2026-11-09');
  assert.equal(dayFromGraphEndTime('2026-03-01T07:00:00+0000'), '2026-02-28');
  assert.equal(dayFromGraphEndTime('nope'), null);
  assert.equal(dayFromGraphEndTime(undefined), null);
});

test('iso formats dates like ISO8601DateFormatter (no millis)', () => {
  assert.equal(iso(new Date('2026-11-18T10:20:30.456Z')), '2026-11-18T10:20:30Z');
});

function serve(handler) {
  return new Promise(resolve => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('requestJSON returns parsed JSON on 2xx and {} for non-JSON', async () => {
  const server = await serve((req, res) => {
    if (req.url === '/text') { res.end('hola'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ method: req.method, auth: req.headers.authorization, body: req.headers['content-type'] }));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.deepEqual(await requestJSON(`${base}/`, { method: 'POST', headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' }, body: '{}' }),
      { method: 'POST', auth: 'Bearer t', body: 'application/json' });
    assert.deepEqual(await requestJSON(`${base}/text`), {});
  } finally { server.close(); }
});

test('requestJSON throws AppError with Graph message on 400', async () => {
  const server = await serve((req, res) => { res.statusCode = 400; res.end(JSON.stringify({ error: { message: 'Bad', code: 1 } })); });
  try {
    await assert.rejects(requestJSON(`http://127.0.0.1:${server.address().port}/x?access_token=SECRET`),
      err => err instanceof AppError && err.message === 'Bad (código 1)');
  } finally { server.close(); }
});

test('requestJSON names only the host on HTTP error without body', async () => {
  const server = await serve((req, res) => { res.statusCode = 503; res.end(''); });
  try {
    await assert.rejects(requestJSON(`http://127.0.0.1:${server.address().port}/path?token=SECRET`),
      err => err instanceof AppError && err.message === 'Error HTTP 503 de 127.0.0.1' && !err.message.includes('SECRET'));
  } finally { server.close(); }
});

test('requestJSON network failure says "Sin conexión con <host>" without URL', async () => {
  await assert.rejects(requestJSON('http://127.0.0.1:1/x?token=SECRET', { timeoutMs: 2000 }),
    err => err instanceof AppError && err.message.startsWith('Sin conexión con 127.0.0.1: ') && !err.message.includes('SECRET'));
});
