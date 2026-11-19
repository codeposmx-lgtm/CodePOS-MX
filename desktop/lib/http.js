'use strict';

// Error con mensaje en español. Nunca incluye URLs ni tokens.
class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppError';
  }
}

function hostOf(url) {
  try { return new URL(url).hostname || 'el servicio'; } catch { return 'el servicio'; }
}

function errorMessage(object) {
  if (!object || typeof object !== 'object') return null;
  const { error } = object;
  if (error && typeof error === 'object') {
    const message = typeof error.message === 'string' ? error.message : 'Error desconocido';
    return error.code !== undefined && error.code !== null ? `${message} (código ${error.code})` : message;
  }
  if (typeof error === 'string') {
    return typeof object.error_description === 'string' ? `${error}: ${object.error_description}` : error;
  }
  return null;
}

// Petición sin caché. Devuelve el JSON (o {} si el cuerpo no es JSON).
async function requestJSON(url, { method = 'GET', headers = {}, body, timeoutMs = 30000 } = {}) {
  const host = hostOf(url);
  let response;
  let text;
  try {
    response = await fetch(url, { method, headers, body, cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
    text = await response.text();
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? 'tiempo de espera agotado' : (error?.cause?.code || error?.message || 'error de red');
    throw new AppError(`Sin conexión con ${host}: ${reason}`);
  }
  let object = {};
  try { object = text ? JSON.parse(text) : {}; } catch { object = {}; }
  if (object === null || typeof object !== 'object') object = {};
  if (response.status < 200 || response.status >= 300) {
    throw new AppError(errorMessage(object) ?? `Error HTTP ${response.status} de ${host}`);
  }
  return object;
}

function encode(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function formBody(params) {
  return Object.entries(params).map(([key, value]) => `${encode(key)}=${encode(value ?? '')}`).join('&');
}

module.exports = { AppError, errorMessage, requestJSON, formBody };
