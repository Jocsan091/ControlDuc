// ==========================================
// ARCHIVO: assets/js/profesores.js
// Propósito: Gestión visual y lógica de docentes (Ficha Personal completa y edición)
// ==========================================

const btnAgregar = document.getElementById('btnAgregarProfesor');
if (btnAgregar) btnAgregar.addEventListener('click', () => mostrarFormularioProfesor());

const buscador = document.getElementById('buscadorProfesores');
if (buscador) {
  buscador.addEventListener('input', (e) => {
    renderProfesores(e.target.value.trim().toLowerCase());
  });
}

// ESTA FUNCIÓN AHORA SIRVE PARA CREAR (index = null) O EDITAR (index = número)
function mostrarFormularioProfesor(indexEdicion = null) {
  if (document.querySelector('.modal')) return;

  const esEdicion = typeof indexEdicion === 'number';
  const p = esEdicion ? profesores[indexEdicion] : {};
  const em1 = p.emergencia?.[0] || {};
  const em2 = p.emergencia?.[1] || {};
  const salud = p.salud || {};

  const titulo = esEdicion ? 'Editar Ficha del Docente' : 'Nueva Ficha del Docente';
  const textoBoton = esEdicion ? 'Guardar Cambios' : 'Guardar Nueva Ficha';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content modal-largo">
        <h3>${titulo}</h3>
        
        <h4 class="seccion-titulo">Datos Personales</h4>
        <div class="form-grid">
          <div><label>Nombre Completo</label><input type="text" id="f_nombre" value="${p.nombre || ''}" placeholder="Ej: Juan Pérez"></div>
          <div><label>RUT</label><input type="text" id="f_rut" value="${p.rut || ''}" placeholder="Ej: 12345678-9"></div>
          <div><label>Fecha de Nacimiento</label><input type="date" id="f_fechaNac" value="${p.fechaNacimiento || ''}"></div>
          <div><label>Domicilio</label><input type="text" id="f_domicilio" value="${p.domicilio || ''}"></div>
          <div><label>Traslado Frecuente</label><input type="text" id="f_traslado" value="${p.traslado || ''}"></div>
          <div><label>Licencia de Conducir</label><input type="text" id="f_licencia" value="${p.licencia || ''}"></div>
          <div><label>Profesión</label><input type="text" id="f_profesion" value="${p.profesion || ''}"></div>
          <div><label>Hijos (Cantidad)</label><input type="number" id="f_hijos" value="${p.hijos || '0'}" min="0"></div>
          <div><label>Personas C/ Vive</label><input type="number" id="f_personasVive" value="${p.personasVive || '0'}" min="0"></div>
        </div>

        <h4 class="seccion-titulo">En caso de Emergencia avisar a:</h4>
        <div class="form-grid-3">
          <input type="text" id="f_em_nombre1" value="${em1.nombre || ''}" placeholder="Nombre">
          <input type="text" id="f_em_vinculo1" value="${em1.vinculo || ''}" placeholder="Vínculo">
          <input type="text" id="f_em_tel1" value="${em1.telefono || ''}" placeholder="Teléfono">
          
          <input type="text" id="f_em_nombre2" value="${em2.nombre || ''}" placeholder="Nombre (Opcional)">
          <input type="text" id="f_em_vinculo2" value="${em2.vinculo || ''}" placeholder="Vínculo (Opcional)">
          <input type="text" id="f_em_tel2" value="${em2.telefono || ''}" placeholder="Teléfono (Opcional)">
        </div>

        <h4 class="seccion-titulo">Salud y Antecedentes</h4>
        <label>Enfermedades y/o condición médica</label>
        <textarea id="f_enfermedades" placeholder="Especifique...">${salud.enfermedades || ''}</textarea>
        
        <label>Alergias</label>
        <input type="text" id="f_alergias" value="${salud.alergias || ''}" placeholder="Especifique...">
        
        <label>Medicamentos Permanentes</label>
        <textarea id="f_medicamentos" placeholder="Especifique...">${salud.medicamentos || ''}</textarea>

        <label>Observaciones</label>
        <textarea id="f_observaciones" placeholder="Información adicional relevante...">${p.observaciones || ''}</textarea>

        <div class="modal-botones" style="margin-top: 20px;">
          <button id="guardarProfesor">${textoBoton}</button>
          <button id="cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarProfesor').addEventListener('click', () => guardarProfesor(indexEdicion));
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
}

