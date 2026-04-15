window.inicializarVistaProfesores = function() {
  const btnAgregar = document.getElementById('btnAgregarProfesor');
  if (btnAgregar) btnAgregar.addEventListener('click', () => mostrarFormularioProfesor());

  const buscador = document.getElementById('buscadorProfesores');
  if (buscador) buscador.addEventListener('input', (e) => renderProfesores(e.target.value.trim().toLowerCase()));
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.acciones-tarjeta')) document.querySelectorAll('.menu-opciones').forEach(menu => menu.classList.remove('mostrar'));
});

function toggleMenuOpciones(event, idMenu) {
  event.stopPropagation();
  document.querySelectorAll('.menu-opciones').forEach(menu => { if (menu.id !== idMenu) menu.classList.remove('mostrar'); });
  const menu = document.getElementById(idMenu);
  if (menu) menu.classList.toggle('mostrar');
}

function habilitarEnterEnModal(botonId) {
  const modal = document.querySelector('.modal');
  if (!modal) return;

  const handler = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      document.getElementById(botonId).click();
    }
  };

  modal.addEventListener('keydown', handler);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '-';
  const partes = fechaStr.split('-');
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return fechaStr;
}

function formatearRUT(rut) {
  let actual = rut.replace(/^0+/, "");
  if (actual != '' && actual.length > 1) {
    let sinPuntos = actual.replace(/\./g, "");
    let actualLimpio = sinPuntos.replace(/-/g, "");
    let inicio = actualLimpio.substring(0, actualLimpio.length - 1);
    let rutPuntos = "";
    let j = 1;
    for (let i = inicio.length - 1; i >= 0; i--) {
      let letra = inicio.charAt(i);
      rutPuntos = letra + rutPuntos;
      if (j % 3 == 0 && j <= inicio.length - 1) rutPuntos = "." + rutPuntos;
      j++;
    }
    let dv = actualLimpio.substring(actualLimpio.length - 1);
    return rutPuntos + "-" + dv.toUpperCase();
  }
  return rut;
}

function validarRUT(rut) {
  if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rut.replace(/\./g, ''))) return false;
  let tmp = rut.split('-');
  let digv = tmp[1].toLowerCase();
  let rutNum = tmp[0].replace(/\./g, '');
  if (digv == 'K') digv = 'k';
  let M = 0, S = 1;
  for (; rutNum; rutNum = Math.floor(rutNum / 10)) S = (S + rutNum % 10 * (9 - M++ % 6)) % 11;
  let dvReal = S ? S - 1 : 'k';
  return (dvReal == digv);
}

function soloNumeros(e) {
  const charCode = (e.which) ? e.which : e.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
  return true;
}

function crearFilaEmergencia(em = {}, index) {
  const ph = index === 0 ? '' : ' (Opcional)';
  return `<div class="form-grid-3 fila-emergencia mb-2" data-index="${index}">
      <input type="text" class="em-nombre input-global w-100" value="${em.nombre || ''}" maxlength="40" placeholder="Nombre${ph}">
      <input type="text" class="em-vinculo input-global w-100" value="${em.vinculo || ''}" maxlength="20" placeholder="Vínculo${ph}">
      <input type="text" class="em-tel input-global w-100" value="${em.telefono || em.tel || ''}" maxlength="15" placeholder="Teléfono (+569...)${ph}">
    </div>`;
}

