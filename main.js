const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const crypto = require('crypto');
const { screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'base_datos_profesores.json');
const licenciasPath = path.join(userDataPath, 'Licencias');
const backupsPath = path.join(userDataPath, 'Backups');

let sesionActiva = false;
let mainWindow = null;

function normalizarUsuarioAcceso(valor = '') {
  return String(valor ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function passwordsCoincidenConTolerancia(passwordIngresada, salt, hashGuardado) {
  if (passwordCoincide(passwordIngresada, salt, hashGuardado)) return true;

  const passwordRecortada = String(passwordIngresada ?? '').trim();
  if (passwordRecortada && passwordRecortada !== passwordIngresada) {
    return passwordCoincide(passwordRecortada, salt, hashGuardado);
  }

  return false;
}

function leerBaseDatos() {
  if (!fs.existsSync(dbPath)) {
    return { profesores: [], feriadosGlobales: [], horariosAnuales: [] };
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
  return { auth: false, profesores: [], feriadosGlobales: [], horariosAnuales: [] };
}

function obtenerDatosSeguros(data) {
  return {
    auth: true,
    profesores: data.profesores || [],
    feriadosGlobales: data.feriadosGlobales || [],
    horariosAnuales: data.horariosAnuales || []
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
  const { workAreaSize } = screen.getPrimaryDisplay();
  const width = Math.max(320, Math.min(1200, workAreaSize.width));
  const height = Math.max(560, Math.min(800, workAreaSize.height));

  const win = new BrowserWindow({
    width,
    height,
    minWidth: 320,
    minHeight: 560,
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
  win.webContents.on('context-menu', (event, params) => {
    const textoSeleccionado = typeof params.selectionText === 'string' ? params.selectionText.trim() : '';
    const esCampoEditable = !!params.isEditable;

    if (!esCampoEditable && !textoSeleccionado) return;

    const menu = Menu.buildFromTemplate([
      ...(esCampoEditable ? [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'pasteAndMatchStyle', label: 'Pegar y mantener estilo' },
        { role: 'delete', label: 'Eliminar' },
        { type: 'separator' }
      ] : [
        { role: 'copy', label: 'Copiar' },
        { type: 'separator' }
      ]),
      { role: 'selectAll', label: 'Seleccionar todo' }
    ]);

    menu.popup({ window: win });
  });
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
  mainWindow = win;
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
}

function limpiarNombreArchivo(nombre = 'reporte') {
  return String(nombre).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim() || 'reporte';
}

async function guardarArchivoConDialogo(config) {
  if (!mainWindow) return { ok: false, cancelado: true };

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, config);
  if (canceled || !filePath) return { ok: false, cancelado: true };

  return { ok: true, filePath };
}

function escaparXml(valor = '') {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function crearExcelXmlResumen(payload = {}) {
  const resumen = Array.isArray(payload.resumen) ? payload.resumen : [];
  const detalle = Array.isArray(payload.detalle) ? payload.detalle : [];
  const titulo = payload.titulo || 'Resumen anual';
  const subtitulo = payload.subtitulo || '';

  const filasResumen = resumen.map((item) => `
      <Row>
        <Cell ss:StyleID="labelCell"><Data ss:Type="String">${escaparXml(item.label || '')}</Data></Cell>
        <Cell ss:StyleID="valueCell"><Data ss:Type="String">${escaparXml(item.value ?? '')}</Data></Cell>
      </Row>
  `).join('');

  const filasDetalle = detalle.map((fila) => `
      <Row>
        <Cell><Data ss:Type="String">${escaparXml(fila.fecha || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escaparXml(fila.dia || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escaparXml(fila.estado || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escaparXml(fila.detalle || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escaparXml(fila.motivo || '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escaparXml(fila.documento || '')}</Data></Cell>
      </Row>
  `).join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="title">
      <Font ss:Bold="1" ss:Size="14"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#EAF4E6" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="labelCell">
      <Font ss:Bold="1"/>
    </Style>
    <Style ss:ID="valueCell">
      <Interior ss:Color="#F8FBF6" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Resumen">
    <Table>
      <Column ss:Width="180"/>
      <Column ss:Width="180"/>
      <Row>
        <Cell ss:MergeAcross="1" ss:StyleID="title"><Data ss:Type="String">${escaparXml(titulo)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="1"><Data ss:Type="String">${escaparXml(subtitulo)}</Data></Cell>
      </Row>
      <Row />
      ${filasResumen}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Detalle diario">
    <Table>
      <Column ss:Width="90"/>
      <Column ss:Width="60"/>
      <Column ss:Width="110"/>
      <Column ss:Width="180"/>
      <Column ss:Width="220"/>
      <Column ss:Width="120"/>
      <Row>
        <Cell ss:StyleID="header"><Data ss:Type="String">Fecha</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Día</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Estado</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Detalle</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Motivo</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Documento</Data></Cell>
      </Row>
      ${filasDetalle}
    </Table>
  </Worksheet>
</Workbook>`;
}

function crearHtmlExportacionResumen(payload = {}) {
  const titulo = payload.titulo || 'Resumen anual';
  const subtitulo = payload.subtitulo || '';
  const resumen = Array.isArray(payload.resumen) ? payload.resumen : [];
  const detalle = Array.isArray(payload.detalle) ? payload.detalle : [];

  const resumenHtml = resumen.map((item) => `
    <div class="metric">
      <span>${item.label || ''}</span>
      <strong>${item.value ?? ''}</strong>
    </div>
  `).join('');

  const filasHtml = detalle.map((fila) => `
    <tr>
      <td>${fila.fecha || ''}</td>
      <td>${fila.dia || ''}</td>
      <td>${fila.estado || ''}</td>
      <td>${fila.detalle || ''}</td>
      <td>${fila.motivo || ''}</td>
      <td>${fila.documento || ''}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 28px; color: #1d2a1f; }
        h1 { margin: 0 0 6px 0; font-size: 28px; }
        p { margin: 0 0 18px 0; color: #4f5d52; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0 24px; }
        .metric { padding: 12px 14px; border: 1px solid #d9e2d4; border-radius: 12px; background: #f8fbf6; }
        .metric span { display: block; font-size: 12px; color: #58705d; margin-bottom: 4px; }
        .metric strong { font-size: 20px; color: #1f4e2d; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #d9e2d4; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; word-break: break-word; }
        th { background: #eef5ea; color: #1f4e2d; }
      </style>
    </head>
    <body>
      <h1>${titulo}</h1>
      <p>${subtitulo}</p>
      <section class="metrics">${resumenHtml}</section>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Día</th>
            <th>Estado</th>
            <th>Detalle</th>
            <th>Motivo</th>
            <th>Documento</th>
          </tr>
        </thead>
        <tbody>${filasHtml}</tbody>
      </table>
    </body>
    </html>
  `;
}

app.whenReady().then(() => {
  if (!fs.existsSync(dbPath)) {
    escribirBaseDatos({ profesores: [], feriadosGlobales: [], horariosAnuales: [] });
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

    const usuario = String(datos?.usuario ?? '').replace(/\s+/g, ' ').trim();
    const password = String(datos?.password ?? '');
    if (!usuario || !password) return false;

    const { salt, hash } = generarHashPassword(password);

    data.configuracion = {
      ...data.configuracion,
      usuario,
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
    const config = data.configuracion || {};
    const usuarioGuardado = normalizarUsuarioAcceso(config.usuario);
    const usuarioIngresado = normalizarUsuarioAcceso(usuario);

    if (!usuarioGuardado || usuarioGuardado !== usuarioIngresado) {
      sesionActiva = false;
      return { exito: false };
    }

    if (config.passwordHash && config.passwordSalt) {
      const exito = passwordsCoincidenConTolerancia(String(password ?? ''), config.passwordSalt, config.passwordHash);
      sesionActiva = exito;
      return { exito };
    }

    if (config.password === password || config.password === String(password ?? '').trim()) {
      const passwordMigrada = config.password === password ? password : String(password ?? '').trim();
      const { salt, hash } = generarHashPassword(passwordMigrada);
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
      horariosAnuales: datosNuevos.horariosAnuales || [],
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

ipcMain.handle('exportar-resumen-excel', async (event, payload = {}) => {
  try {
    if (!sesionActiva) return { ok: false, cancelado: false, mensaje: 'Debes iniciar sesión para exportar.' };
    if (!Array.isArray(payload.detalle) || !payload.detalle.length) {
      return { ok: false, cancelado: false, mensaje: 'No hay datos válidos para exportar.' };
    }

    const nombreBase = limpiarNombreArchivo(payload.nombre || 'resumen_anual');
    const resultado = await guardarArchivoConDialogo({
      title: 'Guardar resumen para Excel',
      defaultPath: `${nombreBase}.xls`,
      filters: [{ name: 'Libro de Excel', extensions: ['xls'] }]
    });

    if (!resultado.ok) return resultado;

    fs.writeFileSync(resultado.filePath, crearExcelXmlResumen(payload), 'utf8');
    return { ok: true, cancelado: false, ruta: resultado.filePath };
  } catch (error) {
    return { ok: false, cancelado: false, mensaje: `No se pudo exportar el archivo de Excel. ${error.message || ''}`.trim() };
  }
});

ipcMain.handle('exportar-resumen-pdf', async (event, payload = {}) => {
  let exportWindow = null;
  try {
    if (!sesionActiva) return { ok: false, cancelado: false, mensaje: 'Debes iniciar sesión para exportar.' };
    if (!Array.isArray(payload.detalle) || !payload.detalle.length) {
      return { ok: false, cancelado: false, mensaje: 'No hay datos válidos para exportar.' };
    }

    const nombreBase = limpiarNombreArchivo(payload.nombre || 'resumen_anual');
    const resultado = await guardarArchivoConDialogo({
      title: 'Guardar resumen en PDF',
      defaultPath: `${nombreBase}.pdf`,
      filters: [{ name: 'Documento PDF', extensions: ['pdf'] }]
    });

    if (!resultado.ok) return resultado;

    exportWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    const html = typeof payload.html === 'string' && payload.html.trim()
      ? payload.html
      : crearHtmlExportacionResumen(payload);
    await exportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await exportWindow.webContents.executeJavaScript(`
      new Promise((resolve) => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => resolve(true)).catch(() => resolve(true));
        } else {
          resolve(true);
        }
      });
    `);
    const pdfBuffer = await exportWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      marginsType: 1,
      landscape: false,
      preferCSSPageSize: true
    });

    fs.writeFileSync(resultado.filePath, pdfBuffer);
    return { ok: true, cancelado: false, ruta: resultado.filePath };
  } catch (error) {
    return { ok: false, cancelado: false, mensaje: `No se pudo exportar el PDF. ${error.message || ''}`.trim() };
  } finally {
    if (exportWindow && !exportWindow.isDestroyed()) exportWindow.close();
  }
});

ipcMain.handle('exportar-horario-clases-pdf', async (event, payload = {}) => {
  let exportWindow = null;
  try {
    if (!sesionActiva) return { ok: false, cancelado: false, mensaje: 'Debes iniciar sesión para exportar.' };
    if (typeof payload.html !== 'string' || !payload.html.trim()) {
      return { ok: false, cancelado: false, mensaje: 'No hay datos válidos para exportar.' };
    }

    const nombreBase = limpiarNombreArchivo(payload.nombre || 'horario_clases');
    const resultado = await guardarArchivoConDialogo({
      title: 'Guardar horario de clases en PDF',
      defaultPath: `${nombreBase}.pdf`,
      filters: [{ name: 'Documento PDF', extensions: ['pdf'] }]
    });

    if (!resultado.ok) return resultado;

    exportWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    await exportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(payload.html)}`);
    const pdfBuffer = await exportWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      marginsType: 1,
      landscape: true,
      preferCSSPageSize: true
    });

    fs.writeFileSync(resultado.filePath, pdfBuffer);
    return { ok: true, cancelado: false, ruta: resultado.filePath };
  } catch (error) {
    return { ok: false, cancelado: false, mensaje: `No se pudo exportar el horario de clases. ${error.message || ''}`.trim() };
  } finally {
    if (exportWindow && !exportWindow.isDestroyed()) exportWindow.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

