// ==========================================
// ARCHIVO: assets/js/profesores.js
// Propósito: CRUD de docentes, UX avanzada y Gestión Limpia de Faltas/Licencias
// ==========================================

const btnAgregar = document.getElementById('btnAgregarProfesor');
if (btnAgregar) btnAgregar.addEventListener('click', () => mostrarFormularioProfesor());

const buscador = document.getElementById('buscadorProfesores');
if (buscador) {
  buscador.addEventListener('input', (e) => renderProfesores(e.target.value.trim().toLowerCase()));
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.acciones-tarjeta')) {
    document.querySelectorAll('.menu-opciones').forEach(menu => menu.classList.remove('mostrar'));
  }
});

function toggleMenuOpciones(event, idMenu) {
  event.stopPropagation();
  document.querySelectorAll('.menu-opciones').forEach(menu => {
    if (menu.id !== idMenu) menu.classList.remove('mostrar');
  });
  const menu = document.getElementById(idMenu);
  if (menu) menu.classList.toggle('mostrar');
}

function habilitarEnterEnModal(botonId) {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        document.getElementById(botonId).click();
      }
    });
  }
}

function crearFilaEmergencia(em = {}, index) {
  const ph = index === 0 ? '' : ' (Opcional)';
  return `
    <div class="form-grid-3 fila-emergencia" style="margin-bottom: 10px;" data-index="${index}">
      <input type="text" class="em-nombre" value="${em.nombre || ''}" placeholder="Nombre${ph}">
      <input type="text" class="em-vinculo" value="${em.vinculo || ''}" placeholder="Vínculo${ph}">
      <input type="text" class="em-tel" value="${em.telefono || em.tel || ''}" placeholder="Teléfono${ph}">
    </div>
  `;
}

function mostrarFormularioProfesor(indexEdicion = null) {
  if (document.querySelector('.modal')) return;
  document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));

  const esEdicion = typeof indexEdicion === 'number';
  const p = esEdicion ? profesores[indexEdicion] : {};
  const salud = p.salud || {};
  
  const emergencias = p.emergencia && p.emergencia.length > 0 ? p.emergencia : [{}];
  let emergenciasHTML = emergencias.map((em, i) => crearFilaEmergencia(em, i)).join('');

  const titulo = esEdicion ? 'Editar Ficha del Docente' : 'Nueva Ficha del Docente';
  const textoBoton = esEdicion ? 'Guardar Cambios' : 'Guardar Ficha';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <h3>${titulo}</h3>
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
          <button id="guardarProfesor" class="btn-principal">${textoBoton}</button>
          <button id="cancelar" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  let emIndex = emergencias.length;
  document.getElementById('btnAgregarEmergencia').addEventListener('click', () => {
    document.getElementById('contenedor-emergencias').insertAdjacentHTML('beforeend', crearFilaEmergencia({}, emIndex++));
  });

  document.getElementById('guardarProfesor').addEventListener('click', () => guardarProfesor(indexEdicion));
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarProfesor');
}