function mostrarFormularioProfesor(indexEdicion = null) {
  if (document.querySelector('.modal')) return;
  document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));

  const esEdicion = typeof indexEdicion === 'number';
  const p = esEdicion ? profesores[indexEdicion] : {};
  const salud = p.salud || {};
  const emergencias = p.emergencia && p.emergencia.length > 0 ? p.emergencia : [{}];
  let emergenciasHTML = emergencias.map((em, i) => crearFilaEmergencia(em, i)).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3>${esEdicion ? 'Editar Ficha del Docente' : 'Nueva Ficha del Docente'}</h3>
        
        <h4 class="seccion-titulo">Datos Personales</h4>
        <div class="form-grid">
          <div><label class="d-block mb-1">Nombre Completo *</label><input type="text" id="f_nombre" class="input-global w-100" value="${p.nombre || ''}" maxlength="60" placeholder="Ej: Juan Pérez"></div>
          <div><label class="d-block mb-1">RUT *</label><input type="text" id="f_rut" class="input-global w-100" value="${p.rut || ''}" maxlength="12" placeholder="12.345.678-9"></div>
          <div><label class="d-block mb-1">Fecha de Nacimiento</label><input type="date" id="f_fechaNac" class="input-global w-100" value="${p.fechaNacimiento || ''}"></div>
          <div><label class="d-block mb-1">Domicilio</label><input type="text" id="f_domicilio" class="input-global w-100" value="${p.domicilio || ''}" maxlength="80"></div>
          <div><label class="d-block mb-1">Traslado Frecuente</label><input type="text" id="f_traslado" class="input-global w-100" value="${p.traslado || ''}" maxlength="50"></div>
          <div><label class="d-block mb-1">Licencia de Conducir</label><input type="text" id="f_licencia" class="input-global w-100" value="${p.licencia || ''}" maxlength="20"></div>
          <div><label class="d-block mb-1">Profesión</label><input type="text" id="f_profesion" class="input-global w-100" value="${p.profesion || ''}" maxlength="50"></div>
          <div><label class="d-block mb-1">Hijos (Cantidad)</label><input type="number" id="f_hijos" class="input-global w-100" value="${p.hijos || '0'}" min="0" max="20" onkeypress="return event.charCode >= 48 && event.charCode <= 57"></div>
          <div><label class="d-block mb-1">Personas C/ Vive</label><input type="number" id="f_personasVive" class="input-global w-100" value="${p.personasVive || '0'}" min="0" max="20" onkeypress="return event.charCode >= 48 && event.charCode <= 57"></div>
        </div>

        <h4 class="seccion-titulo mt-3">En caso de Emergencia avisar a:</h4>
        <div id="contenedor-emergencias">${emergenciasHTML}</div>
        <button type="button" id="btnAgregarEmergencia" class="btn-secundario mb-3 fs-sm py-1 px-2 w-100">+ Agregar otro contacto</button>

        <h4 class="seccion-titulo">Salud y Antecedentes</h4>
        <label class="d-block mb-1">Enfermedades y/o condición médica</label>
        <textarea id="f_enfermedades" class="input-global w-100" style="resize: vertical; min-height: 80px;" maxlength="300">${salud.enfermedades || ''}</textarea>
        
        <label class="d-block mb-1 mt-2">Alergias</label>
        <input type="text" id="f_alergias" class="input-global w-100" value="${salud.alergias || ''}" maxlength="100">
        
        <label class="d-block mb-1 mt-2">Medicamentos Permanentes</label>
        <textarea id="f_medicamentos" class="input-global w-100" style="resize: vertical; min-height: 80px;" maxlength="300">${salud.medicamentos || ''}</textarea>
        
        <label class="d-block mb-1 mt-2">Observaciones</label>
        <textarea id="f_observaciones" class="input-global w-100" style="resize: vertical; min-height: 80px;" maxlength="500">${p.observaciones || ''}</textarea>
        
        <div id="errorProfesor" class="text-danger fw-bold fs-md mt-3 text-center d-none"></div>
        <div class="modal-botones mt-4">
          <button id="guardarProfesor" class="btn-principal">${esEdicion ? 'Guardar Cambios' : 'Guardar Ficha'}</button>
          <button id="cancelar" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  const inputRut = document.getElementById('f_rut');
  inputRut.addEventListener('input', function() { this.value = formatearRUT(this.value.replace(/[^0-9kK]/g, '')); });

  let emIndex = emergencias.length;
  document.getElementById('btnAgregarEmergencia').addEventListener('click', () => { document.getElementById('contenedor-emergencias').insertAdjacentHTML('beforeend', crearFilaEmergencia({}, emIndex++)); });
  document.getElementById('guardarProfesor').addEventListener('click', () => guardarProfesor(indexEdicion));
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarProfesor');
}

