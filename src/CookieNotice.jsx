import { useEffect, useState } from 'react';
import './legal.css';

const CONSENT_COOKIE = 'codepos_cookie_notice';

function hasAcknowledgedNotice() {
  return document.cookie.split(';').some(cookie => cookie.trim().startsWith(`${CONSENT_COOKIE}=1`));
}

export default function CookieNotice() {
  const [open, setOpen] = useState(() => !hasAcknowledgedNotice());

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('codepos:open-cookie-notice', reopen);
    return () => window.removeEventListener('codepos:open-cookie-notice', reopen);
  }, []);

  const acknowledge = () => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CONSENT_COOKIE}=1; Max-Age=15552000; Path=/; SameSite=Lax${secure}`;
    setOpen(false);
  };

  if (!open) return null;

  return <aside className="cookie-notice" aria-label="Aviso de cookies">
    <div className="cookie-notice-copy">
      <strong>Tu privacidad importa</strong>
      <p>Usamos una cookie técnica para recordar que cerraste este aviso. No usamos cookies de analítica ni publicidad. <a href="/legal.html#cookies">Conoce más</a>.</p>
    </div>
    <button type="button" className="cookie-notice-button" onClick={acknowledge}>Entendido</button>
  </aside>;
}
