// ==========================================
// ARCHIVO: assets/js/navegacion.js
// Propósito: Manejar el cambio de pantallas y enrutamiento avanzado
// ==========================================

const menuInicio = document.getElementById('menuInicio');
const menuProfesores = document.getElementById('menuProfesores');
const menuResumen = document.getElementById('menuResumen');
const menuInterferiados = document.getElementById('menuInterferiados');

const vistaInicio = document.getElementById('vista-inicio');
const vistaProfesores = document.getElementById('vista-profesores');
const vistaDetalleProfesor = document.getElementById('vista-detalle-profesor');
const vistaResumen = document.getElementById('vista-resumen');
const vistaInterferiados = document.getElementById('vista-interferiados');

const todasLasVistas = [vistaInicio, vistaProfesores, vistaDetalleProfesor, vistaResumen, vistaInterferiados];
const todosLosMenus = [menuInicio, menuProfesores, menuResumen, menuInterferiados];

window.cambiarVista = function(vistaDestino, menuActivo) {
  todasLasVistas.forEach(vista => {
    if (vista) {
      vista.classList.remove('vista-activa');
      vista.classList.add('vista-oculta');
    }
  });

  todosLosMenus.forEach(menu => {
    if (menu) menu.classList.remove('active');
  });

  if (vistaDestino) {
    vistaDestino.classList.remove('vista-oculta');
    vistaDestino.classList.add('vista-activa');
  }
  
  if (menuActivo) {
    menuActivo.classList.add('active');
  }

  if (typeof actualizarDashboardInicio === 'function') {
    actualizarDashboardInicio();
  }
};

// Navegación Básica del Menú Lateral
if (menuInicio) menuInicio.addEventListener('click', (e) => { e.preventDefault(); window.cambiarVista(vistaInicio, menuInicio); });
if (menuProfesores) menuProfesores.addEventListener('click', (e) => { e.preventDefault(); window.cambiarVista(vistaProfesores, menuProfesores); if (typeof renderProfesores === 'function') renderProfesores(); });
if (menuResumen) menuResumen.addEventListener('click', (e) => { e.preventDefault(); window.cambiarVista(vistaResumen, menuResumen); if (typeof renderListaDiaria === 'function') renderListaDiaria(); });
if (menuInterferiados) menuInterferiados.addEventListener('click', (e) => { e.preventDefault(); window.cambiarVista(vistaInterferiados, menuInterferiados); });

const btnAccionProfesores = document.getElementById('btnAccionProfesores');
if (btnAccionProfesores) btnAccionProfesores.addEventListener('click', () => { window.cambiarVista(vistaProfesores, menuProfesores); if (typeof renderProfesores === 'function') renderProfesores(); });

const btnAccionResumen = document.getElementById('btnAccionResumen');
if (btnAccionResumen) btnAccionResumen.addEventListener('click', () => { window.cambiarVista(vistaResumen, menuResumen); if (typeof renderListaDiaria === 'function') renderListaDiaria(); });

// Enrutamiento desde Tarjetas
function navegarYFiltrarResumen(filtro) {
  window.cambiarVista(vistaResumen, menuResumen);
  if (typeof window.aplicarFiltroResumen === 'function') {
    window.aplicarFiltroResumen(filtro);
  }
}

const cardTotalProfesores = document.getElementById('cardTotalProfesores');
const cardLicenciasHoy = document.getElementById('cardLicenciasHoy');
const cardFaltasHoy = document.getElementById('cardFaltasHoy');
const cardAsistentesHoy = document.getElementById('cardAsistentesHoy');

if (cardTotalProfesores) cardTotalProfesores.addEventListener('click', () => navegarYFiltrarResumen('todos'));
if (cardLicenciasHoy) cardLicenciasHoy.addEventListener('click', () => navegarYFiltrarResumen('licencia'));
if (cardFaltasHoy) cardFaltasHoy.addEventListener('click', () => navegarYFiltrarResumen('falta'));
if (cardAsistentesHoy) cardAsistentesHoy.addEventListener('click', () => navegarYFiltrarResumen('presente'));

// ==========================================
// GATILLO INICIAL: Dispara la vista de inicio al cargar
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  if (menuInicio && vistaInicio) {
    window.cambiarVista(vistaInicio, menuInicio);
  }
});