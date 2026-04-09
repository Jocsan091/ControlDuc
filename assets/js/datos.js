// ==========================================
// ARCHIVO: assets/js/datos.js
// Propósito: Almacenar data global, BD, Feriados y Configuración
// ==========================================

const ASIGNATURAS = ['Artes visuales', 'Ciencias naturales', 'Comunicación', 'Educación física y salud', 'Historia, geografía y ciencias sociales', 'Inglés', 'Lengua y literatura', 'Lenguaje', 'Matemáticas', 'Música', 'Orientación', 'Religión', 'Tecnología', 'Taller artístico', 'Taller deportivo'];
const CURSOS = ['1°', '2°', '3°', '4°', '5°A', '5°B', '6°A', '6°B', '7°A', '7°B', '8°'];

// IMPORTANTE: Se usa 'var' para que Electron y todos los scripts lo reconozcan globalmente.
var profesores = [];
var feriadosGlobales = []; // Aquí se guardan los Interferiados manuales
var configuracion = {}; // Guarda la contraseña y datos del colegio

// === FUNCIÓN PUENTE PARA EVITAR ERRORES DE LECTURA ===
window.obtenerFeriados = function() {
  return feriadosGlobales;
};

// === MOTOR DE FERIADOS NACIONALES CHILENOS ===
var FERIADOS_FIJOS = [
  '01-01', // Año Nuevo
  '05-01', // Día del Trabajador
  '05-21', // Glorias Navales
  '06-21', // Día de los Pueblos Indígenas
  '06-29', // San Pedro y San Pablo
  '07-16', // Día de la Virgen del Carmen
  '08-15', // Asunción de la Virgen
  '09-18', // Primera Junta de Gobierno
  '09-19', // Glorias del Ejército
  '10-31', // Iglesias Evangélicas
  '11-01', // Todos los Santos
  '12-08', // Inmaculada Concepción
  '12-25'  // Navidad
];

var FERIADOS_MOBILES = [
  '2026-04-03', // Viernes Santo 2026
  '2026-04-04', // Sábado Santo 2026
  '2027-03-26', // Viernes Santo 2027
  '2027-03-27'  // Sábado Santo 2027
];

window.esFeriadoNacional = function(fechaStr) {
  const mesDia = fechaStr.substring(5); // Extrae "MM-DD"
  if (FERIADOS_FIJOS.includes(mesDia)) return { tipo: 'Feriado Oficial', desc: 'Feriado Nacional de Chile' };
  if (FERIADOS_MOBILES.includes(fechaStr)) return { tipo: 'Feriado Oficial', desc: 'Feriado Religioso' };
  return null;
}
// ===============================================

function cerrarModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

async function guardarDatosGlobales() {
  if (window.apiBaseDatos) {
    const exito = await window.apiBaseDatos.guardar({ 
      profesores: profesores, 
      feriadosGlobales: feriadosGlobales,
      configuracion: configuracion // Guardamos la config
    });
    if (!exito) console.error("Error crítico guardando.");
  }
}

async function cargarDatosIniciales() {
  if (window.apiBaseDatos) {
    const bd = await window.apiBaseDatos.leer();
    profesores = bd.profesores || [];
    feriadosGlobales = bd.feriadosGlobales || [];
    configuracion = bd.configuracion || {}; // Cargamos la config
    
    // Si estamos en el dashboard, aplicamos el nombre del colegio
    if (window.location.pathname.includes('dashboard.html') && configuracion.nombreColegio) {
      const brandP = document.querySelector('.sidebar-brand p');
      if (brandP) brandP.innerText = configuracion.nombreColegio;
    }
    
    if (typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
    if (typeof renderProfesores === 'function' && document.getElementById('listaProfesores')) renderProfesores();
    if (typeof window.renderFeriados === 'function') window.renderFeriados();
  }
}

cargarDatosIniciales();

window.formatearFechaGlobal = function(fechaStr) {
  if (!fechaStr) return '-';
  const partes = fechaStr.split('-');
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return fechaStr;
}