import { useEffect, useState } from 'react';
import { ANALYTICS_ENABLED, clearAnalyticsCookies, initAnalytics, loadAnalytics, readConsent, saveConsent } from './analytics.js';
import './legal.css';

export default function CookieNotice() {
  const [open, setOpen] = useState(() => readConsent() === null);

  useEffect(() => {
    initAnalytics();
    const reopen = () => setOpen(true);
    window.addEventListener('codepos:open-cookie-notice', reopen);
    return () => window.removeEventListener('codepos:open-cookie-notice', reopen);
  }, []);

  const accept = () => {
    saveConsent('granted');
    loadAnalytics();
    setOpen(false);
  };

  const reject = () => {
    const wasGranted = readConsent() === 'granted';
    saveConsent('denied');
    clearAnalyticsCookies();
    setOpen(false);
    // La etiqueta ya cargada sigue en memoria: recargar la detiene por completo.
    if (wasGranted) window.location.reload();
  };

  if (!open) return null;

  if (!ANALYTICS_ENABLED) {
    return <aside className="cookie-notice" aria-label="Aviso de cookies">
      <div className="cookie-notice-copy">
        <strong>Tu privacidad importa</strong>
        <p>Usamos una cookie técnica para recordar que cerraste este aviso. No usamos cookies de analítica ni publicidad. <a href="/legal.html#cookies">Conoce más</a>.</p>
      </div>
      <button type="button" className="cookie-notice-button" onClick={reject}>Entendido</button>
    </aside>;
  }

  return <aside className="cookie-notice" aria-label="Aviso de cookies">
    <div className="cookie-notice-copy">
      <strong>Tu privacidad importa</strong>
      <p>Con tu permiso usamos Google Analytics para saber cuántas personas visitan el sitio y qué páginas les sirven. No usamos cookies de publicidad. <a href="/legal.html#cookies">Conoce más</a>.</p>
    </div>
    <div className="cookie-notice-actions">
      <button type="button" className="cookie-notice-button cookie-notice-button-secondary" onClick={reject}>Rechazar</button>
      <button type="button" className="cookie-notice-button" onClick={accept}>Aceptar</button>
    </div>
  </aside>;
}