async function guardarProfesor(indexEdicion) {
  const nombre = document.getElementById('f_nombre').value.trim();
  const rut = document.getElementById('f_rut').value.trim();

  if (!nombre || !rut) {
    alert("El Nombre y el RUT son obligatorios.");
    return;
  }

  const nuevaFicha = {
    nombre: nombre,
    rut: rut,
    fechaNacimiento: document.getElementById('f_fechaNac').value,
    domicilio: document.getElementById('f_domicilio').value.trim(),
    traslado: document.getElementById('f_traslado').value.trim(),
    licencia: document.getElementById('f_licencia').value.trim(),
    profesion: document.getElementById('f_profesion').value.trim(),
    hijos: document.getElementById('f_hijos').value,
    personasVive: document.getElementById('f_personasVive').value,
    emergencia: [
      {
        nombre: document.getElementById('f_em_nombre1').value.trim(),
        vinculo: document.getElementById('f_em_vinculo1').value.trim(),
        telefono: document.getElementById('f_em_tel1').value.trim()
      },
      {
        nombre: document.getElementById('f_em_nombre2').value.trim(),
        vinculo: document.getElementById('f_em_vinculo2').value.trim(),
        telefono: document.getElementById('f_em_tel2').value.trim()
      }
    ],
    salud: {
      enfermedades: document.getElementById('f_enfermedades').value.trim(),
      alergias: document.getElementById('f_alergias').value.trim(),
      medicamentos: document.getElementById('f_medicamentos').value.trim(),
    },
    observaciones: document.getElementById('f_observaciones').value.trim()
  };

  // LÓGICA: Si indexEdicion es número, estamos actualizando. Si es null, estamos creando.
  if (typeof indexEdicion === 'number') {
    // Es vital mantener los horarios que ya tenía el profesor
    nuevaFicha.horarios = profesores[indexEdicion].horarios;
    profesores[indexEdicion] = nuevaFicha;
  } else {
    nuevaFicha.horarios = [];
    profesores.push(nuevaFicha);
  }
  
  await guardarDatosGlobales(); // Guarda en disco duro
  cerrarModal();

  if (typeof indexEdicion === 'number') {
    verProfesor(indexEdicion); // Recarga la vista del perfil actualizado
  } else {
    renderProfesores(); // Recarga la cuadrícula
    const contador = document.getElementById('contadorProfesores');
    if (contador) contador.innerText = profesores.length;
  }
}

function renderProfesores(filtro = '') {
  const lista = document.getElementById('listaProfesores');
  if (!lista) return;

  const filtrados = profesores.filter(prof =>
    prof.nombre.toLowerCase().includes(filtro) || prof.rut.toLowerCase().includes(filtro)
  );

  if (filtrados.length === 0) {
    lista.innerHTML = `<div class="sin-profesores">Aún no hay profesores registrados.</div>`;
    return;
  }

  lista.innerHTML = '';
  filtrados.forEach((prof) => {
    const indexReal = profesores.indexOf(prof);
    lista.innerHTML += `
      <div class="profesor-card clickable-card" onclick="verProfesor(${indexReal})">
        <div class="profesor-info">
          <h3>${prof.nombre}</h3>
          <p><strong>RUT:</strong> ${prof.rut}</p>
          <p><strong>Profesión:</strong> ${prof.profesion || 'No especificada'}</p>
        </div>
      </div>
    `;
  });
}

