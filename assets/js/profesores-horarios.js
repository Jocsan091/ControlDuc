function crearCamposFechaHorario(prefix, horario = {}) {
  return [
    { label: 'Inicio Semestre 1', visibleId: `${prefix}Inicio1`, hiddenId: `${prefix}HiddenInicio1`, suffixId: `${prefix}SuffixInicio1`, visibleValue: formatearFechaParaInput(horario.inicioSemestre1), hiddenValue: formatearFechaParaInput(horario.inicioSemestre1), anio: horario.anio || '' },
    { label: 'Fin Semestre 1', visibleId: `${prefix}Fin1`, hiddenId: `${prefix}HiddenFin1`, suffixId: `${prefix}SuffixFin1`, visibleValue: formatearFechaParaInput(horario.finSemestre1), hiddenValue: formatearFechaParaInput(horario.finSemestre1), anio: horario.anio || '' },
    { label: 'Inicio Semestre 2', visibleId: `${prefix}Inicio2`, hiddenId: `${prefix}HiddenInicio2`, suffixId: `${prefix}SuffixInicio2`, visibleValue: formatearFechaParaInput(horario.inicioSemestre2), hiddenValue: formatearFechaParaInput(horario.inicioSemestre2), anio: horario.anio || '' },
    { label: 'Fin Semestre 2', visibleId: `${prefix}Fin2`, hiddenId: `${prefix}HiddenFin2`, suffixId: `${prefix}SuffixFin2`, visibleValue: formatearFechaParaInput(horario.finSemestre2), hiddenValue: formatearFechaParaInput(horario.finSemestre2), anio: horario.anio || '' }
  ];
}

function obtenerValoresFechasHorarioCompleta(campos, anio = '') {
  return campos.map((campo) => {
    const hiddenInput = document.getElementById(campo.hiddenId);
    const visibleInput = document.getElementById(campo.visibleId);
    if (hiddenInput && hiddenInput.value.trim()) return hiddenInput.value.trim();
    if (visibleInput) {
      const visibleValue = visibleInput.value.trim();
      if (window.validarFechaISO(visibleValue)) return visibleValue;
      if (anio && window.validarDiaMes(visibleValue)) return window.construirFechaDesdeDiaMes(visibleValue, anio);
    }
    return '';
  });
}

function renderCamposFechaHorario(campos) {
  return `<div class="form-grid formulario-anual-grid mt-2">${campos.map((campo) => window.crearCampoFechaConAnioHtml(campo)).join('')}</div>`;
}

function obtenerValoresFechasHorario(campos) {
  return campos.map((campo) => {
    const input = document.getElementById(campo.visibleId);
    return input ? input.value.trim() : '';
  });
}

function mostrarErrorHorario(mensaje) {
  const errorDiv = document.getElementById('errorHorarioProfesor');
  if (!errorDiv) return;
  errorDiv.innerText = mensaje;
  errorDiv.classList.remove('d-none');
}

function ocultarErrorHorario() {
  const errorDiv = document.getElementById('errorHorarioProfesor');
  if (!errorDiv) return;
  errorDiv.innerText = '';
  errorDiv.classList.add('d-none');
}

function actualizarFormularioPrecargado(ip) {
  const contenedor = document.getElementById('bloquePrecargadoOpciones');
  if (!contenedor) return;

  const disponibles = window.obtenerAniosPrecargadosDisponibles(ip);
  if (!disponibles.length) {
    contenedor.innerHTML = '<div class="ficha-resumen col-span-full"><p>No hay años precargados disponibles para este docente.</p></div>';
    return;
  }

  contenedor.innerHTML = `
    <div>
      <label class="d-block mb-1">Año precargado</label>
      <select id="selectHorarioPrecargado" class="input-global w-100">
        <option value="">Selecciona un año</option>
        ${disponibles.map((horario) => `<option value="${horario.anio}">${horario.anio}</option>`).join('')}
      </select>
    </div>
    <div id="camposHorarioPrecargado" class="oculto"></div>
  `;

  const select = document.getElementById('selectHorarioPrecargado');
  select.addEventListener('change', () => {
    const anio = select.value;
    const destino = document.getElementById('camposHorarioPrecargado');
    const plantilla = window.obtenerHorarioAnualPorAnio(anio);

    if (!anio || !plantilla) {
      destino.classList.add('oculto');
      destino.innerHTML = '';
      return;
    }

    destino.innerHTML = `
      <div class="ficha-resumen ficha-resumen-simple col-span-full">
        <p class="mb-2"><strong>Horario seleccionado: ${anio}</strong></p>
        <p class="mb-1">Semestre 1: ${formatearFecha(plantilla.inicioSemestre1)} a ${formatearFecha(plantilla.finSemestre1)}</p>
        <p>Semestre 2: ${formatearFecha(plantilla.inicioSemestre2)} a ${formatearFecha(plantilla.finSemestre2)}</p>
      </div>
    `;
    destino.classList.remove('oculto');
  });
}

