const ASIGNATURAS = ['Artes visuales', 'Ciencias naturales', 'Comunicación', 'Educación física y salud', 'Historia, geografía y ciencias sociales', 'Inglés', 'Lengua y literatura', 'Lenguaje', 'Matemáticas', 'Música', 'Orientación', 'Religión', 'Tecnología', 'Taller artístico', 'Taller deportivo'];
const CURSOS = ['1°', '2°', '3°', '4°', '5°A', '5°B', '6°A', '6°B', '7°A', '7°B', '8°'];

var profesores = [];
var feriadosGlobales = [];
var horariosAnuales = [];
var configuracion = {};

const PAISES_TELEFONO = [
  { codigo: '+56', nombre: 'Chile' },
  { codigo: '+54', nombre: 'Argentina' },
  { codigo: '+51', nombre: 'Perú' },
  { codigo: '+57', nombre: 'Colombia' },
  { codigo: '+52', nombre: 'México' },
  { codigo: '+1', nombre: 'EE. UU./Canadá' },
  { codigo: '+34', nombre: 'España' },
  { codigo: '+591', nombre: 'Bolivia' }
];

window.obtenerFeriados = function() {
  return feriadosGlobales;
};

window.escapeHtml = function(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

window.escapeHtmlAttr = function(valor) {
  return window.escapeHtml(valor).replace(/`/g, '&#96;');
};

window.normalizarEspacios = function(valor) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim();
};

window.normalizarUsuarioAcceso = function(valor) {
  return window.normalizarEspacios(valor).toLowerCase();
};

window.formatearTextoTitulo = function(valor) {
  return window.normalizarEspacios(valor)
    .toLowerCase()
    .replace(/\b([a-záéíóúñü])/g, (match) => match.toUpperCase());
};

window.formatearNombrePersona = function(valor) {
  return window.formatearTextoTitulo(valor)
    .replace(/\b(De|Del|La|Las|Los|Y)\b/g, (match) => match.toLowerCase());
};

window.formatearTextoLibre = function(valor) {
  return String(valor ?? '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

window.formatearNumeroLimitado = function(valor, min = 0, max = 9999) {
  const soloDigitos = String(valor ?? '').replace(/\D/g, '');
  if (!soloDigitos) return String(min);
  const numero = Math.min(Math.max(parseInt(soloDigitos, 10), min), max);
  return String(numero);
};

window.configurarInputNumerico = function(input, opciones = {}) {
  if (!input) return;

  const { min = 0, max = 9999, maxLength = 4, allowEmpty = false } = opciones;
  input.addEventListener('input', () => {
    let valor = String(input.value ?? '').replace(/\D/g, '').slice(0, maxLength);
    if (!valor && allowEmpty) {
      input.value = '';
      return;
    }

    if (!valor) valor = String(min);
    const numero = Math.min(Math.max(parseInt(valor, 10), min), max);
    input.value = String(numero);
  });
};

window.construirOpcionesPaisesTelefonoHtml = function(codigoSeleccionado = '+56') {
  return PAISES_TELEFONO.map((pais) => `
    <option value="${window.escapeHtmlAttr(pais.codigo)}" ${pais.codigo === codigoSeleccionado ? 'selected' : ''}>
      ${window.escapeHtml(pais.nombre)} (${window.escapeHtml(pais.codigo)})
    </option>
  `).join('');
};

window.descomponerTelefono = function(valor) {
  const limpio = window.normalizarEspacios(valor);
  if (!limpio) return { codigo: '+56', numero: '' };

  const match = limpio.match(/^(\+\d{1,4})\s*(.*)$/);
  if (!match) return { codigo: '+56', numero: limpio };

  return {
    codigo: match[1],
    numero: match[2] || ''
  };
};

window.formatearNumeroTelefono = function(numero, codigo = '+56') {
  const digitos = String(numero ?? '').replace(/\D/g, '');
  if (!digitos) return '';

  if (codigo === '+56') {
    if (digitos.length <= 1) return digitos;
    if (digitos.length <= 5) return `${digitos.slice(0, 1)} ${digitos.slice(1)}`.trim();
    return `${digitos.slice(0, 1)} ${digitos.slice(1, 5)} ${digitos.slice(5, 9)}`.trim();
  }

  if (codigo === '+54') {
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 6) return `${digitos.slice(0, 2)} ${digitos.slice(2)}`.trim();
    return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)} ${digitos.slice(6, 10)}`.trim();
  }

  if (codigo === '+1') {
    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 6) return `(${digitos.slice(0, 3)}) ${digitos.slice(3)}`;
    return `(${digitos.slice(0, 3)}) ${digitos.slice(3, 6)}-${digitos.slice(6, 10)}`;
  }

  const grupos = digitos.match(/.{1,3}/g) || [];
  return grupos.join(' ');
};

window.obtenerTelefonoCompleto = function(codigo, numero) {
  const numeroFormateado = window.formatearNumeroTelefono(numero, codigo);
  return numeroFormateado ? `${codigo} ${numeroFormateado}` : '';
};

window.inicializarCamposTelefono = function(scope = document) {
  scope.querySelectorAll('[data-phone-row]').forEach((fila) => {
    const select = fila.querySelector('.telefono-pais, .em-pais');
    const input = fila.querySelector('.telefono-numero, .em-tel');
    const hidden = fila.querySelector('.telefono-completo');

    if (!select || !input || input.dataset.telefonoInicializado === 'true') return;

    const sync = () => {
      input.value = window.formatearNumeroTelefono(input.value, select.value);
      if (hidden) hidden.value = window.obtenerTelefonoCompleto(select.value, input.value);
    };

    input.dataset.telefonoInicializado = 'true';
    input.addEventListener('input', sync);
    select.addEventListener('change', sync);
    sync();
  });
};

