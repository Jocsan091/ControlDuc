function abrirModalRangoResumen(datosResumen) {
  if (document.querySelector('.modal')) return;

  const fechaMin = `${datosResumen.horario.anio}-01-01`;
  const fechaMax = `${datosResumen.horario.anio}-12-31`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3>Exportar PDF anual</h3>
        <p>Elige el período que quieres incluir en el PDF.</p>
        <div class="form-grid">
          <div>
            <label class="d-block mb-1">Desde</label>
            <input type="date" id="resumenFechaDesde" class="input-global w-100" min="${fechaMin}" max="${fechaMax}" value="${fechaMin}">
          </div>
          <div>
            <label class="d-block mb-1">Hasta</label>
            <input type="date" id="resumenFechaHasta" class="input-global w-100" min="${fechaMin}" max="${fechaMax}" value="${fechaMax}">
          </div>
        </div>
        <div id="errorExportacionResumen" class="text-danger fw-bold fs-sm mt-2 d-none"></div>
        <div class="modal-botones mt-3">
          <button id="confirmarExportacionResumen" class="btn-principal">Generar PDF</button>
          <button id="cancelarExportacionResumen" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('cancelarExportacionResumen').addEventListener('click', cerrarModal);
  document.getElementById('confirmarExportacionResumen').addEventListener('click', async () => {
    const fechaDesde = document.getElementById('resumenFechaDesde').value;
    const fechaHasta = document.getElementById('resumenFechaHasta').value;
    const error = document.getElementById('errorExportacionResumen');

    if (!fechaDesde || !fechaHasta) {
      error.textContent = 'Debes seleccionar ambas fechas.';
      error.classList.remove('d-none');
      return;
    }

    if (fechaDesde > fechaHasta) {
      error.textContent = 'La fecha inicial no puede ser mayor que la fecha final.';
      error.classList.remove('d-none');
      return;
    }

    const filasRango = filtrarFilasPorRango(datosResumen.filas, fechaDesde, fechaHasta);
    if (!filasRango.length) {
      error.textContent = 'No hay datos en el periodo seleccionado.';
      error.classList.remove('d-none');
      return;
    }

    error.classList.add('d-none');
    cerrarModal();
    await ejecutarExportacionResumenPdf(datosResumen, fechaDesde, fechaHasta);
  });
}

async function ejecutarExportacionResumenPdf(datosResumen, fechaDesde, fechaHasta) {
  const payload = construirPayloadPdf(datosResumen, fechaDesde, fechaHasta);
  payload.html = construirHtmlPdfResumen(datosResumen, fechaDesde, fechaHasta);
  const resultado = await window.apiExportacion.exportarResumenPdf(payload);

  if (resultado?.ok) {
    mostrarMensajeResumen('PDF anual generado correctamente.', 'success');
    return;
  }

  if (!resultado?.cancelado) {
    mostrarMensajeResumen(resultado?.mensaje || 'No se pudo exportar el PDF.', 'error');
  }
}

function mostrarMensajeResumen(texto, tipo = 'info') {
  const contenedor = document.getElementById('resumenesMensaje');
  if (!contenedor) return;

  contenedor.className = `resumen-alerta resumen-alerta-${tipo}`;
  contenedor.textContent = texto;
}

function limpiarMensajeResumen() {
  const contenedor = document.getElementById('resumenesMensaje');
  if (!contenedor) return;
  contenedor.className = 'resumen-alerta d-none';
  contenedor.textContent = '';
}

async function exportarResumenActual() {
  const profesor = profesores[estadoResumenes.profesorIndex];
  if (!profesor) {
    mostrarMensajeResumen('Primero selecciona un docente.', 'warning');
    return;
  }

  const horario = obtenerHorarioProfesor(estadoResumenes.profesorIndex, estadoResumenes.anio);
  if (!horario) {
    mostrarMensajeResumen('Selecciona un año válido antes de exportar.', 'warning');
    return;
  }

  const datosResumen = generarResumenAnualProfesor(profesor, horario);

  if (!window.apiExportacion) {
    mostrarMensajeResumen('La exportación solo funciona en la aplicación de escritorio.', 'warning');
    return;
  }

  limpiarMensajeResumen();
  abrirModalRangoResumen(datosResumen);
}

