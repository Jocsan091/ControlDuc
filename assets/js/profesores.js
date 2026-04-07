// ==========================================
// ARCHIVO: assets/js/profesores.js
// Propósito: CRUD de docentes, Faltas/Licencias y Borrado de Incidencias
// ==========================================

const btnAgregar = document.getElementById('btnAgregarProfesor');
if (btnAgregar) btnAgregar.addEventListener('click', () => mostrarFormularioProfesor());

const buscador = document.getElementById('buscadorProfesores');
if (buscador) buscador.addEventListener('input', (e) => renderProfesores(e.target.value.trim().toLowerCase()));

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
  if (modal) {
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
        e.preventDefault(); document.getElementById(botonId).click();
      }
    });
  }
}

function crearFilaEmergencia(em = {}, index) {
  const ph = index === 0 ? '' : ' (Opcional)';
  return `<div class="form-grid-3 fila-emergencia" style="margin-bottom: 10px;" data-index="${index}">
      <input type="text" class="em-nombre" value="${em.nombre || ''}" placeholder="Nombre${ph}">
      <input type="text" class="em-vinculo" value="${em.vinculo || ''}" placeholder="Vínculo${ph}">
      <input type="text" class="em-tel" value="${em.telefono || em.tel || ''}" placeholder="Teléfono${ph}">
    </div>`;
}

// --- 1. CRUD PROFESORES ---

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
        <h3>${esEdicion ? 'Editar Ficha del Docente' : 'Nueva Ficha del Docente'}</h3>
        <h4 class="seccion-titulo">Datos Personales</h4>
        <div class="form-grid">
          <div><label>Nombre Completo</label><input type="text" id="f_nombre" value="${p.nombre || ''}"></div>
          <div><label>RUT</label><input type="text" id="f_rut" value="${p.rut || ''}"></div>
          <div><label>Fecha de Nacimiento</label><input type="date" id="f_fechaNac" value="${p.fechaNacimiento || ''}"></div>
          <div><label>Domicilio</label><input type="text" id="f_domicilio" value="${p.domicilio || ''}"></div>
          <div><label>Traslado Frecuente</label><input type="text" id="f_traslado" value="${p.traslado || ''}"></div>
          <div><label>Licencia de Conducir</label><input type="text" id="f_licencia" value="${p.licencia || ''}"></div>
          <div><label>Profesión</label><input type="text" id="f_profesion" value="${p.profesion || ''}"></div>
          <div><label>Hijos (Cantidad)</label><input type="number" id="f_hijos" value="${p.hijos || '0'}" min="0"></div>
          <div><label>Personas C/ Vive</label><input type="number" id="f_personasVive" value="${p.personasVive || '0'}" min="0"></div>
        </div>
        <h4 class="seccion-titulo">En caso de Emergencia avisar a:</h4>
        <div id="contenedor-emergencias">${emergenciasHTML}</div>
        <button type="button" id="btnAgregarEmergencia" class="btn-secundario" style="margin-bottom: 15px; font-size: 12px; padding: 6px 12px;">+ Agregar otro contacto</button>
        <h4 class="seccion-titulo">Salud y Antecedentes</h4>
        <label>Enfermedades y/o condición médica</label><textarea id="f_enfermedades">${salud.enfermedades || ''}</textarea>
        <label>Alergias</label><input type="text" id="f_alergias" value="${salud.alergias || ''}">
        <label>Medicamentos Permanentes</label><textarea id="f_medicamentos">${salud.medicamentos || ''}</textarea>
        <label>Observaciones</label><textarea id="f_observaciones">${p.observaciones || ''}</textarea>
        <div id="errorProfesor" style="color: #c62828; font-weight: bold; font-size: 14px; margin-top: 15px; display: none; text-align: center;"></div>
        <div class="modal-botones" style="margin-top: 15px;">
          <button id="guardarProfesor" class="btn-principal">${esEdicion ? 'Guardar Cambios' : 'Guardar Ficha'}</button>
          <button id="cancelar" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  let emIndex = emergencias.length;
  document.getElementById('btnAgregarEmergencia').addEventListener('click', () => { document.getElementById('contenedor-emergencias').insertAdjacentHTML('beforeend', crearFilaEmergencia({}, emIndex++)); });
  document.getElementById('guardarProfesor').addEventListener('click', () => guardarProfesor(indexEdicion));
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarProfesor');
}

