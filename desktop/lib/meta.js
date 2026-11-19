'use strict';

const { AppError, requestJSON, formBody } = require('./http');
const { hmacHex } = require('./crypto');
const { dayFromGraphEndTime, iso } = require('./dates');

// Lectura de estadísticas de la página de Facebook y de la cuenta profesional de Instagram vinculada.
// Solo usa permisos de lectura. No publica, no envía mensajes y no toca anuncios.
const META_APP_ID = '4913773975558748';
const GRAPH_VERSION = 'v26.0';
// Mínimo necesario para leer métricas:
//  - pages_show_list: listar las páginas que administras (para elegir CodePOS MX).
//  - pages_read_engagement: leer datos, publicaciones y seguidores de la página; obtener el token de página.
//  - read_insights: leer estadísticas (Insights) de la página.
//  - instagram_basic: leer perfil y publicaciones de la cuenta profesional vinculada.
//  - instagram_manage_insights: leer estadísticas de Instagram (pese al nombre, no permite modificar nada).
const META_SCOPES = ['pages_show_list', 'pages_read_engagement', 'read_insights', 'instagram_basic', 'instagram_manage_insights'];

const TOKEN = 'meta.user_token';
const SECRET = 'meta.app_secret';
const PAGE_KEY = 'meta.selectedPageID';
const DAY_S = 86_400;

const isNumber = value => typeof value === 'number' && Number.isFinite(value);

function insightSeries(response) {
  const values = response?.data?.[0]?.values;
  if (!Array.isArray(values)) return [];
  return values.flatMap(value => {
    const day = dayFromGraphEndTime(value?.end_time);
    return day && isNumber(value?.value) ? [{ date: day, value: value.value }] : [];
  });
}

function sumSeries(series) {
  if (!Array.isArray(series) || series.length === 0) return null;
  return series.reduce((sum, point) => sum + (isNumber(point?.value) ? point.value : 0), 0);
}

function totalValue(response) {
  const value = response?.data?.[0]?.total_value?.value;
  return isNumber(value) ? value : null;
}

// La API de Instagram limita cada consulta a 30 días; se divide el periodo en tramos.
function instagramWindows(sinceMs, untilMs) {
  const windows = [];
  let cursor = sinceMs;
  while (cursor < untilMs) {
    const end = Math.min(cursor + (30 * DAY_S - 60) * 1000, untilMs);
    windows.push([cursor, end]);
    cursor = end;
  }
  return windows;
}

const seconds = ms => String(Math.floor(ms / 1000));
const range = ([since, until]) => ({ since: seconds(since), until: seconds(until) });
const message = error => (error instanceof Error ? error.message : String(error));

