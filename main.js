// ==========================================
// ARCHIVO: main.js
// Propósito: Motor de Electron, conexión con el SO y Gestión de Archivos Físicos
// ==========================================
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Rutas Seguras (AppData)
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'base_datos_profesores.json');

// NUEVO: Carpeta física donde se guardarán las copias de los PDFs de Licencias
const licenciasPath = path.join(userDataPath, 'Licencias');

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

  // Ocultamos el menú superior feo de Windows para que parezca una app moderna
  win.setMenuBarVisibility(false);
  win.loadFile('views/login.html');
}

app.whenReady().then(() => {
  // 1. Si el JSON no existe, lo creamos
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ profesores: [], feriadosGlobales: [] }));
  }
  
  // 2. Si la carpeta de Licencias no existe, la creamos silenciosamente
  if (!fs.existsSync(licenciasPath)) {
    fs.mkdirSync(licenciasPath, { recursive: true });
  }
  
  createWindow();
});

// --- CANALES DE COMUNICACIÓN (Base de Datos) ---

ipcMain.handle('leer-datos', async () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo DB:", error);
    return { profesores: [], feriadosGlobales: [] };
  }
});

ipcMain.handle('guardar-datos', async (event, datosNuevos) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(datosNuevos, null, 2));
    return true;
  } catch (error) {
    console.error("Error guardando DB:", error);
    return false;
  }
});

// --- NUEVOS CANALES DE COMUNICACIÓN (Archivos Físicos) ---

// Canal para abrir la ventana de Windows, seleccionar el PDF y COPIARLO a la app
ipcMain.handle('adjuntar-licencia', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Seleccionar Documento de Licencia (PDF o Imagen)',
    properties: ['openFile'],
    filters: [
      { name: 'Documentos Válidos', extensions: ['pdf', 'jpg', 'jpeg', 'png'] }
    ]
  });

  if (canceled || filePaths.length === 0) return null;

  const rutaOrigen = filePaths[0];
  const extension = path.extname(rutaOrigen);
  
  // Creamos un nombre único basado en la fecha y hora para que no se sobrescriban
  const nombreArchivoUnico = `licencia_${Date.now()}${extension}`;
  const rutaDestino = path.join(licenciasPath, nombreArchivoUnico);

  try {
    fs.copyFileSync(rutaOrigen, rutaDestino);
    // Devolvemos solo el nombre para que el frontend lo guarde en el JSON del profesor
    return nombreArchivoUnico; 
  } catch (error) {
    console.error("Error copiando el archivo:", error);
    return null;
  }
});

// Canal para que el usuario pueda abrir el PDF meses después
ipcMain.handle('abrir-licencia', async (event, nombreArchivo) => {
  const rutaCompleta = path.join(licenciasPath, nombreArchivo);
  
  if (fs.existsSync(rutaCompleta)) {
    // Abre el PDF con el lector predeterminado de Windows del inspector
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