async function guardarProfesor(indexEdicion) {
  const nombre = document.getElementById('f_nombre').value.trim();
  const rut = document.getElementById('f_rut').value.trim();
  if (!nombre || !rut) { document.getElementById('errorProfesor').innerText = "Nombre y RUT obligatorios."; document.getElementById('errorProfesor').style.display = 'block'; return; }

  const contactos = Array.from(document.querySelectorAll('.fila-emergencia')).map(fila => ({
    nombre: fila.querySelector('.em-nombre').value.trim(), vinculo: fila.querySelector('.em-vinculo').value.trim(), telefono: fila.querySelector('.em-tel').value.trim()
  })).filter(em => em.nombre || em.vinculo || em.telefono);

  const nuevaFicha = {
    nombre, rut, fechaNacimiento: document.getElementById('f_fechaNac').value, domicilio: document.getElementById('f_domicilio').value.trim(), traslado: document.getElementById('f_traslado').value.trim(), licencia: document.getElementById('f_licencia').value.trim(), profesion: document.getElementById('f_profesion').value.trim(), hijos: document.getElementById('f_hijos').value, personasVive: document.getElementById('f_personasVive').value,
    emergencia: contactos, salud: { enfermedades: document.getElementById('f_enfermedades').value.trim(), alergias: document.getElementById('f_alergias').value.trim(), medicamentos: document.getElementById('f_medicamentos').value.trim() },
    observaciones: document.getElementById('f_observaciones').value.trim()
  };

  if (typeof indexEdicion === 'number') { nuevaFicha.horarios = profesores[indexEdicion].horarios; profesores[indexEdicion] = nuevaFicha; } else { nuevaFicha.horarios = []; profesores.push(nuevaFicha); }
  
  await guardarDatosGlobales();
  cerrarModal();
  if (typeof indexEdicion === 'number' && document.getElementById('vista-detalle-profesor').classList.contains('vista-activa')) verProfesor(indexEdicion); else { renderProfesores(); actualizarDashboardInicio(); }
}

async function eliminarProfesor(index) {
  if (confirm(`¿Eliminar al profesor ${profesores[index].nombre} y todo su historial?`)) {
    document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));
    profesores.splice(index, 1);
    await guardarDatosGlobales(); 
    actualizarDashboardInicio();
    window.cambiarVista(document.getElementById('vista-profesores'), document.getElementById('menuProfesores'));
    renderProfesores();
  }
}

