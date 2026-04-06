if (localStorage.getItem('sesionActiva') !== 'true') {
  window.location.href = 'login.html';
}

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('sesionActiva');
  window.location.href = 'login.html';
});

const menuInicio = document.getElementById('menuInicio');
const menuProfesores = document.getElementById('menuProfesores');
const contenidoDashboard = document.getElementById('contenido-dashboard');

const ASIGNATURAS = [
  'Artes visuales',
  'Ciencias naturales',
  'Comunicación',
  'Educación física y salud',
  'Historia, geografía y ciencias sociales',
  'Inglés',
  'Lengua y literatura',
  'Lenguaje',
  'Matemáticas',
  'Música',
  'Orientación',
  'Religión',
  'Tecnología',
  'Taller artístico',
  'Taller deportivo'
];

const CURSOS = [
  '1°',
  '2°',
  '3°',
  '4°',
  '5°A',
  '5°B',
  '6°A',
  '6°B',
  '7°A',
  '7°B',
  '8°'
];

let profesores = [];

const vistaInicio = contenidoDashboard.innerHTML;

function limpiarMenu() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
}

function mostrarInicio() {
  contenidoDashboard.innerHTML = vistaInicio;
  limpiarMenu();
  menuInicio.classList.add('active');

  const btnProfesores = document.getElementById('btnProfesores');
  if (btnProfesores) {
    btnProfesores.addEventListener('click', mostrarProfesores);
  }
}

function mostrarProfesores() {
  contenidoDashboard.innerHTML = `
    <section class="modulo-profesores">
      <div class="profesores-superior">
        <div>
          <h2>Gestión de Profesores</h2>
          <p>Administra los profesores registrados dentro del sistema.</p>
        </div>
        <button class="btn-principal" id="btnAgregarProfesor">+ Agregar Nuevo</button>
      </div>

      <div class="profesores-barra">
        <input type="text" id="buscadorProfesores" placeholder="Buscar profesor por nombre o rut...">
      </div>

      <div id="listaProfesores" class="lista-profesores"></div>
    </section>
  `;

  limpiarMenu();
  menuProfesores.classList.add('active');

  document.getElementById('btnAgregarProfesor').addEventListener('click', mostrarFormularioProfesor);
  document.getElementById('buscadorProfesores').addEventListener('input', (e) => {
    renderProfesores(e.target.value.trim().toLowerCase());
  });

  renderProfesores();
}

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

