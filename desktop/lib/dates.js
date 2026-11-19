'use strict';

const DAY_MS = 86_400_000;

function dayString(date) {
  return date.toISOString().slice(0, 10);
}

// Meta marca cada día con su hora de cierre (medianoche del Pacífico del día siguiente).
function dayFromGraphEndTime(text) {
  if (typeof text !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2})(\d{2})$/.exec(text);
  if (!match) return null;
  const date = new Date(`${match[1]}${match[2]}:${match[3]}`);
  if (Number.isNaN(date.getTime())) return null;
  return dayString(new Date(date.getTime() - DAY_MS));
}

function iso(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

module.exports = { DAY_MS, dayFromGraphEndTime, iso };
