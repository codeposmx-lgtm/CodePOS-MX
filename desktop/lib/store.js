'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { AppError } = require('./http');

// Almacén local: secretos (cifrados) y ajustes (texto plano, sin datos sensibles).
// Los secretos se cifran con safeStorage (DPAPI de Windows, ligado al usuario) antes de tocar el disco.
function createStore({ dir, safeStorage }) {
  const secretsFile = path.join(dir, 'secrets.json');
  const settingsFile = path.join(dir, 'settings.json');

  function read(file) {
    try {
      const value = JSON.parse(fs.readFileSync(file, 'utf8'));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  // Los errores de disco se traducen a un mensaje en español sin rutas (que incluirían el usuario de Windows).
  function write(file, object) {
    const temp = `${file}.${process.pid}.tmp`;
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(temp, JSON.stringify(object, null, 2), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(temp, file);
    } catch (error) {
      try { fs.rmSync(temp, { force: true }); } catch { /* nada que limpiar */ }
      throw new AppError(`No se pudo guardar en el almacenamiento cifrado de Windows (${error?.code || 'ERROR'}).`);
    }
  }

  return {
    getSecret(name) {
      const encoded = read(secretsFile)[name];
      if (typeof encoded !== 'string') return null;
      try {
        return safeStorage.decryptString(Buffer.from(encoded, 'base64'));
      } catch {
        return null;
      }
    },
    setSecret(name, value) {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new AppError('No se pudo guardar: el cifrado de Windows no está disponible para este usuario.');
      }
      const secrets = read(secretsFile);
      secrets[name] = Buffer.from(safeStorage.encryptString(String(value))).toString('base64');
      write(secretsFile, secrets);
    },
    deleteSecret(name) {
      const secrets = read(secretsFile);
      if (!(name in secrets)) return;
      delete secrets[name];
      write(secretsFile, secrets);
    },
    getSetting(key) {
      const value = read(settingsFile)[key];
      return typeof value === 'string' ? value : null;
    },
    setSetting(key, value) {
      const settings = read(settingsFile);
      settings[key] = String(value);
      write(settingsFile, settings);
    },
    removeSetting(key) {
      const settings = read(settingsFile);
      if (!(key in settings)) return;
      delete settings[key];
      write(settingsFile, settings);
    },
  };
}

module.exports = { createStore };
