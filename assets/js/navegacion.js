window.inicializarNavegacion = function() {
  const menuInicio = document.getElementById('menuInicio');
  const menuProfesores = document.getElementById('menuProfesores');
  const menuHorariosAnuales = document.getElementById('menuHorariosAnuales');
  const menuResumen = document.getElementById('menuResumen');
  const menuInterferiados = document.getElementById('menuInterferiados');
  const menuResumenes = document.getElementById('menuResumenes');

  const vistaInicio = document.getElementById('vista-inicio');
  const vistaProfesores = document.getElementById('vista-profesores');
  const vistaHorariosAnuales = document.getElementById('vista-horariosanuales');
  const vistaDetalleProfesor = document.getElementById('vista-detalle-profesor');
  const vistaResumen = document.getElementById('vista-resumen');
  const vistaInterferiados = document.getElementById('vista-interferiados');
  const vistaResumenes = document.getElementById('vista-resumenes');

  const todasLasVistas = [vistaInicio, vistaProfesores, vistaHorariosAnuales, vistaDetalleProfesor, vistaResumen, vistaInterferiados, vistaResumenes];
  const todosLosMenus = [menuInicio, menuProfesores, menuHorariosAnuales, menuResumen, menuInterferiados, menuResumenes];

  window.cambiarVista = function(vistaDestino, menuActivo) {
    todasLasVistas.forEach((vista) => {
      if (!vista) return;
      vista.classList.remove('vista-activa');
      vista.classList.add('vista-oculta');
    });

    todosLosMenus.forEach((menu) => {
      if (menu) menu.classList.remove('active');
    });

    if (vistaDestino) {
      vistaDestino.classList.remove('vista-oculta');
      vistaDestino.classList.add('vista-activa');
    }

    if (menuActivo) menuActivo.classList.add('active');

    if (typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
  };

  if (menuInicio) menuInicio.addEventListener('click', (e) => {
    e.preventDefault();
    window.cambiarVista(vistaInicio, menuInicio);
  });

  if (menuProfesores) menuProfesores.addEventListener('click', (e) => {
    e.preventDefault();
    window.cambiarVista(vistaProfesores, menuProfesores);
    if (typeof renderProfesores === 'function') renderProfesores();
  });

  if (menuHorariosAnuales) menuHorariosAnuales.addEventListener('click', (e) => {
    e.preventDefault();
    window.cambiarVista(vistaHorariosAnuales, menuHorariosAnuales);
    if (typeof window.renderHorariosAnuales === 'function') window.renderHorariosAnuales();
  });

  if (menuResumen) menuResumen.addEventListener('click', (e) => {
    e.preventDefault();
    window.cambiarVista(vistaResumen, menuResumen);
    if (typeof renderListaDiaria === 'function') renderListaDiaria();
  });

  if (menuInterferiados) menuInterferiados.addEventListener('click', (e) => {
    e.preventDefault();
    window.cambiarVista(vistaInterferiados, menuInterferiados);
  });

  if (menuResumenes) menuResumenes.addEventListener('click', (e) => {
    e.preventDefault();
    window.cambiarVista(vistaResumenes, menuResumenes);
    if (typeof window.renderResumenesAnuales === 'function') window.renderResumenesAnuales();
  });

  const btnAccionProfesores = document.getElementById('btnAccionProfesores');
  if (btnAccionProfesores) btnAccionProfesores.addEventListener('click', () => {
    window.cambiarVista(vistaProfesores, menuProfesores);
    if (typeof renderProfesores === 'function') renderProfesores();
  });

  const btnAccionHorariosAnuales = document.getElementById('btnAccionHorariosAnuales');
  if (btnAccionHorariosAnuales) btnAccionHorariosAnuales.addEventListener('click', () => {
    window.cambiarVista(vistaHorariosAnuales, menuHorariosAnuales);
    if (typeof window.renderHorariosAnuales === 'function') window.renderHorariosAnuales();
  });

  const btnAccionResumen = document.getElementById('btnAccionResumen');
  if (btnAccionResumen) btnAccionResumen.addEventListener('click', () => {
    window.cambiarVista(vistaResumen, menuResumen);
    if (typeof renderListaDiaria === 'function') renderListaDiaria();
  });

  const btnAccionInterferiados = document.getElementById('btnAccionInterferiados');
  if (btnAccionInterferiados) btnAccionInterferiados.addEventListener('click', () => {
    window.cambiarVista(vistaInterferiados, menuInterferiados);
  });

  const btnAccionResumenes = document.getElementById('btnAccionResumenes');
  if (btnAccionResumenes) btnAccionResumenes.addEventListener('click', () => {
    window.cambiarVista(vistaResumenes, menuResumenes);
    if (typeof window.renderResumenesAnuales === 'function') window.renderResumenesAnuales();
  });

  function navegarYFiltrarResumen(filtro) {
    window.cambiarVista(vistaResumen, menuResumen);
    if (typeof window.aplicarFiltroResumen === 'function') window.aplicarFiltroResumen(filtro);
  }

  const cardTotalProfesores = document.getElementById('cardTotalProfesores');
  const cardLicenciasHoy = document.getElementById('cardLicenciasHoy');
  const cardFaltasHoy = document.getElementById('cardFaltasHoy');
  const cardAsistentesHoy = document.getElementById('cardAsistentesHoy');

  if (cardTotalProfesores) cardTotalProfesores.addEventListener('click', () => navegarYFiltrarResumen('todos'));
  if (cardLicenciasHoy) cardLicenciasHoy.addEventListener('click', () => navegarYFiltrarResumen('licencia'));
  if (cardFaltasHoy) cardFaltasHoy.addEventListener('click', () => navegarYFiltrarResumen('falta'));
  if (cardAsistentesHoy) cardAsistentesHoy.addEventListener('click', () => navegarYFiltrarResumen('presente'));

  if (menuInicio && vistaInicio) window.cambiarVista(vistaInicio, menuInicio);
};
