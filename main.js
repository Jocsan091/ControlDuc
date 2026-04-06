// ==========================================
// ARCHIVO: main.js
// Propósito: Motor de Electron y conexión con el sistema operativo
// ==========================================
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Ruta segura donde Windows guarda los datos de las aplicaciones (AppData)
const dbPath = path.join(app.getPath('userData'), 'base_datos_profesores.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // El puente de seguridad
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('views/login.html');
}

app.whenReady().then(() => {
  // Si el archivo JSON no existe, lo creamos vacío
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ profesores: [] }));
  }
  
  createWindow();
});

// --- CANALES DE COMUNICACIÓN (Backend) ---

// Escucha cuando el frontend pide leer los datos
ipcMain.handle('leer-datos', async () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo DB:", error);
    return { profesores: [] };
  }
});

// Escucha cuando el frontend manda datos nuevos para guardar
ipcMain.handle('guardar-datos', async (event, datosNuevos) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(datosNuevos, null, 2));
    return true;
  } catch (error) {
    console.error("Error guardando DB:", error);
    return false;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});