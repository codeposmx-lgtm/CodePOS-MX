const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createPrompt } = require('../lib/prompt');

function fakes({ response = 0 } = {}) {
  const windows = [];
  let nextID = 1;
  class FakeWindow extends EventEmitter {
    constructor(options) {
      super();
      this.options = options;
      this.webContents = { id: nextID++ };
      this.destroyed = false;
      windows.push(this);
    }
    loadFile(file) { this.file = file; return Promise.resolve(); }
    isDestroyed() { return this.destroyed; }
    close() { if (!this.destroyed) { this.destroyed = true; this.emit('closed'); } }
    show() {}
  }
  const handlers = {};
  const listeners = {};
  const ipcMain = {
    handle: (channel, fn) => { handlers[channel] = fn; },
    on: (channel, fn) => { listeners[channel] = fn; },
  };
  const dialogCalls = [];
  const dialog = { showMessageBox: async (_parent, options) => { dialogCalls.push(options); return { response }; } };
  const prompt = createPrompt({ BrowserWindow: FakeWindow, dialog, ipcMain, getParent: () => ({ panel: true }), preloadPath: 'p.js', htmlPath: 'p.html' });
  const send = (sender, payload) => listeners['prompt:done']({ sender: { id: sender } }, payload);
  const getConfig = sender => handlers['prompt:get']({ sender: { id: sender } });
  const sendSize = (sender, height) => listeners['prompt:size']?.({ sender: { id: sender } }, height);
  return { prompt, windows, send, getConfig, sendSize, dialogCalls };
}

const OPTIONS = { title: 'T', message: 'M', fields: [{ label: 'A', placeholder: 'p', secure: true, initial: '' }, { label: 'B', placeholder: '', secure: false, initial: 'x' }] };

test('window is modal, sandboxed and isolated', async () => {
  const f = fakes();
  const pending = f.prompt.ask(OPTIONS);
  const prefs = f.windows[0].options.webPreferences;
  assert.equal(prefs.contextIsolation, true);
  assert.equal(prefs.sandbox, true);
  assert.equal(prefs.nodeIntegration, false);
  assert.equal(f.windows[0].options.modal, true);
  f.windows[0].close();
  await pending;
});

test('renderer gets its own config with default confirm label', async () => {
  const f = fakes();
  const pending = f.prompt.ask(OPTIONS);
  const config = f.getConfig(f.windows[0].webContents.id);
  assert.equal(config.title, 'T');
  assert.equal(config.confirm, 'Guardar en Windows');
  assert.deepEqual(config.fields.map(field => field.secure), [true, false]);
  assert.equal(f.getConfig(999), null);
  f.windows[0].close();
  await pending;
});

test('ask resolves trimmed values on submit and closes the window', async () => {
  const f = fakes();
  const pending = f.prompt.ask(OPTIONS);
  f.send(f.windows[0].webContents.id, { ok: true, values: [' a ', 'b\n'] });
  assert.deepEqual(await pending, ['a', 'b']);
  assert.equal(f.windows[0].isDestroyed(), true);
});

test('ask resolves null when cancelled', async () => {
  const f = fakes();
  const pending = f.prompt.ask(OPTIONS);
  f.send(f.windows[0].webContents.id, { ok: false });
  assert.equal(await pending, null);
});

test('ask resolves null when window closed without submit (Review Focus 5)', async () => {
  const f = fakes();
  const pending = f.prompt.ask(OPTIONS);
  f.windows[0].close();
  assert.equal(await pending, null);
});

test('ask ignores messages from other webContents', async () => {
  const f = fakes();
  const pending = f.prompt.ask(OPTIONS);
  f.send(999, { ok: true, values: ['evil', 'evil'] });
  let settled = false;
  pending.then(() => { settled = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false);
  f.windows[0].close();
  assert.equal(await pending, null);
});

test('ask rejects malformed values (wrong count or types) as cancel', async () => {
  const f = fakes();
  const pending = f.prompt.ask(OPTIONS);
  f.send(f.windows[0].webContents.id, { ok: true, values: ['only one'] });
  assert.equal(await pending, null);
});

test('window sizes to its content: useContentSize and prompt:size from own renderer', async () => {
  const f = fakes();
  const pending = f.prompt.ask(OPTIONS);
  const win = f.windows[0];
  assert.equal(win.options.useContentSize, true);
  const sizes = [];
  win.setContentSize = (w, h) => sizes.push([w, h]);
  f.sendSize(999, 300);
  f.sendSize(win.webContents.id, 452.4);
  f.sendSize(win.webContents.id, 99999);
  assert.deepEqual(sizes, [[500, 453], [500, 760]]);
  win.close();
  await pending;
});

test('confirm maps first button to true', async () => {
  assert.equal(await fakes({ response: 0 }).prompt.confirm({ title: 'T', message: 'M', confirm: 'Sí' }), true);
  const f = fakes({ response: 1 });
  assert.equal(await f.prompt.confirm({ title: 'T', message: 'M', confirm: 'Sí' }), false);
  assert.deepEqual(f.dialogCalls[0].buttons, ['Sí', 'Cancelar']);
});
