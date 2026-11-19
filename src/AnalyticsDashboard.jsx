import { useEffect, useMemo, useState } from 'react';

// En la app de Windows las capturas se leen/escriben mediante el puente nativo y se
// guardan localmente. El fallback de localStorage solo facilita la vista previa.
const bridge = () => window.codepos;
async function callNative(action, payload = {}) {
  const handler = bridge();
  if (!handler) throw new Error('Abre CodePOS MX Dashboard para Windows para guardar las métricas en este equipo.');
  return handler.call(action, payload);
}

const ranges = [{ label: '7 días', days: 7 }, { label: '30 días', days: 30 }, { label: '90 días', days: 90 }];
const channels = [
  { key: 'website', name: 'Sitio web', handle: 'codeposmx.vercel.app', icon: '↗', theme: 'web' },
  { key: 'instagram', name: 'Instagram', handle: '@codeposmx', icon: '◎', theme: 'instagram' },
  { key: 'facebook', name: 'Facebook', handle: 'CodePOS MX', icon: 'f', theme: 'facebook' },
];
const numberFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
const fmt = value => (value === null || value === undefined || Number.isNaN(value) ? '—' : numberFormat.format(value));
const fieldsByChannel = {
  website: [
    ['sessions', 'Sesiones', 'Visitas al sitio durante ese día.'],
    ['users', 'Usuarios', 'Usuarios activos del día.'],
    ['pageViews', 'Páginas vistas', 'Vistas totales de páginas.'],
  ],
  instagram: [
    ['views', 'Visualizaciones', 'Reproducciones y visualizaciones que muestra Insights.'],
    ['reach', 'Alcance', 'Cuentas únicas alcanzadas ese día.'],
    ['interactions', 'Interacciones', 'Me gusta, comentarios, guardados y otras interacciones.'],
    ['newFollowers', 'Nuevos seguidores', 'Seguidores obtenidos durante ese día.'],
    ['followers', 'Seguidores actuales', 'Total que aparece en tu perfil al hacer la captura.'],
  ],
  facebook: [
    ['views', 'Visualizaciones', 'Visualizaciones que muestra Meta Business Suite.'],
    ['reach', 'Alcance', 'Personas o cuentas alcanzadas ese día.'],
    ['interactions', 'Interacciones', 'Reacciones, comentarios, compartidos y clics.'],
    ['newFollowers', 'Nuevos seguidores', 'Seguidores obtenidos durante ese día.'],
    ['followers', 'Seguidores actuales', 'Total que aparece en la página al hacer la captura.'],
  ],
};
const metricAliases = {
  date: ['fecha', 'date', 'fin_periodo'], periodStart: ['inicio_periodo', 'periodstart', 'period_start'], channel: ['canal', 'channel', 'plataforma'],
  views: ['visualizaciones', 'views', 'vistas'], reach: ['alcance', 'reach'],
  interactions: ['interacciones', 'interactions'], newFollowers: ['nuevos_seguidores', 'nuevos seguidores', 'newfollowers', 'new_followers'],
  followers: ['seguidores', 'followers'], sessions: ['sesiones', 'sessions'], users: ['usuarios', 'users'], pageViews: ['paginas_vistas', 'páginas vistas', 'pageviews', 'page_views'],
};
const channelAlias = value => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['web', 'sitio web', 'website', 'ga4'].includes(normalized)) return 'website';
  if (['ig', 'instagram'].includes(normalized)) return 'instagram';
  if (['fb', 'facebook'].includes(normalized)) return 'facebook';
  return '';
};
const entryId = entry => `${entry.channel}:${entry.periodStart ?? entry.date}:${entry.date}`;
const dayLabel = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const normalizeEntries = entries => entries
  .filter(item => item && ['website', 'instagram', 'facebook'].includes(item.channel) && /^\d{4}-\d{2}-\d{2}$/.test(item.date))
  .map(item => ({ id: entryId(item), date: item.date, ...(item.periodStart ? { periodStart: item.periodStart } : {}), channel: item.channel, ...Object.fromEntries(['views', 'reach', 'interactions', 'newFollowers', 'followers', 'sessions', 'users', 'pageViews'].map(key => [key, Number.isSafeInteger(Number(item[key])) && Number(item[key]) >= 0 && item[key] !== '' && item[key] !== null ? Number(item[key]) : null])) }))
  .sort((a, b) => b.date.localeCompare(a.date) || a.channel.localeCompare(b.channel));

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); if (row.some(value => value.trim())) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  row.push(cell); if (row.some(value => value.trim())) rows.push(row);
  if (rows.length < 2) throw new Error('El CSV debe tener encabezados y al menos una fila.');
  const headers = rows[0].map(value => value.trim().toLowerCase());
  const indexFor = key => headers.findIndex(header => metricAliases[key].includes(header));
  const dateIndex = indexFor('date'), channelIndex = indexFor('channel');
  if (dateIndex < 0 || channelIndex < 0) throw new Error('El CSV debe incluir las columnas fecha y canal. Descarga la plantilla para ver el formato.');
  return rows.slice(1).map((row, rowIndex) => {
    const date = row[dateIndex]?.trim() ?? '';
    const channel = channelAlias(row[channelIndex]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !channel) throw new Error(`Revisa la fecha o el canal de la fila ${rowIndex + 2}.`);
    const periodStartIndex = indexFor('periodStart');
    const periodStart = periodStartIndex >= 0 ? row[periodStartIndex]?.trim() : '';
    if (periodStart && (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart) || periodStart > date)) throw new Error(`Revisa el periodo de la fila ${rowIndex + 2}.`);
    const entry = { id: `${channel}:${periodStart || date}:${date}`, date, ...(periodStart ? { periodStart } : {}), channel };
    for (const key of Object.keys(metricAliases).filter(item => !['date', 'periodStart', 'channel'].includes(item))) {
      const column = indexFor(key); const raw = column >= 0 ? row[column]?.trim() : '';
      if (!raw) { entry[key] = null; continue; }
      const clean = raw.replace(/[\s,]/g, '');
      if (!/^\d+$/.test(clean)) throw new Error(`La métrica ${key} de la fila ${rowIndex + 2} debe ser un entero sin decimales.`);
      entry[key] = Number(clean);
    }
    if (!Object.keys(entry).some(key => !['id', 'date', 'periodStart', 'channel'].includes(key) && entry[key] !== null)) throw new Error(`La fila ${rowIndex + 2} no tiene métricas.`);
    return entry;
  });
}