async function guardarProfesor(indexEdicion) {
  const nombre = document.getElementById('f_nombre').value.trim();
  const rut = document.getElementById('f_rut').value.trim();
  const errorDiv = document.getElementById('errorProfesor');

  if (!nombre || !rut) { errorDiv.innerText = "Error: Nombre y RUT son obligatorios."; errorDiv.classList.remove('d-none'); errorDiv.classList.add('d-block'); return; }
  if (!validarRUT(rut)) { errorDiv.innerText = "Error: El RUT ingresado no es válido."; errorDiv.classList.remove('d-none'); errorDiv.classList.add('d-block'); return; }
  
  const rutDuplicado = profesores.some((p, index) => p.rut === rut && index !== indexEdicion);
  if (rutDuplicado) {
    errorDiv.innerText = "Error: Este RUT ya se encuentra registrado a nombre de otro docente."; 
    errorDiv.classList.remove('d-none'); 
    errorDiv.classList.add('d-block'); 
    return;
  }

  errorDiv.classList.add('d-none'); errorDiv.classList.remove('d-block');

  const contactos = Array.from(document.querySelectorAll('.fila-emergencia')).map(fila => ({
    nombre: fila.querySelector('.em-nombre').value.trim(), vinculo: fila.querySelector('.em-vinculo').value.trim(), telefono: fila.querySelector('.em-tel').value.trim()
  })).filter(em => em.nombre || em.vinculo || em.telefono);

  const nuevaFicha = {
    nombre, rut, fechaNacimiento: document.getElementById('f_fechaNac').value, domicilio: document.getElementById('f_domicilio').value.trim(), traslado: document.getElementById('f_traslado').value.trim(), licencia: document.getElementById('f_licencia').value.trim(), profesion: document.getElementById('f_profesion').value.trim(), hijos: document.getElementById('f_hijos').value, personasVive: document.getElementById('f_personasVive').value,
    emergencia: contactos, salud: { enfermedades: document.getElementById('f_enfermedades').value.trim(), alergias: document.getElementById('f_alergias').value.trim(), medicamentos: document.getElementById('f_medicamentos').value.trim() },
    observaciones: document.getElementById('f_observaciones').value.trim()
  };

  if (typeof indexEdicion === 'number') { nuevaFicha.horarios = profesores[indexEdicion].horarios; profesores[indexEdicion] = nuevaFicha; } else { nuevaFicha.horarios = []; profesores.push(nuevaFicha); }
  
  await guardarDatosGlobales(); cerrarModal();
  if (typeof indexEdicion === 'number' && document.getElementById('vista-detalle-profesor').classList.contains('vista-activa')) verProfesor(indexEdicion); else { renderProfesores(); if(typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio(); }
}

async function eliminarProfesor(index) {
  if (confirm(`¿Eliminar al profesor ${profesores[index].nombre} y todo su historial?`)) {
    document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));
    profesores.splice(index, 1);
    await guardarDatosGlobales(); 
    if(typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
    window.cambiarVista(document.getElementById('vista-profesores'), document.getElementById('menuProfesores'));
    renderProfesores();
  }
}