function renderProfesores(filtro = '') {
  const lista = document.getElementById('listaProfesores');
  if (!lista) return;
  const filtrados = profesores.filter(p => p.nombre.toLowerCase().includes(filtro) || p.rut.toLowerCase().includes(filtro));
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
        <h3>Ficha Completa: ${p.nombre}</h3><p style="color: var(--gris-texto); margin-top: -5px; margin-bottom: 15px;">RUT: ${p.rut}</p>
        <h4 class="seccion-titulo">Datos Personales</h4>
        <div class="ficha-resumen" style="display: grid; margin-bottom: 15px;">
          <p><strong>Fecha Nacimiento:</strong> ${p.fechaNacimiento || '-'}</p><p><strong>Profesión:</strong> ${p.profesion || '-'}</p><p><strong>Domicilio:</strong> ${p.domicilio || '-'}</p>
          <p><strong>Traslado Frecuente:</strong> ${p.traslado || '-'}</p><p><strong>Licencia Conducir:</strong> ${p.licencia || '-'}</p><p><strong>Hijos / Viven c/:</strong> ${p.hijos || '0'} / ${p.personasVive || '0'}</p>
        </div>
        <h4 class="seccion-titulo">Emergencia</h4><div class="ficha-resumen" style="display: block; margin-bottom: 15px;">${emergenciasHTML || '<p>Sin contactos.</p>'}</div>
        <h4 class="seccion-titulo">Salud</h4><div class="ficha-resumen" style="display: block; margin-bottom: 15px;">
          <p><strong>Enfermedades:</strong> ${p.salud?.enfermedades || '-'}</p><p><strong>Alergias:</strong> ${p.salud?.alergias || '-'}</p><p><strong>Medicamentos:</strong> ${p.salud?.medicamentos || '-'}</p>
        </div>
        <h4 class="seccion-titulo">Observaciones</h4><div class="ficha-resumen" style="display: block; margin-bottom: 15px;"><p>${p.observaciones || '-'}</p></div>
        <div class="modal-botones" style="margin-top: 15px;"><button id="btnEditarDesdeFicha" class="btn-principal">Editar Ficha</button><button id="btnCerrarFicha" class="btn-secundario">Cerrar</button></div>
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
        <div class="horario-info"><h3 style="padding-right: 30px;">Horario ${h.anio}</h3><p>Semestre 1: ${h.inicioSemestre1} a ${h.finSemestre1}</p><p>Semestre 2: ${h.inicioSemestre2} a ${h.finSemestre2}</p></div>
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
      <div style="margin-bottom: 15px;"><button class="btn-secundario" id="btnVolverProfesores" style="padding: 6px 12px; font-size: 13px; background: transparent; border: 1px solid var(--gris-borde);">← Volver a Profesores</button></div>
      <div style="display:flex; justify-content: space-between; align-items: center;">
        <div><h1>${p.nombre}</h1><p>RUT: ${p.rut}</p></div>
        <div><button class="btn-principal" id="btnAgregarHorario">Nuevo Horario</button></div>
      </div>
    </header>
    <section class="modulo-profesores">
      <div class="profesor-card clickable-card" onclick="verFichaCompleta(${index})" style="margin-bottom: 20px; background: var(--blanco);">
        <div class="profesor-info" style="width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;"><h3 style="margin: 0; font-size: 20px;">Resumen de Ficha Personal</h3><span style="color: var(--verde-principal); font-weight: bold; font-size: 13px; background: var(--verde-suave); padding: 6px 12px; border-radius: 8px;">Ver Ficha Completa y Editar ➔</span></div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div><p style="color: var(--verde-oscuro); font-size: 12px; margin-bottom: 4px; font-weight: bold;">Profesión</p><p style="font-size: 15px;">${p.profesion || '-'}</p></div>
            <div><p style="color: var(--verde-oscuro); font-size: 12px; margin-bottom: 4px; font-weight: bold;">Nacimiento</p><p style="font-size: 15px;">${p.fechaNacimiento || '-'}</p></div>
            <div><p style="color: var(--verde-oscuro); font-size: 12px; margin-bottom: 4px; font-weight: bold;">Emergencia</p><p style="font-size: 15px;">${em.nombre || '-'} <br><span style="font-size:13px; color:var(--gris-texto);">${em.tel || em.telefono || '-'}</span></p></div>
          </div>
        </div>
      </div>
      <h3 class="seccion-titulo" style="border:none; margin-bottom:10px;">Historial de Horarios</h3>
      <div class="lista-profesores">${listaHorarios}</div>
    </section>
  `;
  window.cambiarVista(vistaDetalle, document.getElementById('menuProfesores'));
  document.getElementById('btnVolverProfesores').addEventListener('click', () => { window.cambiarVista(document.getElementById('vista-profesores'), document.getElementById('menuProfesores')); renderProfesores(); });
  document.getElementById('btnAgregarHorario').addEventListener('click', () => mostrarFormularioHorario(index));
}

// --- 2. CRUD HORARIOS Y BORRADO DE INCIDENCIAS ---

function mostrarFormularioHorario(ip, ih = null) {
  if (document.querySelector('.modal')) return;
  document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));

  const h = typeof ih === 'number' ? profesores[ip].horarios[ih] : {};
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>${typeof ih === 'number' ? 'Editar Fechas' : 'Nuevo Horario'}</h3>
        <p style="font-size:13px; color:var(--gris-texto); margin-top:-5px;">Ingresa el año primero.</p>
        <input type="number" id="anioHorario" value="${h.anio || ''}" ${typeof ih === 'number' ? 'readonly style="background:#eee;"' : ''}>
        <div id="contenedorFechas" style="${typeof ih === 'number' ? '' : 'opacity: 0.4; pointer-events: none;'}">
          <label>Inicio/Fin Semestre 1</label>
          <div style="display:flex; gap:10px;"><input type="date" class="input-fecha-semestre" id="is1" value="${h.inicioSemestre1 || ''}"><input type="date" class="input-fecha-semestre" id="fs1" value="${h.finSemestre1 || ''}"></div>
          <label>Inicio/Fin Semestre 2</label>
          <div style="display:flex; gap:10px;"><input type="date" class="input-fecha-semestre" id="is2" value="${h.inicioSemestre2 || ''}"><input type="date" class="input-fecha-semestre" id="fs2" value="${h.finSemestre2 || ''}"></div>
        </div>
        <div id="errorHorario" style="color:#c62828; display:none; text-align:center;"></div>
        <div class="modal-botones" style="margin-top:15px;"><button id="guardarHorario" class="btn-principal">Guardar</button><button id="cancelar" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);

  const anioInp = document.getElementById('anioHorario');
  const contF = document.getElementById('contenedorFechas');
  const inps = document.querySelectorAll('.input-fecha-semestre');

  anioInp.addEventListener('input', () => {
    const val = anioInp.value.trim();
    if (val.length === 4) {
      contF.style.opacity = '1'; contF.style.pointerEvents = 'auto';
      if (typeof ih !== 'number') { inps[0].value = `${val}-03-01`; inps[1].value = `${val}-07-15`; inps[2].value = `${val}-07-30`; inps[3].value = `${val}-12-15`; }
    }
  });

  document.getElementById('guardarHorario').addEventListener('click', async () => {
    if (!anioInp.value || !inps[0].value || !inps[1].value || !inps[2].value || !inps[3].value) return;
    if (typeof ih !== 'number') {
      profesores[ip].horarios.push({ anio: anioInp.value, inicioSemestre1: inps[0].value, finSemestre1: inps[1].value, inicioSemestre2: inps[2].value, finSemestre2: inps[3].value, faltas: [], licencias: [], horarioClases: crearHorarioClasesBase() });
    } else {
      const h = profesores[ip].horarios[ih]; h.inicioSemestre1 = inps[0].value; h.finSemestre1 = inps[1].value; h.inicioSemestre2 = inps[2].value; h.finSemestre2 = inps[3].value;
    }
    await guardarDatosGlobales(); cerrarModal(); typeof ih !== 'number' ? verProfesor(ip) : verHorario(ip, ih);
  });
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
}

async function eliminarHorario(ip, ih) {
  if (confirm(`¿Seguro de eliminar el horario ${profesores[ip].horarios[ih].anio}?`)) {
    document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));
    profesores[ip].horarios.splice(ih, 1);
    await guardarDatosGlobales(); verProfesor(ip); 
  }
}

// MAGIA: PANEL DE ADMINISTRACIÓN DE INCIDENCIAS
window.borrarFalta = async function(ip, ih, iFalta) {
  if(confirm('¿Seguro de borrar esta falta/permiso? El día volverá a quedar limpio.')) {
    profesores[ip].horarios[ih].faltas.splice(iFalta, 1);
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); mostrarAdministradorIncidencias(ip, ih); actualizarDashboardInicio();
  }
}

window.borrarLicencia = async function(ip, ih, iLic) {
  if(confirm('¿Seguro de borrar esta licencia médica?')) {
    profesores[ip].horarios[ih].licencias.splice(iLic, 1);
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); mostrarAdministradorIncidencias(ip, ih); actualizarDashboardInicio();
  }
}

function mostrarAdministradorIncidencias(ip, ih) {
  if (document.querySelector('.modal')) return;
  const h = profesores[ip].horarios[ih];
  
  let fHtml = (h.faltas || []).map((f, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background: #fafafa; border:1px solid var(--gris-borde); border-radius: 8px; margin-bottom: 8px;">
      <div><strong style="color:var(--verde-oscuro);">${f.fecha}</strong> - <span style="color:#c62828; font-weight:bold;">${f.tipo}</span><br><span style="font-size:13px; color:var(--gris-texto);">Motivo: ${f.motivo || '-'}</span></div>
      <button class="btn-secundario" style="background:#c62828; color:white; padding:6px 12px; font-size:12px; border:none;" onclick="borrarFalta(${ip}, ${ih}, ${i})">Borrar</button>
    </div>`).join('') || '<p style="color:var(--gris-texto); font-size:14px;">No hay faltas registradas este año.</p>';

  let lHtml = (h.licencias || []).map((l, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background: #fafafa; border:1px solid var(--gris-borde); border-radius: 8px; margin-bottom: 8px;">
      <div><strong style="color:var(--verde-oscuro);">Del ${l.fechaInicio} al ${l.fechaFin}</strong> - <span style="color:#e65100; font-weight:bold;">Licencia</span><br><span style="font-size:13px; color:var(--gris-texto);">Motivo: ${l.motivo || '-'}</span></div>
      <button class="btn-secundario" style="background:#c62828; color:white; padding:6px 12px; font-size:12px; border:none;" onclick="borrarLicencia(${ip}, ${ih}, ${i})">Borrar</button>
    </div>`).join('') || '<p style="color:var(--gris-texto); font-size:14px;">No hay licencias registradas este año.</p>';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <h3>Administrar Registros de Asistencia</h3>
        <p style="font-size:13px; color:var(--gris-texto); margin-top:-5px; margin-bottom: 15px;">Borra registros ingresados por error. Los cambios se aplicarán de inmediato.</p>
        <h4 class="seccion-titulo">Faltas y Permisos</h4>${fHtml}
        <h4 class="seccion-titulo" style="margin-top:20px;">Licencias Médicas</h4>${lHtml}
        <div class="modal-botones" style="margin-top:25px;"><button onclick="cerrarModal()" class="btn-secundario">Cerrar Administrador</button></div>
      </div>
    </div>
  `);
}

