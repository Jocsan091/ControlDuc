// ==========================================
// ARCHIVO: preload.js
// Propósito: Puente seguro entre la vista (HTML) y el sistema (Node.js)
// ==========================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiBaseDatos', {
  leer: () => ipcRenderer.invoke('leer-datos'),
  guardar: (datos) => ipcRenderer.invoke('guardar-datos', datos)
});

contextBridge.exposeInMainWorld('apiArchivos', {
  adjuntarLicencia: () => ipcRenderer.invoke('adjuntar-licencia'),
  abrirLicencia: (nombreArchivo) => ipcRenderer.invoke('abrir-licencia', nombreArchivo)
});

// NUEVO: Exposición de la API de seguridad
contextBridge.exposeInMainWorld('apiAuth', {
  verificarConfiguracion: () => ipcRenderer.invoke('verificar-configuracion'),
  crearUsuarioInicial: (datos) => ipcRenderer.invoke('crear-usuario-inicial', datos),
  login: (credenciales) => ipcRenderer.invoke('intentar-login', credenciales)
});