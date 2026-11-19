'use strict';

// Ventanas nativas para capturar credenciales fuera del JavaScript del panel.
// Los valores van de esta ventana al proceso principal y nunca al panel.
const WIDTH = 500;
const MAX_HEIGHT = 760;

function createPrompt({ BrowserWindow, dialog, ipcMain, getParent, preloadPath, htmlPath }) {
  const pending = new Map(); // webContents.id → { config, finish }

  ipcMain.handle('prompt:get', event => pending.get(event.sender.id)?.config ?? null);
  ipcMain.on('prompt:done', (event, payload) => {
    const entry = pending.get(event.sender.id);
    if (!entry) return;
    const count = entry.config.fields.length;
    const values = payload?.values;
    const valid = payload?.ok === true && Array.isArray(values) && values.length === count && values.every(v => typeof v === 'string');
    entry.finish(valid ? values.map(v => v.trim()) : null);
  });
  // La ventana se ajusta al alto real de su contenido para que los botones siempre queden visibles.
  ipcMain.on('prompt:size', (event, height) => {
    const entry = pending.get(event.sender.id);
    const h = Number(height);
    if (!entry || !Number.isFinite(h) || entry.win.isDestroyed()) return;
    entry.win.setContentSize(WIDTH, Math.min(MAX_HEIGHT, Math.max(160, Math.ceil(h))));
  });

  function ask({ title, message, fields, confirm = 'Guardar en Windows' }) {
    return new Promise(resolve => {
      const parent = getParent() ?? undefined;
      const win = new BrowserWindow({
        parent, modal: Boolean(parent), width: WIDTH, height: Math.min(MAX_HEIGHT, 230 + fields.length * 68), useContentSize: true, resizable: false,
        minimizable: false, maximizable: false, fullscreenable: false, show: false, autoHideMenuBar: true, title,
        backgroundColor: '#f6f8fc',
        webPreferences: { preload: preloadPath, contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false, devTools: false },
      });
      const id = win.webContents.id;
      let done = false;
      const finish = value => {
        if (done) return;
        done = true;
        pending.delete(id);
        if (!win.isDestroyed()) win.close();
        resolve(value);
      };
      pending.set(id, {
        win,
        config: { title, message, confirm, fields: fields.map(({ label, placeholder, secure, initial }) => ({ label, placeholder, secure: Boolean(secure), initial: initial ?? '' })) },
        finish,
      });
      win.on('closed', () => finish(null));
      win.once?.('ready-to-show', () => win.show());
      win.webContents.setWindowOpenHandler?.(() => ({ action: 'deny' }));
      win.webContents.on?.('will-navigate', event => event.preventDefault());
      win.loadFile(htmlPath).catch(() => finish(null));
    });
  }

  async function confirm({ title, message, confirm: confirmLabel }) {
    const { response } = await dialog.showMessageBox(getParent() ?? undefined, {
      type: 'warning', title, message: title, detail: message, buttons: [confirmLabel, 'Cancelar'], defaultId: 1, cancelId: 1, noLink: true,
    });
    return response === 0;
  }

  return { ask, confirm };
}

module.exports = { createPrompt };
