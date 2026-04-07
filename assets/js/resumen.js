// ==========================================
// ARCHIVO: assets/js/resumen.js
// Propósito: Sistema de Toma de Lista Diaria con Filtros y Búsqueda
// ==========================================

let filtroActualResumen = 'todos';
let busquedaActualResumen = '';

// FUNCIÓN PUENTE: Recibe la orden desde el Panel Principal
window.aplicarFiltroResumen = function(filtro) {
  filtroActualResumen = filtro;
  
  // Limpiamos todos los colores de los botones
  const botonesFiltro = document.querySelectorAll('.filtro-btn');
  if (botonesFiltro) {
    botonesFiltro.forEach(b => b.classList.remove('activo-todos', 'activo-presentes', 'activo-faltas', 'activo-licencias'));
  }
  
  // Encendemos solo el botón correcto
  const target = document.querySelector(`.filtro-btn[data-filtro="${filtro}"]`);
  if (target) {
    if (filtro === 'todos') target.classList.add('activo-todos');
    if (filtro === 'presente') target.classList.add('activo-presentes');
    if (filtro === 'falta') target.classList.add('activo-faltas');
    if (filtro === 'licencia') target.classList.add('activo-licencias');
  }

  // Repintamos la tabla con el nuevo filtro
  renderListaDiaria();
};

function renderListaDiaria() {
  const hoyObj = new Date();
  const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
  const anioActual = hoyStr.split('-')[0];

  const fechaVisual = `${String(hoyObj.getDate()).padStart(2, '0')}/${String(hoyObj.getMonth() + 1).padStart(2, '0')}/${hoyObj.getFullYear()}`;
  const labelFecha = document.getElementById('fechaHoyResumen');
  if (labelFecha) labelFecha.innerText = `Fecha en curso: ${fechaVisual}`;

  const tbody = document.getElementById('listaAsistenciaDiaria');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (profesores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay profesores registrados en el sistema.</td></tr>';
    return;
  }

  let countTodos = 0, countPresentes = 0, countFaltas = 0, countLicencias = 0;

  const filas = profesores.map((p, indexP) => {
    const indexH = p.horarios.findIndex(h => h.anio === anioActual);
    let estadoFiltro = 'presente';
    let estadoStr = '<span class="estado-box estado-verde" style="padding: 6px 12px; font-size: 13px;">Presente</span>';
    let botonAccion = `<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px; background: #c62828; color: white; border: none; cursor: pointer;" onclick="marcarFaltaRapida(${indexP}, ${indexH}, '${hoyStr}')">Marcar Inasistencia</button>`;

    if (indexH === -1) {
      estadoFiltro = 'inactivo';
      estadoStr = '<span style="color: #777; font-size: 13px;">Sin contrato activo este año</span>';
      botonAccion = '<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px;" disabled>Bloqueado</button>';
    } else {
      const h = p.horarios[indexH];
      const tieneFalta = h.faltas && h.faltas.some(f => f.fecha === hoyStr);
      const tieneLicencia = h.licencias && h.licencias.some(l => hoyStr >= l.fechaInicio && hoyStr <= l.fechaFin);

      if (tieneLicencia) {
        estadoFiltro = 'licencia';
        estadoStr = '<span class="estado-box estado-amarillo" style="padding: 6px 12px; font-size: 13px; color: #e65100;">En Licencia Médica</span>';
        botonAccion = `<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px;" disabled>Acción Bloqueada</button>`;
      } else if (tieneFalta) {
        estadoFiltro = 'falta';
        estadoStr = '<span class="estado-box estado-rojo" style="padding: 6px 12px; font-size: 13px; color: #c62828;">Ausente (Inasistencia)</span>';
        botonAccion = `<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px; background: var(--verde-principal); color: white; border: none; cursor: pointer;" onclick="revertirFaltaRapida(${indexP}, ${indexH}, '${hoyStr}')">Deshacer y Marcar Presente</button>`;
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
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No se encontraron resultados para el filtro actual.</td></tr>';
    return;
  }

  filasFiltradas.forEach(f => {
    const btnVer = `<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px; border: 1px solid var(--gris-borde); cursor: pointer;" onclick="verProfesorDesdeResumen(${f.indexP})">Ver Perfil</button>`;

    tbody.innerHTML += `
      <tr>
        <td style="text-align: left; padding-left: 20px; font-weight: bold; color: var(--verde-oscuro);">${f.p.nombre}</td>
        <td>${f.p.rut}</td>
        <td>${f.estadoStr}</td>
        <td>${f.botonAccion}</td>
        <td>${btnVer}</td>
      </tr>
    `;
  });
}

function verProfesorDesdeResumen(index) {
  if (typeof verProfesor === 'function') {
    verProfesor(index);
  }
}

async function marcarFaltaRapida(indexP, indexH, fecha) {
  if (indexH === -1) return;
  if (!profesores[indexP].horarios[indexH].faltas) profesores[indexP].horarios[indexH].faltas = [];

  profesores[indexP].horarios[indexH].faltas.push({
    tipo: 'Inasistencia',
    fecha: fecha,
    motivo: 'Falta rápida registrada desde la Toma de Lista Diaria',
    registro: new Date().toISOString().split('T')[0]
  });

  await guardarDatosGlobales();
  renderListaDiaria();
  if (typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
}

async function revertirFaltaRapida(indexP, indexH, fecha) {
  if (indexH === -1) return;
  if (!profesores[indexP].horarios[indexH].faltas) return;

  profesores[indexP].horarios[indexH].faltas = profesores[indexP].horarios[indexH].faltas.filter(f => f.fecha !== fecha);

  await guardarDatosGlobales();
  renderListaDiaria();
  if (typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
}

document.addEventListener('DOMContentLoaded', () => {
  const buscadorResumen = document.getElementById('buscadorResumen');
  if (buscadorResumen) {
    buscadorResumen.addEventListener('input', (e) => {
      busquedaActualResumen = e.target.value.trim().toLowerCase();
      renderListaDiaria();
    });
  }

  const botonesFiltro = document.querySelectorAll('.filtro-btn');
  botonesFiltro.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target.closest('.filtro-btn');
      if (!target) return;
      window.aplicarFiltroResumen(target.dataset.filtro);
    });
  });
});