// ==========================================
// ARCHIVO: assets/js/navegacion.js
// Propósito: Manejar el cambio de pantallas (Router SPA)
// ==========================================

const menuInicio = document.getElementById('menuInicio');
const menuProfesores = document.getElementById('menuProfesores');

const vistaInicio = document.getElementById('vista-inicio');
const vistaProfesores = document.getElementById('vista-profesores');
const vistaDetalleProfesor = document.getElementById('vista-detalle-profesor');

const todasLasVistas = [vistaInicio, vistaProfesores, vistaDetalleProfesor];
const todosLosMenus = [menuInicio, menuProfesores];

// Función global para cambiar pantallas (expuesta para que profesores.js la use)
window.cambiarVista = function(vistaDestino, menuActivo) {
  // Ocultar todo
  todasLasVistas.forEach(vista => {
    if (vista) {
      vista.classList.remove('vista-activa');
      vista.classList.add('vista-oculta');
    }
  });

  // Limpiar menús
  todosLosMenus.forEach(menu => {
    if (menu) menu.classList.remove('active');
  });

  // Mostrar la vista que queremos
  if (vistaDestino) {
    vistaDestino.classList.remove('vista-oculta');
    vistaDestino.classList.add('vista-activa');
  }
  
  // Pintar el menú
  if (menuActivo) {
    menuActivo.classList.add('active');
  }
};

// Eventos de click
if (menuInicio) {
  menuInicio.addEventListener('click', (e) => {
    e.preventDefault();
    window.cambiarVista(vistaInicio, menuInicio);
  });
}

if (menuProfesores) {
  menuProfesores.addEventListener('click', (e) => {
    e.preventDefault();
    window.cambiarVista(vistaProfesores, menuProfesores);
    if (typeof renderProfesores === 'function') {
      renderProfesores();
    }
  });
}

const btnProfesoresInicio = document.getElementById('btnProfesores');
if (btnProfesoresInicio) {
  btnProfesoresInicio.addEventListener('click', () => {
    window.cambiarVista(vistaProfesores, menuProfesores);
    if (typeof renderProfesores === 'function') {
      renderProfesores();
    }
  });
}