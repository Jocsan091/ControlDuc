const { contextBridge, ipcRenderer } = require('electron');

// Exponemos una API segura al frontend (tu HTML/JS)
contextBridge.exposeInMainWorld('apiBaseDatos', {
  leer: () => ipcRenderer.invoke('leer-datos'),
  guardar: (datos) => ipcRenderer.invoke('guardar-datos', datos)
});