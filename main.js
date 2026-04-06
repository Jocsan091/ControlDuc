const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Ruta segura en Windows (AppData) para que no haya problemas de permisos
const dbPath = path.join(app.getPath('userData'), 'base_datos_profesores.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      // El puente de seguridad obligatorio en Electron moderno
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('views/login.html');
}

app.whenReady().then(() => {
  createWindow();

  // Asegurarnos de que el archivo JSON exista al abrir la app
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ profesores: [] }));
  }
});

// --- CANALES DE COMUNICACIÓN (Backend) ---

// Canal para leer la base de datos
ipcMain.handle('leer-datos', async () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo DB:", error);
    return { profesores: [] };
  }
});

// Canal para guardar en la base de datos
ipcMain.handle('guardar-datos', async (event, datosNuevos) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(datosNuevos, null, 2));
    return true; // Éxito
  } catch (error) {
    console.error("Error guardando DB:", error);
    return false; // Fallo
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});