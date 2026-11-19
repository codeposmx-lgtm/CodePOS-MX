'use strict';

const http = require('node:http');
const { AppError, requestJSON, formBody } = require('./http');
const { randomURLSafe, sha256URL } = require('./crypto');
const { iso } = require('./dates');

// Lectura de informes de Google Analytics 4 (Data API) con el alcance analytics.readonly.
// OAuth para app instalada: navegador del sistema + retorno a 127.0.0.1 + PKCE.
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const CLIENT_ID = 'google.client_id';
const CLIENT_SECRET = 'google.client_secret';
const REFRESH = 'google.refresh_token';
const PROPERTY_KEY = 'ga4.propertyID';
const METRIC_NAMES = ['sessions', 'activeUsers', 'screenPageViews'];

const SUCCESS_HTML = '<!doctype html><meta charset=utf-8><title>CodePOS MX</title><body style="font-family:system-ui,sans-serif;padding:40px"><h2>Autorización recibida</h2><p>Puedes cerrar esta pestaña y volver al panel de CodePOS MX.</p></body>';

// Servidor mínimo en 127.0.0.1 (puerto aleatorio) que recibe un único retorno de OAuth.
function createLoopbackReceiver() {
  let server = null;
  let pending = null;
  let waiter = null;

  function deliver(params) {
    if (waiter) { const w = waiter; waiter = null; clearTimeout(w.timer); w.resolve(params); } else { pending = params; }
  }

  return {
    start() {
      return new Promise((resolve, reject) => {
        server = http.createServer((req, res) => {
          let url;
          try { url = new URL(req.url, 'http://127.0.0.1'); } catch { url = null; }
          const params = url ? Object.fromEntries(url.searchParams) : {};
          const respond = (status, body) => {
            res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(body), Connection: 'close', 'Cache-Control': 'no-store' });
            res.end(body);
          };
          if (!url || url.pathname !== '/' || Object.keys(params).length === 0) { respond(404, ''); return; }
          respond(200, SUCCESS_HTML);
          deliver(params);
        });
        server.once('error', error => reject(new AppError(`No se pudo abrir el puerto local: ${error.message}`)));
        server.listen(0, '127.0.0.1', () => resolve(server.address().port));
      });
    },
    address() { return server?.address() ?? null; },
    waitForCallback(timeoutMs) {
      if (pending) { const p = pending; pending = null; return Promise.resolve(p); }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (waiter?.timer !== timer) return;
          waiter = null;
          reject(new AppError('Tiempo agotado esperando la autorización de Google.'));
        }, timeoutMs);
        waiter = { resolve, timer };
      });
    },
    stop() {
      if (waiter) { clearTimeout(waiter.timer); waiter = null; }
      if (server) { server.close(); server.closeAllConnections?.(); server = null; }
    },
  };
}

const metricValues = row => (Array.isArray(row?.metricValues) ? row.metricValues : []).map(v => Number(v?.value) || 0);

function parseGAReports({ daily, prior, pages, days, property, now }) {
  const series = {};
  for (const row of Array.isArray(daily?.rows) ? daily.rows : []) {
    const raw = row?.dimensionValues?.[0]?.value ?? '';
    if (typeof raw !== 'string' || raw.length !== 8) continue;
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    metricValues(row).forEach((value, index) => {
      if (index >= METRIC_NAMES.length) return;
      (series[METRIC_NAMES[index]] ??= []).push({ date, value });
    });
  }
  const totalValues = metricValues(daily?.totals?.[0]);
  const priorValues = metricValues(prior?.rows?.[0]);
  const totals = {};
  const previous = {};
  METRIC_NAMES.forEach((name, index) => {
    totals[name] = index < totalValues.length ? totalValues[index]
      : (series[name] ? series[name].reduce((sum, point) => sum + point.value, 0) : null);
    previous[name] = index < priorValues.length ? priorValues[index] : 0;
  });
  const topPages = (Array.isArray(pages?.rows) ? pages.rows : []).map(row => ({
    path: row?.dimensionValues?.[0]?.value ?? '',
    views: metricValues(row)[0] ?? 0,
  }));
  return { verifiedAt: iso(now), days, propertyID: property, totals, previous, series, topPages };
}

