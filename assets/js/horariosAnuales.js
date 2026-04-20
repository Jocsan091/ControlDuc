function formatearFechaParaInput(fechaStr) {
  return fechaStr || '';
}

window.obtenerDiasActivosPorDefecto = function() {
  return {
    lunes: true,
    martes: true,
    miercoles: true,
    jueves: true,
    viernes: true
  };
};

window.renderDiasActivosSelector = function(prefix, diasActivos = {}) {
  const dias = [
    { key: 'lunes', abbr: 'LU' },
    { key: 'martes', abbr: 'MA' },
    { key: 'miercoles', abbr: 'MI' },
    { key: 'jueves', abbr: 'JU' },
    { key: 'viernes', abbr: 'VI' }
  ];

  return `
    <div class="dias-activos-grid">
      <div class="dias-activos-nombres">
        ${dias.map(d => `<div>${d.abbr}</div>`).join('')}
      </div>
      <div class="dias-activos-toggles">
        ${dias.map(d => `
          <label class="toggle-dia" for="${prefix}dia-${d.key}">
            <input type="checkbox" id="${prefix}dia-${d.key}" data-dia="${d.key}" class="dias-activos-checkbox" ${diasActivos[d.key] ? 'checked' : ''}>
            <span></span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
};

window.obtenerDiasActivosDeModal = function(prefix = '') {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  return dias.reduce((resultado, dia) => {
    const input = document.getElementById(`${prefix}dia-${dia}`);
    resultado[dia] = !!(input && input.checked);
    return resultado;
  }, {});
};

function obtenerDiaMes(fechaStr) {
  if (!fechaStr) return '';
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return '';
  return `${partes[2]}-${partes[1]}`;
}

window.formatearEntradaDiaMes = function(valor) {
  const soloDigitos = valor.replace(/\D/g, '').slice(0, 4);
  if (soloDigitos.length <= 2) return soloDigitos;
  return `${soloDigitos.slice(0, 2)}-${soloDigitos.slice(2)}`;
};

window.construirFechaDesdeDiaMes = function(diaMes, anio) {
  const [dia, mes] = diaMes.split('-');
  return `${anio}-${mes}-${dia}`;
};

window.validarDiaMes = function(valor) {
  if (!/^\d{2}-\d{2}$/.test(valor)) return false;
  const [dia, mes] = valor.split('-').map(Number);
  if (!dia || !mes) return false;
  return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12;
};

window.validarFechaISO = function(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
};

window.validarSemestres = function(inicio1, fin1, inicio2, fin2) {
  return !(inicio1 > fin1 || inicio2 > fin2 || fin1 >= inicio2);
};

window.obtenerHorarioAnualPorAnio = function(anio) {
  return horariosAnuales.find((horario) => horario.anio === anio) || null;
};

window.profesorTieneHorarioAnio = function(indexProfesor, anio, indexHorarioActual = null) {
  return profesores[indexProfesor].horarios.some((horario, index) => horario.anio === anio && index !== indexHorarioActual);
};

window.crearHorarioClonadoDesdePlantilla = function(plantilla, diasActivos) {
  return {
    anio: plantilla.anio,
    inicioSemestre1: plantilla.inicioSemestre1,
    finSemestre1: plantilla.finSemestre1,
    inicioSemestre2: plantilla.inicioSemestre2,
    finSemestre2: plantilla.finSemestre2,
    diasActivos: diasActivos || plantilla.diasActivos || window.obtenerDiasActivosPorDefecto(),
    faltas: [],
    licencias: [],
    horarioClases: crearHorarioClasesBase()
  };
};

window.obtenerAniosPrecargadosDisponibles = function(indexProfesor, indexHorarioActual = null) {
  const aniosOcupados = new Set(
    profesores[indexProfesor].horarios
      .filter((horario, index) => index !== indexHorarioActual)
      .map((horario) => horario.anio)
  );

  return horariosAnuales.filter((horario) => !aniosOcupados.has(horario.anio));
};

window.crearCampoFechaConAnioHtml = function(config) {
  return `
    <div class="date-field">
      <label class="d-block mb-1">${config.label}</label>
      <input type="date" id="${config.visibleId}" class="input-global w-100" value="${config.visibleValue || config.hiddenValue || ''}">
    </div>
  `;
};