function activarModoHorario(modo) {
  document.querySelectorAll('.opcion-modo-anio').forEach((opcion) => {
    opcion.classList.toggle('activo', opcion.dataset.modo === modo);
  });

  const bloquePersonalizado = document.getElementById('bloqueHorarioPersonalizado');
  const bloquePrecargado = document.getElementById('bloqueHorarioPrecargado');

  if (bloquePersonalizado) bloquePersonalizado.classList.toggle('oculto', modo !== 'personalizado');
  if (bloquePrecargado) bloquePrecargado.classList.toggle('oculto', modo !== 'precargado');
}

function renderSelectorModoHorario() {
  return `
    <div class="lista-profesores lista-opciones-horario">
      <label class="horario-card clickable-card opcion-modo-anio" data-modo="precargado" tabindex="0">
        <input type="radio" name="modoHorarioProfesor" value="precargado">
        <div class="horario-info">
          <h3 class="mb-2">Año precargado</h3>
          <p>Carga un año ya creado en Horarios Anuales y luego puedes ajustarlo si hace falta.</p>
        </div>
      </label>
      <label class="horario-card clickable-card opcion-modo-anio" data-modo="personalizado" tabindex="0">
        <input type="radio" name="modoHorarioProfesor" value="personalizado">
        <div class="horario-info">
          <h3 class="mb-2">Año personalizado</h3>
          <p>Crea un calendario propio para ese docente ingresando el año y las 4 fechas.</p>
        </div>
      </label>
    </div>
  `;
}

