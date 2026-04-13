const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'base_datos_profesores.json');
const licenciasPath = path.join(userDataPath, 'Licencias');
const backupsPath = path.join(userDataPath, 'Backups');

let sesionActiva = false;

function leerBaseDatos() {
  if (!fs.existsSync(dbPath)) {
    return { profesores: [], feriadosGlobales: [] };
  }

  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function escribirBaseDatos(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function generarHashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function passwordCoincide(password, salt, hashGuardado) {
  const hashActual = crypto.scryptSync(password, salt, 64);
  const hashEsperado = Buffer.from(hashGuardado, 'hex');

  if (hashActual.length !== hashEsperado.length) return false;
  return crypto.timingSafeEqual(hashActual, hashEsperado);
}

function obtenerConfiguracionPublica(configuracion = {}) {
  return {
    nombreColegio: configuracion.nombreColegio || '',
    usuario: configuracion.usuario || ''
  };
}

function existeUsuarioConfigurado(data) {
  return !!(data.configuracion && data.configuracion.usuario);
}

function respuestaSinAuth() {
  return { auth: false, profesores: [], feriadosGlobales: [] };
}

function obtenerDatosSeguros(data) {
  return {
    auth: true,
    profesores: data.profesores || [],
    feriadosGlobales: data.feriadosGlobales || []
  };
}

function obtenerRutaLicenciaSegura(nombreArchivo) {
  if (typeof nombreArchivo !== 'string' || !nombreArchivo.trim()) return null;

  const rutaCompleta = path.resolve(licenciasPath, path.normalize(nombreArchivo));
  const carpetaBase = path.resolve(licenciasPath) + path.sep;

  if (!rutaCompleta.startsWith(carpetaBase)) return null;
  return rutaCompleta;
}

function crearBackup(dataString) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const nombreBackup = `backup_${timestamp}.json`;
  const rutaBackup = path.join(backupsPath, nombreBackup);
  fs.writeFileSync(rutaBackup, dataString);

  const archivosBackup = fs.readdirSync(backupsPath)
    .filter((file) => file.startsWith('backup_') && file.endsWith('.json'))
    .map((file) => ({
      name: file,
      time: fs.statSync(path.join(backupsPath, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (archivosBackup.length > 10) {
    archivosBackup.slice(10).forEach((archivo) => {
      fs.unlinkSync(path.join(backupsPath, archivo.name));
    });
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  win.setMenuBarVisibility(false);
  const baseViewsPath = path.resolve(__dirname, 'views') + path.sep;
  win.webContents.on('will-navigate', (event, url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'file:') {
        const destinationPath = fileURLToPath(parsedUrl);
        const resolvedPath = path.resolve(destinationPath);
        if (resolvedPath.startsWith(baseViewsPath)) return;
      }
    } catch (error) {
    }

    event.preventDefault();
  });
  win.loadFile(path.join(__dirname, 'views', 'login.html'));
}

app.whenReady().then(() => {
  if (!fs.existsSync(dbPath)) {
    escribirBaseDatos({ profesores: [], feriadosGlobales: [] });
  }

  if (!fs.existsSync(licenciasPath)) fs.mkdirSync(licenciasPath, { recursive: true });
  if (!fs.existsSync(backupsPath)) fs.mkdirSync(backupsPath, { recursive: true });

  createWindow();
});

ipcMain.handle('verificar-configuracion', async () => {
  try {
    const data = leerBaseDatos();
    return { existeUsuario: existeUsuarioConfigurado(data) };
  } catch (error) {
    return { existeUsuario: false };
  }
});

ipcMain.handle('obtener-configuracion-publica', async () => {
  try {
    const data = leerBaseDatos();
    return obtenerConfiguracionPublica(data.configuracion);
  } catch (error) {
    return obtenerConfiguracionPublica();
  }
});

ipcMain.handle('crear-usuario-inicial', async (event, datos) => {
  try {
    const data = leerBaseDatos();
    if (existeUsuarioConfigurado(data)) return false;

    const { salt, hash } = generarHashPassword(datos.password);

    data.configuracion = {
      ...data.configuracion,
      usuario: datos.usuario,
      passwordHash: hash,
      passwordSalt: salt
    };

    delete data.configuracion.password;

    escribirBaseDatos(data);
    sesionActiva = false;
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('intentar-login', async (event, { usuario, password }) => {
  try {
    const data = leerBaseDatos();
    const config = data.configuracion;

    if (!config || config.usuario !== usuario) {
      sesionActiva = false;
      return { exito: false };
    }

    if (config.passwordHash && config.passwordSalt) {
      const exito = passwordCoincide(password, config.passwordSalt, config.passwordHash);
      sesionActiva = exito;
      return { exito };
    }

    if (config.password === password) {
      const { salt, hash } = generarHashPassword(password);
      data.configuracion = {
        ...config,
        passwordHash: hash,
        passwordSalt: salt
      };

      delete data.configuracion.password;
      escribirBaseDatos(data);
      sesionActiva = true;
      return { exito: true };
    }

    sesionActiva = false;
    return { exito: false };
  } catch (error) {
    sesionActiva = false;
    return { exito: false };
  }
});

ipcMain.handle('cerrar-sesion', async () => {
  sesionActiva = false;
  return true;
});

ipcMain.handle('estado-sesion', async () => {
  return { autenticado: sesionActiva };
});

ipcMain.handle('leer-datos', async () => {
  try {
    if (!sesionActiva) return respuestaSinAuth();

    const data = leerBaseDatos();
    return obtenerDatosSeguros(data);
  } catch (error) {
    return sesionActiva ? obtenerDatosSeguros({}) : respuestaSinAuth();
  }
});

ipcMain.handle('guardar-datos', async (event, datosNuevos) => {
  try {
    if (!sesionActiva) return false;

    const dataActual = leerBaseDatos();
    const dataFinal = {
      profesores: datosNuevos.profesores || [],
      feriadosGlobales: datosNuevos.feriadosGlobales || [],
      configuracion: dataActual.configuracion || {}
    };

    const dataString = JSON.stringify(dataFinal, null, 2);
    fs.writeFileSync(dbPath, dataString);
    crearBackup(dataString);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('adjuntar-licencia', async () => {
  if (!sesionActiva) return null;

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
  } catch (error) {
    return null;
  }
});

ipcMain.handle('abrir-licencia', async (event, nombreArchivo) => {
  if (!sesionActiva) return false;

  const rutaCompleta = obtenerRutaLicenciaSegura(nombreArchivo);
  if (!rutaCompleta) return false;

  if (fs.existsSync(rutaCompleta)) {
    await shell.openPath(rutaCompleta);
    return true;
  }

  return false;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