async function guardarProfesor(indexEdicion) {
  const nombre = document.getElementById('f_nombre').value.trim();
  const rut = document.getElementById('f_rut').value.trim();
  const errorDiv = document.getElementById('errorProfesor');

  if (!nombre || !rut) {
    errorDiv.innerText = "Error: El Nombre y el RUT son obligatorios.";
    errorDiv.style.display = 'block';
    return;
  }
  errorDiv.style.display = 'none';

  const contactos = Array.from(document.querySelectorAll('.fila-emergencia')).map(fila => ({
    nombre: fila.querySelector('.em-nombre').value.trim(),
    vinculo: fila.querySelector('.em-vinculo').value.trim(),
    telefono: fila.querySelector('.em-tel').value.trim()
  })).filter(em => em.nombre || em.vinculo || em.telefono);

  const nuevaFicha = {
    nombre, rut,
    fechaNacimiento: document.getElementById('f_fechaNac').value,
    domicilio: document.getElementById('f_domicilio').value.trim(),
    traslado: document.getElementById('f_traslado').value.trim(),
    licencia: document.getElementById('f_licencia').value.trim(),
    profesion: document.getElementById('f_profesion').value.trim(),
    hijos: document.getElementById('f_hijos').value,
    personasVive: document.getElementById('f_personasVive').value,
    emergencia: contactos,
    salud: { 
      enfermedades: document.getElementById('f_enfermedades').value.trim(), 
      alergias: document.getElementById('f_alergias').value.trim(), 
      medicamentos: document.getElementById('f_medicamentos').value.trim() 
    },
    observaciones: document.getElementById('f_observaciones').value.trim()
  };

  if (typeof indexEdicion === 'number') {
    nuevaFicha.horarios = profesores[indexEdicion].horarios;
    profesores[indexEdicion] = nuevaFicha;
  } else {
    nuevaFicha.horarios = [];
    profesores.push(nuevaFicha);
  }
  
  await guardarDatosGlobales();
  cerrarModal();

  if (typeof indexEdicion === 'number') {
    if (document.getElementById('vista-detalle-profesor').classList.contains('vista-activa')) verProfesor(indexEdicion);
    else renderProfesores();
  } else {
    renderProfesores();
    const c = document.getElementById('contadorProfesores');
    if (c) c.innerText = profesores.length;
  }
}

async function eliminarProfesor(index) {
  if (confirm(`¿Eliminar al profesor ${profesores[index].nombre} y todo su historial?`)) {
    document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));
    profesores.splice(index, 1);
    await guardarDatosGlobales(); 
    const c = document.getElementById('contadorProfesores');
    if (c) c.innerText = profesores.length;
    window.cambiarVista(document.getElementById('vista-profesores'), document.getElementById('menuProfesores'));
    renderProfesores();
  }
}

function renderProfesores(filtro = '') {
  const lista = document.getElementById('listaProfesores');
  if (!lista) return;

  const filtrados = profesores.filter(prof => prof.nombre.toLowerCase().includes(filtro) || prof.rut.toLowerCase().includes(filtro));
  if (filtrados.length === 0) {
    lista.innerHTML = `<div class="sin-profesores">Sin registros.</div>`;
    return;
  }

  lista.innerHTML = '';
  filtrados.forEach((prof) => {
    const indexReal = profesores.indexOf(prof);
    lista.innerHTML += `
      <div class="profesor-card clickable-card" onclick="verProfesor(${indexReal})">
        <div class="profesor-info">
          <h3>${prof.nombre}</h3><p><strong>RUT:</strong> ${prof.rut}</p><p><strong>Profesión:</strong> ${prof.profesion || '-'}</p>
        </div>
        <div class="acciones-tarjeta">
          <button class="btn-opciones" onclick="toggleMenuOpciones(event, 'menu-profesor-${indexReal}')">&#8942;</button>
          <div id="menu-profesor-${indexReal}" class="menu-opciones">
            <button class="opcion-item" onclick="event.stopPropagation(); mostrarFormularioProfesor(${indexReal})">Editar Ficha</button>
            <button class="opcion-item opcion-eliminar" onclick="event.stopPropagation(); eliminarProfesor(${indexReal})">Eliminar Profesor</button>
          </div>
        </div>
      </div>`;
  });
}

