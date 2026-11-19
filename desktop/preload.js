'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Única puerta del panel hacia la capa nativa. Solo devuelve estados y cifras agregadas, nunca tokens.
contextBridge.exposeInMainWorld('codepos', {
  call: async (action, payload = {}) => {
    const reply = await ipcRenderer.invoke('codepos', { ...payload, action });
    if (!reply || reply.ok !== true) throw new Error(reply?.error || 'Error desconocido.');
    return reply.value;
  },
});