function createGoogleService({ store, ask, openExternal, focus }) {
  let accessToken = null; // { token, expires: ms } solo en memoria

  const propertyID = () => store.getSetting(PROPERTY_KEY);

  function status() {
    return {
      configured: store.getSecret(CLIENT_ID) !== null && store.getSecret(CLIENT_SECRET) !== null,
      connected: store.getSecret(REFRESH) !== null,
      propertyID: propertyID(),
      scope: GOOGLE_SCOPE,
    };
  }

  async function configure() {
    const values = await ask({
      title: 'Configurar Google Analytics 4',
      message: 'Crea en Google Cloud un ID de cliente OAuth de tipo «App de escritorio» y habilita la Google Analytics Data API. El ID y el secreto se guardan solo en el almacenamiento cifrado de Windows de este usuario. El ID de propiedad GA4 (solo números) está en Analytics › Administrar › Detalles de la propiedad.',
      fields: [
        { label: 'ID de cliente OAuth', placeholder: '…apps.googleusercontent.com', secure: false, initial: store.getSecret(CLIENT_ID) ?? '' },
        { label: 'Secreto del cliente', placeholder: store.getSecret(CLIENT_SECRET) === null ? 'GOCSPX-…' : 'Guardado (déjalo vacío para conservarlo)', secure: true, initial: '' },
        { label: 'ID de propiedad GA4', placeholder: '123456789', secure: false, initial: propertyID() ?? '' },
      ],
    });
    if (!values) return status();
    const [clientID, secret, property] = values;
    if (!clientID.endsWith('.apps.googleusercontent.com')) throw new AppError('El ID de cliente debe terminar en .apps.googleusercontent.com. No se guardó nada.');
    if (property !== '' && !/^[0-9]{5,15}$/.test(property)) {
      throw new AppError('El ID de propiedad GA4 debe ser solo números (no el ID de medición G-…). No se guardó nada.');
    }
    if (clientID !== store.getSecret(CLIENT_ID)) { store.deleteSecret(REFRESH); accessToken = null; }
    store.setSecret(CLIENT_ID, clientID);
    if (secret !== '') store.setSecret(CLIENT_SECRET, secret);
    if (property === '') store.removeSetting(PROPERTY_KEY); else store.setSetting(PROPERTY_KEY, property);
    return status();
  }

  async function connect() {
    const clientID = store.getSecret(CLIENT_ID);
    const secret = store.getSecret(CLIENT_SECRET);
    if (clientID === null || secret === null) throw new AppError('Primero configura el ID y el secreto del cliente OAuth.');
    const verifier = randomURLSafe(48);
    const state = randomURLSafe(24);
    const receiver = createLoopbackReceiver();
    try {
      const port = await receiver.start();
      const redirectURI = `http://127.0.0.1:${port}`;
      const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      Object.entries({
        client_id: clientID, redirect_uri: redirectURI, response_type: 'code', scope: GOOGLE_SCOPE,
        code_challenge: sha256URL(verifier), code_challenge_method: 'S256', state,
        access_type: 'offline', prompt: 'consent',
      }).forEach(([key, value]) => auth.searchParams.set(key, value));
      await openExternal(auth.toString());

      const params = await receiver.waitForCallback(300_000);
      if (params.error) throw new AppError(params.error === 'access_denied' ? 'Cancelaste la autorización en Google.' : `Google rechazó la autorización: ${params.error}`);
      if (params.state !== state || !params.code) throw new AppError('Respuesta de Google no válida (state no coincide).');

      const response = await requestJSON('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody({ code: params.code, client_id: clientID, client_secret: secret, redirect_uri: redirectURI, grant_type: 'authorization_code', code_verifier: verifier }),
      });
      if (typeof response.refresh_token !== 'string') throw new AppError('Google no devolvió un token de actualización.');
      const granted = String(response.scope ?? '').split(' ');
      if (!granted.includes(GOOGLE_SCOPE)) throw new AppError('No se concedió el permiso de solo lectura de Analytics.');
      store.setSecret(REFRESH, response.refresh_token);
      if (typeof response.access_token === 'string') {
        accessToken = { token: response.access_token, expires: Date.now() + ((Number(response.expires_in) || 3000) - 60) * 1000 };
      }
      return status();
    } finally {
      receiver.stop();
      try { focus(); } catch { /* sin ventana */ }
    }
  }

  async function disconnect() {
    const refresh = store.getSecret(REFRESH);
    if (refresh !== null) {
      try {
        await requestJSON('https://oauth2.googleapis.com/revoke', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formBody({ token: refresh }),
        });
      } catch { /* se borra igualmente */ }
    }
    store.deleteSecret(REFRESH);
    accessToken = null;
    return status();
  }

  async function currentAccessToken() {
    if (accessToken && accessToken.expires > Date.now()) return accessToken.token;
    const refresh = store.getSecret(REFRESH);
    const clientID = store.getSecret(CLIENT_ID);
    const secret = store.getSecret(CLIENT_SECRET);
    if (refresh === null || clientID === null || secret === null) throw new AppError('Google Analytics no está conectado.');
    try {
      const response = await requestJSON('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody({ refresh_token: refresh, client_id: clientID, client_secret: secret, grant_type: 'refresh_token' }),
      });
      if (typeof response.access_token !== 'string') throw new AppError('Google no devolvió un token de acceso.');
      accessToken = { token: response.access_token, expires: Date.now() + ((Number(response.expires_in) || 3000) - 60) * 1000 };
      return accessToken.token;
    } catch (error) {
      if (error instanceof AppError && error.message.includes('invalid_grant')) {
        store.deleteSecret(REFRESH);
        throw new AppError('La autorización de Google caducó o fue revocada. Vuelve a conectar.');
      }
      throw error;
    }
  }

  function runReport(body, property, token) {
    return requestJSON(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async function fetchReports(requestedDays) {
    const property = propertyID();
    if (property === null) throw new AppError('Falta el ID de propiedad GA4.');
    const token = await currentAccessToken();
    const days = Math.max(1, Math.min(Math.trunc(Number(requestedDays) || 30), 90));
    const metrics = METRIC_NAMES.map(name => ({ name }));
    const current = { startDate: `${days - 1}daysAgo`, endDate: 'today' };
    const previous = { startDate: `${2 * days - 1}daysAgo`, endDate: `${days}daysAgo` };

    const daily = await runReport({
      dateRanges: [current], dimensions: [{ name: 'date' }], metrics,
      orderBys: [{ dimension: { dimensionName: 'date' } }], keepEmptyRows: true, metricAggregations: ['TOTAL'],
    }, property, token);
    const prior = await runReport({ dateRanges: [previous], metrics }, property, token);
    const pages = await runReport({
      dateRanges: [current], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 5,
    }, property, token);
    return parseGAReports({ daily, prior, pages, days, property, now: new Date() });
  }

  return { status, configure, connect, disconnect, fetch: fetchReports };
}

module.exports = { GOOGLE_SCOPE, createLoopbackReceiver, parseGAReports, createGoogleService };