window.configurarFormatoTexto = function(input, formatter) {
  if (!input || typeof formatter !== 'function' || input.dataset.formatterInicializado === 'true') return;

  input.dataset.formatterInicializado = 'true';
  input.addEventListener('input', () => {
    const valorOriginal = input.value;
    const terminaConEspacio = /\s$/.test(valorOriginal);
    let valorFormateado = formatter(valorOriginal);

    // Permite seguir escribiendo nombres compuestos sin borrar el espacio final en cada tecla.
    if (terminaConEspacio && valorFormateado) valorFormateado = `${valorFormateado} `;
    if (valorOriginal !== valorFormateado) input.value = valorFormateado;
  });
};

window.configurarAccionesModal = function(config = {}) {
  const modal = config.modal || document.querySelector('.modal');
  if (!modal || modal.dataset.keyboardReady === 'true') return;

  modal.dataset.keyboardReady = 'true';
  const primaryButton = config.primaryButtonId ? document.getElementById(config.primaryButtonId) : null;
  const cancelButton = config.cancelButtonId ? document.getElementById(config.cancelButtonId) : null;

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (cancelButton) cancelButton.click();
      else cerrarModal();
      return;
    }

    if (event.key !== 'Enter') return;
    if (event.defaultPrevented || event.shiftKey) return;

    const tag = event.target.tagName;
    if (tag === 'TEXTAREA' && !event.ctrlKey && !event.metaKey) return;
    if (tag === 'BUTTON') return;

    if (primaryButton) {
      event.preventDefault();
      primaryButton.click();
    }
  });

  modal.addEventListener('pointerdown', (event) => {
    const campo = event.target.closest('input, textarea, select');
    if (!campo) return;
    requestAnimationFrame(() => campo.focus());
  });

  const primerCampo = modal.querySelector('input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]):not([readonly])');
  if (primerCampo) {
    setTimeout(() => primerCampo.focus(), 30);
  }
};

window.validarAnioEscolar = function(valor) {
  return /^\d{4}$/.test(String(valor ?? '').trim());
};

function calcularDomingoPascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

function formatearFechaIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

window.esFeriadoNacional = function(fechaStr) {
  const mesDia = fechaStr.substring(5);
  const feriadosFijos = new Set([
    '01-01',
    '05-01',
    '05-21',
    '06-21',
    '06-29',
    '07-16',
    '08-15',
    '09-18',
    '09-19',
    '10-31',
    '11-01',
    '12-08',
    '12-25'
  ]);

  if (feriadosFijos.has(mesDia)) return { tipo: 'Feriado Oficial', desc: 'Feriado Nacional de Chile' };

  const anio = parseInt(fechaStr.slice(0, 4), 10);
  if (Number.isNaN(anio)) return null;

  const domingoPascua = calcularDomingoPascua(anio);
  const viernesSanto = new Date(domingoPascua);
  viernesSanto.setDate(domingoPascua.getDate() - 2);
  const sabadoSanto = new Date(domingoPascua);
  sabadoSanto.setDate(domingoPascua.getDate() - 1);

  const feriadosMoviles = new Set([
    formatearFechaIso(viernesSanto),
    formatearFechaIso(sabadoSanto)
  ]);

  if (feriadosMoviles.has(fechaStr)) {
    return { tipo: 'Feriado Oficial', desc: 'Feriado Religioso' };
  }

  return null;
};

function cerrarModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!document.querySelector('.modal')) return;
  cerrarModal();
});

async function guardarDatosGlobales() {
  if (window.apiBaseDatos) {
    const exito = await window.apiBaseDatos.guardar({
      profesores: profesores,
      feriadosGlobales: feriadosGlobales,
      horariosAnuales: horariosAnuales
    });
    if (!exito) console.error('Error crítico guardando.');
  }
}

window.cargarDatosIniciales = async function() {
  const enLogin = window.location.pathname.includes('login.html');
  if (enLogin) return;

  if (window.apiBaseDatos) {
    const bd = await window.apiBaseDatos.leer();
    if (bd.auth === false) {
      window.location.replace('login.html');
      return;
    }

    profesores = bd.profesores || [];
    feriadosGlobales = bd.feriadosGlobales || [];
    horariosAnuales = bd.horariosAnuales || [];
    configuracion = window.apiConfiguracion ? await window.apiConfiguracion.obtenerPublica() : {};

    if (window.location.pathname.includes('dashboard.html') && configuracion.nombreColegio) {
      const brandP = document.querySelector('.sidebar-brand p:last-of-type');
      if (brandP) brandP.innerText = configuracion.nombreColegio;
    }

    if (window.location.pathname.includes('dashboard.html') && configuracion.usuario) {
      const usuarioTopbar = document.getElementById('topbarUsuario');
      if (usuarioTopbar) usuarioTopbar.innerText = configuracion.usuario;
    }

    if (typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
    if (typeof renderProfesores === 'function' && document.getElementById('listaProfesores')) renderProfesores();
    if (typeof window.renderHorariosAnuales === 'function') window.renderHorariosAnuales();
    if (typeof window.renderFeriados === 'function') window.renderFeriados();
    if (typeof renderListaDiaria === 'function' && document.getElementById('listaAsistenciaDiaria')) renderListaDiaria();
    if (typeof window.renderResumenesAnuales === 'function' && document.getElementById('contenidoResumenesAnuales')) window.renderResumenesAnuales();
  }
};

window.formatearFechaGlobal = function(fechaStr) {
  if (!fechaStr) return '-';
  const partes = fechaStr.split('-');
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return fechaStr;
};