function renderProfesores(filtro = '') {
  const lista = document.getElementById('listaProfesores');
  if (!lista) return;
  const filtroNormalizado = filtro.replace(/\./g, '');
  const filtrados = profesores.filter(p => {
    const rutNormalizado = p.rut.toLowerCase().replace(/\./g, '');
    return p.nombre.toLowerCase().includes(filtro) || p.rut.toLowerCase().includes(filtro) || rutNormalizado.includes(filtroNormalizado);
  });
  if (filtrados.length === 0) return lista.innerHTML = `<div class="sin-profesores">Sin registros.</div>`;

  lista.innerHTML = filtrados.map(prof => {
    const iReal = profesores.indexOf(prof);
    return `
      <div class="profesor-card clickable-card" onclick="verProfesor(${iReal})">
        <div class="profesor-info"><h3>${prof.nombre}</h3><p><strong>RUT:</strong> ${prof.rut}</p><p><strong>Profesión:</strong> ${prof.profesion || '-'}</p></div>
        <div class="acciones-tarjeta">
          <button class="btn-opciones" onclick="toggleMenuOpciones(event, 'menu-profesor-${iReal}')">&#8942;</button>
          <div id="menu-profesor-${iReal}" class="menu-opciones">
            <button class="opcion-item" onclick="event.stopPropagation(); mostrarFormularioProfesor(${iReal})">Editar Ficha</button>
            <button class="opcion-item opcion-eliminar" onclick="event.stopPropagation(); eliminarProfesor(${iReal})">Eliminar Profesor</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function verFichaCompleta(index) {
  if (document.querySelector('.modal')) return;
  const p = profesores[index];
  const emergenciasHTML = p.emergencia.map(em => `<p><strong>${em.nombre || '-'}</strong> (${em.vinculo || '-'}) - Tel: ${em.telefono || em.tel || '-'}</p>`).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3>Ficha Completa: ${p.nombre}</h3>
        <p class="text-muted mt-0 mb-3">RUT: ${p.rut}</p>
        
        <h4 class="seccion-titulo">Datos Personales</h4>
        <div class="ficha-resumen d-grid mb-3">
          <p><strong>Fecha Nacimiento:</strong> ${formatearFecha(p.fechaNacimiento)}</p>
          <p><strong>Profesión:</strong> ${p.profesion || '-'}</p>
          <p><strong>Domicilio:</strong> ${p.domicilio || '-'}</p>
          <p><strong>Traslado Frecuente:</strong> ${p.traslado || '-'}</p>
          <p><strong>Licencia Conducir:</strong> ${p.licencia || '-'}</p>
          <p><strong>Hijos / Viven c/:</strong> ${p.hijos || '0'} / ${p.personasVive || '0'}</p>
        </div>
        
        <h4 class="seccion-titulo">Emergencia</h4>
        <div class="ficha-resumen col-span-full mb-3">${emergenciasHTML || '<p>Sin contactos.</p>'}</div>
        
        <h4 class="seccion-titulo">Salud</h4>
        <div class="ficha-resumen col-span-full mb-3">
          <p><strong>Enfermedades:</strong> ${p.salud?.enfermedades || '-'}</p>
          <p><strong>Alergias:</strong> ${p.salud?.alergias || '-'}</p>
          <p><strong>Medicamentos:</strong> ${p.salud?.medicamentos || '-'}</p>
        </div>
        
        <h4 class="seccion-titulo">Observaciones</h4>
        <div class="ficha-resumen col-span-full mb-3"><p>${p.observaciones || '-'}</p></div>
        
        <div class="modal-botones mt-3">
          <button id="btnEditarDesdeFicha" class="btn-principal">Editar Ficha</button>
          <button id="btnCerrarFicha" class="btn-secundario">Cerrar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('btnEditarDesdeFicha').addEventListener('click', () => { cerrarModal(); mostrarFormularioProfesor(index); });
  document.getElementById('btnCerrarFicha').addEventListener('click', cerrarModal);
}

function verProfesor(index) {
  const p = profesores[index];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  let listaHorarios = p.horarios.length ? p.horarios.map((h, i) => `
      <div class="horario-card clickable-card" onclick="verHorario(${index}, ${i})">
        <div class="horario-info">
          <h3 class="mb-2">Horario ${h.anio}</h3>
          
          <div>
            <p>Semestre 1: ${formatearFecha(h.inicioSemestre1)} a ${formatearFecha(h.finSemestre1)}</p>
            <p>Semestre 2: ${formatearFecha(h.inicioSemestre2)} a ${formatearFecha(h.finSemestre2)}</p>
          </div>
          <br>
          
        </div>
        <div class="acciones-tarjeta">
          <button class="btn-opciones" onclick="toggleMenuOpciones(event, 'menu-horario-${i}')">&#8942;</button>
          <div id="menu-horario-${i}" class="menu-opciones">
            <button class="opcion-item" onclick="event.stopPropagation(); mostrarFormularioHorario(${index}, ${i})">Editar Fechas</button>
            <button class="opcion-item opcion-eliminar" onclick="event.stopPropagation(); eliminarHorario(${index}, ${i})">Eliminar Horario</button>
          </div>
        </div>
      </div>`).join('') : `<div class="sin-profesores">Aún no hay horarios registrados.</div>`;

  const em = p.emergencia[0] || {}; 
  
  vistaDetalle.innerHTML = `
    <header class="dashboard-topbar">
      <div class="d-flex align-center gap-3">
        <button class="btn-secundario border-radius-lg py-2 px-3 fs-sm" id="btnVolverProfesores">Volver</button>
        <div>
          <h1 class="mb-1 fs-xxl line-height-1">${p.nombre}</h1>
          <p class="m-0 fs-md">RUT: ${p.rut}</p>
        </div>
      </div>
      <div class="d-flex gap-1 align-center">
        <button class="btn-principal" id="btnAgregarHorarioPersonalizado">Agregar horario personalizado</button>
        <button class="btn-principal btn-secundario" id="btnAgregarHorarioSobreCargado">Agregar horario sobrecargado</button>
      </div>
    </header>

    <section class="modulo-profesores">
      <div class="profesor-card clickable-card bg-white mb-4" onclick="verFichaCompleta(${index})">
        <div class="profesor-info w-100">
          <div class="d-flex justify-between align-left mb-3">
            <h3 class="m-0 fs-xl">Resumen de Ficha Personal</h3>
            <span class="text-primary fw-bold fs-sm bg-success-light py-1 px-2 border-radius-md">Ver Ficha Completa y Editar</span>
          </div>
          <div class="form-grid-3 gap-3">
            <div><p class="text-primary fs-sm mb-1 text-uppercase fw-bold">Profesión</p><p class="fs-lg fw-bold text-dark">${p.profesion || '-'}</p></div>
            <div><p class="text-primary fs-sm mb-1 text-uppercase fw-bold">Nacimiento</p><p class="fs-lg fw-bold text-dark">${formatearFecha(p.fechaNacimiento)}</p></div>
            <div><p class="text-primary fs-sm mb-1 text-uppercase fw-bold">Emergencia</p><p class="fs-lg fw-bold text-dark">${em.nombre || '-'} <br><span class="fs-md text-muted fw-normal">${em.tel || em.telefono || '-'}</span></p></div>
          </div>
        </div>
      </div>
      <h3 class="seccion-titulo border-none mb-2">Historial de Horarios</h3>
      <div class="lista-profesores">${listaHorarios}</div>
    </section>
  `;
  window.cambiarVista(vistaDetalle, document.getElementById('menuProfesores'));
  document.getElementById('btnVolverProfesores').addEventListener('click', () => { window.cambiarVista(document.getElementById('vista-profesores'), document.getElementById('menuProfesores')); renderProfesores(); });
  const btnAgregarHorarioPersonalizado = document.getElementById('btnAgregarHorarioPersonalizado');
  const btnAgregarHorarioSobreCargado = document.getElementById('btnAgregarHorarioSobreCargado');
  if (btnAgregarHorarioPersonalizado) btnAgregarHorarioPersonalizado.addEventListener('click', () => mostrarFormularioHorario(index, null, 'personalizado'));
  if (btnAgregarHorarioSobreCargado) btnAgregarHorarioSobreCargado.addEventListener('click', () => mostrarFormularioHorario(index, null, 'precargado'));
}
 
function crearCamposFechaHorario(prefix, horario = {}) {
  return [
    { label: 'Inicio Semestre 1 *', visibleId: `${prefix}Inicio1`, hiddenId: `${prefix}HiddenInicio1`, suffixId: `${prefix}SuffixInicio1`, visibleValue: formatearFechaParaInput(horario.inicioSemestre1), hiddenValue: formatearFechaParaInput(horario.inicioSemestre1), anio: horario.anio || '' },
    { label: 'Fin Semestre 1 *', visibleId: `${prefix}Fin1`, hiddenId: `${prefix}HiddenFin1`, suffixId: `${prefix}SuffixFin1`, visibleValue: formatearFechaParaInput(horario.finSemestre1), hiddenValue: formatearFechaParaInput(horario.finSemestre1), anio: horario.anio || '' },
    { label: 'Inicio Semestre 2 *', visibleId: `${prefix}Inicio2`, hiddenId: `${prefix}HiddenInicio2`, suffixId: `${prefix}SuffixInicio2`, visibleValue: formatearFechaParaInput(horario.inicioSemestre2), hiddenValue: formatearFechaParaInput(horario.inicioSemestre2), anio: horario.anio || '' },
    { label: 'Fin Semestre 2 *', visibleId: `${prefix}Fin2`, hiddenId: `${prefix}HiddenFin2`, suffixId: `${prefix}SuffixFin2`, visibleValue: formatearFechaParaInput(horario.finSemestre2), hiddenValue: formatearFechaParaInput(horario.finSemestre2), anio: horario.anio || '' }
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
      <label class="d-block mb-1">Año precargado *</label>
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
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3>${typeof ih === 'number' ? 'Editar Fechas' : 'Nuevo Horario'}</h3>
        <p class="fs-sm text-muted mt-0">Ingresa el año primero para configurar el calendario.</p>
        <input type="number" id="anioHorario" class="input-global" value="${h.anio || ''}" ${typeof ih === 'number' ? 'readonly class="bg-gray-light"' : ''} onkeypress="return soloNumeros(event)">
        <div id="contenedorFechas" class="${typeof ih === 'number' ? '' : 'opacidad-mitad'}">
          <label class="d-block mb-1 mt-2">Inicio/Fin Semestre 1</label>
          <div class="d-flex gap-1 mb-2"><input type="date" class="input-global flex-1" id="is1" value="${h.inicioSemestre1 || ''}"><input type="date" class="input-global flex-1" id="fs1" value="${h.finSemestre1 || ''}"></div>
          <label class="d-block mb-1">Inicio/Fin Semestre 2</label>
          <div class="d-flex gap-1"><input type="date" class="input-global flex-1" id="is2" value="${h.inicioSemestre2 || ''}"><input type="date" class="input-global flex-1" id="fs2" value="${h.finSemestre2 || ''}"></div>
        </div>
        <div class="modal-botones mt-3"><button id="guardarHorario" class="btn-principal">Guardar</button><button id="cancelar" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);

  const anioInp = document.getElementById('anioHorario');
  const contF = document.getElementById('contenedorFechas');
  const inputsFechas = [document.getElementById('is1'), document.getElementById('fs1'), document.getElementById('is2'), document.getElementById('fs2')];

  const actualizarLimites = () => {
    const val = anioInp.value.trim();
    if (val.length === 4) {
      contF.classList.remove('opacidad-mitad');
      inputsFechas.forEach(inp => {
        inp.min = `${val}-01-01`;
        inp.max = `${val}-12-31`;
      });
    } else {
      contF.classList.add('opacidad-mitad');
      inputsFechas.forEach(inp => { inp.min = ''; inp.max = ''; });
    }
  };

  anioInp.addEventListener('input', actualizarLimites);

  if (typeof ih === 'number') actualizarLimites();

  inputsFechas.forEach(inp => {
    inp.addEventListener('change', (e) => {
      const valAnio = anioInp.value.trim();
      if (valAnio.length === 4 && e.target.value) {
        let partes = e.target.value.split('-');
        if (partes[0] !== valAnio) {
          partes[0] = valAnio;
          e.target.value = partes.join('-');
        }
      }
    });
  });

  document.getElementById('guardarHorario').addEventListener('click', async () => {
    const is1 = document.getElementById('is1').value;
    const fs1 = document.getElementById('fs1').value;
    const is2 = document.getElementById('is2').value;
    const fs2 = document.getElementById('fs2').value;

    if (!anioInp.value || !is1 || !fs1 || !is2 || !fs2) {
      return alert("Error: Debes completar todas las fechas de inicio y fin de ambos semestres.");
    }

    if (is1 > fs1 || is2 > fs2 || fs1 > is2) {
      return alert("Error Lógico: Las fechas están desordenadas. Revisa que el inicio sea antes del fin, y el semestre 1 termine antes de que empiece el semestre 2.");
    }

    if (typeof ih !== 'number') {
      profesores[ip].horarios.push({ anio: anioInp.value, inicioSemestre1: is1, finSemestre1: fs1, inicioSemestre2: is2, finSemestre2: fs2, faltas: [], licencias: [], horarioClases: crearHorarioClasesBase() });
    } else {
      const h = profesores[ip].horarios[ih]; h.inicioSemestre1 = is1; h.finSemestre1 = fs1; h.inicioSemestre2 = is2; h.finSemestre2 = fs2;
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
      <div><strong class="text-primary">${formatearFecha(f.fecha)}</strong> - <span class="text-danger fw-bold">${f.tipo}</span><br><span class="fs-sm text-muted">Motivo: ${f.motivo || '-'}</span></div>
      <button class="btn-danger py-1 px-2 fs-xs border-none cursor-pointer" onclick="borrarFalta(${ip}, ${ih}, ${i})">Borrar</button>
    </div>`).join('') || '<p class="text-muted fs-sm">No hay faltas registradas este año.</p>';

  let lHtml = (h.licencias || []).map((l, i) => {
    const btnArchivo = l.archivoAdjunto ? `<button class="btn-principal bg-success-light text-success border-success py-1 px-2 fs-xs border-none cursor-pointer mr-2" style="margin-right: 8px;" onclick="window.abrirLicenciaPDF('${l.archivoAdjunto}')">Ver Documento</button>` : '';

    return `
    <div class="d-flex justify-between align-center p-2 bg-gray-light border-muted border-radius-md mb-2">
      <div><strong class="text-primary">Del ${formatearFecha(l.fechaInicio)} al ${formatearFecha(l.fechaFin)}</strong> - <span class="text-warning fw-bold">Licencia</span><br><span class="fs-sm text-muted">Motivo: ${l.motivo || '-'}</span></div>
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

function verHorario(ip, ih) {
  const p = profesores[ip]; const h = p.horarios[ih];
  if (!h.faltas) h.faltas = []; if (!h.licencias) h.licencias = [];
  const totalFaltas = h.faltas.length; const totalLicencias = h.licencias.length;

  document.getElementById('vista-detalle-profesor').innerHTML = `
    <header class="dashboard-topbar">
      <div class="d-flex align-center gap-3">
        <button class="btn-secundario border-radius-lg py-2 px-3 fs-sm" id="btnVolverProfesor">Volver</button>
        <div><h1 class="mb-1 fs-xxl line-height-1">${p.nombre}</h1><p class="m-0 fs-md">RUT: ${p.rut} | Calendario ${h.anio}</p></div>
      </div>
      <div class="d-flex gap-1 align-center">
        <button class="btn-secundario btn-outline-muted" id="btnAdministrarIncidencias">Resgistros</button>
        <button class="btn-secundario" id="btnHorarioClases">Ver Horario Clases</button>
        <button class="btn-principal bg-danger-light border-danger text-danger" id="btnRegistrarFalta">Registrar Falta/Permiso</button>
        <button class="btn-principal bg-warning-light border-warning text-warning" id="btnRegistrarLicencia">Registrar Licencia</button>
      </div>
    </header>

    <div class="barra-estados-fija">
      <div class="estado-box estado-verde fs-sm py-2 px-2">Días asistidos</div>
      <div class="estado-box estado-gris border-muted fs-sm py-2 px-2">Días futuros</div>
      <div class="estado-box estado-morado fs-sm py-2 px-2 border-morado">Feriados e Interferiados</div>
      <div class="estado-box estado-tachado border-dashed fs-sm py-2 px-2">Inactivo</div>
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
    
    if (!f || f.split('-')[0] !== anio) return alert("Fecha inválida o fuera del año escolar.");

    const h = profesores[ip].horarios[ih];
    
    const existeFalta = h.faltas.some(fal => fal.fecha === f);
    if (existeFalta) return alert(`Ya existe un registro de Inasistencia/Permiso para el día ${formatearFecha(f)}.`);

    const chocaConLicencia = h.licencias.some(lic => f >= lic.fechaInicio && f <= lic.fechaFin);
    if (chocaConLicencia) return alert(`No puedes registrar una falta. El día ${formatearFecha(f)} está cubierto por una Licencia Médica.`);
    profesores[ip].horarios[ih].faltas.push({ tipo: t, fecha: f, motivo: document.getElementById('motivoFalta').value.trim() });
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); if(typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
  });
  
  document.getElementById('cancelarFalta').addEventListener('click', cerrarModal);
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
    
    if (!fi || !ff || fi.split('-')[0] !== anio) return alert("Fechas inválidas o fuera del año escolar.");
    if (fi > ff) return alert("Error Lógico: La fecha de inicio no puede ser mayor a la fecha de fin.");

    const h = profesores[ip].horarios[ih];

    const chocaConOtraLicencia = h.licencias.some(lic => 
      (fi >= lic.fechaInicio && fi <= lic.fechaFin) || 
      (ff >= lic.fechaInicio && ff <= lic.fechaFin) ||
      (fi <= lic.fechaInicio && ff >= lic.fechaFin)
    );
    if (chocaConOtraLicencia) return alert("Error: El rango de fechas ingresado se cruza con otra Licencia Médica ya registrada en el sistema.");

    const chocaConFaltas = h.faltas.some(fal => fal.fecha >= fi && fal.fecha <= ff);
    if (chocaConFaltas) return alert("Error: Hay registros de Inasistencia o Permisos en los días de esta licencia. Debes ir a 'Ajustes', borrar las faltas de esos días, y luego ingresar la licencia.");
    profesores[ip].horarios[ih].licencias.push({ 
      fechaInicio: fi, 
      fechaFin: ff, 
      motivo: document.getElementById('motivoLic').value.trim(),
      archivoAdjunto: archivoSeleccionado 
    });
    
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); if(typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
  });
  
  document.getElementById('cancelarLicencia').addEventListener('click', cerrarModal);
}