function BrandMark() {
  return <span className="analytics-brand-mark" aria-hidden="true"><span>‹</span><i>/</i><span>›</span></span>;
}

function TrendChart({ series }) {
  const visible = series.filter(item => item.points?.length);
  const dates = [...new Set(visible.flatMap(item => item.points.map(point => point.date)))].sort();
  if (!dates.length) return <div className="analytics-chart empty-chart">Agrega una captura diaria para ver la tendencia.</div>;
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
      {visible.map(item => <g key={item.name}><polyline points={item.points.map(point => `${x(point.date)},${y(point.value)}`).join(' ')} className="chart-line" style={{ stroke: item.color }} />{item.points.map(point => <circle key={point.date} cx={x(point.date)} cy={y(point.value)} r="3" className="chart-point" style={{ stroke: item.color }} />)}</g>)}
    </svg>
    <div className="chart-x-labels">{labels.map(date => <span key={date}>{dayLabel(date)}</span>)}</div>
  </div>;
}

function StatCard({ label, value, note, icon, color }) {
  return <article className="analytics-stat-card"><div className="stat-topline"><span>{label}</span><span className={`stat-icon ${color}`}>{icon}</span></div><strong className="stat-value">{fmt(value)}</strong><div className="stat-foot"><span>{note}</span></div></article>;
}

