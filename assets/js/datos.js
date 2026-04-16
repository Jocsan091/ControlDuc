const ASIGNATURAS = ['Artes visuales', 'Ciencias naturales', 'Comunicaci\u00f3n', 'Educaci\u00f3n f\u00edsica y salud', 'Historia, geograf\u00eda y ciencias sociales', 'Ingl\u00e9s', 'Lengua y literatura', 'Lenguaje', 'Matem\u00e1ticas', 'M\u00fasica', 'Orientaci\u00f3n', 'Religi\u00f3n', 'Tecnolog\u00eda', 'Taller art\u00edstico', 'Taller deportivo'];
const CURSOS = ['1\u00b0', '2\u00b0', '3\u00b0', '4\u00b0', '5\u00b0A', '5\u00b0B', '6\u00b0A', '6\u00b0B', '7\u00b0A', '7\u00b0B', '8\u00b0'];

var profesores = [];
var feriadosGlobales = [];
var horariosAnuales = [];
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
  if (modal) modal.replaceWith();
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
    if (!exito) console.error("Error cr\u00edtico guardando.");
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
}

window.formatearFechaGlobal = function(fechaStr) {
  if (!fechaStr) return '-';
  const partes = fechaStr.split('-');
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return fechaStr;
}