function verHorarioClases(ip, ih) {
  const p = profesores[ip]; const h = p.horarios[ih];
  document.getElementById('vista-detalle-profesor').innerHTML = `
    <header class="dashboard-topbar">
      <div class="d-flex align-center gap-3">
        <button class="btn-secundario border-radius-lg py-2 px-3 fs-sm" id="btnVolverCalendario">Volver</button>
        <div><h1 class="mb-1 fs-xxl line-height-1">${p.nombre}</h1><p class="m-0 fs-md">Horario Semanal ${h.anio}</p></div>
      </div>
    </header>
    <section class="modulo-profesores">
      <section class="tabla-horario-contenedor"><table class="tabla-horario-clases"><thead><tr><th>Bloque</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>${generarFilasHorarioClases(ip, ih)}</tbody></table></section>
    </section>
  `;
  document.getElementById('btnVolverCalendario').addEventListener('click', () => verHorario(ip, ih));
}

function editarBloque(ip, ih, d, b) {
  if (document.querySelector('.modal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal"><div class="modal-content"><button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button><h3>Asignar bloque</h3><select id="sAsig" class="input-global mb-2 w-100"><option value="">Vacío</option>${ASIGNATURAS.map(a=>`<option value="${a}">${a}</option>`).join('')}</select><select id="sCur" class="input-global w-100"><option value="">Vacío</option>${CURSOS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select><div class="modal-botones"><button id="gAsig" class="btn-principal">Guardar</button><button onclick="cerrarModal()" class="btn-secundario">Cancelar</button></div></div></div>`);
  document.getElementById('gAsig').addEventListener('click', async () => { profesores[ip].horarios[ih].horarioClases[d][b] = document.getElementById('sAsig').value ? `${document.getElementById('sAsig').value} - ${document.getElementById('sCur').value}` : ''; await guardarDatosGlobales(); cerrarModal(); verHorarioClases(ip, ih); });
}

function editarHora(ip, ih, d, t) {
  if (document.querySelector('.modal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal"><div class="modal-content"><button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button><h3>Hora</h3><input type="time" id="iHora" class="input-global w-100"><div class="modal-botones"><button id="gHora" class="btn-principal">Guardar</button><button onclick="cerrarModal()" class="btn-secundario">Cancelar</button></div></div></div>`);
  document.getElementById('gHora').addEventListener('click', async () => { profesores[ip].horarios[ih].horarioClases[d][t] = document.getElementById('iHora').value || ''; await guardarDatosGlobales(); cerrarModal(); verHorarioClases(ip, ih); });
}