function verProfesor(index) {
  const profesor = profesores[index];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  let listaHorarios = `<div class="sin-profesores">Aún no hay horarios registrados para este profesor.</div>`;

  if (profesor.horarios.length > 0) {
    listaHorarios = profesor.horarios.map((horario, i) => `
      <div class="horario-card clickable-card" onclick="verHorario(${index}, ${i})">
        <div class="horario-info">
          <h3>Horario ${horario.anio}</h3>
          <p>Semestre 1: ${horario.inicioSemestre1} a ${horario.finSemestre1}</p>
          <p>Semestre 2: ${horario.inicioSemestre2} a ${horario.finSemestre2}</p>
        </div>
      </div>
    `).join('');
  }

  const em = profesor.emergencia[0] || {}; 

  // AQUÍ ESTÁ LA NUEVA CABECERA (dashboard-topbar) QUE REEMPLAZA EL DISEÑO REDUNDANTE
  vistaDetalle.innerHTML = `
    <header class="dashboard-topbar">
      <div>
        <h1>${profesor.nombre}</h1>
        <p>Ficha Personal | RUT: ${profesor.rut}</p>
      </div>
      <div style="display: flex; gap: 15px; align-items: center;">
        <button class="btn-secundario" id="btnEditarFicha">✏️ Editar Ficha Completa</button>
        <button class="btn-principal" id="btnAgregarHorario">+ Agregar Horario</button>
      </div>
    </header>

    <section class="modulo-profesores">
      <div class="profesores-barra" style="margin-top: -10px;">
        <button class="btn-secundario" id="btnVolverProfesores">← Volver a la Lista de Profesores</button>
      </div>

      <div class="ficha-resumen">
        <p><strong>Profesión:</strong> ${profesor.profesion || '-'}</p>
        <p><strong>Fecha Nacimiento:</strong> ${profesor.fechaNacimiento || '-'}</p>
        <p><strong>Domicilio:</strong> ${profesor.domicilio || '-'}</p>
        <p><strong>Contacto Emergencia:</strong> ${em.nombre || '-'} (${em.tel || em.telefono || '-'})</p>
        <p class="ficha-completa"><strong>Condiciones Médicas / Alergias:</strong> ${profesor.salud?.enfermedades || '-'} / ${profesor.salud?.alergias || '-'}</p>
        <p class="ficha-completa"><strong>Observaciones:</strong> ${profesor.observaciones || '-'}</p>
      </div>

      <h3 class="seccion-titulo" style="border: none; margin-bottom: 15px;">Historial de Horarios</h3>
      <div class="lista-profesores">
        ${listaHorarios}
      </div>
    </section>
  `;

  window.cambiarVista(vistaDetalle, document.getElementById('menuProfesores'));

  document.getElementById('btnVolverProfesores').addEventListener('click', () => {
    window.cambiarVista(document.getElementById('vista-profesores'), document.getElementById('menuProfesores'));
    renderProfesores();
  });
  
  // Asignar eventos a los botones de la cabecera
  document.getElementById('btnEditarFicha').addEventListener('click', () => mostrarFormularioProfesor(index));
  document.getElementById('btnAgregarHorario').addEventListener('click', () => mostrarFormularioHorario(index));
}

