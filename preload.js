const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiBaseDatos', {
  leer: () => ipcRenderer.invoke('leer-datos'),
  guardar: (datos) => ipcRenderer.invoke('guardar-datos', datos)
});

contextBridge.exposeInMainWorld('apiArchivos', {
  adjuntarLicencia: () => ipcRenderer.invoke('adjuntar-licencia'),
  abrirLicencia: (nombreArchivo) => ipcRenderer.invoke('abrir-licencia', nombreArchivo)
});

contextBridge.exposeInMainWorld('apiAuth', {
  verificarConfiguracion: () => ipcRenderer.invoke('verificar-configuracion'),
  crearUsuarioInicial: (datos) => ipcRenderer.invoke('crear-usuario-inicial', datos),
  login: (credenciales) => ipcRenderer.invoke('intentar-login', credenciales),
  logout: () => ipcRenderer.invoke('cerrar-sesion'),
  estadoSesion: () => ipcRenderer.invoke('estado-sesion')
});

contextBridge.exposeInMainWorld('apiConfiguracion', {
  obtenerPublica: () => ipcRenderer.invoke('obtener-configuracion-publica')
});

contextBridge.exposeInMainWorld('apiExportacion', {
  exportarResumenPdf: (payload) => ipcRenderer.invoke('exportar-resumen-pdf', payload),
  exportarResumenExcel: (payload) => ipcRenderer.invoke('exportar-resumen-excel', payload),
  exportarHorarioClasesPdf: (payload) => ipcRenderer.invoke('exportar-horario-clases-pdf', payload)
});
