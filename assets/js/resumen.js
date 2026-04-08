// ==========================================
// ARCHIVO: assets/js/resumen.js
// Propósito: Toma de Lista Dinámica sin CSS en línea
// ==========================================

let filtroActualResumen = 'todos';
let busquedaActualResumen = '';

window.aplicarFiltroResumen = function(filtro) {
  filtroActualResumen = filtro;
  const botonesFiltro = document.querySelectorAll('.filtro-btn');
  if (botonesFiltro) botonesFiltro.forEach(b => b.classList.remove('activo-todos', 'activo-presentes', 'activo-faltas', 'activo-licencias'));
  
  const target = document.querySelector(`.filtro-btn[data-filtro="${filtro}"]`);
  if (target) {
    if (filtro === 'todos') target.classList.add('activo-todos');
    if (filtro === 'presente') target.classList.add('activo-presentes');
    if (filtro === 'falta') target.classList.add('activo-faltas');
    if (filtro === 'licencia') target.classList.add('activo-licencias');
  }
  renderListaDiaria();
};

function renderListaDiaria() {
  const hoyObj = new Date();
  const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
  const anioActual = hoyStr.split('-')[0];

  const fechaConsulta = hoyStr;
  const anioConsulta = anioActual;

  const fechaVisual = `${String(hoyObj.getDate()).padStart(2, '0')}/${String(hoyObj.getMonth() + 1).padStart(2, '0')}/${hoyObj.getFullYear()}`;
  const labelFecha = document.getElementById('fechaHoyResumen');
  if (labelFecha) labelFecha.innerText = `Fecha en curso: ${fechaVisual}`;

  const tbody = document.getElementById('listaAsistenciaDiaria');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (profesores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-3 text-muted">No hay profesores registrados en el sistema.</td></tr>';
    return;
  }

  let countTodos = 0, countPresentes = 0, countFaltas = 0, countLicencias = 0;

  const filas = profesores.map((p, indexP) => {
    const indexH = p.horarios.findIndex(h => h.anio === anioConsulta);
    let estadoFiltro = 'presente';
    let estadoStr = '<span class="estado-box estado-verde fs-sm py-1 px-2">Presente</span>';
    let botonAccion = `<button class="btn-danger border-none fs-sm py-1 px-2 cursor-pointer border-radius-sm" onclick="marcarFaltaRapida(${indexP}, ${indexH}, '${fechaConsulta}')">Marcar Inasistencia</button>`;

    if (indexH === -1) {
      estadoFiltro = 'inactivo';
      estadoStr = `<span class="text-muted fs-sm">Sin calendario en ${anioConsulta}</span>`;
      botonAccion = '<button class="btn-secundario border-none fs-sm py-1 px-2 border-radius-sm" disabled>Bloqueado</button>';
    } else {
      const h = p.horarios[indexH];
      const tieneFalta = h.faltas && h.faltas.some(f => f.fecha === fechaConsulta);
      const tieneLicencia = h.licencias && h.licencias.some(l => fechaConsulta >= l.fechaInicio && fechaConsulta <= l.fechaFin);

      if (tieneLicencia) {
        estadoFiltro = 'licencia';
        estadoStr = '<span class="estado-box estado-amarillo text-warning fs-sm py-1 px-2">En Licencia Médica</span>';
        botonAccion = '<button class="btn-secundario border-none fs-sm py-1 px-2 border-radius-sm" disabled>Acción Bloqueada</button>';
      } else if (tieneFalta) {
        estadoFiltro = 'falta';
        estadoStr = '<span class="estado-box estado-rojo text-danger fs-sm py-1 px-2">Ausente (Inasistencia)</span>';
        botonAccion = `<button class="btn-principal border-none fs-sm py-1 px-2 cursor-pointer border-radius-sm" onclick="revertirFaltaRapida(${indexP}, ${indexH}, '${fechaConsulta}')">Deshacer y Marcar Presente</button>`;
      }
    }

    if (estadoFiltro !== 'inactivo') countTodos++;
    if (estadoFiltro === 'presente') countPresentes++;
    if (estadoFiltro === 'falta') countFaltas++;
    if (estadoFiltro === 'licencia') countLicencias++;

    return { p, indexP, indexH, estadoFiltro, estadoStr, botonAccion };
  });

  const cTodos = document.getElementById('countTodos'); if(cTodos) cTodos.innerText = countTodos;
  const cPres = document.getElementById('countPresentes'); if(cPres) cPres.innerText = countPresentes;
  const cFalt = document.getElementById('countFaltas'); if(cFalt) cFalt.innerText = countFaltas;
  const cLic = document.getElementById('countLicencias'); if(cLic) cLic.innerText = countLicencias;

  const filasFiltradas = filas.filter(f => {
    if (filtroActualResumen !== 'todos' && f.estadoFiltro !== filtroActualResumen) return false;
    if (filtroActualResumen === 'todos' && f.estadoFiltro === 'inactivo' && !busquedaActualResumen) return false;

    if (busquedaActualResumen) {
      const match = f.p.nombre.toLowerCase().includes(busquedaActualResumen) || f.p.rut.toLowerCase().includes(busquedaActualResumen);
      if (!match) return false;
    }
    return true;
  });

  if (filasFiltradas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-3 text-muted">No se encontraron resultados para los filtros actuales.</td></tr>';
    return;
  }

  filasFiltradas.forEach(f => {
    const btnVer = `<button class="btn-secundario btn-outline-muted py-1 px-2 fs-sm cursor-pointer border-radius-sm" onclick="verProfesorDesdeResumen(${f.indexP})">Ver Perfil</button>`;
    tbody.innerHTML += `
      <tr>
        <td class="text-left px-3 fw-bold text-primary">${f.p.nombre}</td>
        <td>${f.p.rut}</td>
        <td>${f.estadoStr}</td>
        <td>${f.botonAccion}</td>
        <td>${btnVer}</td>
      </tr>`;
  });
}

function verProfesorDesdeResumen(index) { if (typeof verProfesor === 'function') verProfesor(index); }

async function marcarFaltaRapida(indexP, indexH, fecha) {
  if (indexH === -1) return;
  if (!profesores[indexP].horarios[indexH].faltas) profesores[indexP].horarios[indexH].faltas = [];
  profesores[indexP].horarios[indexH].faltas.push({ tipo: 'Inasistencia', fecha: fecha, motivo: 'Falta rápida registrada desde la Toma de Lista Diaria', registro: new Date().toISOString().split('T')[0] });
  await guardarDatosGlobales(); renderListaDiaria(); if (typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
}

async function revertirFaltaRapida(indexP, indexH, fecha) {
  if (indexH === -1) return;
  if (!profesores[indexP].horarios[indexH].faltas) return;
  profesores[indexP].horarios[indexH].faltas = profesores[indexP].horarios[indexH].faltas.filter(f => f.fecha !== fecha);
  await guardarDatosGlobales(); renderListaDiaria(); if (typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
}

document.addEventListener('DOMContentLoaded', () => {
  const buscadorResumen = document.getElementById('buscadorResumen');
  if (buscadorResumen) buscadorResumen.addEventListener('input', (e) => { busquedaActualResumen = e.target.value.trim().toLowerCase(); renderListaDiaria(); });
  
  const botonesFiltro = document.querySelectorAll('.filtro-btn');
  botonesFiltro.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.closest('.filtro-btn');
      if (!target) return;
      window.aplicarFiltroResumen(target.dataset.filtro);
    });
  });
});