function verFichaCompleta(index) {
  if (document.querySelector('.modal')) return;
  const p = profesores[index];
  
  const emergenciasHTML = p.emergencia.map(em => `
    <p><strong>${em.nombre || '-'}</strong> (${em.vinculo || '-'}) - Tel: ${em.telefono || em.tel || '-'}</p>
  `).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <h3>Ficha Completa: ${p.nombre}</h3>
        <p style="color: var(--gris-texto); margin-top: -5px; margin-bottom: 15px;">RUT: ${p.rut}</p>
        
        <h4 class="seccion-titulo">Datos Personales</h4>
        <div class="ficha-resumen" style="display: grid; margin-bottom: 15px;">
          <p><strong>Fecha Nacimiento:</strong> ${p.fechaNacimiento || '-'}</p>
          <p><strong>Profesión:</strong> ${p.profesion || '-'}</p>
          <p><strong>Domicilio:</strong> ${p.domicilio || '-'}</p>
          <p><strong>Traslado Frecuente:</strong> ${p.traslado || '-'}</p>
          <p><strong>Licencia de Conducir:</strong> ${p.licencia || '-'}</p>
          <p><strong>Hijos / Personas con quien vive:</strong> ${p.hijos || '0'} / ${p.personasVive || '0'}</p>
        </div>

        <h4 class="seccion-titulo">Contactos de Emergencia</h4>
        <div class="ficha-resumen" style="display: block; margin-bottom: 15px;">
          ${emergenciasHTML || '<p>Sin contactos registrados.</p>'}
        </div>

        <h4 class="seccion-titulo">Salud y Antecedentes</h4>
        <div class="ficha-resumen" style="display: block; margin-bottom: 15px;">
          <p><strong>Condición médica / Enfermedades:</strong> ${p.salud?.enfermedades || '-'}</p>
          <p><strong>Alergias:</strong> ${p.salud?.alergias || '-'}</p>
          <p><strong>Medicamentos permanentes:</strong> ${p.salud?.medicamentos || '-'}</p>
        </div>

        <h4 class="seccion-titulo">Observaciones Generales</h4>
        <div class="ficha-resumen" style="display: block; margin-bottom: 15px;">
          <p>${p.observaciones || '-'}</p>
        </div>

        <div class="modal-botones" style="margin-top: 15px;">
          <button id="btnEditarDesdeFicha" class="btn-principal">Editar Ficha</button>
          <button id="btnCerrarFicha" class="btn-secundario">Cerrar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('btnEditarDesdeFicha').addEventListener('click', () => {
    cerrarModal();
    mostrarFormularioProfesor(index);
  });
  document.getElementById('btnCerrarFicha').addEventListener('click', cerrarModal);
}

