// ==========================================
// ARCHIVO: assets/js/profesores.js
// Propósito: Gestión visual y lógica de docentes y sus perfiles
// ==========================================

// --- 1. EVENTOS PRINCIPALES DE LA VISTA PROFESORES ---
const btnAgregar = document.getElementById('btnAgregarProfesor');
if (btnAgregar) {
  btnAgregar.addEventListener('click', mostrarFormularioProfesor);
}

const buscador = document.getElementById('buscadorProfesores');
if (buscador) {
  buscador.addEventListener('input', (e) => {
    renderProfesores(e.target.value.trim().toLowerCase());
  });
}

// --- 2. FUNCIONES CRUD ---
function mostrarFormularioProfesor() {
  if (document.querySelector('.modal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Agregar Profesor</h3>
        <input type="text" id="nombreCompleto" placeholder="Nombre completo">
        <input type="text" id="rutProfesor" placeholder="RUT">
        <div class="modal-botones">
          <button id="guardarProfesor">Guardar</button>
          <button id="cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarProfesor').addEventListener('click', guardarProfesor);
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
}

function guardarProfesor() {
  const nombre = document.getElementById('nombreCompleto').value.trim();
  const rut = document.getElementById('rutProfesor').value.trim();

  if (!nombre || !rut) return;

  profesores.push({
    nombre,
    rut,
    horarios: []
  });

  cerrarModal();
  renderProfesores();
  
  // Actualizar el contador del inicio
  const contador = document.getElementById('contadorProfesores');
  if (contador) contador.innerText = profesores.length;
}

function renderProfesores(filtro = '') {
  const lista = document.getElementById('listaProfesores');
  if (!lista) return;

  const filtrados = profesores.filter(prof =>
    prof.nombre.toLowerCase().includes(filtro) ||
    prof.rut.toLowerCase().includes(filtro)
  );

  if (filtrados.length === 0) {
    lista.innerHTML = `<div class="sin-profesores">Aún no hay profesores registrados.</div>`;
    return;
  }

  lista.innerHTML = '';

  filtrados.forEach((profesorOriginal) => {
    const indexReal = profesores.indexOf(profesorOriginal);

    lista.innerHTML += `
      <div class="profesor-card clickable-card" onclick="verProfesor(${indexReal})">
        <div class="profesor-info">
          <h3>${profesorOriginal.nombre}</h3>
          <p><strong>RUT:</strong> ${profesorOriginal.rut}</p>
          <p><strong>Horarios registrados:</strong> ${profesorOriginal.horarios.length}</p>
        </div>
      </div>
    `;
  });
}

// --- 3. FUNCIONES DE DETALLE (Inyectan en vista-detalle-profesor) ---

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

  vistaDetalle.innerHTML = `
    <section class="modulo-profesores">
      <div class="profesores-superior">
        <div>
          <h2>${profesor.nombre}</h2>
          <p>RUT: ${profesor.rut}</p>
        </div>
        <button class="btn-principal" id="btnAgregarHorario">+ Agregar Horario</button>
      </div>

      <div class="profesores-barra">
        <button class="btn-secundario" id="btnVolverProfesores">← Volver a Profesores</button>
      </div>

      <div class="lista-profesores">
        ${listaHorarios}
      </div>
    </section>
  `;

  // Cambiamos a la vista de detalles sin borrar el HTML principal
  window.cambiarVista(vistaDetalle, document.getElementById('menuProfesores'));

  document.getElementById('btnVolverProfesores').addEventListener('click', () => {
    window.cambiarVista(document.getElementById('vista-profesores'), document.getElementById('menuProfesores'));
    renderProfesores();
  });
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

function guardarHorario(indexProfesor) {
  const anio = document.getElementById('anioHorario').value.trim();
  const inicioSemestre1 = document.getElementById('inicioSemestre1').value;
  const finSemestre1 = document.getElementById('finSemestre1').value;
  const inicioSemestre2 = document.getElementById('inicioSemestre2').value;
  const finSemestre2 = document.getElementById('finSemestre2').value;

  if (!anio || !inicioSemestre1 || !finSemestre1 || !inicioSemestre2 || !finSemestre2) return;

  const yaExiste = profesores[indexProfesor].horarios.some(h => h.anio === anio);
  if (yaExiste) {
    alert("Ese año ya está registrado.");
    return;
  }

  profesores[indexProfesor].horarios.push({
    anio, inicioSemestre1, finSemestre1, inicioSemestre2, finSemestre2,
    inasistencias: [], licencias: [],
    horarioClases: crearHorarioClasesBase()
  });

  cerrarModal();
  verProfesor(indexProfesor);
}

function verHorario(indexProfesor, indexHorario) {
  const profesor = profesores[indexProfesor];
  const horario = profesores[indexProfesor].horarios[indexHorario];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  vistaDetalle.innerHTML = `
    <section class="modulo-profesores">
      <div class="profesores-superior">
        <div>
          <h2>${profesor.nombre}</h2>
          <p>RUT: ${profesor.rut} | Horario ${horario.anio}</p>
        </div>
        <button class="btn-principal" id="btnAgregarIncidencia">+ Agregar Incidencia</button>
      </div>

      <div class="profesores-barra barra-acciones-horario">
        <button class="btn-secundario" id="btnVolverProfesor">← Volver al Perfil</button>
        <button class="btn-secundario" id="btnHorarioClases">Horario de clases (Ingresar)</button>
      </div>

      <section class="horario-resumen">
        <div class="estado-box estado-verde">Días asistidos</div>
        <div class="estado-box estado-gris">Días futuros</div>
        <div class="estado-box estado-rojo">Días con inasistencia</div>
        <div class="estado-box estado-amarillo">Días con licencia</div>
        <div class="estado-box estado-tachado">Días no hábiles</div>
      </section>

      <section class="meses-grid">
        ${generarMesesHorario(parseInt(horario.anio), horario)}
      </section>
    </section>
  `;

  window.cambiarVista(vistaDetalle, document.getElementById('menuProfesores'));

  document.getElementById('btnVolverProfesor').addEventListener('click', () => verProfesor(indexProfesor));
  document.getElementById('btnHorarioClases').addEventListener('click', () => verHorarioClases(indexProfesor, indexHorario));
  document.getElementById('btnAgregarIncidencia').addEventListener('click', () => alert('Incidencias próximamente'));
}

function verHorarioClases(indexProfesor, indexHorario) {
  const profesor = profesores[indexProfesor];
  const horario = profesores[indexProfesor].horarios[indexHorario];
  const vistaDetalle = document.getElementById('vista-detalle-profesor');

  vistaDetalle.innerHTML = `
    <section class="modulo-profesores">
      <div class="profesores-superior">
        <div>
          <h2>${profesor.nombre}</h2>
          <p>RUT: ${profesor.rut} | Horario de clases ${horario.anio}</p>
        </div>
      </div>

      <div class="profesores-barra barra-acciones-horario">
        <button class="btn-secundario" id="btnVolverCalendario">← Volver al calendario</button>
      </div>

      <section class="tabla-horario-contenedor">
        <table class="tabla-horario-clases">
          <thead>
            <tr>
              <th>Bloque</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th>
            </tr>
          </thead>
          <tbody>
            ${generarFilasHorarioClases(indexProfesor, indexHorario)}
          </tbody>
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
        <h3>Asignar bloque</h3>
        <p>${dia.toUpperCase()} - Bloque ${bloque}</p>
        <select id="selectAsignatura"><option value="">Asignatura...</option>${opcionesAsignaturas}</select>
        <select id="selectCurso"><option value="">Curso...</option>${opcionesCursos}</select>
        <div class="modal-botones">
          <button id="guardarAsignatura">Guardar</button>
          <button id="cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarAsignatura').addEventListener('click', () => {
    const asig = document.getElementById('selectAsignatura').value;
    const cur = document.getElementById('selectCurso').value;
    if (asig && cur) {
      profesores[indexProfesor].horarios[indexHorario].horarioClases[dia][bloque] = `${asig} - ${cur}`;
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
        <h3>${titulo}</h3>
        <p>${dia.toUpperCase()}</p>
        <input type="time" id="inputHora">
        <div class="modal-botones">
          <button id="guardarHora">Guardar</button>
          <button id="cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarHora').addEventListener('click', () => {
    const hora = document.getElementById('inputHora').value;
    if (hora) {
      profesores[indexProfesor].horarios[indexHorario].horarioClases[dia][tipo] = hora;
      cerrarModal();
      verHorarioClases(indexProfesor, indexHorario);
    }
  });
  document.getElementById('cancelar').addEventListener('click', cerrarModal);
}