function mostrarFormularioHorario(ip, ih = null, modoInicial = null) {
  if (document.querySelector('.modal')) return;
  document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));

  const h = typeof ih === 'number' ? profesores[ip].horarios[ih] : {};
  const diasActivosIniciales = h.diasActivos || window.obtenerDiasActivosPorDefecto();
  const modo = modoInicial || (typeof ih === 'number' ? 'editar' : 'personalizado');

  if (modo === 'precargado' && typeof ih !== 'number') {
    const disponibles = window.obtenerAniosPrecargadosDisponibles(ip);
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal">
        <div class="modal-content modal-largo">
          <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
          <h3>Agregar horario sobrecargado</h3>
          <p class="fs-sm text-muted mt-0">Selecciona un año precargado para clonar sus fechas.</p>
          <div>
            <label class="d-block mb-1">Año precargado</label>
            <select id="selectHorarioPrecargado" class="input-global w-100">
              <option value="">Selecciona un año</option>
              ${disponibles.map((horario) => `<option value="${horario.anio}">${horario.anio}</option>`).join('')}
            </select>
          </div>
          <div class="mt-2">
            <p class="fs-sm text-muted mb-1">Escoge los días que el docente bajará durante la semana.</p>
            ${window.renderDiasActivosSelector('precargado-', window.obtenerDiasActivosPorDefecto())}
            <p class="fs-xs text-muted mt-1">Después de seleccionar el año precargado verás la información de semestres y podrás avanzar a la carga del horario de clases.</p>
          </div>
          <div id="previewHorarioPrecargado" class="oculto mt-2"></div>
          <div class="modal-botones mt-3"><button id="guardarHorarioPrecargado" class="btn-principal">Agregar horario</button><button id="cancelar" class="btn-secundario">Cancelar</button></div>
        </div>
      </div>
    `);

    const select = document.getElementById('selectHorarioPrecargado');
    const preview = document.getElementById('previewHorarioPrecargado');
    const guardarBtn = document.getElementById('guardarHorarioPrecargado');

    const actualizarPreview = () => {
      const anio = select.value;
      const plantilla = window.obtenerHorarioAnualPorAnio(anio);
      if (!anio || !plantilla) {
        preview.classList.add('oculto');
        preview.innerHTML = '';
        guardarBtn.disabled = true;
        return;
      }
      const diasActivosPlantilla = plantilla.diasActivos || window.obtenerDiasActivosPorDefecto();
      Object.entries(diasActivosPlantilla).forEach(([dia, activo]) => {
        const input = document.getElementById(`precargado-dia-${dia}`);
        if (input) input.checked = activo;
      });
      preview.innerHTML = `
        <div class="ficha-resumen ficha-resumen-simple col-span-full">
          <p class="mb-2"><strong>Horario seleccionado: ${anio}</strong></p>
          <p class="mb-1">Semestre 1: ${formatearFecha(plantilla.inicioSemestre1)} a ${formatearFecha(plantilla.finSemestre1)}</p>
          <p>Semestre 2: ${formatearFecha(plantilla.inicioSemestre2)} a ${formatearFecha(plantilla.finSemestre2)}</p>
        </div>
      `;
      preview.classList.remove('oculto');
      guardarBtn.disabled = false;
    };

    select.addEventListener('change', actualizarPreview);
    if (!disponibles.length) {
      preview.classList.remove('oculto');
      preview.innerHTML = '<div class="ficha-resumen col-span-full"><p>No hay años precargados disponibles para este docente.</p></div>';
      guardarBtn.disabled = true;
    }

    guardarBtn.addEventListener('click', async () => {
      const anio = select.value;
      if (!anio) return alert('Selecciona un año precargado para continuar.');
      const plantilla = window.obtenerHorarioAnualPorAnio(anio);
      if (!plantilla) return alert('El año seleccionado no es válido.');
      const diasActivos = window.obtenerDiasActivosDeModal('precargado-');
      profesores[ip].horarios.push(window.crearHorarioClonadoDesdePlantilla(plantilla, diasActivos));
      await guardarDatosGlobales(); cerrarModal(); verProfesor(ip);
    });

    document.getElementById('cancelar').addEventListener('click', cerrarModal);
    habilitarEnterEnModal('guardarHorarioPrecargado');
    return;
  }

  const camposFecha = crearCamposFechaHorario('profHorario', h);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3>${typeof ih === 'number' ? 'Editar Fechas' : 'Nuevo Horario'}</h3>
        <p class="fs-sm text-muted mt-0">Escoge los días que el docente bajará durante la semana.</p>
        ${window.renderDiasActivosSelector('horario-', diasActivosIniciales)}
        <div class="form-grid formulario-anual-grid">
          <div class="col-span-full">
            <label class="d-block mb-1">Año</label>
            <input type="text" id="anioHorario" class="input-global w-100" value="${window.escapeHtmlAttr(h.anio || '')}" inputmode="numeric" maxlength="4" ${typeof ih === 'number' ? 'readonly' : ''}>
          </div>
        </div>
        <p class="fs-xs text-muted mb-2">A continuación ingresa el año y las fechas de los semestres que formarán el calendario.</p>
        <div id="contenedorFechas" class="${typeof ih === 'number' ? '' : 'opacidad-mitad'}">
          ${renderCamposFechaHorario(camposFecha)}
        </div>
        <div class="modal-botones mt-3"><button id="guardarHorario" class="btn-principal">Guardar</button><button id="cancelar" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);

  const anioInp = document.getElementById('anioHorario');
  const contF = document.getElementById('contenedorFechas');
  const controladorFechas = window.inicializarCamposFechaConAnio(camposFecha, () => anioInp.value.trim());

  const actualizarLimites = () => {
    const val = anioInp.value.trim();
    if (val.length === 4) {
      contF.classList.remove('opacidad-mitad');
      controladorFechas.actualizarAnioEnCampos(val);
    } else {
      contF.classList.add('opacidad-mitad');
      controladorFechas.actualizarAnioEnCampos('');
    }
  };

  anioInp.addEventListener('input', () => {
    anioInp.value = String(anioInp.value ?? '').replace(/\D/g, '').slice(0, 4);
    actualizarLimites();
  });

  if (typeof ih === 'number') actualizarLimites();

  document.getElementById('guardarHorario').addEventListener('click', async () => {
    const anio = anioInp.value.trim();
    const [is1, fs1, is2, fs2] = obtenerValoresFechasHorarioCompleta(camposFecha, anio);

    if (!anio || !is1 || !fs1 || !is2 || !fs2) {
      return alert('Error: Debes completar todas las fechas de inicio y fin de ambos semestres.');
    }

    if (!window.validarAnioEscolar(anio)) {
      return alert('Error: El año debe tener 4 dígitos.');
    }

    if (typeof ih !== 'number' && profesores[ip].horarios.some((horario) => horario.anio === anio)) {
      return alert('Error: Este docente ya tiene un horario para ese año.');
    }

    if (!window.validarSemestres(is1, fs1, is2, fs2)) {
      return alert('Error lógico: Las fechas están desordenadas. Revisa que el inicio sea antes del fin, y el semestre 1 termine antes de que empiece el semestre 2.');
    }

    if (![is1, fs1, is2, fs2].every((fecha) => fecha.startsWith(`${anio}-`))) {
      return alert('Error: Todas las fechas deben pertenecer al año indicado.');
    }

    const diasActivos = window.obtenerDiasActivosDeModal('horario-');
    if (!Object.values(diasActivos).some(Boolean)) {
      return alert('Error: Debes dejar al menos un día activo en la semana.');
    }

    if (typeof ih !== 'number') {
      profesores[ip].horarios.push({ anio, inicioSemestre1: is1, finSemestre1: fs1, inicioSemestre2: is2, finSemestre2: fs2, diasActivos, faltas: [], licencias: [], horarioClases: crearHorarioClasesBase() });
    } else {
      const horarioActual = profesores[ip].horarios[ih];
      horarioActual.inicioSemestre1 = is1;
      horarioActual.finSemestre1 = fs1;
      horarioActual.inicioSemestre2 = is2;
      horarioActual.finSemestre2 = fs2;
      horarioActual.diasActivos = diasActivos;
    }
    await guardarDatosGlobales(); cerrarModal(); typeof ih !== 'number' ? verProfesor(ip) : verHorario(ip, ih);
  });

  document.getElementById('cancelar').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarHorario');
}

async function eliminarHorario(ip, ih) {
  if (confirm(`¿Seguro de eliminar el horario ${profesores[ip].horarios[ih].anio}?`)) {
    document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));
    profesores[ip].horarios.splice(ih, 1);
    await guardarDatosGlobales(); verProfesor(ip); 
  }
}

window.borrarFalta = async function(ip, ih, iFalta) {
  if(confirm('¿Seguro de borrar esta falta/permiso? El día volverá a quedar limpio.')) {
    profesores[ip].horarios[ih].faltas.splice(iFalta, 1);
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); mostrarAdministradorIncidencias(ip, ih); if(typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
  }
}

window.borrarLicencia = async function(ip, ih, iLic) {
  if(confirm('¿Seguro de borrar esta licencia médica?')) {
    profesores[ip].horarios[ih].licencias.splice(iLic, 1);
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); mostrarAdministradorIncidencias(ip, ih); if(typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
  }
}

window.abrirLicenciaPDF = async function(nombreArchivo) {
  if(window.apiArchivos) {
    const exito = await window.apiArchivos.abrirLicencia(nombreArchivo);
    if(!exito) alert("No se pudo abrir el archivo. Es posible que haya sido eliminado del disco duro.");
  } else {
    alert("Función no disponible en el navegador.");
  }
}

function mostrarAdministradorIncidencias(ip, ih) {
  if (document.querySelector('.modal')) return;
  const h = profesores[ip].horarios[ih];
  
  let fHtml = (h.faltas || []).map((f, i) => `
    <div class="d-flex justify-between align-center p-2 bg-gray-light border-muted border-radius-md mb-2">
      <div><strong class="text-primary">${formatearFecha(f.fecha)}</strong> - <span class="text-danger fw-bold">${window.escapeHtml(f.tipo)}</span><br><span class="fs-sm text-muted">Motivo: ${window.escapeHtml(f.motivo || '-')}</span></div>
      <button class="btn-danger py-1 px-2 fs-xs border-none cursor-pointer" onclick="borrarFalta(${ip}, ${ih}, ${i})">Borrar</button>
    </div>`).join('') || '<p class="text-muted fs-sm">No hay faltas registradas este año.</p>';

  let lHtml = (h.licencias || []).map((l, i) => {
    const btnArchivo = l.archivoAdjunto ? `<button class="btn-principal bg-success-light text-success border-success py-1 px-2 fs-xs border-none cursor-pointer mr-2" style="margin-right: 8px;" onclick="window.abrirLicenciaPDF(decodeURIComponent('${encodeURIComponent(l.archivoAdjunto)}'))">Ver Documento</button>` : '';

    return `
    <div class="d-flex justify-between align-center p-2 bg-gray-light border-muted border-radius-md mb-2">
      <div><strong class="text-primary">Del ${formatearFecha(l.fechaInicio)} al ${formatearFecha(l.fechaFin)}</strong> - <span class="text-warning fw-bold">Licencia</span><br><span class="fs-sm text-muted">Motivo: ${window.escapeHtml(l.motivo || '-')}</span></div>
      <div class="d-flex align-center">
        ${btnArchivo}
        <button class="btn-danger py-1 px-2 fs-xs border-none cursor-pointer" onclick="borrarLicencia(${ip}, ${ih}, ${i})">Borrar</button>
      </div>
    </div>`
  }).join('') || '<p class="text-muted fs-sm">No hay licencias registradas este año.</p>';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3>Administrar Registros de Asistencia</h3>
        <p class="fs-sm text-muted mt-0 mb-3">Borra registros ingresados por error. Los cambios se aplicarán de inmediato.</p>
        <h4 class="seccion-titulo">Faltas y Permisos</h4>${fHtml}
        <h4 class="seccion-titulo mt-4">Licencias Médicas</h4>${lHtml}
        <div class="modal-botones mt-4"><button onclick="cerrarModal()" class="btn-secundario">Cerrar Administrador</button></div>
      </div>
    </div>
  `);
}

