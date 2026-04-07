// ==========================================
// ARCHIVO: assets/js/navegacion.js
// Propósito: Manejar el cambio de pantallas y disparar los módulos lógicos
// ==========================================

const menuInicio = document.getElementById('menuInicio');
const menuProfesores = document.getElementById('menuProfesores');
const menuResumen = document.getElementById('menuResumen');
const menuConfiguracion = document.getElementById('menuConfiguracion');

const vistaInicio = document.getElementById('vista-inicio');
const vistaProfesores = document.getElementById('vista-profesores');
const vistaDetalleProfesor = document.getElementById('vista-detalle-profesor');
const vistaResumen = document.getElementById('vista-resumen');
const vistaConfiguracion = document.getElementById('vista-configuracion');

const todasLasVistas = [vistaInicio, vistaProfesores, vistaDetalleProfesor, vistaResumen, vistaConfiguracion];
const todosLosMenus = [menuInicio, menuProfesores, menuResumen, menuConfiguracion];

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

  // Obligamos a que los números de la pantalla de inicio se refresquen cada vez que te muevas
  if (typeof actualizarDashboardInicio === 'function') {
    actualizarDashboardInicio();
  }
};

if (menuInicio) menuInicio.addEventListener('click', (e) => { e.preventDefault(); window.cambiarVista(vistaInicio, menuInicio); });
if (menuProfesores) menuProfesores.addEventListener('click', (e) => { e.preventDefault(); window.cambiarVista(vistaProfesores, menuProfesores); if (typeof renderProfesores === 'function') renderProfesores(); });
if (menuResumen) menuResumen.addEventListener('click', (e) => { e.preventDefault(); window.cambiarVista(vistaResumen, menuResumen); if (typeof renderListaDiaria === 'function') renderListaDiaria(); });
if (menuConfiguracion) menuConfiguracion.addEventListener('click', (e) => { e.preventDefault(); window.cambiarVista(vistaConfiguracion, menuConfiguracion); });

const btnAccionProfesores = document.getElementById('btnAccionProfesores');
if (btnAccionProfesores) btnAccionProfesores.addEventListener('click', () => { window.cambiarVista(vistaProfesores, menuProfesores); if (typeof renderProfesores === 'function') renderProfesores(); });

const btnAccionResumen = document.getElementById('btnAccionResumen');
if (btnAccionResumen) btnAccionResumen.addEventListener('click', () => { window.cambiarVista(vistaResumen, menuResumen); if (typeof renderListaDiaria === 'function') renderListaDiaria(); });