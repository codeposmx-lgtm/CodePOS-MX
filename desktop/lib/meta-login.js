'use strict';

const { AppError } = require('./http');
const { randomURLSafe } = require('./crypto');

// Ventana de inicio de sesión de Facebook (flujo manual para apps de escritorio).
// Meta redirige a login_success.html con el token en el fragmento; la app lo captura y lo guarda cifrado.
const REDIRECT_URI = 'https://www.facebook.com/connect/login_success.html';
const ALLOWED_HOSTS = ['facebook.com', 'facebook.net', 'fbcdn.net', 'fbsbx.com', 'meta.com'];
const chromeMajor = (process.versions.chrome || '142').split('.')[0];
const CHROME_UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36`;

function parse(url) {
  try { return new URL(url); } catch { return null; }
}

function isAllowed(url) {
  const u = parse(url);
  if (!u) return false;
  if (u.protocol === 'about:') return true;
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  return ALLOWED_HOSTS.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
}

// Meta puede normalizar la URL final quitando "www". Se acepta únicamente
// el callback oficial exacto en ambos hosts, nunca otros subdominios.
function isRedirect(url) {
  const u = parse(url);
  if (!u || u.protocol !== 'https:') return false;
  return ['facebook.com', 'www.facebook.com'].includes(u.hostname.toLowerCase()) && u.pathname === '/connect/login_success.html';
}

function decode(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

// Devuelve el resultado (token o error) o null si la URL aún no trae ninguno.
function parseRedirect(url, expectedState) {
  const u = parse(url);
  if (!u) return null;
  const params = {};
  for (const part of [u.hash.replace(/^#/, ''), u.search.replace(/^\?/, '')]) {
    for (const pair of part.split('&')) {
      const index = pair.indexOf('=');
      if (index <= 0) continue;
      params[pair.slice(0, index)] = decode(pair.slice(index + 1));
    }
  }
  const error = params.error ?? params.error_reason;
  if (error !== undefined) {
    const denied = error === 'user_denied' || params.error_reason === 'user_denied';
    return {
      kind: 'error',
      message: denied ? 'Cancelaste la autorización en Meta.'
        : `Meta rechazó el inicio de sesión: ${params.error_description !== undefined ? params.error_description.replace(/\+/g, ' ') : error}`,
    };
  }
  if (params.access_token === undefined) return null;
  if (params.state !== expectedState) {
    return { kind: 'error', message: 'Respuesta de Meta no válida (state no coincide). Se descartó el token.' };
  }
  return { kind: 'token', token: params.access_token, expiresIn: Number.parseInt(params.expires_in ?? '', 10) || 0 };
}

function runMetaLogin({ BrowserWindow, session, appID, version, scopes, parent }) {
  return new Promise((resolve, reject) => {
    const state = randomURLSafe(24);
    const auth = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
    Object.entries({
      client_id: appID, redirect_uri: REDIRECT_URI, response_type: 'token',
      scope: scopes.join(','), state, auth_type: 'rerequest',
    }).forEach(([key, value]) => auth.searchParams.set(key, value));

    // Sesión propia, en memoria (sin "persist:"): sin cookies persistentes ni compartidas con el panel.
    const loginSession = session.fromPartition(`meta-login-${randomURLSafe(8)}`, { cache: false });
    loginSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    loginSession.setUserAgent(CHROME_UA);

    const win = new BrowserWindow({
      width: 640, height: 760, parent: parent ?? undefined, show: false, autoHideMenuBar: true,
      title: 'Conectar con Meta · solo lectura de estadísticas',
      webPreferences: { session: loginSession, contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true },
    });
    win.on('page-title-updated', event => event.preventDefault());
    let done = false;

    function finish(error, value) {
      if (done) return;
      done = true;
      if (!win.isDestroyed()) {
        win.webContents.stop();
        win.close();
      }
      if (error) reject(error); else resolve(value);
    }

    // true si la URL traía un resultado y se cerró el flujo.
    function handle(url) {
      if (!isRedirect(url)) return false;
      const result = parseRedirect(url, state);
      if (!result) return false;
      if (result.kind === 'error') finish(new AppError(result.message));
      else finish(null, { token: result.token, expiresIn: result.expiresIn });
      return true;
    }

    const guard = (event, legacyURL) => {
      const url = event?.url ?? legacyURL;
      const isMainFrame = event?.isMainFrame ?? true;
      if (handle(url)) { event.preventDefault(); return; }
      if (isRedirect(url)) return;
      if (isMainFrame ? !isAllowed(url) : !/^(https|about):/i.test(String(url))) event.preventDefault();
    };
    const contents = win.webContents;
    contents.setUserAgent(CHROME_UA);
    contents.on('will-frame-navigate', guard);
    contents.on('will-redirect', guard);
    contents.on('did-navigate', (_event, url) => handle(url));
    contents.on('did-redirect-navigation', (event, url) => handle(event?.url ?? url));
    contents.on('did-navigate-in-page', (_event, url, isMainFrame) => { if (isMainFrame) handle(url); });
    contents.setWindowOpenHandler(({ url }) => {
      if (isAllowed(url)) contents.loadURL(url);
      return { action: 'deny' };
    });
    win.on('closed', () => finish(new AppError('Se cerró la ventana de Meta sin completar la conexión.')));
    win.once('ready-to-show', () => win.show());
    contents.loadURL(auth.toString()).catch(() => { /* las navegaciones canceladas rechazan; el flujo sigue */ });
    win.show();
  });
}

module.exports = { REDIRECT_URI, CHROME_UA, isAllowed, isRedirect, parseRedirect, runMetaLogin };