function contarEstadosHorario(horario) {
  const listaFeriadosSegura = typeof window.obtenerFeriados === 'function' ? window.obtenerFeriados() : [];
  const hoyObj = new Date();
  const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
  const diasActivos = horario.diasActivos || (typeof window.obtenerDiasActivosPorDefecto === 'function' ? window.obtenerDiasActivosPorDefecto() : { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true });
  let asistidos = 0;
  let futuros = 0;
  let feriadosInterferencias = 0;
  let diasNoHabiles = 0;
  let inactivos = 0;

  const anio = parseInt(horario.anio, 10);
  if (Number.isNaN(anio)) return { asistidos, futuros, feriadosInterferencias, diasNoHabiles, inactivos };

  for (let m = 0; m < 12; m++) {
    const diasEnMes = new Date(anio, m + 1, 0).getDate();
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaActualStr = `${anio}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const fechaObj = new Date(anio, m, d);
      const diaSem = fechaObj.getDay();
      if (diaSem === 0 || diaSem === 6) continue;

      const nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][diaSem];
      const enSemestre1 = fechaActualStr >= horario.inicioSemestre1 && fechaActualStr <= horario.finSemestre1;
      const enSemestre2 = fechaActualStr >= horario.inicioSemestre2 && fechaActualStr <= horario.finSemestre2;
      const enSemestreActivo = enSemestre1 || enSemestre2;
      const esDiaActivo = diasActivos[nombreDia] !== false;
      const feriadoNacional = typeof window.esFeriadoNacional === 'function' ? window.esFeriadoNacional(fechaActualStr) : null;
      const feriadoManual = listaFeriadosSegura.find(f => f.fecha === fechaActualStr);
      const esDiaNoHabil = feriadoManual && feriadoManual.tipo === 'Día no hábil';
      const tieneLicencia = horario.licencias && horario.licencias.some(lic => fechaActualStr >= lic.fechaInicio && fechaActualStr <= lic.fechaFin);
      const tieneFalta = horario.faltas && horario.faltas.some(fal => fal.fecha === fechaActualStr);

      if (!enSemestreActivo || !esDiaActivo) {
        inactivos++;
      } else if (esDiaNoHabil) {
        diasNoHabiles++;
      } else if (feriadoNacional || feriadoManual) {
        feriadosInterferencias++;
      } else if (tieneLicencia || tieneFalta) {
        continue;
      } else if (fechaActualStr > hoyStr) {
        futuros++;
      } else {
        asistidos++;
      }
    }
  }

  return { asistidos, futuros, feriadosInterferencias, diasNoHabiles, inactivos };
}

function verHorario(ip, ih) {
  const p = profesores[ip]; const h = p.horarios[ih];
  if (!h.faltas) h.faltas = []; if (!h.licencias) h.licencias = [];
  const totalFaltas = h.faltas.length; const totalLicencias = h.licencias.length;
  const estados = contarEstadosHorario(h);

  document.getElementById('vista-detalle-profesor').innerHTML = `
    <header class="dashboard-topbar">
      <div class="d-flex align-center gap-3">
        <button class="btn-secundario border-radius-lg py-2 px-3 fs-sm" id="btnVolverProfesor">Volver</button>
        <div><h1 class="mb-1 fs-xxl line-height-1">${window.escapeHtml(p.nombre)}</h1><p class="m-0 fs-md">RUT: ${window.escapeHtml(p.rut)} | Calendario ${window.escapeHtml(h.anio)}</p></div>
      </div>
      <div class="d-flex gap-1 align-center">
        <button class="btn-secundario btn-outline-muted" id="btnAdministrarIncidencias">Registros</button>
        <button class="btn-secundario" id="btnHorarioClases">Ver Horario de Clases</button>
        <button class="btn-principal bg-danger-light border-danger text-danger" id="btnRegistrarFalta">Registrar Falta/Permiso</button>
        <button class="btn-principal bg-warning-light border-warning text-warning" id="btnRegistrarLicencia">Registrar Licencia</button>
      </div>
    </header>

    <div class="barra-estados-fija">
      <div class="estado-box estado-verde fs-sm py-2 px-2">Días asistidos: <strong>${estados.asistidos}</strong></div>
      <div class="estado-box estado-gris border-muted fs-sm py-2 px-2">Días futuros: <strong>${estados.futuros}</strong></div>
      <div class="estado-box estado-morado fs-sm py-2 px-2 border-morado">Feriados e interferiados: <strong>${estados.feriadosInterferencias}</strong></div>
      <div class="estado-box bg-azul-light text-azul border-azul fs-sm py-2 px-2">Días no hábiles: <strong>${estados.diasNoHabiles}</strong></div>
      <div class="estado-box estado-tachado border-dashed fs-sm py-2 px-2">Inactivo: <strong>${estados.inactivos}</strong></div>
      <div class="separador-vertical"></div>
      <div class="estado-box estado-rojo border-danger fs-sm py-2 px-2">Faltas: <strong>${totalFaltas}</strong></div>
      <div class="estado-box estado-amarillo border-warning fs-sm py-2 px-2">Licencias: <strong>${totalLicencias}</strong></div>
    </div>

    <section class="modulo-profesores">
      <section class="meses-grid">${generarMesesHorario(parseInt(h.anio), h)}</section>
    </section>
  `;
  document.getElementById('btnVolverProfesor').addEventListener('click', () => verProfesor(ip));
  document.getElementById('btnHorarioClases').addEventListener('click', () => verHorarioClases(ip, ih));
  document.getElementById('btnRegistrarFalta').addEventListener('click', () => mostrarFormularioFalta(ip, ih));
  document.getElementById('btnRegistrarLicencia').addEventListener('click', () => mostrarFormularioLicencia(ip, ih));
  document.getElementById('btnAdministrarIncidencias').addEventListener('click', () => mostrarAdministradorIncidencias(ip, ih));
}

function mostrarFormularioFalta(ip, ih) {
  if (document.querySelector('.modal')) return; const anio = profesores[ip].horarios[ih].anio;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3 class="text-danger">Registrar Falta o Permiso</h3>
        <select id="tipoFalta" class="input-global mb-2"><option value="Inasistencia">Inasistencia</option><option value="Permiso">Permiso</option></select>
        <label class="d-block mb-1">Día</label><input type="date" id="fechaFalta" min="${anio}-01-01" max="${anio}-12-31" class="input-global w-100 mb-2">
        <label class="d-block mb-1">Motivo</label><textarea id="motivoFalta" class="input-global w-100" style="resize: vertical; min-height: 80px;" maxlength="250"></textarea>
        <div class="modal-botones mt-3"><button id="guardarFalta" class="btn-danger">Registrar</button><button id="cancelarFalta" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);
  
  document.getElementById('guardarFalta').addEventListener('click', async () => {
    const t = document.getElementById('tipoFalta').value; 
    const f = document.getElementById('fechaFalta').value;
    const motivo = window.formatearTextoLibre(document.getElementById('motivoFalta').value);
    
    if (!f || f.split('-')[0] !== anio) return alert("Fecha inválida o fuera del año escolar.");
    if (!motivo) return alert("Debes escribir un motivo para registrar la falta o permiso.");

    const h = profesores[ip].horarios[ih];
    const fechaObj = new Date(f);
    const diaSemana = fechaObj.getDay();
    const nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][diaSemana];
    const diasActivos = h.diasActivos || window.obtenerDiasActivosPorDefecto();
    const enSemestre1 = f >= h.inicioSemestre1 && f <= h.finSemestre1;
    const enSemestre2 = f >= h.inicioSemestre2 && f <= h.finSemestre2;
    const enSemestreActivo = enSemestre1 || enSemestre2;
    const esDiaActivo = diasActivos[nombreDia] !== false;

    if (diaSemana === 0 || diaSemana === 6 || !enSemestreActivo || !esDiaActivo) {
      return alert('No puedes registrar una falta en un día inactivo o fuera del calendario de clases.');
    }

    const existeFalta = h.faltas.some(fal => fal.fecha === f);
    if (existeFalta) return alert(`Ya existe un registro de Inasistencia/Permiso para el día ${formatearFecha(f)}.`);

    const chocaConLicencia = h.licencias.some(lic => f >= lic.fechaInicio && f <= lic.fechaFin);
    if (chocaConLicencia) return alert(`No puedes registrar una falta. El día ${formatearFecha(f)} está cubierto por una licencia médica.`);
    profesores[ip].horarios[ih].faltas.push({ tipo: t, fecha: f, motivo });
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); if(typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
  });
  
  document.getElementById('cancelarFalta').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarFalta');
}

function mostrarFormularioLicencia(ip, ih) {
  if (document.querySelector('.modal')) return; const anio = profesores[ip].horarios[ih].anio;
  
  let archivoSeleccionado = null;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3 class="text-warning">Registrar Licencia Médica</h3>
        <div class="form-grid">
          <div><label class="d-block mb-1">Desde</label><input type="date" id="fILic" min="${anio}-01-01" max="${anio}-12-31" class="input-global w-100"></div>
          <div><label class="d-block mb-1">Hasta</label><input type="date" id="fFLic" min="${anio}-01-01" max="${anio}-12-31" class="input-global w-100"></div>
        </div>
        <label class="d-block mb-1 mt-2">Motivo</label><textarea id="motivoLic" class="input-global w-100" style="resize: vertical; min-height: 80px;" maxlength="250"></textarea>
        
        <label class="d-block mb-1 mt-2">Documento de Respaldo (PDF o Imagen)</label>
        <div class="d-flex gap-2 align-center mt-1">
          <button type="button" id="btnSubirArchivo" class="btn-secundario bg-gray-light border-muted fs-sm py-2">Buscar Archivo...</button>
          <span id="nombreArchivoUI" class="text-muted fs-xs">Ningún archivo seleccionado</span>
        </div>

        <div class="modal-botones mt-3"><button id="guardarLicencia" class="btn-principal bg-warning-light text-dark">Registrar</button><button id="cancelarLicencia" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);

  document.getElementById('btnSubirArchivo').addEventListener('click', async () => {
    if (window.apiArchivos) {
      const nombreFinal = await window.apiArchivos.adjuntarLicencia();
      if (nombreFinal) {
        archivoSeleccionado = nombreFinal;
        document.getElementById('nombreArchivoUI').innerText = "Archivo cargado correctamente.";
        document.getElementById('nombreArchivoUI').classList.add('text-success');
      }
    } else {
      alert("La subida de archivos solo funciona en la aplicación de escritorio instalada.");
    }
  });

  document.getElementById('guardarLicencia').addEventListener('click', async () => {
    const fi = document.getElementById('fILic').value; 
    const ff = document.getElementById('fFLic').value;
    const motivo = window.formatearTextoLibre(document.getElementById('motivoLic').value);
    
    if (!fi || !ff || fi.split('-')[0] !== anio) return alert("Fechas inválidas o fuera del año escolar.");
    if (fi > ff) return alert("Error lógico: La fecha de inicio no puede ser mayor a la fecha de fin.");
    if (!motivo) return alert("Debes indicar el motivo de la licencia.");

    const h = profesores[ip].horarios[ih];

    const chocaConOtraLicencia = h.licencias.some(lic => 
      (fi >= lic.fechaInicio && fi <= lic.fechaFin) || 
      (ff >= lic.fechaInicio && ff <= lic.fechaFin) ||
      (fi <= lic.fechaInicio && ff >= lic.fechaFin)
    );
    if (chocaConOtraLicencia) return alert("Error: el rango de fechas ingresado se cruza con otra licencia médica ya registrada en el sistema.");

    const chocaConFaltas = h.faltas.some(fal => fal.fecha >= fi && fal.fecha <= ff);
    if (chocaConFaltas) return alert("Error: Hay registros de Inasistencia o Permisos en los días de esta licencia. Debes ir a 'Ajustes', borrar las faltas de esos días, y luego ingresar la licencia.");
    profesores[ip].horarios[ih].licencias.push({ 
      fechaInicio: fi, 
      fechaFin: ff, 
      motivo,
      archivoAdjunto: archivoSeleccionado 
    });
    
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); if(typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
  });
  
  document.getElementById('cancelarLicencia').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarLicencia');
}

function verHorarioClases(ip, ih) {
  const p = profesores[ip]; const h = p.horarios[ih];
  document.getElementById('vista-detalle-profesor').innerHTML = `
    <header class="dashboard-topbar">
      <div class="d-flex align-center gap-3">
        <button class="btn-secundario border-radius-lg py-2 px-3 fs-sm" id="btnVolverCalendario">Volver</button>
        <div>
          <h1 class="mb-1 fs-xxl line-height-1">${window.escapeHtml(p.nombre)}</h1>
          <p class="m-0 fs-lg text-muted">Horario de clases ${h.anio}</p>
        </div>
      </div>
      <div class="d-flex gap-1 align-center">
        <button class="btn-principal" id="btnExportarHorarioClasesPdf">Exportar PDF</button>
      </div>
    </header>
    <section class="horario-clases-info mt-2" aria-label="Información del horario de clases">
      <div class="horario-clases-info-titulo">Horario de clases</div>
      <p class="horario-clases-info-texto">Incluye hora de llegada y salida de lunes a viernes.</p>
    </section>
    <section class="modulo-profesores">
      <section class="tabla-horario-contenedor"><table class="tabla-horario-clases"><thead><tr><th>Bloque</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>${generarFilasHorarioClases(ip, ih)}</tbody></table></section>
    </section>
  `;
  document.getElementById('btnVolverCalendario').addEventListener('click', () => verHorario(ip, ih));
  const btnExportarHorario = document.getElementById('btnExportarHorarioClasesPdf');
  if (btnExportarHorario) btnExportarHorario.addEventListener('click', () => exportarHorarioClasesPdf(ip, ih));
}

function construirFilasHorarioClasesExportables(horarioClases) {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const filas = [];

  filas.push({
    tipo: 'fila',
    label: 'Llegada',
    celdas: dias.map((dia) => ({
      valor: horarioClases[dia].llegada || '<span class="vacio">--:--</span>',
      clase: horarioClases[dia].llegada ? '' : 'vacio'
    }))
  });

  for (let bloque = 1; bloque <= 10; bloque++) {
    filas.push({
      tipo: 'fila',
      label: `Bloque ${bloque}`,
      celdas: dias.map((dia) => {
        if (dia === 'viernes' && bloque >= 7) {
          return { valor: 'X', clase: 'bloqueado' };
        }

        const valor = horarioClases[dia][bloque] || '<span class="vacio">Libre</span>';
        return { valor, clase: horarioClases[dia][bloque] ? '' : 'vacio' };
      })
    });

    if (bloque === 2 || bloque === 4 || bloque === 6) {
      filas.push({ tipo: 'separador', label: 'RECREO' });
    }

    if (bloque === 8) {
      filas.push({ tipo: 'separador', label: 'ALMUERZO' });
    }
  }

  filas.push({
    tipo: 'fila',
    label: 'Salida',
    celdas: dias.map((dia) => ({
      valor: horarioClases[dia].salida || '<span class="vacio">--:--</span>',
      clase: horarioClases[dia].salida ? '' : 'vacio'
    }))
  });

  return filas;
}

function construirHtmlHorarioClasesPdf(profesor, horario) {
  const filas = construirFilasHorarioClasesExportables(horario.horarioClases || crearHorarioClasesBase());

  const filasHtml = filas.map((fila) => {
    if (fila.tipo === 'separador') {
      return `<tr><td class="separador" colspan="6">${fila.label}</td></tr>`;
    }

    return `
      <tr>
        <td class="col-bloque">${fila.label}</td>
        ${fila.celdas.map((celda) => `<td class="${celda.clase || ''}">${celda.valor}</td>`).join('')}
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Horario de clases</title>
      <style>
        @page { size: A4 landscape; margin: 6mm; }
        body { font-family: Arial, sans-serif; margin: 8px; color: #1d2a1f; }
        h1 { margin: 0 0 2px 0; font-size: 18px; }
        p { margin: 0 0 8px 0; color: #4f5d52; font-size: 11px; }
        .pdf-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #d9e2d4; }
        .pdf-header img { width: 48px; height: 48px; object-fit: contain; }
        .pdf-header-text small { display: block; font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase; color: #58705d; margin-bottom: 2px; }
        .pdf-header-text strong { display: block; font-size: 14px; color: #1f4e2d; }
        .banda { display: flex; gap: 6px; margin: 8px 0 10px; }
        .pill { padding: 5px 8px; border-radius: 999px; background: #eef2ef; color: #445048; font-size: 10px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #d8d8d8; padding: 4px 3px; font-size: 9px; text-align: center; vertical-align: middle; word-break: break-word; line-height: 1.15; }
        th { background: #f3f5ef; color: #145a1f; font-size: 10px; }
        .col-bloque { background: #f9faf7; color: #145a1f; font-weight: bold; }
        .separador { background: #dff0df; color: #145a1f; font-weight: bold; letter-spacing: 1px; }
        .bloqueado { background: #f1f1f1; color: #777; text-decoration: line-through; font-weight: bold; }
        .vacio { color: #999; font-style: italic; }
      </style>
    </head>
    <body>
      <header class="pdf-header">
        <img src="__LOGO_INSTITUCIONAL__" alt="Logo institucional">
        <div class="pdf-header-text">
          <small>Documento institucional</small>
          <strong>Escuela Esperanza</strong>
        </div>
      </header>
      <h1>${window.escapeHtml(profesor.nombre)}</h1>
      <p>RUT: ${window.escapeHtml(profesor.rut)} | Horario de clases ${window.escapeHtml(horario.anio)}</p>
      <div class="banda">
        <span class="pill">Horario de clases</span>
        <span class="pill">Incluye llegada y salida de lunes a viernes</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Bloque</th>
            <th>Lunes</th>
            <th>Martes</th>
            <th>Miércoles</th>
            <th>Jueves</th>
            <th>Viernes</th>
          </tr>
        </thead>
        <tbody>${filasHtml}</tbody>
      </table>
    </body>
    </html>
  `;
}

async function exportarHorarioClasesPdf(ip, ih) {
  const profesor = profesores[ip];
  const horario = profesor?.horarios?.[ih];

  if (!profesor || !horario) {
    alert('No se pudo preparar el horario para exportar.');
    return;
  }

  if (!window.apiExportacion || typeof window.apiExportacion.exportarHorarioClasesPdf !== 'function') {
    alert('La exportación PDF solo funciona en la aplicación de escritorio.');
    return;
  }

  const resultado = await window.apiExportacion.exportarHorarioClasesPdf({
    nombre: `${profesor.nombre || 'docente'}_${horario.anio || 'horario'}_clases`,
    html: construirHtmlHorarioClasesPdf(profesor, horario)
  });

  if (!resultado?.ok && !resultado?.cancelado) {
    alert(resultado?.mensaje || 'No se pudo exportar el horario de clases.');
  }
}

function editarBloque(ip, ih, d, b) {
  if (document.querySelector('.modal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal"><div class="modal-content"><button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button><h3>Asignar bloque</h3><select id="sAsig" class="input-global mb-2 w-100"><option value="">Vacío</option>${ASIGNATURAS.map(a=>`<option value="${a}">${a}</option>`).join('')}</select><select id="sCur" class="input-global w-100"><option value="">Vacío</option>${CURSOS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select><div class="modal-botones"><button id="gAsig" class="btn-principal">Guardar</button><button onclick="cerrarModal()" class="btn-secundario">Cancelar</button></div></div></div>`);
  document.getElementById('gAsig').addEventListener('click', async () => { profesores[ip].horarios[ih].horarioClases[d][b] = document.getElementById('sAsig').value ? `${document.getElementById('sAsig').value} - ${document.getElementById('sCur').value}` : ''; await guardarDatosGlobales(); cerrarModal(); verHorarioClases(ip, ih); });
  habilitarEnterEnModal('gAsig');
}

function editarHora(ip, ih, d, t) {
  if (document.querySelector('.modal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal"><div class="modal-content"><button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button><h3>Hora</h3><input type="time" id="iHora" class="input-global w-100"><div class="modal-botones"><button id="gHora" class="btn-principal">Guardar</button><button onclick="cerrarModal()" class="btn-secundario">Cancelar</button></div></div></div>`);
  document.getElementById('gHora').addEventListener('click', async () => { profesores[ip].horarios[ih].horarioClases[d][t] = document.getElementById('iHora').value || ''; await guardarDatosGlobales(); cerrarModal(); verHorarioClases(ip, ih); });
  habilitarEnterEnModal('gHora');
}





