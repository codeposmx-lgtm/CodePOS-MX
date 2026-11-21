// Google Analytics 4 con consentimiento previo.
// La etiqueta solo se carga si el visitante pulsa «Aceptar» en el aviso de cookies.
//
// Pega aquí el ID de medición de tu flujo web (Analytics › Administrar › Flujos de datos › Web).
// Tiene la forma G-XXXXXXXXXX. NO es el ID de propiedad numérico (ese va en la app del panel).
// Mientras esté vacío, el sitio no carga Analytics y el aviso muestra solo la cookie técnica.
export const GA_MEASUREMENT_ID = 'G-FZH9WM5LJJ';

export const ANALYTICS_ENABLED = /^G-[A-Z0-9]{4,20}$/.test(GA_MEASUREMENT_ID);

const CONSENT_COOKIE = 'codepos_cookie_notice';
const MAX_AGE = 15552000; // 180 días

// 'granted' | 'denied' | null (sin decidir). El valor antiguo «1» (solo aviso) cuenta como sin decidir
// cuando Analytics está activo, para que nadie quede medido sin haber aceptado.
export function readConsent() {
  const entry = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(`${CONSENT_COOKIE}=`));
  const value = entry ? entry.slice(CONSENT_COOKIE.length + 1) : null;
  if (value === 'granted' || value === 'denied') return value;
  if (value === '1') return ANALYTICS_ENABLED ? null : 'denied';
  return null;
}

export function saveConsent(value) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

let loaded = false;

export function loadAnalytics() {
  if (!ANALYTICS_ENABLED || loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

// Borra las cookies _ga / _ga_<ID> en el host y en sus dominios padre.
export function clearAnalyticsCookies() {
  const names = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => n === '_ga' || n.startsWith('_ga_'));
  const parts = window.location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i += 1) domains.push(`; Domain=.${parts.slice(i).join('.')}`);
  for (const name of names) {
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
  }
}

// Al cargar cada página: si ya aceptó antes, se activa Analytics.
export function initAnalytics() {
  if (readConsent() === 'granted') loadAnalytics();
}