function mostrarFormularioHorario(indexProfesor) {
  if (document.querySelector('.modal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Agregar Horario / Año</h3>
        <input type="number" id="anioHorario" placeholder="Año (ej: 2026)">
        <label>Inicio semestre 1</label><input type="date" id="inicioSemestre1">
        <label>Término semestre 1</label><input type="date" id="finSemestre1">
        <label>Inicio semestre 2</label><input type="date" id="inicioSemestre2">
        <label>Término semestre 2</label><input type="date" id="finSemestre2">
        <div class="modal-botones">
          <button id="guardarHorario">Guardar</button>
          <button id="cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarHorario').addEventListener('click', () => guardarHorario(indexProfesor));
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
}

async function guardarHorario(indexProfesor) {
  const anio = document.getElementById('anioHorario').value.trim();
  const inicioSemestre1 = document.getElementById('inicioSemestre1').value;
  const finSemestre1 = document.getElementById('finSemestre1').value;
  const inicioSemestre2 = document.getElementById('inicioSemestre2').value;
  const finSemestre2 = document.getElementById('finSemestre2').value;

  if (!anio || !inicioSemestre1 || !finSemestre1 || !inicioSemestre2 || !finSemestre2) return;

  if (profesores[indexProfesor].horarios.some(h => h.anio === anio)) {
    alert("Ese año ya está registrado.");
    return;
  }

  profesores[indexProfesor].horarios.push({
    anio, inicioSemestre1, finSemestre1, inicioSemestre2, finSemestre2,
    inasistencias: [], licencias: [], horarioClases: crearHorarioClasesBase()
  });

  await guardarDatosGlobales(); // Guarda en disco duro

  cerrarModal();
  verProfesor(indexProfesor);
}

function verHorario(indexProfesor, indexHorario) {
  const profesor = profesores[indexProfesor];
  const horario = profesores[indexProfesor].horarios[indexHorario];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  vistaDetalle.innerHTML = `
    <header class="dashboard-topbar">
      <div>
        <h1>${profesor.nombre}</h1>
        <p>RUT: ${profesor.rut} | Horario ${horario.anio}</p>
      </div>
      <button class="btn-principal" id="btnAgregarIncidencia">+ Agregar Incidencia</button>
    </header>

    <section class="modulo-profesores">
      <div class="profesores-barra barra-acciones-horario" style="margin-top: -10px;">
        <button class="btn-secundario" id="btnVolverProfesor">← Volver al Perfil</button>
        <button class="btn-secundario" id="btnHorarioClases">Horario de clases</button>
      </div>
      <section class="horario-resumen">
        <div class="estado-box estado-verde">Días asistidos</div>
        <div class="estado-box estado-gris">Días futuros</div>
        <div class="estado-box estado-rojo">Días con inasistencia</div>
        <div class="estado-box estado-amarillo">Días con licencia</div>
        <div class="estado-box estado-tachado">Días no hábiles</div>
      </section>
      <section class="meses-grid">${generarMesesHorario(parseInt(horario.anio), horario)}</section>
    </section>
  `;

  window.cambiarVista(vistaDetalle, document.getElementById('menuProfesores'));

  document.getElementById('btnVolverProfesor').addEventListener('click', () => verProfesor(indexProfesor));
  document.getElementById('btnHorarioClases').addEventListener('click', () => verHorarioClases(indexProfesor, indexHorario));
  document.getElementById('btnAgregarIncidencia').addEventListener('click', () => alert('Próximamente'));
}

function verHorarioClases(indexProfesor, indexHorario) {
  const profesor = profesores[indexProfesor];
  const horario = profesores[indexProfesor].horarios[indexHorario];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  vistaDetalle.innerHTML = `
    <header class="dashboard-topbar">
      <div>
        <h1>${profesor.nombre}</h1>
        <p>RUT: ${profesor.rut} | Horario de clases ${horario.anio}</p>
      </div>
    </header>

    <section class="modulo-profesores">
      <div class="profesores-barra barra-acciones-horario" style="margin-top: -10px;">
        <button class="btn-secundario" id="btnVolverCalendario">← Volver al calendario</button>
      </div>
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
        <select id="selectAsignatura"><option value="">Asignatura...</option>${opcionesAsignaturas}</select>
        <select id="selectCurso"><option value="">Curso...</option>${opcionesCursos}</select>
        <div class="modal-botones">
          <button id="guardarAsignatura">Guardar</button>
          <button id="cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarAsignatura').addEventListener('click', async () => {
    const asig = document.getElementById('selectAsignatura').value;
    const cur = document.getElementById('selectCurso').value;
    if (asig && cur) {
      profesores[indexProfesor].horarios[indexHorario].horarioClases[dia][bloque] = `${asig} - ${cur}`;
      await guardarDatosGlobales();
      cerrarModal();
      verHorarioClases(indexProfesor, indexHorario);
    }
  });
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
}

function editarHora(indexProfesor, indexHorario, dia, tipo) {
  if (document.querySelector('.modal')) return;
  const titulo = tipo === 'llegada' ? 'Hora de llegada' : 'Hora de salida';
  
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>${titulo}</h3><p>${dia.toUpperCase()}</p>
        <input type="time" id="inputHora">
        <div class="modal-botones"><button id="guardarHora">Guardar</button><button id="cancelar">Cancelar</button></div>
      </div>
    </div>
  `);

  document.getElementById('guardarHora').addEventListener('click', async () => {
    const hora = document.getElementById('inputHora').value;
    if (hora) {
      profesores[indexProfesor].horarios[indexHorario].horarioClases[dia][tipo] = hora;
      await guardarDatosGlobales();
      cerrarModal();
      verHorarioClases(indexProfesor, indexHorario);
    }
  });
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
}