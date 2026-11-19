import { useCallback, useEffect, useMemo, useState } from 'react';

// Este panel no accede a la red (CSP connect-src 'none'). Todas las consultas pasan por la app
// nativa de Windows, que guarda las credenciales cifradas y solo devuelve cifras agregadas.
const bridge = () => window.codepos;
async function callNative(action, payload = {}) {
  const handler = bridge();
  if (!handler) throw new Error('Disponible solo dentro de la app CodePOS MX Dashboard para Windows.');
  return handler.call(action, payload);
}

const ranges = [{ label: '7 días', days: 7 }, { label: '30 días', days: 30 }, { label: '90 días', days: 90 }];
const channels = [
  { key: 'website', name: 'Sitio web', handle: 'codeposmx.vercel.app · GA4', icon: '↗', theme: 'web' },
  { key: 'instagram', name: 'Instagram', handle: '@codeposmx', icon: '◎', theme: 'instagram' },
  { key: 'facebook', name: 'Facebook', handle: 'CodePOS MX', icon: 'f', theme: 'facebook' },
];
const seriesColors = ['#2679f5', '#9a79e4', '#ec8ba5'];
const metaPermissions = [
  ['pages_show_list', 'Ver la lista de páginas que administras para elegir CodePOS MX.'],
  ['pages_read_engagement', 'Leer datos, publicaciones y seguidores de la página.'],
  ['read_insights', 'Leer las estadísticas (Insights) de la página.'],
  ['instagram_basic', 'Leer perfil y publicaciones de la cuenta profesional vinculada.'],
  ['instagram_manage_insights', 'Leer estadísticas de Instagram. A pesar del nombre, no permite publicar ni modificar.'],
];

const numberFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
const fmt = value => (value === null || value === undefined || Number.isNaN(value) ? '—' : numberFormat.format(value));
const num = value => (typeof value === 'number' && !Number.isNaN(value) ? value : null);
const sumKnown = (...values) => { const known = values.map(num).filter(value => value !== null); return known.length ? known.reduce((a, b) => a + b, 0) : null; };
const change = (current, previous) => { const c = num(current); const p = num(previous); if (c === null || p === null || p === 0) return null; return ((c - p) / p) * 100; };
const timeText = iso => (iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const dayLabel = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function BrandMark() {
  return <span className="analytics-brand-mark" aria-hidden="true"><span>‹</span><i>/</i><span>›</span></span>;
}

function TrendChart({ series }) {
  const visible = series.filter(item => item.points?.length);
  const dates = [...new Set(visible.flatMap(item => item.points.map(point => point.date)))].sort();
  if (!dates.length) return <div className="analytics-chart empty-chart">Sin datos verificados para este periodo.</div>;
  const max = Math.max(1, ...visible.flatMap(item => item.points.map(point => point.value)));
  const x = date => (dates.length === 1 ? 380 : (dates.indexOf(date) / (dates.length - 1)) * 760);
  const y = value => 180 - (value / max) * 160;
  const ticks = [1, 0.75, 0.5, 0.25, 0].map(f => fmt(max * f));
  const labelEvery = Math.max(1, Math.ceil(dates.length / 7));
  const labels = dates.filter((_, index) => index % labelEvery === 0);
  return <div className="analytics-chart" role="img" aria-label={`Gráfica de ${visible.map(item => item.name).join(', ')}`}>
    <div className="chart-y-labels">{ticks.map((tick, index) => <span key={index}>{tick}</span>)}</div>
    <svg viewBox="0 0 760 190" preserveAspectRatio="none" aria-hidden="true">
      {[20, 60, 100, 140, 180].map(line => <line key={line} x1="0" y1={line} x2="760" y2={line} className="chart-grid-line" />)}
      {visible.map(item => <polyline key={item.name} points={item.points.map(point => `${x(point.date)},${y(point.value)}`).join(' ')} className="chart-line" style={{ stroke: item.color }} />)}
    </svg>
    <div className="chart-x-labels">{labels.map(date => <span key={date}>{dayLabel(date)}</span>)}</div>
  </div>;
}

function StatCard({ label, value, delta, note, icon, color }) {
  return <article className="analytics-stat-card">
    <div className="stat-topline"><span>{label}</span><span className={`stat-icon ${color}`}>{icon}</span></div>
    <strong className="stat-value">{fmt(value)}</strong>
    <div className="stat-foot">{delta !== null && delta !== undefined && <span className={delta >= 0 ? 'stat-growth' : 'stat-decline'}>{delta >= 0 ? '↗' : '↘'} {Math.abs(delta).toFixed(1)}%</span>}<span>{note}</span></div>
  </article>;
}

function ConnectionModal({ channelKey, native, status, metaData, busy, onAction, onClose }) {
  if (!channelKey) return null;
  const channel = channels.find(item => item.key === channelKey);
  const isMeta = channelKey !== 'website';
  const meta = status?.meta ?? {};
  const google = status?.google ?? {};
  const permissions = meta.permissions ?? metaData?.permissions;
  return <div className="analytics-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="analytics-modal analytics-modal-wide" role="dialog" aria-modal="true" aria-labelledby="integration-title">
      <button className="modal-close" onClick={onClose} type="button" aria-label="Cerrar">×</button>
      <span className={`channel-icon ${channel.theme}`}>{channel.icon}</span>
      <span className="analytics-kicker">CONEXIÓN DE SOLO LECTURA</span>
      <h2 id="integration-title">{isMeta ? 'Facebook e Instagram (Meta)' : 'Sitio web (Google Analytics 4)'}</h2>
      {!native && <p>Las conexiones solo funcionan dentro de la app <b>CodePOS MX Dashboard</b> para Windows. En este navegador no se guardan ni usan credenciales.</p>}
      {isMeta ? <>
        <p>Inicias sesión en la ventana oficial de Meta. El token se guarda cifrado en esta PC (Windows) y nunca llega al panel. App: CodePOS MX Analytics ({meta.appID ?? '4913773975558748'}), Graph API {meta.graphVersion ?? 'v26.0'}.</p>
        <div className="integration-checklist"><strong>Permisos que se solicitan (solo lectura)</strong>{metaPermissions.map(([name, text]) => {
          const state = permissions ? (permissions.granted?.includes(name) ? 'ok' : 'missing') : 'pending';
          return <div key={name}><span className={`perm-${state}`}>{state === 'ok' ? '✓' : state === 'missing' ? '!' : '·'}</span><span><code>{name}</code> — {text}</span></div>;
        })}<div><span>✕</span><span>No se solicitan permisos para publicar, enviar mensajes ni administrar anuncios.</span></div></div>
        {permissions?.unexpected?.length > 0 && <p className="modal-warning">Permisos adicionales concedidos que el panel no usa: {permissions.unexpected.join(', ')}. Puedes retirarlos en Facebook › Configuración › Integraciones comerciales.</p>}
        {meta.notes?.map(note => <p className="modal-note" key={note}>{note}</p>)}
        <p className="modal-state">Estado: {meta.connected ? `conectado · token ${meta.longLived ? 'de larga duración' : 'de corta duración'} · caduca: ${meta.expiresAt === 'sin caducidad' ? 'sin caducidad' : timeText(meta.expiresAt)}` : meta.expired ? 'el token caducó, vuelve a conectar' : 'sin conectar'} · App Secret guardado: {meta.hasAppSecret ? 'sí' : 'no'}</p>
        {metaData?.pages?.length > 1 && <label className="page-select">Página a analizar
          <select value={metaData.facebook?.id ?? ''} onChange={event => onAction('meta.selectPage', { pageID: event.target.value }, true)}>{metaData.pages.map(page => <option key={page.id} value={page.id}>{page.name}</option>)}</select></label>}
        <div className="modal-actions">
          <button type="button" className="analytics-button analytics-button-primary" disabled={!native || busy} onClick={() => onAction('meta.connect', {}, true)}>{meta.connected ? 'Volver a autorizar' : 'Conectar con Meta'}</button>
          <button type="button" className="analytics-button analytics-button-secondary" disabled={!native || busy} onClick={() => onAction('meta.setSecret', {}, true)}>App Secret → Windows</button>
          {meta.hasAppSecret && <button type="button" className="analytics-button analytics-button-secondary" disabled={busy} onClick={() => onAction('meta.clearSecret')}>Quitar App Secret</button>}
          {meta.connected && <button type="button" className="analytics-button analytics-button-danger" disabled={busy} onClick={() => onAction('meta.disconnect')}>Desconectar y revocar</button>}
        </div>
      </> : <>
        <p>El sitio todavía no tiene Google Analytics instalado; sin eso no hay visitas que leer. La conexión usa OAuth en tu navegador con el permiso <code>analytics.readonly</code>.</p>
        <div className="integration-checklist"><strong>Qué se necesita</strong>
          <div><span>01</span>Crear una propiedad GA4 para codeposmx.vercel.app e instalar su etiqueta (requiere actualizar el aviso de cookies y privacidad).</div>
          <div><span>02</span>En Google Cloud: habilitar «Google Analytics Data API» y crear un ID de cliente OAuth de tipo «App de escritorio».</div>
          <div><span>03</span>Configurar aquí el ID de cliente, su secreto y el ID numérico de la propiedad (se guardan cifrados en Windows).</div>
          <div><span>04</span>Conectar con Google y autorizar solo lectura de Analytics.</div>
        </div>
        <p className="modal-state">Estado: credenciales {google.configured ? 'configuradas' : 'pendientes'} · {google.connected ? 'autorizado' : 'sin autorizar'} · propiedad: {google.propertyID ?? 'pendiente'}</p>
        <div className="modal-actions">
          <button type="button" className="analytics-button analytics-button-secondary" disabled={!native || busy} onClick={() => onAction('google.configure')}>Configurar credenciales</button>
          <button type="button" className="analytics-button analytics-button-primary" disabled={!native || busy || !google.configured} onClick={() => onAction('google.connect', {}, true)}>{google.connected ? 'Volver a autorizar' : 'Conectar con Google'}</button>
          {google.connected && <button type="button" className="analytics-button analytics-button-danger" disabled={busy} onClick={() => onAction('google.disconnect')}>Desconectar y revocar</button>}
        </div>
      </>}
      <p className="modal-security-note"><span>◈</span> Nunca escribas contraseñas ni tokens en el panel. Las credenciales solo se capturan en ventanas nativas o en las páginas oficiales de Meta y Google.</p>
    </section>
  </div>;
}

export default function AnalyticsDashboard() {
  const [activeChannel, setActiveChannel] = useState('overview');
  const [range, setRange] = useState(ranges[1]);
  const [modalChannel, setModalChannel] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [native, setNative] = useState(() => Boolean(bridge()));
  const [status, setStatus] = useState(null);
  const [metaData, setMetaData] = useState(null);
  const [gaData, setGaData] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!bridge()) { setNative(false); return null; }
    const next = await callNative('status');
    setNative(true);
    setStatus(next);
    return next;
  }, []);

  const refresh = useCallback(async (current, days) => {
    if (!current) return;
    setBusy(true);
    const nextErrors = {};
    await Promise.all([
      current.meta?.connected ? callNative('meta.fetch', { days }).then(setMetaData).catch(error => { setMetaData(null); nextErrors.meta = error.message; }) : Promise.resolve(setMetaData(null)),
      current.google?.connected && current.google?.propertyID ? callNative('google.fetch', { days }).then(setGaData).catch(error => { setGaData(null); nextErrors.google = error.message; }) : Promise.resolve(setGaData(null)),
    ]);
    setErrors(nextErrors);
    setBusy(false);
  }, []);

  useEffect(() => { loadStatus().then(current => refresh(current, range.days)).catch(error => setErrors({ app: error.message })); }, [loadStatus, refresh, range.days]);

  const onAction = useCallback(async (action, payload = {}, refetch = false) => {
    setBusy(true);
    try {
      const result = await callNative(action, payload);
      const current = await loadStatus();
      if (action.startsWith('meta.') && result && typeof result === 'object') setStatus(previous => ({ ...previous, meta: { ...previous?.meta, ...result } }));
      setErrors(previous => ({ ...previous, action: undefined }));
      setBusy(false);
      if (refetch || action.endsWith('disconnect')) await refresh(current, range.days);
    } catch (error) {
      setErrors(previous => ({ ...previous, action: error.message }));
      setBusy(false);
    }
  }, [loadStatus, refresh, range.days]);

  const fb = metaData?.facebook;
  const ig = metaData?.instagram;
  const ga = gaData;
  const verified = { website: Boolean(ga), instagram: Boolean(ig?.totals), facebook: Boolean(fb?.totals) };
  const channelState = key => {
    if (verified[key]) return { text: 'Verificado', className: 'verified' };
    if (key === 'website') return status?.google?.connected ? { text: 'Autorizado', className: '' } : { text: 'Sin conectar', className: '' };
    if (status?.meta?.connected) return { text: errors.meta ? 'Error' : 'Autorizado', className: '' };
    return { text: status?.meta?.expired ? 'Caducado' : 'Sin conectar', className: '' };
  };

  const active = channels.find(channel => channel.key === activeChannel);
  const title = useMemo(() => (active ? active.name : 'Resumen general'), [active]);

  const stats = activeChannel === 'website' ? [
    { label: 'Sesiones', value: num(ga?.totals?.sessions), delta: change(ga?.totals?.sessions, ga?.previous?.sessions), note: 'vs. periodo anterior', icon: '↗', color: 'blue' },
    { label: 'Usuarios activos', value: num(ga?.totals?.activeUsers), delta: change(ga?.totals?.activeUsers, ga?.previous?.activeUsers), note: 'vs. periodo anterior', icon: '◎', color: 'violet' },
    { label: 'Páginas vistas', value: num(ga?.totals?.screenPageViews), delta: change(ga?.totals?.screenPageViews, ga?.previous?.screenPageViews), note: 'vs. periodo anterior', icon: '▤', color: 'rose' },
    { label: 'Páginas con visitas', value: ga?.topPages?.length ?? null, note: 'top del periodo', icon: '＋', color: 'green' },
  ] : activeChannel === 'instagram' ? [
    { label: 'Alcance (cuentas únicas)', value: num(ig?.totals?.reach), note: range.days > 30 ? 'solo hasta 30 días' : 'Instagram Insights', icon: '◎', color: 'violet' },
    { label: 'Visualizaciones', value: num(ig?.totals?.views), note: 'Instagram Insights', icon: '↗', color: 'blue' },
    { label: 'Interacciones', value: num(ig?.totals?.interactions), note: 'me gusta, comentarios, guardados…', icon: '♡', color: 'rose' },
    { label: 'Seguidores', value: num(ig?.followers), note: ig?.totals?.newFollows != null ? `+${fmt(ig.totals.newFollows)} en el periodo` : 'total actual', icon: '＋', color: 'green' },
  ] : activeChannel === 'facebook' ? [
    { label: 'Visualizaciones', value: num(fb?.totals?.views), note: 'page_media_view', icon: '↗', color: 'blue' },
    { label: 'Interacciones', value: num(fb?.totals?.engagements), note: 'en publicaciones', icon: '♡', color: 'rose' },
    { label: 'Nuevos seguidores', value: num(fb?.totals?.newFollows), note: 'en el periodo', icon: '＋', color: 'green' },
    { label: 'Seguidores', value: num(fb?.followers), note: 'total actual', icon: '◎', color: 'violet' },
  ] : [
    { label: 'Visitas al sitio', value: num(ga?.totals?.sessions), delta: change(ga?.totals?.sessions, ga?.previous?.sessions), note: ga ? 'sesiones GA4' : 'GA4 sin conectar', icon: '↗', color: 'blue' },
    { label: 'Visualizaciones', value: sumKnown(ig?.totals?.views, fb?.totals?.views), note: 'Instagram + Facebook', icon: '◎', color: 'violet' },
    { label: 'Interacciones', value: sumKnown(ig?.totals?.interactions, fb?.totals?.engagements), note: 'Instagram + Facebook', icon: '♡', color: 'rose' },
    { label: 'Nuevos seguidores', value: sumKnown(ig?.totals?.newFollows, fb?.totals?.newFollows), note: 'Instagram + Facebook', icon: '＋', color: 'green' },
  ];

  const chart = activeChannel === 'website' ? {
    title: 'Actividad del sitio web', subtitle: 'Datos diarios de Google Analytics 4',
    series: [['Sesiones', ga?.series?.sessions], ['Usuarios activos', ga?.series?.activeUsers], ['Páginas vistas', ga?.series?.screenPageViews]],
  } : activeChannel === 'instagram' ? {
    title: 'Rendimiento de Instagram', subtitle: 'Alcance diario (cuentas únicas por día)',
    series: [['Alcance diario', ig?.series?.reachDaily]],
  } : activeChannel === 'facebook' ? {
    title: 'Rendimiento de Facebook', subtitle: 'Datos diarios de la página',
    series: [['Espectadores únicos', fb?.series?.reachDaily], ['Visualizaciones', fb?.series?.views], ['Interacciones', fb?.series?.engagements]],
  } : {
    title: 'Actividad de tus canales', subtitle: 'Sesiones del sitio y alcance diario en redes',
    series: [['Sitio web · sesiones', ga?.series?.sessions], ['Instagram · alcance', ig?.series?.reachDaily], ['Facebook · espectadores', fb?.series?.reachDaily]],
  };
  const chartSeries = chart.series.map(([name, points], index) => ({ name, points: points ?? [], color: seriesColors[index] }));
  const chartTotal = chartSeries[0].points.length ? chartSeries[0].points.reduce((total, point) => total + point.value, 0) : null;

  const posts = [...(activeChannel !== 'facebook' ? ig?.posts ?? [] : []), ...(activeChannel !== 'instagram' ? fb?.posts ?? [] : [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
  const warnings = [
    ...(errors.app ? [`App: ${errors.app}`] : []),
    ...(errors.action ? [errors.action] : []),
    ...(errors.meta ? [`Meta: ${errors.meta}`] : []),
    ...(errors.google ? [`Google Analytics: ${errors.google}`] : []),
    ...(metaData?.warnings ?? []),
  ];
  const anyVerified = verified.website || verified.instagram || verified.facebook;
  const followersIG = num(ig?.followers);
  const followersFB = num(fb?.followers);
  const followersTotal = sumKnown(followersIG, followersFB);
  const share = value => (followersTotal ? Math.round(((value ?? 0) / followersTotal) * 100) : 0);
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  const verifiedTimes = [ga && `GA4 ${timeText(ga.verifiedAt)}`, metaData && `Meta ${timeText(metaData.verifiedAt)}`].filter(Boolean).join(' · ');

  return <div className="analytics-app" id="analytics-top">
    <aside className={`analytics-sidebar${mobileNavOpen ? ' is-open' : ''}`}>
      <a className="analytics-brand" href="#analytics-top" aria-label="CodePOS MX, inicio del panel"><BrandMark/><span>CodePOS <b>MX</b><small>ANALÍTICA</small></span></a>
      <div className="analytics-workspace"><span className="workspace-avatar">C</span><span><small>ESPACIO DE TRABAJO</small><strong>CodePOS MX</strong></span></div>
      <span className="sidebar-caption">PANEL</span>
      <nav className="analytics-side-nav" aria-label="Canales del panel">
        <button className={activeChannel === 'overview' ? 'selected' : ''} onClick={() => { setActiveChannel('overview'); setMobileNavOpen(false); }}><span className="nav-icon">▦</span>Resumen general</button>
        {channels.map(channel => <button key={channel.key} className={activeChannel === channel.key ? 'selected' : ''} onClick={() => { setActiveChannel(channel.key); setMobileNavOpen(false); }}><span className={`nav-icon nav-${channel.theme}`}>{channel.icon}</span>{channel.name}<span className={`nav-state ${verified[channel.key] ? 'verified' : ''}`}/></button>)}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-help-icon">?</div><span><strong>Panel privado</strong><small>Solo en esta PC · no se publica</small></span></div>
    </aside>
    {mobileNavOpen && <button className="analytics-nav-scrim" aria-label="Cerrar navegación" onClick={() => setMobileNavOpen(false)}/>}
    <main className="analytics-main">
      <header className="analytics-topbar"><button className="analytics-mobile-menu" onClick={() => setMobileNavOpen(value => !value)} aria-label="Abrir navegación">☰</button><div className="topbar-breadcrumb"><span>CodePOS MX</span><span>/</span><strong>{title}</strong></div><div className="topbar-actions"><span className={`sync-status${anyVerified ? ' is-live' : ''}`}><i/> {busy ? 'Consultando…' : anyVerified ? 'Datos verificados' : native ? 'Sin datos conectados' : 'Fuera de la app'}</span><button type="button" className="analytics-button analytics-button-secondary refresh-button" disabled={!native || busy} onClick={() => loadStatus().then(current => refresh(current, range.days))}>↻ Actualizar</button></div></header>
      <div className="analytics-content">
        {!anyVerified && <div className="prototype-banner"><span className="prototype-icon">i</span><span><strong>{native ? 'Todavía no hay cuentas conectadas' : 'Abre la app CodePOS MX Dashboard para Windows'}</strong><small>{native ? 'El panel solo muestra cifras obtenidas de Meta y Google Analytics. Mientras no haya conexión verificada verás «—».' : 'En el navegador el panel no puede conectarse a ningún servicio ni muestra datos.'}</small></span><span className="prototype-badge">SIN DATOS</span></div>}
        {anyVerified && <div className="prototype-banner live-banner"><span className="prototype-icon">✓</span><span><strong>Datos reales verificados</strong><small>{verifiedTimes}</small></span><span className="prototype-badge">EN VIVO</span></div>}
        {warnings.length > 0 && <details className="warning-list" open={warnings.length < 4}><summary>{warnings.length} aviso{warnings.length === 1 ? '' : 's'} de las API</summary><ul>{warnings.map(item => <li key={item}>{item}</li>)}</ul></details>}
        <section className="analytics-heading"><div><span className="analytics-kicker">{today}</span><h1>{active ? active.name : 'Tus canales, en perspectiva.'}</h1><p>{active ? `Métricas de ${active.name} de los últimos ${range.days} días.` : 'Sitio web, Instagram y Facebook en un solo lugar.'}</p></div><button type="button" className="analytics-button analytics-button-primary" onClick={() => setModalChannel(active?.key ?? 'facebook')}><span>＋</span> Conexiones</button></section>
        <div className="analytics-filter-row"><div className="source-pills" aria-label="Seleccionar canal"><button className={activeChannel === 'overview' ? 'active' : ''} onClick={() => setActiveChannel('overview')}>Todos los canales</button>{channels.map(channel => <button className={activeChannel === channel.key ? 'active' : ''} key={channel.key} onClick={() => setActiveChannel(channel.key)}><span className={`tiny-channel ${channel.theme}`}>{channel.icon}</span>{channel.name}</button>)}</div><div className="range-picker" aria-label="Seleccionar periodo">{ranges.map(option => <button type="button" key={option.days} className={range.days === option.days ? 'active' : ''} onClick={() => setRange(option)}>{option.label}</button>)}</div></div>
        <section className="analytics-stat-grid" aria-label="Indicadores">{stats.map(stat => <StatCard key={stat.label} {...stat}/>)}</section>
        <section className="analytics-main-grid">
          <article className="analytics-panel analytics-trend-panel"><div className="panel-heading"><div><h2>{chart.title}</h2><p>{chart.subtitle}</p></div></div><div className="trend-summary"><strong>{fmt(chartTotal)} <small>{chartSeries[0].name.toLowerCase()} · {range.label}</small></strong></div><TrendChart series={chartSeries}/><div className="chart-legend">{chartSeries.map(item => <span key={item.name}><i className="legend-dot" style={{ background: item.color }}/>{item.name}</span>)}</div></article>
          <article className="analytics-panel channels-panel"><div className="panel-heading"><div><h2>Tus canales</h2><p>Estado de las conexiones</p></div></div><div className="channel-list">{channels.map(channel => { const state = channelState(channel.key); const handle = channel.key === 'instagram' && ig?.username ? `@${ig.username}` : channel.key === 'facebook' && fb?.name ? fb.name : channel.handle; return <div className="channel-row" key={channel.key}><span className={`channel-icon ${channel.theme}`}>{channel.icon}</span><span className="channel-name"><strong>{channel.name}</strong><small>{handle}</small></span><span className={`connection-pill ${state.className}`}><i/>{state.text}</span><button type="button" className="channel-connect" aria-label={`Conexión de ${channel.name}`} onClick={() => setModalChannel(channel.key)}>↗</button></div>; })}</div><button type="button" className="connect-all-button" onClick={() => setModalChannel('facebook')}>Administrar conexiones <span>→</span></button></article>
        </section>
        <section className="analytics-lower-grid">
          {activeChannel === 'website' ? <article className="analytics-panel content-panel"><div className="panel-heading"><div><h2>Páginas más vistas</h2><p>Google Analytics 4 · {range.label}</p></div></div><div className="content-table"><div className="content-table-heading pages-table"><span>PÁGINA</span><span>VISTAS</span></div>{(ga?.topPages ?? []).map(page => <div className="content-table-row pages-table" key={page.path}><span className="post-name"><strong>{page.path}</strong></span><span>{fmt(page.views)}</span></div>)}</div>{!ga && <div className="content-demo-note">Sin datos de GA4 todavía.</div>}</article>
          : <article className="analytics-panel content-panel"><div className="panel-heading"><div><h2>Publicaciones recientes</h2><p>Alcance e interacciones reportados por Meta</p></div></div><div className="content-table"><div className="content-table-heading"><span>PUBLICACIÓN</span><span>CANAL</span><span>ALCANCE</span><span>INTERACCIONES</span></div>{posts.map((post, index) => <div className="content-table-row" key={`${post.link}-${index}`}><span className="post-name"><i className={`post-thumb thumb-${post.channel === 'instagram' ? 0 : 1}`}>{post.channel === 'instagram' ? '◎' : 'f'}</i><button type="button" className="post-link" onClick={() => callNative('openExternal', { url: post.link }).catch(() => {})} title={post.text}>{post.text.split('\n')[0]}</button></span><span className="post-channel">{post.channel === 'instagram' ? '◎ Instagram' : 'f Facebook'} · {new Date(post.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span><span>{fmt(num(post.reach))}</span><span className="post-interactions">♡ {fmt(post.interactions)}</span></div>)}</div>{!posts.length && <div className="content-demo-note">Sin publicaciones verificadas todavía.</div>}</article>}
          <article className="analytics-panel audience-panel"><div className="panel-heading"><div><h2>Tu comunidad</h2><p>Seguidores actuales</p></div><span className="audience-mark">◎</span></div><div className="audience-total"><strong>{fmt(followersTotal)}</strong><span>seguidores combinados</span></div><div className="audience-segment"><div><span className="audience-label"><i className="audience-instagram"/>Instagram</span><strong>{fmt(followersIG)}</strong><small>{share(followersIG)}%</small></div><div className="audience-progress"><span style={{ width: `${share(followersIG)}%` }}/></div><div><span className="audience-label"><i className="audience-facebook"/>Facebook</span><strong>{fmt(followersFB)}</strong><small>{share(followersFB)}%</small></div><div className="audience-progress facebook-progress"><span style={{ width: `${share(followersFB)}%` }}/></div></div><p className="audience-demo-note">{followersTotal === null ? 'Se mostrará al conectar Meta.' : 'Fuente: Graph API de Meta.'}</p></article>
        </section>
        <footer className="analytics-footer"><span>CodePOS MX · Panel privado</span><span>Credenciales cifradas en esta PC · el panel no tiene acceso directo a internet</span><span>No se publica en el sitio web</span></footer>
      </div>
    </main>
    <ConnectionModal channelKey={modalChannel} native={native} status={status} metaData={metaData} busy={busy} onAction={onAction} onClose={() => setModalChannel(null)}/>
  </div>;
}
