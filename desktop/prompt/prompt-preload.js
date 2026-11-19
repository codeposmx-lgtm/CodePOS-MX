'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codeposPrompt', {
  config: () => ipcRenderer.invoke('prompt:get'),
  submit: values => ipcRenderer.send('prompt:done', { ok: true, values }),
  cancel: () => ipcRenderer.send('prompt:done', { ok: false }),
  resize: height => ipcRenderer.send('prompt:size', height),
});