function renderListadoProfesores() {
  const contenedor = document.getElementById('contenidoResumenesAnuales');
  if (!contenedor) return;

  if (!profesores.length) {
    contenedor.innerHTML = `
      <div class="sin-profesores">
        <strong>Aún no hay docentes registrados.</strong>
        <p class="mt-2">Primero crea una ficha docente para generar resúmenes anuales.</p>
      </div>
    `;
    return;
  }

  const filtro = normalizarTexto(estadoResumenes.filtroListado);
  const lista = profesores.filter((profesor) => {
    if (!filtro) return true;
    return normalizarTexto(`${profesor.nombre} ${profesor.rut}`).includes(filtro);
  });

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="sin-profesores">
        <strong>No se encontraron docentes con ese criterio.</strong>
        <p class="mt-2">Prueba con otro nombre o RUT.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div class="lista-profesores">
      ${lista.map((profesor) => {
        const indexProfesor = profesores.indexOf(profesor);
        const anios = obtenerAniosProfesor(profesor);
        return `
          <article class="profesor-card clickable-card resumen-profesor-card" onclick="window.verResumenProfesor(${indexProfesor})">
            <div class="profesor-info">
              <h3>${escapeHtml(profesor.nombre || 'Sin nombre')}</h3>
              <p><strong>RUT:</strong> ${escapeHtml(profesor.rut || '-')}</p>
              <p><strong>Profesión:</strong> ${escapeHtml(profesor.profesion || '-')}</p>
              <p><strong>Años disponibles:</strong> ${anios.length ? anios.length : 0}</p>
              <div class="resumen-chip-row">
                ${anios.length
                  ? anios.map((item) => `<span class="resumen-chip">${escapeHtml(item.horario.anio)}</span>`).join('')
                  : '<span class="resumen-chip resumen-chip-neutro">Sin calendarios</span>'
                }
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderDetalleResumenProfesor() {
  const contenedor = document.getElementById('contenidoResumenesAnuales');
  if (!contenedor) return;

  const profesor = profesores[estadoResumenes.profesorIndex];
  if (!profesor) {
    estadoResumenes.profesorIndex = null;
    renderListadoProfesores();
    return;
  }

  const anios = obtenerAniosProfesor(profesor);
  if (!anios.length) {
    contenedor.innerHTML = `
      <div class="sin-profesores">
        <strong>${escapeHtml(profesor.nombre)} no tiene calendarios cargados.</strong>
        <p class="mt-2">Primero crea un horario anual para que el resumen pueda mostrar datos.</p>
        <button class="btn-secundario mt-3" onclick="window.volverAListadoResumenes()">Volver al listado</button>
      </div>
    `;
    return;
  }

  if (!estadoResumenes.anio || !anios.some((item) => item.horario.anio === estadoResumenes.anio)) {
    estadoResumenes.anio = anios[anios.length - 1].horario.anio;
  }

  const horario = obtenerHorarioProfesor(estadoResumenes.profesorIndex, estadoResumenes.anio);
  if (!horario) {
    mostrarMensajeResumen('No se pudo cargar el año seleccionado.', 'error');
    return;
  }

  const datosResumen = generarResumenAnualProfesor(profesor, horario);
  const filasFiltradas = filtrarFilasResumen(datosResumen.filas);
  estadoResumenes.ultimaVista = { datosResumen, filasFiltradas };

  contenedor.innerHTML = `
    <section class="resumenes-detalle">
      <div class="resumenes-acciones-superiores">
        <button class="btn-secundario" id="btnVolverResumenesListado">Volver al listado</button>
        <div class="d-flex gap-1 flex-wrap">
          <button class="btn-principal" id="btnExportarResumenPdf">Exportar PDF</button>
        </div>
      </div>

      <div id="resumenesMensaje" class="resumen-alerta d-none"></div>

      <section class="resumen-cabecera-anual">
        <article class="profesor-card resumen-bloque-lista">
          <div class="profesor-info">
            <h3>${escapeHtml(profesor.nombre || 'Docente')}</h3>
            <p><strong>RUT:</strong> ${escapeHtml(profesor.rut || '-')}</p>
            <p><strong>Profesión:</strong> ${escapeHtml(profesor.profesion || '-')}</p>
            <p><strong>Nacimiento:</strong> ${escapeHtml(formatearFechaVisual(profesor.fechaNacimiento) || '-')}</p>
          </div>
        </article>

        <aside class="resumen-leyenda-card">
          <h3>Guía breve</h3>
          <p>1. Elige el año en las pestañas.</p>
          <p>2. Revisa primero la lectura rápida.</p>
          <p>3. Exporta solo el período que necesites.</p>
        </aside>
      </section>

      <div class="resumen-tabs">
        ${anios.map((item) => `
          <button class="resumen-tab ${item.horario.anio === estadoResumenes.anio ? 'activo' : ''}" data-anio="${escapeHtml(item.horario.anio)}">
            ${escapeHtml(item.horario.anio)}
          </button>
        `).join('')}
      </div>

      ${construirResumenCompacto(datosResumen)}
      ${construirIndicadoresSecundarios(datosResumen)}

      <section class="resumen-paneles-grid">
        ${construirDetalleFechas('Inasistencias', datosResumen.detalle.inasistencias, 'inasistencia')}
        ${construirDetalleFechas('Permisos', datosResumen.detalle.permisos, 'permiso')}
        ${construirDetalleLicencias(datosResumen)}
      </section>

      <section class="resumen-bloque-lista">
        <div class="resumen-tabla-barra">
          <div class="resumen-tabla-controles">
            <input type="text" id="busquedaTablaResumenes" class="input-global resumen-busqueda-tabla" placeholder="Buscar por fecha, motivo o estado..." value="${escapeHtml(estadoResumenes.busquedaTabla)}">
            <div class="resumen-filtro-botones">
                <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'todo' ? 'activo' : ''}" data-filtro="todo">Todo el año</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'noLectivos' ? 'activo' : ''}" data-filtro="noLectivos">No lectivos</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'presentes' ? 'activo' : ''}" data-filtro="presentes">Presentes</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'licencias' ? 'activo' : ''}" data-filtro="licencias">Licencias</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'permisos' ? 'activo' : ''}" data-filtro="permisos">Permisos</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'inasistencias' ? 'activo' : ''}" data-filtro="inasistencias">Inasistencias</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'incidencias' ? 'activo' : ''}" data-filtro="incidencias">Solo incidencias</button>
            </div>
          </div>
          <span class="resumen-badge-ayuda">${filasFiltradas.length} fila(s) visibles</span>
        </div>
        ${construirTablaResumen(filasFiltradas)}
      </section>
    </section>
  `;

  const btnVolver = document.getElementById('btnVolverResumenesListado');
  if (btnVolver) btnVolver.addEventListener('click', () => window.volverAListadoResumenes());

  const inputBusquedaTabla = document.getElementById('busquedaTablaResumenes');
  if (inputBusquedaTabla) {
    inputBusquedaTabla.addEventListener('input', (event) => {
      estadoResumenes.busquedaTabla = event.target.value;
      renderDetalleResumenProfesor();
    });
  }

  document.querySelectorAll('.resumen-tab').forEach((boton) => {
    boton.addEventListener('click', () => {
      estadoResumenes.anio = boton.dataset.anio || '';
      estadoResumenes.busquedaTabla = '';
      estadoResumenes.filtroTabla = 'incidencias';
      limpiarMensajeResumen();
      renderDetalleResumenProfesor();
    });
  });

  document.querySelectorAll('.resumen-filtro-btn').forEach((boton) => {
    boton.addEventListener('click', () => {
      estadoResumenes.filtroTabla = boton.dataset.filtro || 'incidencias';
      limpiarMensajeResumen();
      renderDetalleResumenProfesor();
    });
  });

  const btnPdf = document.getElementById('btnExportarResumenPdf');
  if (btnPdf) btnPdf.addEventListener('click', () => exportarResumenActual());
}

window.verResumenProfesor = function(indexProfesor) {
  const profesor = profesores[indexProfesor];
  if (!profesor) {
    mostrarMensajeResumen('No se encontró el docente seleccionado.', 'error');
    return;
  }

  const anios = obtenerAniosProfesor(profesor);
  estadoResumenes.profesorIndex = indexProfesor;
  estadoResumenes.anio = anios.length ? anios[anios.length - 1].horario.anio : '';
  estadoResumenes.filtroTabla = 'incidencias';
  estadoResumenes.busquedaTabla = '';
  limpiarMensajeResumen();
  renderDetalleResumenProfesor();
};

window.volverAListadoResumenes = function() {
  estadoResumenes.profesorIndex = null;
  estadoResumenes.anio = '';
  estadoResumenes.filtroTabla = 'incidencias';
  estadoResumenes.busquedaTabla = '';
  limpiarMensajeResumen();
  renderListadoProfesores();
};

window.renderResumenesAnuales = function() {
  if (estadoResumenes.profesorIndex === null) {
    renderListadoProfesores();
    return;
  }
  renderDetalleResumenProfesor();
};

window.inicializarVistaResumenes = function() {
  const buscador = document.getElementById('buscadorResumenes');
  if (!buscador || buscador.dataset.inicializado === 'true') return;

  buscador.dataset.inicializado = 'true';
  buscador.addEventListener('input', (event) => {
    estadoResumenes.filtroListado = event.target.value;
    if (estadoResumenes.profesorIndex === null) renderListadoProfesores();
  });
};