function verHorario(ip, ih) {
  const p = profesores[ip]; const h = p.horarios[ih];
  if (!h.faltas) h.faltas = []; if (!h.licencias) h.licencias = [];

  document.getElementById('vista-detalle-profesor').innerHTML = `
    <header class="dashboard-topbar">
      <div style="margin-bottom: 15px;"><button class="btn-secundario" id="btnVolverProfesor" style="padding: 6px 12px; font-size: 13px; background: transparent; border: 1px solid var(--gris-borde);">← Volver al Perfil</button></div>
      <div style="display:flex; justify-content: space-between; align-items: center;">
        <div><h1>${p.nombre}</h1><p>RUT: ${p.rut} | Calendario ${h.anio}</p></div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn-secundario" id="btnAdministrarIncidencias" style="border: 1px solid var(--gris-borde);">⚙️ Ajustes de Registro</button>
          <button class="btn-secundario" id="btnHorarioClases">Ver Horario Clases</button>
          <button class="btn-principal" id="btnRegistrarFalta">Registrar Falta/Permiso</button>
          <button class="btn-principal" id="btnRegistrarLicencia">Registrar Licencia</button>
        </div>
      </div>
    </header>
    <section class="modulo-profesores">
      <section class="horario-resumen">
        <div class="estado-box estado-rojo">Faltas/Permisos: ${h.faltas.length}</div>
        <div class="estado-box estado-amarillo">Licencias: ${h.licencias.length}</div>
      </section>
      <section class="meses-grid">${generarMesesHorario(parseInt(h.anio), h)}</section>
    </section>
  `;
  document.getElementById('btnVolverProfesor').addEventListener('click', () => verProfesor(ip));
  document.getElementById('btnHorarioClases').addEventListener('click', () => verHorarioClases(ip, ih));
  document.getElementById('btnRegistrarFalta').addEventListener('click', () => mostrarFormularioFalta(ip, ih));
  document.getElementById('btnRegistrarLicencia').addEventListener('click', () => mostrarFormularioLicencia(ip, ih));
  document.getElementById('btnAdministrarIncidencias').addEventListener('click', () => mostrarAdministradorIncidencias(ip, ih));
}

