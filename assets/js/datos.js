const ASIGNATURAS = ['Artes visuales', 'Ciencias naturales', 'Comunicación', 'Educación física y salud', 'Historia, geografía y ciencias sociales', 'Inglés', 'Lengua y literatura', 'Lenguaje', 'Matemáticas', 'Música', 'Orientación', 'Religión', 'Tecnología', 'Taller artístico', 'Taller deportivo'];
const CURSOS = ['1°', '2°', '3°', '4°', '5°A', '5°B', '6°A', '6°B', '7°A', '7°B', '8°'];

var profesores = [];
var feriadosGlobales = []; 
var configuracion = {}; 

window.obtenerFeriados = function() {
  return feriadosGlobales;
};

var FERIADOS_FIJOS = [
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
];

var FERIADOS_MOBILES = [
  '2026-04-03',
  '2026-04-04',
  '2027-03-26',
  '2027-03-27'
];

window.esFeriadoNacional = function(fechaStr) {
  const mesDia = fechaStr.substring(5);
  if (FERIADOS_FIJOS.includes(mesDia)) return { tipo: 'Feriado Oficial', desc: 'Feriado Nacional de Chile' };
  if (FERIADOS_MOBILES.includes(fechaStr)) return { tipo: 'Feriado Oficial', desc: 'Feriado Religioso' };
  return null;
}
function cerrarModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

async function guardarDatosGlobales() {
  if (window.apiBaseDatos) {
    const exito = await window.apiBaseDatos.guardar({ 
      profesores: profesores, 
      feriadosGlobales: feriadosGlobales,
      configuracion: configuracion
    });
    if (!exito) console.error("Error crítico guardando.");
  }
}

async function cargarDatosIniciales() {
  if (window.apiBaseDatos) {
    const bd = await window.apiBaseDatos.leer();
    profesores = bd.profesores || [];
    feriadosGlobales = bd.feriadosGlobales || [];
    configuracion = bd.configuracion || {};
    
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