window.inicializarCamposFechaConAnio = function(campos, getAnio) {
  const actualizarAnioEnCampos = (anio) => {
    campos.forEach(({ visibleId }) => {
      const visibleInput = document.getElementById(visibleId);
      if (!visibleInput) return;

      const anioValido = /^\d{4}$/.test(String(anio || '').trim());
      visibleInput.min = anioValido ? `${anio}-01-01` : '';
      visibleInput.max = anioValido ? `${anio}-12-31` : '';
    });
  };

  actualizarAnioEnCampos(getAnio());

  return {
    actualizarAnioEnCampos
  };
};

window.renderHorariosAnuales = function() {
  const lista = document.getElementById('listaHorariosAnuales');
  if (!lista) return;

  if (!horariosAnuales.length) {
    lista.innerHTML = '<div class="sin-profesores">No hay horarios anuales registrados.</div>';
  } else {
    lista.innerHTML = horariosAnuales.map((horario, index) => `
      <div class="horario-card bg-white mb-3">
        <div class="horario-info">
          <h3 class="mb-2">Horario ${horario.anio}</h3>
          <p>Semestre 1: ${window.formatearFechaGlobal(horario.inicioSemestre1)} a ${window.formatearFechaGlobal(horario.finSemestre1)}</p>
          <p>Semestre 2: ${window.formatearFechaGlobal(horario.inicioSemestre2)} a ${window.formatearFechaGlobal(horario.finSemestre2)}</p>
        </div>
        <div class="acciones-tarjeta">
          <button class="btn-opciones" onclick="toggleMenuOpciones(event, 'menu-horario-anual-${index}')">&#8942;</button>
          <div id="menu-horario-anual-${index}" class="menu-opciones">
            <button class="opcion-item" onclick="event.stopPropagation(); window.agregarHorarioAnual(${index})">Editar Fechas</button>
            <button class="opcion-item opcion-eliminar" onclick="event.stopPropagation(); window.eliminarHorarioAnual(${index})">Eliminar Horario</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  const btnAgregar = document.getElementById('btnAgregarHorarioAnual');
  if (btnAgregar) btnAgregar.onclick = () => window.agregarHorarioAnual();
};

window.agregarHorarioAnual = function(indexEdicion = null) {
  if (document.querySelector('.modal')) return;

  const horario = typeof indexEdicion === 'number' ? horariosAnuales[indexEdicion] : {};
  const camposFecha = [
    { label: 'Inicio Semestre 1', visibleId: 'inicioSemestre1Anual', hiddenId: 'hiddenInicioSemestre1Anual', suffixId: 'suffixInicioSemestre1Anual', visibleValue: formatearFechaParaInput(horario.inicioSemestre1), hiddenValue: formatearFechaParaInput(horario.inicioSemestre1), anio: horario.anio || '' },
    { label: 'Fin Semestre 1', visibleId: 'finSemestre1Anual', hiddenId: 'hiddenFinSemestre1Anual', suffixId: 'suffixFinSemestre1Anual', visibleValue: formatearFechaParaInput(horario.finSemestre1), hiddenValue: formatearFechaParaInput(horario.finSemestre1), anio: horario.anio || '' },
    { label: 'Inicio Semestre 2', visibleId: 'inicioSemestre2Anual', hiddenId: 'hiddenInicioSemestre2Anual', suffixId: 'suffixInicioSemestre2Anual', visibleValue: formatearFechaParaInput(horario.inicioSemestre2), hiddenValue: formatearFechaParaInput(horario.inicioSemestre2), anio: horario.anio || '' },
    { label: 'Fin Semestre 2', visibleId: 'finSemestre2Anual', hiddenId: 'hiddenFinSemestre2Anual', suffixId: 'suffixFinSemestre2Anual', visibleValue: formatearFechaParaInput(horario.finSemestre2), hiddenValue: formatearFechaParaInput(horario.finSemestre2), anio: horario.anio || '' }
  ];

  const diasActivosIniciales = horario.diasActivos || window.obtenerDiasActivosPorDefecto();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3>${typeof indexEdicion === 'number' ? 'Editar Horario Anual' : 'Nuevo Horario Anual'}</h3>
        ${window.renderDiasActivosSelector('anual-', diasActivosIniciales)}
        <div class="form-grid formulario-anual-grid">
          <div class="col-span-full">
            <label class="d-block mb-1">Año</label>
            <input type="text" id="anioHorarioAnual" class="input-global w-100" value="${window.escapeHtmlAttr(horario.anio || '')}" inputmode="numeric" maxlength="4" ${typeof indexEdicion === 'number' ? 'readonly' : ''}>
          </div>
          ${camposFecha.map((campo) => window.crearCampoFechaConAnioHtml(campo)).join('')}
        </div>
        <div id="errorHorarioAnual" class="text-danger fw-bold fs-md mt-3 text-center d-none"></div>
        <div class="modal-botones mt-4">
          <button id="guardarHorarioAnual" class="btn-principal">Guardar</button>
          <button id="cancelarHorarioAnual" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  const anioInput = document.getElementById('anioHorarioAnual');
  const controladorFechas = window.inicializarCamposFechaConAnio(camposFecha, () => anioInput.value.trim());
  anioInput.addEventListener('input', () => {
    anioInput.value = String(anioInput.value ?? '').replace(/\D/g, '').slice(0, 4);
    controladorFechas.actualizarAnioEnCampos(anioInput.value.trim());
  });

  document.getElementById('guardarHorarioAnual').addEventListener('click', async () => {
    const anio = anioInput.value.trim();
    const inicio1 = document.getElementById('inicioSemestre1Anual').value.trim();
    const fin1 = document.getElementById('finSemestre1Anual').value.trim();
    const inicio2 = document.getElementById('inicioSemestre2Anual').value.trim();
    const fin2 = document.getElementById('finSemestre2Anual').value.trim();
    const errorDiv = document.getElementById('errorHorarioAnual');

    if (!anio || !inicio1 || !fin1 || !inicio2 || !fin2) {
      errorDiv.innerText = 'Completa todos los campos del horario anual.';
      errorDiv.classList.remove('d-none');
      return;
    }

    if (!window.validarAnioEscolar(anio)) {
      errorDiv.innerText = 'El año debe tener exactamente 4 dígitos.';
      errorDiv.classList.remove('d-none');
      return;
    }

    if (![inicio1, fin1, inicio2, fin2].every(window.validarFechaISO)) {
      errorDiv.innerText = 'Completa las 4 fechas usando el selector de fecha.';
      errorDiv.classList.remove('d-none');
      return;
    }

    if (![inicio1, fin1, inicio2, fin2].every((fecha) => fecha.startsWith(`${anio}-`))) {
      errorDiv.innerText = 'Todas las fechas deben pertenecer al año indicado.';
      errorDiv.classList.remove('d-none');
      return;
    }

    const inicio1Fecha = inicio1;
    const fin1Fecha = fin1;
    const inicio2Fecha = inicio2;
    const fin2Fecha = fin2;

    if (!window.validarSemestres(inicio1Fecha, fin1Fecha, inicio2Fecha, fin2Fecha)) {
      errorDiv.innerText = 'Las fechas de los semestres están en orden incorrecto.';
      errorDiv.classList.remove('d-none');
      return;
    }

    if (typeof indexEdicion !== 'number' && horariosAnuales.some((item) => item.anio === anio)) {
      errorDiv.innerText = 'Ya existe un horario anual para ese año.';
      errorDiv.classList.remove('d-none');
      return;
    }

    const diasActivos = window.obtenerDiasActivosDeModal('anual-');
    if (!Object.values(diasActivos).some(Boolean)) {
      errorDiv.innerText = 'Debes dejar al menos un día activo en la semana.';
      errorDiv.classList.remove('d-none');
      return;
    }
    const horarioNuevo = {
      anio,
      inicioSemestre1: inicio1Fecha,
      finSemestre1: fin1Fecha,
      inicioSemestre2: inicio2Fecha,
      finSemestre2: fin2Fecha,
      diasActivos
    };

    if (typeof indexEdicion === 'number') {
      horariosAnuales[indexEdicion] = horarioNuevo;
    } else {
      horariosAnuales.push(horarioNuevo);
      horariosAnuales.sort((a, b) => a.anio.localeCompare(b.anio));
    }

    await guardarDatosGlobales();
    cerrarModal();
    window.renderHorariosAnuales();
  });

  document.getElementById('cancelarHorarioAnual').addEventListener('click', cerrarModal);
  if (typeof habilitarEnterEnModal === 'function') habilitarEnterEnModal('guardarHorarioAnual');
};

window.eliminarHorarioAnual = async function(index) {
  if (!horariosAnuales[index]) return;
  if (!confirm(`¿Eliminar el horario anual de ${horariosAnuales[index].anio}?`)) return;

  horariosAnuales.splice(index, 1);
  await guardarDatosGlobales();
  window.renderHorariosAnuales();
};