function createMetaService({ store, ask, confirm, login }) {
  function storedToken() {
    const raw = store.getSecret(TOKEN);
    if (raw === null) return null;
    try {
      const token = JSON.parse(raw);
      return typeof token?.token === 'string' ? { token: token.token, expiresAt: Number(token.expiresAt) || 0, longLived: Boolean(token.longLived) } : null;
    } catch { return null; }
  }
  const storeToken = token => store.setSecret(TOKEN, JSON.stringify(token));
  const hasSecret = () => store.getSecret(SECRET) !== null;

  function status() {
    const token = storedToken();
    const expired = token ? token.expiresAt > 0 && token.expiresAt < Date.now() / 1000 + 60 : false;
    return {
      appID: META_APP_ID,
      graphVersion: GRAPH_VERSION,
      scopes: META_SCOPES,
      hasAppSecret: hasSecret(),
      connected: token !== null && !expired,
      expired,
      longLived: token?.longLived ?? false,
      expiresAt: token ? (token.expiresAt > 0 ? iso(new Date(token.expiresAt * 1000)) : 'sin caducidad') : null,
      selectedPageID: store.getSetting(PAGE_KEY),
    };
  }

  function graphURL(path, query, token) {
    const items = { ...query };
    const secret = store.getSecret(SECRET);
    if (secret !== null) items.appsecret_proof = hmacHex(secret, token);
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
    Object.keys(items).sort().forEach(key => url.searchParams.set(key, items[key]));
    return url.toString();
  }

  // El token viaja en la cabecera Authorization, nunca en la URL.
  function graph(path, query, token, method = 'GET') {
    return requestJSON(graphURL(path, query ?? {}, token), { method, headers: { Authorization: `Bearer ${token}` } });
  }

  async function exchangeForLongLived() {
    const secret = store.getSecret(SECRET);
    const token = storedToken();
    if (secret === null || !token) return;
    const response = await requestJSON(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody({ grant_type: 'fb_exchange_token', client_id: META_APP_ID, client_secret: secret, fb_exchange_token: token.token }),
    });
    if (typeof response.access_token !== 'string') throw new AppError('Meta no devolvió un token.');
    const expiresIn = Number(response.expires_in) || 0;
    storeToken({ token: response.access_token, expiresAt: expiresIn > 0 ? Date.now() / 1000 + expiresIn : 0, longLived: true });
  }

  async function permissionReport() {
    const token = storedToken();
    if (!token) return {};
    const response = await graph('me/permissions', {}, token.token);
    const rows = Array.isArray(response.data) ? response.data : [];
    const granted = rows.filter(row => row?.status === 'granted').map(row => row.permission).filter(p => typeof p === 'string');
    const declined = rows.filter(row => row?.status !== 'granted').map(row => row?.permission).filter(p => typeof p === 'string');
    const missing = META_SCOPES.filter(scope => !granted.includes(scope));
    const unexpected = granted.filter(p => !META_SCOPES.includes(p) && p !== 'public_profile');
    return { granted, declined, missing, unexpected };
  }

  async function connect(parent) {
    const result = await login(parent);
    const expiresAt = result.expiresIn > 0 ? Date.now() / 1000 + result.expiresIn : 0;
    storeToken({ token: result.token, expiresAt, longLived: false });
    const notes = [];
    if (hasSecret()) {
      try { await exchangeForLongLived(); } catch (error) { notes.push(`No se pudo obtener el token de larga duración: ${message(error)}`); }
    } else {
      notes.push('Token de corta duración (1–2 h). Guarda el App Secret en el almacenamiento cifrado de Windows para obtener uno de ~60 días.');
    }
    const permissions = await permissionReport();
    return { ...status(), permissions, notes };
  }

  async function setAppSecret() {
    const values = await ask({
      title: 'App Secret de CodePOS MX Analytics',
      message: 'Se guarda solo en el almacenamiento cifrado de Windows de este usuario. Se usa para cambiar el token por uno de larga duración y firmar las consultas (appsecret_proof). Nunca se envía al panel ni se escribe sin cifrar. Cópialo desde Meta › Configuración de la app › Básica.',
      fields: [{ label: 'App Secret', placeholder: 'Pega aquí el App Secret', secure: true, initial: '' }],
    });
    const secret = values?.[0];
    if (!secret) return status();
    if (!/^[0-9a-f]{32}$/.test(secret)) throw new AppError('El App Secret no tiene el formato esperado (32 caracteres hexadecimales). No se guardó.');
    store.setSecret(SECRET, secret);
    const notes = ['App Secret guardado en el almacenamiento cifrado de Windows.'];
    const token = storedToken();
    if (token && !token.longLived) {
      try { await exchangeForLongLived(); notes.push('Token cambiado a larga duración.'); }
      catch (error) { notes.push(`No se pudo cambiar el token: ${message(error)}`); }
    }
    return { ...status(), notes };
  }

  function clearAppSecret() {
    store.deleteSecret(SECRET);
    return status();
  }

  async function disconnect() {
    const notes = [];
    const token = storedToken();
    if (token) {
      const ok = await confirm({
        title: 'Desconectar Meta',
        message: 'Se borrará el token del almacenamiento cifrado de Windows y se revocará el acceso de la app CodePOS MX Analytics a tu cuenta (DELETE /me/permissions).',
        confirm: 'Desconectar y revocar',
      });
      if (!ok) return status();
      try {
        await graph('me/permissions', {}, token.token, 'DELETE');
        notes.push('Acceso revocado en Meta.');
      } catch (error) {
        notes.push(`Token borrado localmente; la revocación en Meta falló: ${message(error)}`);
      }
    }
    store.deleteSecret(TOKEN);
    return { ...status(), notes };
  }

  function selectPage(pageID) {
    if (/^[0-9]+$/.test(String(pageID ?? ''))) store.setSetting(PAGE_KEY, String(pageID));
    return status();
  }

  async function fetchFacebook(pageID, pageToken, since, until, warnings) {
    // Métricas vigentes tras la retirada de page_impressions* (nov. 2025 / jun. 2026).
    const metrics = {
      page_total_media_view_unique: 'reachDaily',
      page_media_view: 'views',
      page_post_engagements: 'engagements',
      page_daily_follows_unique: 'newFollows',
    };
    const series = {};
    for (const [metric, key] of Object.entries(metrics)) {
      try {
        const response = await graph(`${pageID}/insights`, { metric, period: 'day', ...range([since, until]) }, pageToken);
        series[key] = insightSeries(response);
      } catch (error) {
        warnings.push(`Facebook · ${metric}: ${message(error)}`);
      }
    }

    const posts = [];
    try {
      const response = await graph(`${pageID}/published_posts`, {
        fields: 'id,message,created_time,permalink_url,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0),shares',
        limit: '5',
      }, pageToken);
      for (const post of Array.isArray(response.data) ? response.data : []) {
        const reactions = Number.isInteger(post?.reactions?.summary?.total_count) ? post.reactions.summary.total_count : 0;
        const comments = Number.isInteger(post?.comments?.summary?.total_count) ? post.comments.summary.total_count : 0;
        const shares = Number.isInteger(post?.shares?.count) ? post.shares.count : 0;
        let reach = null;
        if (typeof post?.id === 'string') {
          try {
            const insight = await graph(`${post.id}/insights`, { metric: 'post_total_media_view_unique', period: 'lifetime' }, pageToken);
            const value = insight?.data?.[0]?.values?.[0]?.value;
            if (isNumber(value)) reach = value;
          } catch { /* sin alcance */ }
        }
        posts.push({
          channel: 'facebook',
          text: typeof post?.message === 'string' ? post.message : 'Publicación sin texto',
          date: post?.created_time ?? '',
          link: post?.permalink_url ?? '',
          reach,
          interactions: reactions + comments + shares,
        });
      }
    } catch (error) {
      warnings.push(`Facebook · publicaciones: ${message(error)}`);
    }

    return {
      series,
      totals: {
        views: sumSeries(series.views),
        engagements: sumSeries(series.engagements),
        newFollows: sumSeries(series.newFollows),
        reachDailySum: sumSeries(series.reachDaily),
      },
      posts,
    };
  }

  async function fetchInstagram(igID, token, since, until, warnings) {
    const windows = instagramWindows(since, until);

    let reachDaily = [];
    for (const window of windows) {
      try {
        const response = await graph(`${igID}/insights`, { metric: 'reach', period: 'day', ...range(window) }, token);
        reachDaily = reachDaily.concat(insightSeries(response));
      } catch (error) {
        warnings.push(`Instagram · reach diario: ${message(error)}`);
        break;
      }
    }

    const totals = {};
    // Métricas sumables entre tramos.
    const additive = { views: 'views', total_interactions: 'interactions', profile_views: 'profileViews' };
    // Métricas de cuentas únicas: solo válidas si el periodo cabe en una consulta.
    const unique = { reach: 'reach', accounts_engaged: 'accountsEngaged' };
    for (const [metric, key] of Object.entries(additive)) {
      let total = 0;
      let ok = true;
      for (const window of windows) {
        try {
          const response = await graph(`${igID}/insights`, { metric, period: 'day', metric_type: 'total_value', ...range(window) }, token);
          total += totalValue(response) ?? 0;
        } catch (error) {
          ok = false;
          warnings.push(`Instagram · ${metric}: ${message(error)}`);
          break;
        }
      }
      totals[key] = ok ? total : null;
    }
    for (const [metric, key] of Object.entries(unique)) {
      if (windows.length !== 1) { totals[key] = null; continue; }
      try {
        const response = await graph(`${igID}/insights`, { metric, period: 'day', metric_type: 'total_value', ...range(windows[0]) }, token);
        totals[key] = totalValue(response);
      } catch (error) {
        totals[key] = null;
        warnings.push(`Instagram · ${metric}: ${message(error)}`);
      }
    }
    if (windows.length > 1) {
      warnings.push('Instagram · alcance y cuentas con interacción son personas únicas; con más de 30 días no se pueden sumar y se muestran como «—».');
    }

    let follows = 0;
    let unfollows = 0;
    let followsOK = true;
    for (const window of windows) {
      try {
        const response = await graph(`${igID}/insights`, { metric: 'follows_and_unfollows', period: 'day', metric_type: 'total_value', breakdown: 'follow_type', ...range(window) }, token);
        const results = response?.data?.[0]?.total_value?.breakdowns?.[0]?.results;
        for (const result of Array.isArray(results) ? results : []) {
          const kind = result?.dimension_values?.[0] ?? '';
          const value = isNumber(result?.value) ? result.value : 0;
          if (kind === 'FOLLOWER') follows += value; else if (kind === 'NON_FOLLOWER') unfollows += value;
        }
      } catch (error) {
        followsOK = false;
        warnings.push(`Instagram · follows_and_unfollows: ${message(error)} (Meta solo lo ofrece a cuentas con 100+ seguidores).`);
        break;
      }
    }
    totals.newFollows = followsOK ? follows : null;
    totals.unfollows = followsOK ? unfollows : null;

    const posts = [];
    try {
      const response = await graph(`${igID}/media`, { fields: 'id,caption,media_type,timestamp,permalink,like_count,comments_count', limit: '5' }, token);
      for (const media of Array.isArray(response.data) ? response.data : []) {
        let reach = null;
        if (typeof media?.id === 'string') {
          try {
            const insight = await graph(`${media.id}/insights`, { metric: 'reach' }, token);
            const value = insight?.data?.[0]?.values?.[0]?.value;
            if (isNumber(value)) reach = value;
          } catch { /* sin alcance */ }
        }
        const likes = Number.isInteger(media?.like_count) ? media.like_count : 0;
        const comments = Number.isInteger(media?.comments_count) ? media.comments_count : 0;
        posts.push({
          channel: 'instagram',
          text: typeof media?.caption === 'string' ? media.caption : 'Publicación sin texto',
          date: media?.timestamp ?? '',
          link: media?.permalink ?? '',
          reach,
          interactions: likes + comments,
        });
      }
    } catch (error) {
      warnings.push(`Instagram · publicaciones: ${message(error)}`);
    }

    return { series: { reachDaily }, totals, posts };
  }

  async function fetchAll(requestedDays) {
    const token = storedToken();
    if (!token) throw new AppError('Meta no está conectado.');
    if (token.expiresAt > 0 && token.expiresAt < Date.now() / 1000 + 60) throw new AppError('El token de Meta caducó. Vuelve a conectar.');
    const days = Math.max(1, Math.min(Math.trunc(Number(requestedDays) || 30), 90));
    const until = Date.now();
    const since = until - days * DAY_S * 1000 + 600_000;
    const warnings = [];

    let permissions = {};
    try { permissions = await permissionReport(); } catch { permissions = {}; }
    if (Array.isArray(permissions.missing) && permissions.missing.length > 0) {
      warnings.push(`Permisos no concedidos: ${permissions.missing.join(', ')}.`);
    }

    const accounts = await graph('me/accounts', {
      fields: 'id,name,access_token,followers_count,instagram_business_account{id,username,followers_count,media_count}',
      limit: '50',
    }, token.token);
    const pages = Array.isArray(accounts.data) ? accounts.data : [];
    if (pages.length === 0) {
      throw new AppError('Meta no devolvió páginas. Al conectar, selecciona la página CodePOS MX y confirma que tienes acceso de administrador o la tarea de análisis.');
    }
    const selectedID = store.getSetting(PAGE_KEY);
    const page = pages.find(p => p?.id === selectedID)
      ?? pages.find(p => String(p?.name ?? '').toLowerCase().includes('codepos'))
      ?? pages[0];
    if (typeof page?.id !== 'string' || typeof page?.access_token !== 'string') {
      throw new AppError('No se obtuvo acceso de lectura a la página seleccionada.');
    }
    const pageList = pages.map(p => ({ id: p?.id ?? '', name: p?.name ?? '' }));

    const facebook = await fetchFacebook(page.id, page.access_token, since, until, warnings);
    const facebookInfo = { id: page.id, name: page.name ?? '', followers: page.followers_count ?? null, ...facebook };

    let instagramInfo = null;
    const ig = page.instagram_business_account;
    if (typeof ig?.id === 'string') {
      const metrics = await fetchInstagram(ig.id, token.token, since, until, warnings);
      instagramInfo = { id: ig.id, username: ig.username ?? '', followers: ig.followers_count ?? null, mediaCount: ig.media_count ?? null, ...metrics };
    } else {
      warnings.push(`La página ${page.name ?? ''} no tiene una cuenta profesional de Instagram vinculada (o falta instagram_basic).`);
    }

    return {
      verifiedAt: iso(new Date()),
      days,
      pages: pageList,
      facebook: facebookInfo,
      instagram: instagramInfo,
      permissions,
      warnings,
    };
  }

  return { status, connect, setAppSecret, clearAppSecret, disconnect, selectPage, fetch: fetchAll };
}

module.exports = { META_APP_ID, GRAPH_VERSION, META_SCOPES, insightSeries, sumSeries, totalValue, instagramWindows, createMetaService };
