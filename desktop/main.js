'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, session, shell } = require('electron');
const { createStore } = require('./lib/store');
const { createPrompt } = require('./lib/prompt');
const { createMetaService, META_APP_ID, GRAPH_VERSION, META_SCOPES } = require('./lib/meta');
const { runMetaLogin } = require('./lib/meta-login');
const { createGoogleService } = require('./lib/google');
const { createHandler, isAuthorizedSender } = require('./lib/bridge');

// El panel (HTML/JS local) no tiene acceso a red (CSP connect-src 'none').
// Pide datos a esta capa nativa mediante window.codepos.call (preload.js).
// La capa nativa nunca devuelve tokens ni secretos: solo estados y cifras agregadas.

app.setName('CodePOS MX Dashboard');
app.setAppUserModelId('mx.codepos.dashboard.local');
app.setPath('userData', path.join(app.getPath('appData'), 'CodePOS MX Dashboard'));

const dashboardRoot = app.isPackaged
  ? path.join(process.resourcesPath, 'Dashboard')
  : path.join(__dirname, '..', 'private-dashboard-build');
const pageFile = path.join(dashboardRoot, 'index.html');

let mainWindow = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  app.whenReady().then(start);
}

app.on('window-all-closed', () => app.quit());

// Ninguna ventana creada por la app puede abrir otras ni navegar a sitios no previstos.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', event => event.preventDefault());
});

function buildMenu() {
  // Menú mínimo para que funcionen copiar/pegar en los campos.
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Archivo', submenu: [{ label: 'Salir de CodePOS MX Dashboard', role: 'quit' }] },
    {
      label: 'Edición',
      submenu: [
        { label: 'Cortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Pegar', role: 'paste' },
        { label: 'Seleccionar todo', role: 'selectAll' },
      ],
    },
  ]));
}

function start() {
  if (!fs.existsSync(pageFile)) {
    dialog.showErrorBox('No se pudo abrir el dashboard', 'No se encontró el panel local de CodePOS MX.');
    app.quit();
    return;
  }
  buildMenu();

  const store = createStore({ dir: app.getPath('userData'), safeStorage });
  const prompt = createPrompt({
    BrowserWindow, dialog, ipcMain,
    getParent: () => mainWindow,
    preloadPath: path.join(__dirname, 'prompt', 'prompt-preload.js'),
    htmlPath: path.join(__dirname, 'prompt', 'prompt.html'),
  });
  const meta = createMetaService({
    store, ask: prompt.ask, confirm: prompt.confirm,
    login: parent => runMetaLogin({ BrowserWindow, session, appID: META_APP_ID, version: GRAPH_VERSION, scopes: META_SCOPES, parent }),
  });
  const google = createGoogleService({
    store, ask: prompt.ask,
    openExternal: url => shell.openExternal(url),
    focus: () => { if (mainWindow && !mainWindow.isDestroyed()) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } },
  });
  const handle = createHandler({ meta, google, openExternal: url => shell.openExternal(url), getWindow: () => mainWindow });

  // Puente JS ↔ nativo. Solo se aceptan mensajes del documento principal empaquetado.
  ipcMain.handle('codepos', async (event, body) => {
    const frame = event.senderFrame;
    if (!mainWindow || event.sender !== mainWindow.webContents || !frame
      || !isAuthorizedSender(frame.url, frame === event.sender.mainFrame, dashboardRoot)) {
      return { ok: false, error: 'Origen no autorizado.' };
    }
    const payload = body && typeof body === 'object' ? body : {};
    try {
      return { ok: true, value: await handle(String(payload.action ?? ''), payload) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  mainWindow = new BrowserWindow({
    width: 1440, height: 960, minWidth: 760, minHeight: 620, center: true, show: false,
    title: 'CodePOS MX · Panel de analítica', backgroundColor: '#f6f8fc', autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      partition: 'codepos-panel', // sin "persist:": nada del panel se guarda en disco
      contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false,
      devTools: !app.isPackaged,
    },
  });
  mainWindow.on('page-title-updated', event => event.preventDefault());
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  // Navegación restringida a los archivos locales del panel.
  const contents = mainWindow.webContents;
  contents.on('will-navigate', event => {
    if (!isAuthorizedSender(event.url, true, dashboardRoot)) event.preventDefault();
  });
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

  mainWindow.loadURL(pathToFileURL(pageFile).toString());
}
