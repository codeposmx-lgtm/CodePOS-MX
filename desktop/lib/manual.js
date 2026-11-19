'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { AppError } = require('./http');

// Estadísticas capturadas por el usuario. Permanecen en la carpeta de datos de la app
// (%APPDATA%\CodePOS MX Dashboard) de esta cuenta de Windows y nunca se envían a un servidor.
const METRIC_KEYS = ['views', 'reach', 'interactions', 'newFollowers', 'followers', 'sessions', 'users', 'pageViews'];
const CHANNELS = new Set(['website', 'instagram', 'facebook']);
const FILE_NAME = 'manual-metrics.json';
const MAX_ENTRIES = 1000;
const MAX_VALUE = 1_000_000_000;

function validDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalize(entries) {
  if (!Array.isArray(entries) || entries.length > MAX_ENTRIES) {
    throw new AppError('El archivo debe contener como máximo 1,000 capturas.');
  }
  const records = new Map();
  for (const entry of entries) {
    const channel = entry?.channel;
    const date = entry?.date;
    if (typeof channel !== 'string' || !CHANNELS.has(channel) || !validDay(date)) {
      throw new AppError('Una captura tiene una fecha o canal inválido.');
    }
    const periodStart = typeof entry.periodStart === 'string' ? entry.periodStart : undefined;
    if (periodStart !== undefined && (!validDay(periodStart) || periodStart > date)) {
      throw new AppError('El inicio del periodo debe ser una fecha válida anterior o igual al final.');
    }
    const id = `${channel}:${periodStart ?? date}:${date}`;
    const record = { id, date, channel };
    if (periodStart !== undefined) record.periodStart = periodStart;
    let hasMetric = false;
    for (const key of METRIC_KEYS) {
      const raw = entry[key];
      if (raw === undefined || raw === null) { record[key] = null; continue; }
      if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > MAX_VALUE) {
        throw new AppError(`La métrica ${key} debe ser un entero entre 0 y 1,000,000,000.`);
      }
      record[key] = raw;
      hasMetric = true;
    }
    if (!hasMetric) throw new AppError('Cada captura debe incluir al menos una métrica.');
    records.set(id, record);
  }
  return [...records.values()].sort((a, b) => (a.date === b.date
    ? (a.channel < b.channel ? -1 : a.channel > b.channel ? 1 : 0)
    : (a.date > b.date ? -1 : 1)));
}

function createManualStore({ dir }) {
  const file = path.join(dir, FILE_NAME);

  function load() {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') return { entries: [] };
      throw new AppError(`No se pudieron leer las capturas (${error?.code || 'ERROR'}).`);
    }
    let object;
    try { object = JSON.parse(text); } catch { object = null; }
    if (!object || typeof object !== 'object' || !Array.isArray(object.entries)) {
      throw new AppError('El archivo de capturas está dañado y no se pudo leer.');
    }
    return { entries: object.entries.filter(entry => entry && typeof entry === 'object' && !Array.isArray(entry)) };
  }

  function save(entries) {
    const normalized = normalize(entries);
    const temp = `${file}.${process.pid}.tmp`;
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      fs.writeFileSync(temp, JSON.stringify({ version: 1, entries: normalized }, null, 2), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(temp, file);
    } catch (error) {
      try { fs.rmSync(temp, { force: true }); } catch { /* nada que limpiar */ }
      throw new AppError(`No se pudieron guardar las capturas (${error?.code || 'ERROR'}).`);
    }
    return { entries: normalized };
  }

  return { load, save };
}

module.exports = { createManualStore, METRIC_KEYS };