function MetricForm({ entry, onSave, onClose }) {
  const [channel, setChannel] = useState(entry?.channel ?? 'instagram');
  const [date, setDate] = useState(entry?.date ?? localToday());
  const [periodStart, setPeriodStart] = useState(entry?.periodStart ?? '');
  const [values, setValues] = useState(() => Object.fromEntries(['views', 'reach', 'interactions', 'newFollowers', 'followers', 'sessions', 'users', 'pageViews'].map(key => [key, entry?.[key] ?? ''])));
  const [error, setError] = useState('');
  const save = event => {
    event.preventDefault(); setError('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (periodStart && (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart) || periodStart > date))) { setError('Revisa las fechas del reporte.'); return; }
    const record = { id: `${channel}:${periodStart || date}:${date}`, date, ...(periodStart ? { periodStart } : {}), channel };
    const activeFields = fieldsByChannel[channel];
    let hasMetric = false;
    for (const [key] of activeFields) {
      const raw = String(values[key]).trim();
      if (!raw) { record[key] = null; continue; }
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) { setError(`${key === 'newFollowers' ? 'Nuevos seguidores' : activeFields.find(field => field[0] === key)?.[1]} debe ser un número entero igual o mayor que cero.`); return; }
      record[key] = Number(raw); hasMetric = true;
    }
    if (!hasMetric) { setError('Agrega al menos una métrica para guardar la captura.'); return; }
    onSave(record);
  };
  return <div className="analytics-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="analytics-modal manual-modal" role="dialog" aria-modal="true" aria-labelledby="manual-form-title">
      <button className="modal-close" onClick={onClose} type="button" aria-label="Cerrar">×</button>
      <span className="analytics-kicker">CAPTURA LOCAL · {entry ? 'EDITAR' : 'NUEVA'}</span>
      <h2 id="manual-form-title">Registrar métricas</h2>
      <p>Transcribe las cifras de tus plataformas. Los reportes por rango quedan identificados como consolidados y no se confunden con capturas de un día. Se guardan en esta PC.</p>
      <form onSubmit={save}>
        <div className="manual-form-meta">
          <label>Canal<select value={channel} onChange={event => { setChannel(event.target.value); setValues(Object.fromEntries(['views', 'reach', 'interactions', 'newFollowers', 'followers', 'sessions', 'users', 'pageViews'].map(key => [key, '']))); }} disabled={Boolean(entry)}>{channels.map(item => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label>
          <label>{periodStart ? 'Fin del periodo' : 'Fecha'}<input type="date" value={date} onChange={event => setDate(event.target.value)} required disabled={Boolean(entry)} /></label>
          <label className="manual-period-toggle"><input type="checkbox" checked={Boolean(periodStart)} onChange={event => setPeriodStart(event.target.checked ? (entry?.periodStart ?? date) : '')} disabled={Boolean(entry)} />Este reporte resume varios días</label>
          {periodStart && <label>Inicio del periodo<input type="date" value={periodStart} max={date} onChange={event => setPeriodStart(event.target.value)} required disabled={Boolean(entry)} /></label>}
        </div>
        <div className="manual-input-grid">{fieldsByChannel[channel].map(([key, label, hint]) => <label key={key}>{label}<input type="number" min="0" step="1" inputMode="numeric" value={values[key]} onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))} placeholder="Escribe la cifra"/><small>{hint}</small></label>)}</div>
        {error && <p className="manual-error" role="alert">{error}</p>}
        <div className="manual-form-actions"><button className="analytics-button analytics-button-secondary" type="button" onClick={onClose}>Cancelar</button><button className="analytics-button analytics-button-primary" type="submit">Guardar captura</button></div>
      </form>
    </section>
  </div>;
}