// Faltas y Licencias
function mostrarFormularioFalta(ip, ih) {
  if (document.querySelector('.modal')) return; const anio = profesores[ip].horarios[ih].anio;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Registrar Falta o Permiso</h3>
        <select id="tipoFalta" style="padding: 12px; width: 100%; border: 1px solid var(--gris-borde); border-radius: 10px; margin-bottom: 10px;"><option value="Inasistencia">Inasistencia</option><option value="Permiso">Permiso</option></select>
        <label>Día</label><input type="date" id="fechaFalta" min="${anio}-01-01" max="${anio}-12-31" style="width: 100%; padding: 12px; border: 1px solid var(--gris-borde); border-radius: 10px; margin-bottom: 10px;">
        <label>Motivo</label><textarea id="motivoFalta"></textarea>
        <div class="modal-botones" style="margin-top: 15px;"><button id="guardarFalta" class="btn-principal">Registrar</button><button id="cancelarFalta" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);
  document.getElementById('guardarFalta').addEventListener('click', async () => {
    const t = document.getElementById('tipoFalta').value; const f = document.getElementById('fechaFalta').value;
    if (!f || f.split('-')[0] !== anio) return alert("Fecha inválida");
    profesores[ip].horarios[ih].faltas.push({ tipo: t, fecha: f, motivo: document.getElementById('motivoFalta').value.trim() });
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); actualizarDashboardInicio();
  });
  document.getElementById('cancelarFalta').addEventListener('click', cerrarModal);
}

function mostrarFormularioLicencia(ip, ih) {
  if (document.querySelector('.modal')) return; const anio = profesores[ip].horarios[ih].anio;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Registrar Licencia Médica</h3>
        <div class="form-grid">
          <div><label>Desde</label><input type="date" id="fILic" min="${anio}-01-01" max="${anio}-12-31" style="width: 100%; padding: 12px; border-radius: 10px;"></div>
          <div><label>Hasta</label><input type="date" id="fFLic" min="${anio}-01-01" max="${anio}-12-31" style="width: 100%; padding: 12px; border-radius: 10px;"></div>
        </div>
        <label>Motivo</label><textarea id="motivoLic"></textarea>
        <div class="modal-botones" style="margin-top: 15px;"><button id="guardarLicencia" class="btn-principal">Registrar</button><button id="cancelarLicencia" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);
  document.getElementById('guardarLicencia').addEventListener('click', async () => {
    const fi = document.getElementById('fILic').value; const ff = document.getElementById('fFLic').value;
    if (!fi || !ff || fi.split('-')[0] !== anio) return alert("Fechas inválidas");
    profesores[ip].horarios[ih].licencias.push({ fechaInicio: fi, fechaFin: ff, motivo: document.getElementById('motivoLic').value.trim() });
    await guardarDatosGlobales(); cerrarModal(); verHorario(ip, ih); actualizarDashboardInicio();
  });
  document.getElementById('cancelarLicencia').addEventListener('click', cerrarModal);
}

function verHorarioClases(ip, ih) {
  const p = profesores[ip]; const h = p.horarios[ih];
  document.getElementById('vista-detalle-profesor').innerHTML = `
    <header class="dashboard-topbar">
      <div style="margin-bottom: 15px;"><button class="btn-secundario" id="btnVolverCalendario" style="padding: 6px 12px; font-size: 13px; background: transparent; border: 1px solid var(--gris-borde);">← Volver al Calendario</button></div>
      <div><h1>${p.nombre}</h1><p>Horario Semanal ${h.anio}</p></div>
    </header>
    <section class="modulo-profesores">
      <section class="tabla-horario-contenedor">
        <table class="tabla-horario-clases"><thead><tr><th>Bloque</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>${generarFilasHorarioClases(ip, ih)}</tbody></table>
      </section>
    </section>
  `;
  document.getElementById('btnVolverCalendario').addEventListener('click', () => verHorario(ip, ih));
}

function editarBloque(ip, ih, d, b) {
  if (document.querySelector('.modal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal"><div class="modal-content"><h3>Asignar bloque</h3><select id="sAsig"><option value="">Vacío</option>${ASIGNATURAS.map(a=>`<option value="${a}">${a}</option>`).join('')}</select><select id="sCur"><option value="">Vacío</option>${CURSOS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select><div class="modal-botones"><button id="gAsig" class="btn-principal">Guardar</button><button onclick="cerrarModal()" class="btn-secundario">Cancelar</button></div></div></div>`);
  document.getElementById('gAsig').addEventListener('click', async () => { profesores[ip].horarios[ih].horarioClases[d][b] = document.getElementById('sAsig').value ? `${document.getElementById('sAsig').value} - ${document.getElementById('sCur').value}` : ''; await guardarDatosGlobales(); cerrarModal(); verHorarioClases(ip, ih); });
}

function editarHora(ip, ih, d, t) {
  if (document.querySelector('.modal')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal"><div class="modal-content"><h3>Hora</h3><input type="time" id="iHora"><div class="modal-botones"><button id="gHora" class="btn-principal">Guardar</button><button onclick="cerrarModal()" class="btn-secundario">Cancelar</button></div></div></div>`);
  document.getElementById('gHora').addEventListener('click', async () => { profesores[ip].horarios[ih].horarioClases[d][t] = document.getElementById('iHora').value || ''; await guardarDatosGlobales(); cerrarModal(); verHorarioClases(ip, ih); });
}