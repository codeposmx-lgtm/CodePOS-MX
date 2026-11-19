'use strict';

const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { AppError } = require('./http');

const norm = p => path.resolve(p).toLowerCase();

// Solo se aceptan mensajes del documento principal empaquetado en la app.
function isAuthorizedSender(frameURL, isMainFrame, dashboardRoot) {
  if (!isMainFrame || typeof frameURL !== 'string') return false;
  let filePath;
  try {
    const url = new URL(frameURL);
    if (url.protocol !== 'file:') return false;
    filePath = fileURLToPath(url);
  } catch {
    return false;
  }
  return norm(filePath).startsWith(norm(dashboardRoot) + path.sep);
}

// Solo enlaces de publicaciones en Facebook/Instagram, abiertos en el navegador del sistema.
// Devuelve la URL normalizada (la que se validó) o null.
function allowedExternalURL(link) {
  let url;
  try { url = new URL(String(link)); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  return ['facebook.com', 'instagram.com'].some(allowed => host === allowed || host.endsWith(`.${allowed}`)) ? url.href : null;
}
const isAllowedExternal = link => allowedExternalURL(link) !== null;

function createHandler({ meta, google, openExternal, getWindow }) {
  return async function handle(action, body = {}) {
    const days = Number.isFinite(Number(body.days)) && body.days !== undefined && body.days !== null ? Math.trunc(Number(body.days)) : 30;
    switch (action) {
      case 'status': return { native: true, meta: meta.status(), google: google.status() };
      case 'meta.connect': return meta.connect(getWindow());
      case 'meta.setSecret': return meta.setAppSecret();
      case 'meta.clearSecret': return meta.clearAppSecret();
      case 'meta.disconnect': return meta.disconnect();
      case 'meta.selectPage': return meta.selectPage(typeof body.pageID === 'string' ? body.pageID : '');
      case 'meta.fetch': return meta.fetch(days);
      case 'google.configure': return google.configure();
      case 'google.connect': return google.connect();
      case 'google.disconnect': return google.disconnect();
      case 'google.fetch': return google.fetch(days);
      case 'openExternal': {
        const href = allowedExternalURL(body.url);
        if (href) await openExternal(href);
        return true;
      }
      default:
        throw new AppError('Acción desconocida.');
    }
  };
}

module.exports = { isAuthorizedSender, isAllowedExternal, createHandler };