function StatSummary({ rows, metric }) {
  const values = rows.map(row => row[metric]).filter(Number.isFinite);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

function WeeklyGrowthAssistant({ entries, activeChannel }) {
  const socialChannels = activeChannel === 'overview' ? ['facebook', 'instagram'] : [activeChannel].filter(key => key !== 'website');
  const reports = socialChannels.flatMap(channel => entries
    .filter(row => row.channel === channel && row.periodStart)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2)
    .map(row => ({ ...row, reportChannel: channel })));
  const comparisons = socialChannels.map(channel => {
    const records = entries.filter(row => row.channel === channel && row.periodStart).sort((a, b) => b.date.localeCompare(a.date));
    if (records.length < 2) return null;
    const latest = records[0], previous = records[1];
    const duration = (row) => Math.round((new Date(`${row.date}T12:00:00Z`) - new Date(`${row.periodStart}T12:00:00Z`)) / 86400000);
    if (duration(latest) !== duration(previous) || previous.date >= latest.periodStart) return null;
    return { channel, latest, previous };
  }).filter(Boolean);
  const metricNames = { reach: 'alcance', views: 'visualizaciones', interactions: 'interacciones', newFollowers: 'nuevos seguidores' };
  const metricChanges = comparisons.flatMap(({ channel, latest, previous }) => Object.keys(metricNames).flatMap(metric => {
    if (!Number.isFinite(latest[metric]) || !Number.isFinite(previous[metric])) return [];
    const delta = latest[metric] - previous[metric];
    const percent = previous[metric] === 0 ? null : Math.round((delta / previous[metric]) * 100);
    return [{ channel, metric, name: metricNames[metric], delta, percent }];
  }));
  const hasWeeklyReports = reports.length > 0;
  const best = [...metricChanges].sort((a, b) => b.delta - a.delta)[0];
  const down = metricChanges.filter(item => item.delta < 0);
  const channelLabels = { facebook: 'Facebook', instagram: 'Instagram' };
  return <article className="analytics-panel growth-assistant" aria-labelledby="growth-assistant-title">
    <div className="growth-assistant-icon" aria-hidden="true">✦</div>
    <div className="growth-assistant-copy">
      <span className="analytics-kicker">ASISTENTE SEMANAL · ANÁLISIS LOCAL</span>
      <h2 id="growth-assistant-title">Tu siguiente paso, con datos.</h2>
      {metricChanges.length ? <>
        {best && <p><strong>{channelLabels[best.channel]} {best.name} {best.delta >= 0 ? 'subió' : 'bajó'} {fmt(Math.abs(best.delta))}{best.percent !== null ? ` (${Math.abs(best.percent)}%)` : ' desde cero'} frente al periodo anterior comparable.</strong> {best.delta >= 0 ? 'Conserva el formato que funcionó y prueba una variación pequeña en la llamada a la acción.' : 'Revisa el tema y el formato de las publicaciones; prueba un video corto y vuelve a medir la próxima semana.'}</p>}
        {down.filter(item => item !== best).slice(0, 2).map(item => <p key={`${item.channel}:${item.metric}`}><strong>{channelLabels[item.channel]} {item.name} bajó {fmt(Math.abs(item.delta))}{item.percent !== null ? ` (${Math.abs(item.percent)}%)` : ''}.</strong> Considera probar otro enfoque y comparar otra vez en el siguiente reporte.</p>)}
      </> : hasWeeklyReports ? <>
        <p>Ya guardaste reportes semanales. Todavía falta una segunda semana del mismo canal y duración para calcular cuánto subieron o bajaron tus métricas.</p>
        <ul>{reports.map(row => <li key={row.id}><strong>{channelLabels[row.reportChannel]} · {dayLabel(row.periodStart)}–{dayLabel(row.date)}:</strong> {Number.isFinite(row.reach) ? `${fmt(row.reach)} de alcance/espectadores` : 'alcance sin dato'}{Number.isFinite(row.interactions) ? ` · ${fmt(row.interactions)} interacciones` : ''}{Number.isFinite(row.views) ? ` · ${fmt(row.views)} visualizaciones` : ''}</li>)}</ul>
        <p>Para la próxima semana: conserva una frecuencia de publicación constante, incluye una invitación clara a escribir por WhatsApp y registra el mismo rango de métricas para comparar con precisión.</p>
      </> : <p>Cuando registres dos reportes semanales comparables, calcularé el cambio y te daré sugerencias basadas en esas cifras. Por ahora no hay una base suficiente.</p>}
      <small>Este asistente usa únicamente las capturas guardadas en esta PC; sus recomendaciones son orientativas.</small>
    </div>
    <span className="growth-assistant-badge">{metricChanges.length ? 'COMPARACIÓN LISTA' : 'SEGUIMIENTO SEMANAL'}</span>
  </article>;
}

