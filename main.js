// ==========================================
// ARCHIVO: main.js
// Propósito: Motor de Electron, conexión con el SO, Gestión de Archivos y Seguridad
// ==========================================
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'base_datos_profesores.json');
const licenciasPath = path.join(userDataPath, 'Licencias');
const backupsPath = path.join(userDataPath, 'Backups');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('views/login.html');
}

app.whenReady().then(() => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ profesores: [], feriadosGlobales: [] }));
  }
  if (!fs.existsSync(licenciasPath)) fs.mkdirSync(licenciasPath, { recursive: true });
  if (!fs.existsSync(backupsPath)) fs.mkdirSync(backupsPath, { recursive: true });
  createWindow();
});

// ==========================================
// AUTENTICACIÓN SEGURA EN EL MOTOR
// ==========================================
ipcMain.handle('verificar-configuracion', async () => {
  try {
    if (!fs.existsSync(dbPath)) return { existeUsuario: false };
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    return { existeUsuario: !!(data.configuracion && data.configuracion.usuario) };
  } catch (error) {
    return { existeUsuario: false };
  }
});

ipcMain.handle('crear-usuario-inicial', async (event, datos) => {
  try {
    let data = { profesores: [], feriadosGlobales: [] };
    if (fs.existsSync(dbPath)) {
      data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }
    data.configuracion = datos;
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) { return false; }
});

ipcMain.handle('intentar-login', async (event, { usuario, password }) => {
  try {
    if (!fs.existsSync(dbPath)) return { exito: false };
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const config = data.configuracion;
    if (config && config.usuario === usuario && config.password === password) {
      return { exito: true };
    }
    return { exito: false };
  } catch (error) { return { exito: false }; }
});

// ==========================================
// BASE DE DATOS Y RESPALDOS
// ==========================================
ipcMain.handle('leer-datos', async () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { profesores: [], feriadosGlobales: [] };
  }
});

ipcMain.handle('guardar-datos', async (event, datosNuevos) => {
  try {
    const dataString = JSON.stringify(datosNuevos, null, 2);
    fs.writeFileSync(dbPath, dataString);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreBackup = `backup_${timestamp}.json`;
    const rutaBackup = path.join(backupsPath, nombreBackup);
    fs.writeFileSync(rutaBackup, dataString);

    const archivosBackup = fs.readdirSync(backupsPath)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupsPath, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (archivosBackup.length > 10) {
      archivosBackup.slice(10).forEach(archivo => fs.unlinkSync(path.join(backupsPath, archivo.name)));
    }
    return true;
  } catch (error) { return false; }
});

// ==========================================
// ARCHIVOS FÍSICOS
// ==========================================
ipcMain.handle('adjuntar-licencia', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Seleccionar Documento',
    properties: ['openFile'],
    filters: [{ name: 'Documentos', extensions: ['pdf', 'jpg', 'jpeg', 'png'] }]
  });
  if (canceled || filePaths.length === 0) return null;
  const rutaOrigen = filePaths[0];
  const nombreArchivoUnico = `licencia_${Date.now()}${path.extname(rutaOrigen)}`;
  const rutaDestino = path.join(licenciasPath, nombreArchivoUnico);
  try {
    fs.copyFileSync(rutaOrigen, rutaDestino);
    return nombreArchivoUnico;
  } catch (error) { return null; }
});

ipcMain.handle('abrir-licencia', async (event, nombreArchivo) => {
  const rutaCompleta = path.join(licenciasPath, nombreArchivo);
  if (fs.existsSync(rutaCompleta)) {
    await shell.openPath(rutaCompleta);
    return true;
  }
  return false;
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });