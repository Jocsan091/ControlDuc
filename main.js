// ==========================================
// ARCHIVO: main.js
// Propósito: Motor de Electron, conexión con el SO, Gestión de Archivos Físicos y Backups Automáticos
// ==========================================
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// --- RUTAS SEGURAS (AppData del SO) ---
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'base_datos_profesores.json');
const licenciasPath = path.join(userDataPath, 'Licencias');

// NUEVO: Carpeta física donde se guardarán los respaldos de emergencia
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
  // 1. Si el JSON principal no existe, lo inicializamos vacío
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ profesores: [], feriadosGlobales: [] }));
  }
  
  // 2. Aseguramos que existan las carpetas críticas
  if (!fs.existsSync(licenciasPath)) fs.mkdirSync(licenciasPath, { recursive: true });
  if (!fs.existsSync(backupsPath)) fs.mkdirSync(backupsPath, { recursive: true });
  
  createWindow();
});

// ==========================================
// CANALES DE COMUNICACIÓN (Base de Datos)
// ==========================================

ipcMain.handle('leer-datos', async () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error crítico leyendo DB:", error);
    return { profesores: [], feriadosGlobales: [] };
  }
});

ipcMain.handle('guardar-datos', async (event, datosNuevos) => {
  try {
    const dataString = JSON.stringify(datosNuevos, null, 2);

    // 1. Guardado Principal
    fs.writeFileSync(dbPath, dataString);

    // 2. CREACIÓN DE BACKUP SILENCIOSO
    // Genera un nombre único con la fecha y hora actual (ej: backup_2026-04-10T14-30-00.json)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreBackup = `backup_${timestamp}.json`;
    const rutaBackup = path.join(backupsPath, nombreBackup);
    
    fs.writeFileSync(rutaBackup, dataString);

    // 3. LIMPIEZA AUTOMÁTICA (Rolling Backups)
    // Leemos la carpeta, ordenamos por fecha de modificación (del más nuevo al más viejo)
    const archivosBackup = fs.readdirSync(backupsPath)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupsPath, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    // Si hay más de 10 backups, borramos los más antiguos para no llenar el disco duro
    if (archivosBackup.length > 10) {
      const archivosABorrar = archivosBackup.slice(10); // Toma del elemento 11 en adelante
      archivosABorrar.forEach(archivo => {
        fs.unlinkSync(path.join(backupsPath, archivo.name));
      });
    }

    return true;
  } catch (error) {
    console.error("Error crítico guardando DB o creando Backup:", error);
    return false;
  }
});

// ==========================================
// CANALES DE COMUNICACIÓN (Archivos Físicos)
// ==========================================

ipcMain.handle('adjuntar-licencia', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Seleccionar Documento de Licencia (PDF o Imagen)',
    properties: ['openFile'],
    filters: [{ name: 'Documentos Válidos', extensions: ['pdf', 'jpg', 'jpeg', 'png'] }]
  });

  if (canceled || filePaths.length === 0) return null;

  const rutaOrigen = filePaths[0];
  const extension = path.extname(rutaOrigen);
  
  const nombreArchivoUnico = `licencia_${Date.now()}${extension}`;
  const rutaDestino = path.join(licenciasPath, nombreArchivoUnico);

  try {
    fs.copyFileSync(rutaOrigen, rutaDestino);
    return nombreArchivoUnico; 
  } catch (error) {
    console.error("Error copiando el archivo de licencia:", error);
    return null;
  }
});

ipcMain.handle('abrir-licencia', async (event, nombreArchivo) => {
  const rutaCompleta = path.join(licenciasPath, nombreArchivo);
  
  if (fs.existsSync(rutaCompleta)) {
    await shell.openPath(rutaCompleta);
    return true;
  } else {
    console.error("El archivo no se encontró en el disco duro.");
    return false;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});