export default function AnalyticsDashboard() {
  const [activeChannel, setActiveChannel] = useState('overview');
  const [range, setRange] = useState(ranges[1]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [native, setNative] = useState(Boolean(bridge()));
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const today = localToday();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (bridge()) {
          const result = await callNative('manual.load');
          if (mounted) { setEntries(normalizeEntries(result?.entries ?? [])); setNative(true); }
        } else {
          const saved = JSON.parse(localStorage.getItem('codepos-manual-metrics-preview') ?? '[]');
          if (mounted) { setEntries(normalizeEntries(saved)); setNative(false); }
        }
      } catch (loadError) { if (mounted) setError(`No se pudieron leer las capturas guardadas: ${loadError.message}`); }
      finally { if (mounted) setBusy(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const saveAll = async nextEntries => {
    const normalized = normalizeEntries(nextEntries);
    setBusy(true); setError(''); setNotice('');
    try {
      if (bridge()) await callNative('manual.save', { entries: normalized });
      else localStorage.setItem('codepos-manual-metrics-preview', JSON.stringify(normalized));
      setEntries(normalized); setModalOpen(false); setEditingEntry(null); setNotice('Captura guardada en esta PC.');
    } catch (saveError) { setError(`No se pudo guardar la captura: ${saveError.message}`); }
    finally { setBusy(false); }
  };

  const periodRows = useMemo(() => {
    const start = new Date(`${today}T12:00:00`); start.setDate(start.getDate() - (range.days - 1));
    const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    return entries.filter(row => (row.periodStart ? row.periodStart >= startDate && row.date <= today : row.date >= startDate && row.date <= today));
  }, [entries, range.days, today]);
  const group = key => periodRows.filter(row => row.channel === key);
  const channelHasData = key => entries.some(row => row.channel === key);
  const latestValue = (key, metric) => entries.filter(row => row.channel === key && row[metric] !== null).sort((a, b) => b.date.localeCompare(a.date))[0]?.[metric] ?? null;
  const active = channels.find(channel => channel.key === activeChannel);
  const title = active?.name ?? 'Resumen general';
  const rowsWebsite = group('website'), rowsInstagram = group('instagram'), rowsFacebook = group('facebook');
  const sum = (rows, key) => StatSummary({ rows, metric: key });
  const sumAcrossChannels = (left, right) => left === null && right === null ? null : (left ?? 0) + (right ?? 0);

  const stats = activeChannel === 'website' ? [
    { label: 'Sesiones', value: sum(rowsWebsite, 'sessions'), note: 'suma de capturas diarias', icon: '↗', color: 'blue' },
    { label: 'Usuarios', value: sum(rowsWebsite, 'users'), note: 'suma de capturas diarias', icon: '◎', color: 'violet' },
    { label: 'Páginas vistas', value: sum(rowsWebsite, 'pageViews'), note: 'suma de capturas diarias', icon: '▤', color: 'rose' },
    { label: 'Capturas del periodo', value: rowsWebsite.length, note: `${range.label} · registro manual`, icon: '＋', color: 'green' },
  ] : activeChannel === 'instagram' ? [
    { label: 'Alcance', value: sum(rowsInstagram, 'reach'), note: 'cuentas únicas por día', icon: '◎', color: 'violet' },
    { label: 'Visualizaciones', value: sum(rowsInstagram, 'views'), note: 'suma de capturas diarias', icon: '↗', color: 'blue' },
    { label: 'Interacciones', value: sum(rowsInstagram, 'interactions'), note: 'suma de capturas diarias', icon: '♡', color: 'rose' },
    { label: 'Seguidores actuales', value: latestValue('instagram', 'followers'), note: 'último total registrado', icon: '＋', color: 'green' },
  ] : activeChannel === 'facebook' ? [
    { label: 'Visualizaciones', value: sum(rowsFacebook, 'views'), note: 'suma de capturas diarias', icon: '↗', color: 'blue' },
    { label: 'Alcance', value: sum(rowsFacebook, 'reach'), note: 'cuentas únicas por día', icon: '◎', color: 'violet' },
    { label: 'Interacciones', value: sum(rowsFacebook, 'interactions'), note: 'suma de capturas diarias', icon: '♡', color: 'rose' },
    { label: 'Seguidores actuales', value: latestValue('facebook', 'followers'), note: 'último total registrado', icon: '＋', color: 'green' },
  ] : [
    { label: 'Sesiones web', value: sum(rowsWebsite, 'sessions'), note: `${rowsWebsite.length} capturas · ${range.label}`, icon: '↗', color: 'blue' },
    { label: 'Visualizaciones', value: sumAcrossChannels(sum(rowsInstagram, 'views'), sum(rowsFacebook, 'views')), note: 'Instagram + Facebook', icon: '◎', color: 'violet' },
    { label: 'Interacciones', value: sumAcrossChannels(sum(rowsInstagram, 'interactions'), sum(rowsFacebook, 'interactions')), note: 'Instagram + Facebook', icon: '♡', color: 'rose' },
    { label: 'Nuevos seguidores', value: sumAcrossChannels(sum(rowsInstagram, 'newFollowers'), sum(rowsFacebook, 'newFollowers')), note: 'Instagram + Facebook', icon: '＋', color: 'green' },
  ];

  const daily = (rows, metric) => {
    const byDate = new Map();
    rows.forEach(row => { if (Number.isFinite(row[metric])) byDate.set(row.date, (byDate.get(row.date) ?? 0) + row[metric]); });
    return [...byDate].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
  };
  const chart = activeChannel === 'website' ? { title: 'Actividad del sitio web', subtitle: 'Cifras diarias capturadas manualmente', series: [['Sesiones', daily(rowsWebsite, 'sessions')], ['Usuarios', daily(rowsWebsite, 'users')], ['Páginas vistas', daily(rowsWebsite, 'pageViews')]] }
    : activeChannel === 'instagram' ? { title: 'Rendimiento de Instagram', subtitle: 'Capturas diarias de Insights', series: [['Visualizaciones', daily(rowsInstagram, 'views')], ['Alcance', daily(rowsInstagram, 'reach')], ['Interacciones', daily(rowsInstagram, 'interactions')]] }
      : activeChannel === 'facebook' ? { title: 'Rendimiento de Facebook', subtitle: 'Capturas diarias de Meta Business Suite', series: [['Visualizaciones', daily(rowsFacebook, 'views')], ['Alcance', daily(rowsFacebook, 'reach')], ['Interacciones', daily(rowsFacebook, 'interactions')]] }
        : { title: 'Actividad de tus canales', subtitle: 'Capturas diarias de tus plataformas', series: [['Sitio web · sesiones', daily(rowsWebsite, 'sessions')], ['Instagram · vistas', daily(rowsInstagram, 'views')], ['Facebook · vistas', daily(rowsFacebook, 'views')]] };
  const colors = ['#2679f5', '#9a79e4', '#ec8ba5'];
  const chartSeries = chart.series.map(([name, points], index) => ({ name, points, color: colors[index] }));
  const chartTotal = chartSeries[0].points.reduce((total, point) => total + point.value, 0);
  const latestSocial = [...entries].filter(row => row.channel !== 'website').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const followersIG = latestValue('instagram', 'followers'), followersFB = latestValue('facebook', 'followers');
  const followersTotal = followersIG === null && followersFB === null ? null : (followersIG ?? 0) + (followersFB ?? 0);
  const share = value => followersTotal && value !== null ? Math.round((value / followersTotal) * 100) : 0;
  const allChannelsHaveData = channels.every(item => channelHasData(item.key));
  const todayLabel = new Date(`${today}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  const importCsv = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    setError(''); setNotice('');
    try {
      const imported = parseCsv(await file.text());
      const merged = new Map(entries.map(entry => [entryId(entry), entry]));
      imported.forEach(entry => merged.set(entryId(entry), { ...merged.get(entryId(entry)), ...entry }));
      await saveAll([...merged.values()]);
      setNotice(`Se importaron ${imported.length} fila${imported.length === 1 ? '' : 's'} desde ${file.name}.`);
    } catch (importError) { setError(importError.message || 'No se pudo leer el CSV.'); }
    finally { event.target.value = ''; }
  };

  const downloadTemplate = () => {
    const content = 'fecha,inicio_periodo,canal,visualizaciones,alcance,interacciones,nuevos_seguidores,seguidores,sesiones,usuarios,paginas_vistas\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'plantilla-metricas-codepos.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="analytics-app" id="analytics-top">
    <aside className={`analytics-sidebar${mobileNavOpen ? ' is-open' : ''}`}>
      <a className="analytics-brand" href="#analytics-top" aria-label="CodePOS MX, inicio del panel"><BrandMark/><span>CodePOS <b>MX</b><small>ANALÍTICA</small></span></a>
      <div className="analytics-workspace"><span className="workspace-avatar">C</span><span><small>ESPACIO DE TRABAJO</small><strong>CodePOS MX</strong></span></div>
      <span className="sidebar-caption">PANEL</span>
      <nav className="analytics-side-nav" aria-label="Canales del panel">
        <button className={activeChannel === 'overview' ? 'selected' : ''} onClick={() => { setActiveChannel('overview'); setMobileNavOpen(false); }}><span className="nav-icon">▦</span>Resumen general</button>
        {channels.map(channel => <button key={channel.key} className={activeChannel === channel.key ? 'selected' : ''} onClick={() => { setActiveChannel(channel.key); setMobileNavOpen(false); }}><span className={`nav-icon nav-${channel.theme}`}>{channel.icon}</span>{channel.name}<span className={`nav-state${channelHasData(channel.key) ? ' has-records' : ''}`}/></button>)}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-help-icon">↳</div><span><strong>Registro manual</strong><small>Guardado solo en esta PC</small></span></div>
    </aside>
    {mobileNavOpen && <button className="analytics-nav-scrim" aria-label="Cerrar navegación" onClick={() => setMobileNavOpen(false)}/>}
    <main className="analytics-main">
      <header className="analytics-topbar"><button className="analytics-mobile-menu" onClick={() => setMobileNavOpen(value => !value)} aria-label="Abrir navegación">☰</button><div className="topbar-breadcrumb"><span>CodePOS MX</span><span>/</span><strong>{title}</strong></div><div className="topbar-actions"><span className={`sync-status${entries.length ? ' is-live' : ''}`}><i/>{busy ? 'Guardando…' : entries.length ? 'Capturas guardadas' : 'Sin capturas'}</span><button type="button" className="analytics-button analytics-button-secondary refresh-button" onClick={() => { setEditingEntry(null); setModalOpen(true); }}>＋ Registrar</button></div></header>
      <div className="analytics-content">
        <div className={`prototype-banner${entries.length ? ' manual-banner-active' : ''}`}><span className="prototype-icon">{entries.length ? '✓' : 'i'}</span><span><strong>{entries.length ? 'Métricas ingresadas manualmente' : 'Elige cómo registrar tus métricas'}</strong><small>{entries.length ? 'Las cifras son las que capturaste; no se han verificado automáticamente con las plataformas.' : 'Escribe las cifras de Instagram, Facebook y tu sitio, o impórtalas con nuestra plantilla CSV.'}</small></span><span className="prototype-badge">{entries.length ? `${entries.length} CAPTURAS` : 'LOCAL'}</span></div>
        {!native && <div className="manual-preview-note">Vista previa: abre la app privada para que tus capturas se guarden en esta PC.</div>}
        {error && <div className="manual-error-banner" role="alert">{error}</div>}
        {notice && <div className="manual-success-banner" role="status">{notice}</div>}
        <section className="analytics-heading"><div><span className="analytics-kicker">{todayLabel}</span><h1>{active ? active.name : 'Tus canales, en perspectiva.'}</h1><p>{active ? `Cifras que registraste para ${active.name} en los últimos ${range.days} días.` : 'Registra y compara las cifras de tu sitio y redes en un solo lugar.'}</p></div><button type="button" className="analytics-button analytics-button-primary" onClick={() => { setEditingEntry(null); setModalOpen(true); }}><span>＋</span> Capturar métricas</button></section>
        <div className="analytics-filter-row"><div className="source-pills" aria-label="Seleccionar canal"><button className={activeChannel === 'overview' ? 'active' : ''} onClick={() => setActiveChannel('overview')}>Todos los canales</button>{channels.map(channel => <button className={activeChannel === channel.key ? 'active' : ''} key={channel.key} onClick={() => setActiveChannel(channel.key)}><span className={`tiny-channel ${channel.theme}`}>{channel.icon}</span>{channel.name}</button>)}</div><div className="range-picker" aria-label="Seleccionar periodo">{ranges.map(option => <button type="button" key={option.days} className={range.days === option.days ? 'active' : ''} onClick={() => setRange(option)}>{option.label}</button>)}</div></div>
        <section className="analytics-stat-grid" aria-label="Indicadores">{stats.map(stat => <StatCard key={stat.label} {...stat}/>)}</section>
        <WeeklyGrowthAssistant entries={entries} activeChannel={activeChannel}/>
        <section className="analytics-main-grid">
          <article className="analytics-panel analytics-trend-panel"><div className="panel-heading"><div><h2>{chart.title}</h2><p>{chart.subtitle} · {range.label}</p></div></div><div className="trend-summary"><strong>{periodRows.length ? fmt(chartTotal) : '—'} <small>{chartSeries[0].name.toLowerCase()} · {range.label}</small></strong></div><TrendChart series={chartSeries}/><div className="chart-legend">{chartSeries.map(item => <span key={item.name}><i className="legend-dot" style={{ background: item.color }}/>{item.name}</span>)}</div></article>
          <article className="analytics-panel channels-panel"><div className="panel-heading"><div><h2>Tus canales</h2><p>Estado de tus capturas manuales</p></div></div><div className="channel-list">{channels.map(channel => <div className="channel-row" key={channel.key}><span className={`channel-icon ${channel.theme}`}>{channel.icon}</span><span className="channel-name"><strong>{channel.name}</strong><small>{channel.handle}</small></span><span className={`connection-pill ${channelHasData(channel.key) ? 'manual-state' : ''}`}><i/>{channelHasData(channel.key) ? 'Con captura' : 'Sin capturas'}</span><button type="button" className="channel-connect" aria-label={`Registrar métricas de ${channel.name}`} onClick={() => { setEditingEntry(null); setModalOpen(true); }}>＋</button></div>)}</div><button type="button" className="connect-all-button" onClick={() => { setEditingEntry(null); setModalOpen(true); }}>Registrar una captura <span>→</span></button></article>
        </section>
        <section className="analytics-lower-grid">
          <article className="analytics-panel content-panel"><div className="panel-heading"><div><h2>{activeChannel === 'website' ? 'Historial del sitio web' : 'Historial de capturas'}</h2><p>{activeChannel === 'website' ? 'Sesiones, usuarios y páginas vistas por día' : 'Valores que registraste para tus redes'}</p></div><div className="manual-tools"><button type="button" className="panel-text-action" onClick={downloadTemplate}>Plantilla CSV</button><label className="panel-text-action manual-import-button">Importar CSV<input type="file" accept=".csv,text/csv" onChange={importCsv}/></label></div></div>
            <div className="content-table manual-table"><div className="content-table-heading"><span>FECHA / PERIODO</span><span>CANAL</span><span>{activeChannel === 'website' ? 'SESIONES' : 'VISTAS'}</span><span>{activeChannel === 'website' ? 'USUARIOS' : 'ALCANCE'}</span><span>{activeChannel === 'website' ? 'PÁGINAS' : 'INTERACCIONES'}</span><span/></div>{(activeChannel === 'website' ? rowsWebsite : activeChannel === 'instagram' ? rowsInstagram : activeChannel === 'facebook' ? rowsFacebook : periodRows).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(row => <div className="content-table-row" key={row.id}><span>{row.periodStart ? `${dayLabel(row.periodStart)} – ${dayLabel(row.date)} · periodo` : dayLabel(row.date)}</span><span className="post-channel">{channels.find(channel => channel.key === row.channel)?.name}</span><span>{fmt(row.channel === 'website' ? row.sessions : row.views)}</span><span>{fmt(row.channel === 'website' ? row.users : row.reach)}</span><span>{fmt(row.channel === 'website' ? row.pageViews : row.interactions)}</span><span className="manual-row-actions"><button type="button" aria-label={`Editar captura del ${row.date}`} onClick={() => { setEditingEntry(row); setModalOpen(true); }}>Editar</button><button type="button" aria-label={`Eliminar captura del ${row.date}`} onClick={() => { if (window.confirm(`¿Eliminar la captura de ${channels.find(channel => channel.key === row.channel)?.name} del ${dayLabel(row.date)}?`)) void saveAll(entries.filter(item => item.id !== row.id)); }}>×</button></span></div>)}</div>
            {periodRows.length === 0 && <div className="content-demo-note">Todavía no hay capturas en este periodo. Usa “Registrar” o importa tu CSV.</div>}
            <p className="manual-table-footnote">Puedes registrar cifras diarias o reportes consolidados por rango. Los reportes por rango conservan sus fechas y no se presentan como actividad de un solo día.</p>
          </article>
          <article className="analytics-panel audience-panel"><div className="panel-heading"><div><h2>Tu comunidad</h2><p>Último total de seguidores registrado</p></div><span className="audience-mark">◎</span></div><div className="audience-total"><strong>{fmt(followersTotal)}</strong><span>seguidores combinados</span></div><div className="audience-segment"><div><span className="audience-label"><i className="audience-instagram"/>Instagram</span><strong>{fmt(followersIG)}</strong><small>{share(followersIG)}%</small></div><div className="audience-progress"><span style={{ width: `${share(followersIG)}%` }}/></div><div><span className="audience-label"><i className="audience-facebook"/>Facebook</span><strong>{fmt(followersFB)}</strong><small>{share(followersFB)}%</small></div><div className="audience-progress facebook-progress"><span style={{ width: `${share(followersFB)}%` }}/></div></div><p className="audience-demo-note">{followersTotal === null ? 'Registra el total actual desde cada plataforma.' : 'Fuente: captura manual.'}</p></article>
        </section>
        <section className="manual-help"><div><strong>¿De dónde saco las cifras?</strong><p>Instagram: Perfil profesional → Panel para profesionales → Estadísticas. Facebook: Meta Business Suite → Estadísticas. Web: informes de Analytics o del panel de Vercel.</p></div><button type="button" className="analytics-button analytics-button-secondary" onClick={downloadTemplate}>Descargar plantilla CSV</button></section>
        <footer className="analytics-footer"><span>CodePOS MX · Panel privado</span><span>Las capturas se guardan localmente en esta PC</span><span>No se publica en el sitio web</span></footer>
      </div>
    </main>
    {modalOpen && <MetricForm entry={editingEntry} onSave={record => { const merged = new Map(entries.map(item => [item.id, item])); merged.set(entryId(record), record); void saveAll([...merged.values()]); }} onClose={() => { setModalOpen(false); setEditingEntry(null); }}/ >}
  </div>;
}