function verProfesor(index) {
  const profesor = profesores[index];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  let listaHorarios = `<div class="sin-profesores">Aún no hay horarios registrados.</div>`;
  if (profesor.horarios.length > 0) {
    listaHorarios = profesor.horarios.map((horario, i) => `
      <div class="horario-card clickable-card" onclick="verHorario(${index}, ${i})">
        <div class="horario-info">
          <h3 style="padding-right: 30px;">Horario ${horario.anio}</h3>
          <p>Semestre 1: ${horario.inicioSemestre1} a ${horario.finSemestre1}</p>
          <p>Semestre 2: ${horario.inicioSemestre2} a ${horario.finSemestre2}</p>
        </div>
        <div class="acciones-tarjeta">
          <button class="btn-opciones" onclick="toggleMenuOpciones(event, 'menu-horario-${i}')">&#8942;</button>
          <div id="menu-horario-${i}" class="menu-opciones">
            <button class="opcion-item" onclick="event.stopPropagation(); mostrarFormularioHorario(${index}, ${i})">Editar Fechas</button>
            <button class="opcion-item opcion-eliminar" onclick="event.stopPropagation(); eliminarHorario(${index}, ${i})">Eliminar Horario</button>
          </div>
        </div>
      </div>`).join('');
  }

  const em = profesor.emergencia[0] || {}; 
  
  vistaDetalle.innerHTML = `
    <header class="dashboard-topbar" style="display: block;">
      <div style="margin-bottom: 15px;">
        <button class="btn-secundario" id="btnVolverProfesores" style="padding: 6px 12px; font-size: 13px; background: transparent; border: 1px solid var(--gris-borde); color: var(--gris-texto);">← Volver a Profesores</button>
      </div>
      <div style="display:flex; justify-content: space-between; align-items: center;">
        <div><h1>${profesor.nombre}</h1><p>RUT: ${profesor.rut}</p></div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn-principal" id="btnAgregarHorario">Nuevo Horario</button>
        </div>
      </div>
    </header>

    <section class="modulo-profesores">
      <div class="profesor-card clickable-card" onclick="verFichaCompleta(${index})" style="margin-bottom: 20px; background: var(--blanco);">
        <div class="profesor-info" style="width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;">
            <h3 style="margin: 0; font-size: 20px;">Resumen de Ficha Personal</h3>
            <span style="color: var(--verde-principal); font-weight: bold; font-size: 13px; background: var(--verde-suave); padding: 6px 12px; border-radius: 8px;">Ver Ficha Completa y Editar ➔</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div>
              <p style="color: var(--verde-oscuro); font-size: 12px; margin-bottom: 4px; text-transform: uppercase; font-weight: bold;">Profesión</p>
              <p style="font-size: 15px; color: #222;">${profesor.profesion || '-'}</p>
            </div>
            <div>
              <p style="color: var(--verde-oscuro); font-size: 12px; margin-bottom: 4px; text-transform: uppercase; font-weight: bold;">Fecha Nacimiento</p>
              <p style="font-size: 15px; color: #222;">${profesor.fechaNacimiento || '-'}</p>
            </div>
            <div>
              <p style="color: var(--verde-oscuro); font-size: 12px; margin-bottom: 4px; text-transform: uppercase; font-weight: bold;">Contacto de Emergencia</p>
              <p style="font-size: 15px; color: #222;">${em.nombre || '-'} <br><span style="font-size:13px; color:var(--gris-texto);">${em.tel || em.telefono || '-'}</span></p>
            </div>
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

function mostrarFormularioHorario(indexProfesor, indexHorario = null) {
  if (document.querySelector('.modal')) return;
  document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));

  const esEdicion = typeof indexHorario === 'number';
  const h = esEdicion ? profesores[indexProfesor].horarios[indexHorario] : {};
  const titulo = esEdicion ? 'Editar Fechas' : 'Nuevo Horario';
  const estiloOculto = esEdicion ? '' : 'opacity: 0.4; pointer-events: none;';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>${titulo}</h3>
        <p style="font-size:13px; color:var(--gris-texto); margin-top:-5px;">Ingresa el año académico primero para habilitar los semestres.</p>
        
        <label>Año Académico</label>
        <input type="number" id="anioHorario" value="${h.anio || ''}" placeholder="Ej: 2026" ${esEdicion ? 'readonly style="background:#eee;"' : ''}>
        
        <div id="contenedorFechas" style="${estiloOculto}">
          <label>Inicio semestre 1</label><input type="date" class="input-fecha-semestre" id="inicioSemestre1" value="${h.inicioSemestre1 || ''}">
          <label>Término semestre 1</label><input type="date" class="input-fecha-semestre" id="finSemestre1" value="${h.finSemestre1 || ''}">
          <label>Inicio semestre 2</label><input type="date" class="input-fecha-semestre" id="inicioSemestre2" value="${h.inicioSemestre2 || ''}">
          <label>Término semestre 2</label><input type="date" class="input-fecha-semestre" id="finSemestre2" value="${h.finSemestre2 || ''}">
        </div>
        
        <div id="errorHorario" style="color:#c62828; font-weight:bold; font-size:14px; margin-top:15px; display:none; text-align:center;"></div>
        <div class="modal-botones" style="margin-top:15px;">
          <button id="guardarHorario" class="btn-principal">Guardar</button>
          <button id="cancelar" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  const anioInput = document.getElementById('anioHorario');
  const contenedorFechas = document.getElementById('contenedorFechas');
  const inputsFechas = document.querySelectorAll('.input-fecha-semestre');

  anioInput.addEventListener('input', () => {
    const anioVal = anioInput.value.trim();
    if (anioVal.length === 4 && anioVal >= 2000 && anioVal <= 2100) {
      contenedorFechas.style.opacity = '1';
      contenedorFechas.style.pointerEvents = 'auto';

      if (!esEdicion) {
        if (!inputsFechas[0].value) inputsFechas[0].value = `${anioVal}-03-01`;
        if (!inputsFechas[1].value) inputsFechas[1].value = `${anioVal}-07-15`;
        if (!inputsFechas[2].value) inputsFechas[2].value = `${anioVal}-07-30`;
        if (!inputsFechas[3].value) inputsFechas[3].value = `${anioVal}-12-15`;
      }

      inputsFechas.forEach(input => {
        input.min = `${anioVal}-01-01`;
        input.max = `${anioVal}-12-31`;
      });
    } else {
      if (!esEdicion) {
        contenedorFechas.style.opacity = '0.4';
        contenedorFechas.style.pointerEvents = 'none';
      }
    }
  });

  inputsFechas.forEach(input => {
    input.addEventListener('change', (e) => {
      const anioVal = anioInput.value.trim();
      if (anioVal.length === 4 && e.target.value) {
        const parts = e.target.value.split('-'); 
        if (parts[0] !== anioVal) {
          parts[0] = anioVal;
          e.target.value = parts.join('-');
        }
      }
    });
  });

  document.getElementById('guardarHorario').addEventListener('click', () => guardarHorario(indexProfesor, indexHorario));
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarHorario');
}

async function guardarHorario(indexProfesor, indexHorario) {
  const anio = document.getElementById('anioHorario').value.trim();
  const inicioSemestre1 = document.getElementById('inicioSemestre1').value;
  const finSemestre1 = document.getElementById('finSemestre1').value;
  const inicioSemestre2 = document.getElementById('inicioSemestre2').value;
  const finSemestre2 = document.getElementById('finSemestre2').value;
  const errorDiv = document.getElementById('errorHorario');

  const mostrarError = (msg) => { errorDiv.innerText = msg; errorDiv.style.display = 'block'; };

  if (!anio || !inicioSemestre1 || !finSemestre1 || !inicioSemestre2 || !finSemestre2) return mostrarError("Debes completar todas las fechas.");
  if (anio.length !== 4) return mostrarError("Año inválido.");
  if (inicioSemestre1 >= finSemestre1) return mostrarError("El Semestre 1 debe iniciar antes de terminar.");
  if (finSemestre1 >= inicioSemestre2) return mostrarError("El Semestre 2 no puede iniciar antes de que termine el Semestre 1.");
  if (inicioSemestre2 >= finSemestre2) return mostrarError("El Semestre 2 debe iniciar antes de terminar.");

  const esEdicion = typeof indexHorario === 'number';

  if (!esEdicion) {
    if (profesores[indexProfesor].horarios.some(h => h.anio === anio)) return mostrarError("Año ya registrado.");
    profesores[indexProfesor].horarios.push({ 
      anio, inicioSemestre1, finSemestre1, inicioSemestre2, finSemestre2, 
      faltas: [], licencias: [], 
      horarioClases: crearHorarioClasesBase() 
    });
  } else {
    const hor = profesores[indexProfesor].horarios[indexHorario];
    hor.inicioSemestre1 = inicioSemestre1; hor.finSemestre1 = finSemestre1; hor.inicioSemestre2 = inicioSemestre2; hor.finSemestre2 = finSemestre2;
  }

  await guardarDatosGlobales(); 
  cerrarModal();
  if (esEdicion) verHorario(indexProfesor, indexHorario); else verProfesor(indexProfesor); 
}

async function eliminarHorario(indexProfesor, indexHorario) {
  if (confirm(`¿Seguro de eliminar el horario ${profesores[indexProfesor].horarios[indexHorario].anio}?`)) {
    document.querySelectorAll('.menu-opciones').forEach(m => m.classList.remove('mostrar'));
    profesores[indexProfesor].horarios.splice(indexHorario, 1);
    await guardarDatosGlobales();
    verProfesor(indexProfesor); 
  }
}

function verHorario(indexProfesor, indexHorario) {
  const profesor = profesores[indexProfesor];
  const horario = profesores[indexProfesor].horarios[indexHorario];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  if (!horario.faltas) horario.faltas = [];
  if (!horario.licencias) horario.licencias = [];

  const totalFaltas = horario.faltas.length;
  const totalLicencias = horario.licencias.length;

  vistaDetalle.innerHTML = `
    <header class="dashboard-topbar" style="display: block;">
      <div style="margin-bottom: 15px;">
        <button class="btn-secundario" id="btnVolverProfesor" style="padding: 6px 12px; font-size: 13px; background: transparent; border: 1px solid var(--gris-borde); color: var(--gris-texto);">← Volver al Perfil</button>
      </div>
      <div style="display:flex; justify-content: space-between; align-items: center;">
        <div><h1>${profesor.nombre}</h1><p>RUT: ${profesor.rut} | Calendario ${horario.anio}</p></div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn-secundario" id="btnHorarioClases">Ver Horario Clases</button>
          <button class="btn-principal" id="btnRegistrarFalta">Registrar Falta/Permiso</button>
          <button class="btn-principal" id="btnRegistrarLicencia">Registrar Licencia</button>
        </div>
      </div>
    </header>
    <section class="modulo-profesores">
      <section class="horario-resumen">
        <div class="estado-box estado-verde">Días asistidos</div><div class="estado-box estado-gris">Días futuros</div>
        <div class="estado-box estado-rojo">Faltas/Permisos: ${totalFaltas}</div>
        <div class="estado-box estado-amarillo">Licencias: ${totalLicencias}</div>
        <div class="estado-box estado-tachado">Días no hábiles</div>
      </section>
      <section class="meses-grid">${generarMesesHorario(parseInt(horario.anio), horario)}</section>
    </section>
  `;
  window.cambiarVista(vistaDetalle, document.getElementById('menuProfesores'));
  document.getElementById('btnVolverProfesor').addEventListener('click', () => verProfesor(indexProfesor));
  document.getElementById('btnHorarioClases').addEventListener('click', () => verHorarioClases(indexProfesor, indexHorario));
  
  document.getElementById('btnRegistrarFalta').addEventListener('click', () => mostrarFormularioFalta(indexProfesor, indexHorario));
  document.getElementById('btnRegistrarLicencia').addEventListener('click', () => mostrarFormularioLicencia(indexProfesor, indexHorario));
}

function mostrarFormularioFalta(indexProfesor, indexHorario) {
  if (document.querySelector('.modal')) return;
  const anio = profesores[indexProfesor].horarios[indexHorario].anio;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Registrar Falta o Permiso</h3>
        <p style="font-size:13px; color:var(--gris-texto); margin-top:-5px;">Año Académico: ${anio}</p>

        <label>Tipo</label>
        <select id="tipoFalta" style="padding: 12px; width: 100%; border: 1px solid var(--gris-borde); border-radius: 10px; margin-bottom: 10px;">
          <option value="Inasistencia">Inasistencia (Sin justificar)</option>
          <option value="Permiso">Permiso Administrativo</option>
        </select>

        <label>Día de la Falta</label>
        <input type="date" id="fechaFalta" min="${anio}-01-01" max="${anio}-12-31" style="width: 100%; padding: 12px; border: 1px solid var(--gris-borde); border-radius: 10px; margin-bottom: 10px;">

        <label>Motivo u Observación</label>
        <textarea id="motivoFalta" placeholder="Ej: Problemas familiares, Atraso severo..."></textarea>

        <div id="errorFalta" style="color: #c62828; font-weight: bold; font-size: 14px; margin-top: 15px; display: none; text-align: center;"></div>

        <div class="modal-botones" style="margin-top: 15px;">
          <button id="guardarFalta" class="btn-principal">Registrar Falta</button>
          <button id="cancelarFalta" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarFalta').addEventListener('click', async () => {
    const tipo = document.getElementById('tipoFalta').value;
    const fecha = document.getElementById('fechaFalta').value;
    const motivo = document.getElementById('motivoFalta').value.trim();
    const errorDiv = document.getElementById('errorFalta');

    if (!fecha) {
      errorDiv.innerText = "Error: Selecciona una fecha.";
      errorDiv.style.display = 'block';
      return;
    }
    if (fecha.split('-')[0] !== anio) {
      errorDiv.innerText = `Error: La fecha debe pertenecer al año ${anio}.`;
      errorDiv.style.display = 'block';
      return;
    }

    if (!profesores[indexProfesor].horarios[indexHorario].faltas) profesores[indexProfesor].horarios[indexHorario].faltas = [];
    profesores[indexProfesor].horarios[indexHorario].faltas.push({ tipo, fecha, motivo, registro: new Date().toISOString().split('T')[0] });
    
    await guardarDatosGlobales();
    cerrarModal();
    verHorario(indexProfesor, indexHorario);
  });

  document.getElementById('cancelarFalta').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarFalta');
}

function mostrarFormularioLicencia(indexProfesor, indexHorario) {
  if (document.querySelector('.modal')) return;
  const anio = profesores[indexProfesor].horarios[indexHorario].anio;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Registrar Licencia Médica</h3>
        <p style="font-size:13px; color:var(--gris-texto); margin-top:-5px;">Año Académico: ${anio}</p>

        <div class="form-grid">
          <div>
            <label>Desde</label>
            <input type="date" id="fechaInicioLicencia" min="${anio}-01-01" max="${anio}-12-31" style="width: 100%; padding: 12px; border: 1px solid var(--gris-borde); border-radius: 10px;">
          </div>
          <div>
            <label>Hasta</label>
            <input type="date" id="fechaFinLicencia" min="${anio}-01-01" max="${anio}-12-31" style="width: 100%; padding: 12px; border: 1px solid var(--gris-borde); border-radius: 10px;">
          </div>
        </div>

        <label>Motivo u Observación</label>
        <textarea id="motivoLicencia" placeholder="Ej: Cirugía, Reposo por accidente..."></textarea>

        <label>Documento Adjunto (PDF/Imagen)</label>
        <input type="file" id="adjuntoLicencia" accept=".pdf, image/*" style="padding: 8px; font-size: 13px; width: 100%; border: 1px dashed var(--gris-borde); border-radius: 8px;">

        <div id="errorLicencia" style="color: #c62828; font-weight: bold; font-size: 14px; margin-top: 15px; display: none; text-align: center;"></div>

        <div class="modal-botones" style="margin-top: 15px;">
          <button id="guardarLicencia" class="btn-principal">Registrar Licencia</button>
          <button id="cancelarLicencia" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarLicencia').addEventListener('click', async () => {
    const fechaInicio = document.getElementById('fechaInicioLicencia').value;
    const fechaFin = document.getElementById('fechaFinLicencia').value;
    const motivo = document.getElementById('motivoLicencia').value.trim();
    const archivoAdjunto = document.getElementById('adjuntoLicencia').files[0];
    const errorDiv = document.getElementById('errorLicencia');

    if (!fechaInicio || !fechaFin) {
      errorDiv.innerText = "Error: Faltan fechas por completar.";
      errorDiv.style.display = 'block';
      return;
    }
    if (fechaInicio.split('-')[0] !== anio || fechaFin.split('-')[0] !== anio) {
      errorDiv.innerText = `Error: Las fechas deben pertenecer al año ${anio}.`;
      errorDiv.style.display = 'block';
      return;
    }
    if (fechaInicio > fechaFin) {
      errorDiv.innerText = "Error: La fecha de inicio no puede ser mayor a la fecha de término.";
      errorDiv.style.display = 'block';
      return;
    }

    if (!profesores[indexProfesor].horarios[indexHorario].licencias) profesores[indexProfesor].horarios[indexHorario].licencias = [];
    
    profesores[indexProfesor].horarios[indexHorario].licencias.push({ 
      fechaInicio, 
      fechaFin, 
      motivo, 
      archivo: archivoAdjunto ? archivoAdjunto.name : '',
      registro: new Date().toISOString().split('T')[0] 
    });
    
    await guardarDatosGlobales();
    cerrarModal();
    verHorario(indexProfesor, indexHorario);
  });

  document.getElementById('cancelarLicencia').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarLicencia');
}

function verHorarioClases(indexProfesor, indexHorario) {
  const profesor = profesores[indexProfesor];
  const horario = profesores[indexProfesor].horarios[indexHorario];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  vistaDetalle.innerHTML = `
    <header class="dashboard-topbar" style="display: block;">
      <div style="margin-bottom: 15px;">
        <button class="btn-secundario" id="btnVolverCalendario" style="padding: 6px 12px; font-size: 13px; background: transparent; border: 1px solid var(--gris-borde); color: var(--gris-texto);">← Volver al Calendario Anual</button>
      </div>
      <div style="display:flex; justify-content: space-between; align-items: center;">
        <div><h1>${profesor.nombre}</h1><p>Horario Semanal ${horario.anio}</p></div>
      </div>
    </header>
    <section class="modulo-profesores">
      <section class="tabla-horario-contenedor">
        <table class="tabla-horario-clases">
          <thead><tr><th>Bloque</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead>
          <tbody>${generarFilasHorarioClases(indexProfesor, indexHorario)}</tbody>
        </table>
      </section>
    </section>
  `;
  window.cambiarVista(vistaDetalle, document.getElementById('menuProfesores'));
  document.getElementById('btnVolverCalendario').addEventListener('click', () => verHorario(indexProfesor, indexHorario));
}

function editarBloque(indexProfesor, indexHorario, dia, bloque) {
  if (document.querySelector('.modal')) return;
  const opcionesAsignaturas = ASIGNATURAS.map(a => `<option value="${a}">${a}</option>`).join('');
  const opcionesCursos = CURSOS.map(c => `<option value="${c}">${c}</option>`).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Asignar bloque</h3><p>${dia.toUpperCase()} - Bloque ${bloque}</p>
        <select id="selectAsignatura"><option value="">Asignatura (Vacío = borrar)...</option>${opcionesAsignaturas}</select>
        <select id="selectCurso"><option value="">Curso...</option>${opcionesCursos}</select>
        <div class="modal-botones"><button id="guardarAsignatura" class="btn-principal">Guardar</button><button id="cancelar" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);
  document.getElementById('guardarAsignatura').addEventListener('click', async () => {
    const asig = document.getElementById('selectAsignatura').value;
    const cur = document.getElementById('selectCurso').value;
    profesores[indexProfesor].horarios[indexHorario].horarioClases[dia][bloque] = (asig && cur) ? `${asig} - ${cur}` : '';
    await guardarDatosGlobales();
    cerrarModal(); verHorarioClases(indexProfesor, indexHorario);
  });
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarAsignatura');
}

function editarHora(indexProfesor, indexHorario, dia, tipo) {
  if (document.querySelector('.modal')) return;
  const titulo = tipo === 'llegada' ? 'Hora de llegada' : 'Hora de salida';
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>${titulo}</h3><p>${dia.toUpperCase()}</p>
        <input type="time" id="inputHora">
        <p style="font-size:12px; color:#666;">* Vacío para borrar.</p>
        <div class="modal-botones"><button id="guardarHora" class="btn-principal">Guardar</button><button id="cancelar" class="btn-secundario">Cancelar</button></div>
      </div>
    </div>
  `);
  document.getElementById('guardarHora').addEventListener('click', async () => {
    profesores[indexProfesor].horarios[indexHorario].horarioClases[dia][tipo] = document.getElementById('inputHora').value || '';
    await guardarDatosGlobales();
    cerrarModal(); verHorarioClases(indexProfesor, indexHorario);
  });
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
  habilitarEnterEnModal('guardarHora');
}