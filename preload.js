// ==========================================
// ARCHIVO: preload.js
// Propósito: Puente seguro entre la vista (HTML) y el sistema (Node.js)
// ==========================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiBaseDatos', {
  leer: () => ipcRenderer.invoke('leer-datos'),
  guardar: (datos) => ipcRenderer.invoke('guardar-datos', datos)
});

// NUEVO: Exponemos las herramientas de archivos al frontend
contextBridge.exposeInMainWorld('apiArchivos', {
  adjuntarLicencia: () => ipcRenderer.invoke('adjuntar-licencia'),
  abrirLicencia: (nombreArchivo) => ipcRenderer.invoke('abrir-licencia', nombreArchivo)
});