function mostrarFormularioHorario(indexProfesor) {
  if (document.querySelector('.modal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Agregar Horario / Año</h3>

        <input type="number" id="anioHorario" placeholder="Año (ej: 2026)">

        <label for="inicioSemestre1">Inicio semestre 1</label>
        <input type="date" id="inicioSemestre1">

        <label for="finSemestre1">Término semestre 1</label>
        <input type="date" id="finSemestre1">

        <label for="inicioSemestre2">Inicio semestre 2</label>
        <input type="date" id="inicioSemestre2">

        <label for="finSemestre2">Término semestre 2</label>
        <input type="date" id="finSemestre2">

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

function cerrarModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
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
}

function crearHorarioClasesBase() {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const filas = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const base = {};

  dias.forEach(dia => {
    base[dia] = {
      llegada: '',
      salida: ''
    };

    filas.forEach(fila => {
      base[dia][fila] = '';
    });
  });

  return base;
}

function guardarHorario(indexProfesor) {
  const anio = document.getElementById('anioHorario').value.trim();
  const inicioSemestre1 = document.getElementById('inicioSemestre1').value;
  const finSemestre1 = document.getElementById('finSemestre1').value;
  const inicioSemestre2 = document.getElementById('inicioSemestre2').value;
  const finSemestre2 = document.getElementById('finSemestre2').value;

  if (!anio || !inicioSemestre1 || !finSemestre1 || !inicioSemestre2 || !finSemestre2) {
    return;
  }

  const yaExiste = profesores[indexProfesor].horarios.some(h => h.anio === anio);
  if (yaExiste) return;

  profesores[indexProfesor].horarios.push({
    anio,
    inicioSemestre1,
    finSemestre1,
    inicioSemestre2,
    finSemestre2,
    inasistencias: [],
    licencias: [],
    horarioClases: crearHorarioClasesBase()
  });

  cerrarModal();
  verProfesor(indexProfesor);
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

function verProfesor(index) {
  const profesor = profesores[index];

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

  contenidoDashboard.innerHTML = `
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

  limpiarMenu();
  menuProfesores.classList.add('active');

  document.getElementById('btnVolverProfesores').addEventListener('click', mostrarProfesores);
  document.getElementById('btnAgregarHorario').addEventListener('click', () => mostrarFormularioHorario(index));
}

function esDentroDeSemestre(fecha, horario) {
  const inicio1 = new Date(horario.inicioSemestre1 + 'T00:00:00');
  const fin1 = new Date(horario.finSemestre1 + 'T00:00:00');
  const inicio2 = new Date(horario.inicioSemestre2 + 'T00:00:00');
  const fin2 = new Date(horario.finSemestre2 + 'T00:00:00');
  return (fecha >= inicio1 && fecha <= fin1) || (fecha >= inicio2 && fecha <= fin2);
}

function esFinDeSemana(fecha) {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

function obtenerDesfasePrimerDia(anio, mesNumero) {
  const primerDia = new Date(anio, mesNumero - 1, 1).getDay();
  return primerDia === 0 ? 6 : primerDia - 1;
}

function generarDiasMes(anio, mesNumero, horario) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diasEnMes = new Date(anio, mesNumero, 0).getDate();
  const desfase = obtenerDesfasePrimerDia(anio, mesNumero);

  let html = '';

  for (let i = 0; i < desfase; i++) {
    html += `<div class="dia-vacio"></div>`;
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(anio, mesNumero - 1, dia);
    fecha.setHours(0, 0, 0, 0);

    const dentroSemestre = esDentroDeSemestre(fecha, horario);
    const finDeSemana = esFinDeSemana(fecha);
    const yaPaso = fecha <= hoy;

    let clase = 'dia-tachado';
    if (dentroSemestre && !finDeSemana) {
      clase = yaPaso ? 'dia-verde' : 'dia-gris';
    }

    html += `<div class="dia-box ${clase}">${dia}</div>`;
  }

  return html;
}

function generarMesesHorario(anio, horario) {
  const meses = [
    { nombre: 'Enero', numero: 1 },
    { nombre: 'Febrero', numero: 2 },
    { nombre: 'Marzo', numero: 3 },
    { nombre: 'Abril', numero: 4 },
    { nombre: 'Mayo', numero: 5 },
    { nombre: 'Junio', numero: 6 },
    { nombre: 'Julio', numero: 7 },
    { nombre: 'Agosto', numero: 8 },
    { nombre: 'Septiembre', numero: 9 },
    { nombre: 'Octubre', numero: 10 },
    { nombre: 'Noviembre', numero: 11 },
    { nombre: 'Diciembre', numero: 12 }
  ];

  return meses.map(mes => `
    <div class="mes-card">
      <h3>${mes.nombre} ${anio}</h3>
      <div class="dias-semana">
        <div>Lun</div>
        <div>Mar</div>
        <div>Mié</div>
        <div>Jue</div>
        <div>Vie</div>
        <div>Sáb</div>
        <div>Dom</div>
      </div>
      <div class="dias-grid">
        ${generarDiasMes(anio, mes.numero, horario)}
      </div>
    </div>
  `).join('');
}

function verHorario(indexProfesor, indexHorario) {
  const profesor = profesores[indexProfesor];
  const horario = profesores[indexProfesor].horarios[indexHorario];
  const anio = parseInt(horario.anio, 10);

  contenidoDashboard.innerHTML = `
    <section class="modulo-profesores">
      <div class="profesores-superior">
        <div>
          <h2>${profesor.nombre}</h2>
          <p>RUT: ${profesor.rut} | Horario ${horario.anio}</p>
          <p>Semestre 1: ${horario.inicioSemestre1} a ${horario.finSemestre1}</p>
          <p>Semestre 2: ${horario.inicioSemestre2} a ${horario.finSemestre2}</p>
        </div>
        <button class="btn-principal" id="btnAgregarIncidencia">+ Agregar Incidencia</button>
      </div>

      <div class="profesores-barra barra-acciones-horario">
        <button class="btn-secundario" id="btnVolverHorarios">← Volver a Horarios</button>
        <button class="btn-secundario" id="btnHorarioClases">Horario de clases</button>
      </div>

      <section class="horario-resumen">
        <div class="estado-box estado-verde">Días asistidos</div>
        <div class="estado-box estado-gris">Días futuros</div>
        <div class="estado-box estado-rojo">Días con inasistencia</div>
        <div class="estado-box estado-amarillo">Días con licencia</div>
        <div class="estado-box estado-tachado">Días no hábiles</div>
      </section>

      <section class="meses-grid">
        ${generarMesesHorario(anio, horario)}
      </section>
    </section>
  `;

  limpiarMenu();
  menuProfesores.classList.add('active');

  document.getElementById('btnVolverHorarios').addEventListener('click', () => verProfesor(indexProfesor));
  document.getElementById('btnHorarioClases').addEventListener('click', () => verHorarioClases(indexProfesor, indexHorario));
  document.getElementById('btnAgregarIncidencia').addEventListener('click', () => {
    alert('Aquí después agregaremos inasistencias y licencias');
  });
}

function obtenerTextoCelda(horario, dia, bloque) {
  return horario.horarioClases?.[dia]?.[bloque] || '';
}

function obtenerHoraCelda(horario, dia, tipo) {
  return horario.horarioClases?.[dia]?.[tipo] || '';
}

function generarFilasHorarioClases(indexProfesor, indexHorario) {
  const horario = profesores[indexProfesor].horarios[indexHorario];

  const filas = [
    { nombre: 'Hora llegada', tipo: 'hora-llegada' },
    { nombre: '1', tipo: 'editable' },
    { nombre: '2', tipo: 'editable' },
    { nombre: 'Recreo', tipo: 'recreo' },
    { nombre: '3', tipo: 'editable' },
    { nombre: '4', tipo: 'editable' },
    { nombre: 'Recreo', tipo: 'recreo' },
    { nombre: '5', tipo: 'editable' },
    { nombre: '6', tipo: 'editable' },
    { nombre: 'Almuerzo', tipo: 'almuerzo' },
    { nombre: '7', tipo: 'editable' },
    { nombre: '8', tipo: 'editable' },
    { nombre: 'Hora salida', tipo: 'hora-salida' }
  ];

  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

  return filas.map(fila => {
    const celdas = dias.map(dia => {
      const esViernes = dia === 'viernes';
      const esRecreo = fila.tipo === 'recreo';
      const esAlmuerzo = fila.tipo === 'almuerzo';
      const esEditable = fila.tipo === 'editable';
      const esHoraLlegada = fila.tipo === 'hora-llegada';
      const esHoraSalida = fila.tipo === 'hora-salida';
      const esBloqueTarde = fila.nombre === '7' || fila.nombre === '8';

      if (esRecreo) {
        return `<td class="celda-recreo">RECREO</td>`;
      }

      if (esAlmuerzo) {
        if (esViernes) {
          return `<td class="celda-viernes-bloqueado">NO APLICA</td>`;
        }
        return `<td class="celda-almuerzo">ALMUERZO</td>`;
      }

      if (esViernes && esBloqueTarde) {
        return `<td class="celda-viernes-bloqueado">NO APLICA</td>`;
      }

      if (esHoraLlegada) {
        const texto = obtenerHoraCelda(horario, dia, 'llegada');
        return `
          <td class="celda-editable" onclick="editarHora(${indexProfesor}, ${indexHorario}, '${dia}', 'llegada')">
            ${texto || '<span class="texto-vacio">Sin hora</span>'}
          </td>
        `;
      }

      if (esHoraSalida) {
        const texto = obtenerHoraCelda(horario, dia, 'salida');
        return `
          <td class="celda-editable" onclick="editarHora(${indexProfesor}, ${indexHorario}, '${dia}', 'salida')">
            ${texto || '<span class="texto-vacio">Sin hora</span>'}
          </td>
        `;
      }

      if (esEditable) {
        const texto = obtenerTextoCelda(horario, dia, fila.nombre);
        return `
          <td class="celda-editable" onclick="editarBloque(${indexProfesor}, ${indexHorario}, '${dia}', '${fila.nombre}')">
            ${texto || '<span class="texto-vacio">Libre</span>'}
          </td>
        `;
      }

      return `<td></td>`;
    }).join('');

    return `
      <tr>
        <td class="celda-bloque">${fila.nombre}</td>
        ${celdas}
      </tr>
    `;
  }).join('');
}

function verHorarioClases(indexProfesor, indexHorario) {
  const profesor = profesores[indexProfesor];
  const horario = profesores[indexProfesor].horarios[indexHorario];

  contenidoDashboard.innerHTML = `
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
              <th>Bloque</th>
              <th>Lunes</th>
              <th>Martes</th>
              <th>Miércoles</th>
              <th>Jueves</th>
              <th>Viernes</th>
            </tr>
          </thead>
          <tbody>
            ${generarFilasHorarioClases(indexProfesor, indexHorario)}
          </tbody>
        </table>
      </section>
    </section>
  `;

  limpiarMenu();
  menuProfesores.classList.add('active');

  document.getElementById('btnVolverCalendario').addEventListener('click', () => verHorario(indexProfesor, indexHorario));
}

function editarBloque(indexProfesor, indexHorario, dia, bloque) {
  if (document.querySelector('.modal')) return;

  const opcionesAsignaturas = ASIGNATURAS.map(asignatura => `
    <option value="${asignatura}">${asignatura}</option>
  `).join('');

  const opcionesCursos = CURSOS.map(curso => `
    <option value="${curso}">${curso}</option>
  `).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <h3>Seleccionar asignatura y curso</h3>
        <p>${dia.charAt(0).toUpperCase() + dia.slice(1)} - Bloque ${bloque}</p>

        <label for="selectAsignatura">Asignatura</label>
        <select id="selectAsignatura" class="select-asignatura">
          <option value="">Seleccione una asignatura</option>
          ${opcionesAsignaturas}
        </select>

        <label for="selectCurso">Curso</label>
        <select id="selectCurso" class="select-asignatura">
          <option value="">Seleccione un curso</option>
          ${opcionesCursos}
        </select>

        <div class="modal-botones">
          <button id="guardarAsignatura">Guardar</button>
          <button id="cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('guardarAsignatura').addEventListener('click', () => {
    const asignatura = document.getElementById('selectAsignatura').value;
    const curso = document.getElementById('selectCurso').value;

    if (!asignatura || !curso) return;

    profesores[indexProfesor].horarios[indexHorario].horarioClases[dia][bloque] = `${asignatura} - ${curso}`;
    cerrarModal();
    verHorarioClases(indexProfesor, indexHorario);
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
        <p>${dia.charAt(0).toUpperCase() + dia.slice(1)}</p>

        <label for="inputHora">Hora</label>
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
    if (!hora) return;

    profesores[indexProfesor].horarios[indexHorario].horarioClases[dia][tipo] = hora;
    cerrarModal();
    verHorarioClases(indexProfesor, indexHorario);
  });

  document.getElementById('cancelar').addEventListener('click', cerrarModal);
}

menuInicio.addEventListener('click', (e) => {
  e.preventDefault();
  mostrarInicio();
});

menuProfesores.addEventListener('click', (e) => {
  e.preventDefault();
  mostrarProfesores();
});

const btnProfesoresInicio = document.getElementById('btnProfesores');
if (btnProfesoresInicio) {
  btnProfesoresInicio.addEventListener('click', mostrarProfesores);
}