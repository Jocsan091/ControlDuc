// ==========================================
// ARCHIVO: assets/js/resumen.js
// Propósito: Sistema de Toma de Lista Rápida Diaria
// ==========================================

function renderListaDiaria() {
  const hoyObj = new Date();
  const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
  const anioActual = hoyStr.split('-')[0];

  // Formato chileno estándar para visualización
  const fechaVisual = `${String(hoyObj.getDate()).padStart(2, '0')}/${String(hoyObj.getMonth() + 1).padStart(2, '0')}/${hoyObj.getFullYear()}`;
  document.getElementById('fechaHoyResumen').innerText = `Fecha en curso: ${fechaVisual}`;

  const tbody = document.getElementById('listaAsistenciaDiaria');
  tbody.innerHTML = '';

  if (profesores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay profesores registrados en el sistema.</td></tr>';
    return;
  }

  profesores.forEach((p, indexP) => {
    const indexH = p.horarios.findIndex(h => h.anio === anioActual);
    
    let estadoStr = '<span class="estado-box estado-verde" style="padding: 6px 12px; font-size: 13px;">Presente</span>';
    let botonAccion = `<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px; background: #c62828; color: white; border: none; cursor: pointer;" onclick="marcarFaltaRapida(${indexP}, ${indexH}, '${hoyStr}')">Marcar Inasistencia</button>`;

    if (indexH === -1) {
      estadoStr = '<span style="color: #777; font-size: 13px;">Sin contrato activo este año</span>';
      botonAccion = '<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px;" disabled>Bloqueado</button>';
    } else {
      const h = p.horarios[indexH];
      const tieneFalta = h.faltas && h.faltas.some(f => f.fecha === hoyStr);
      const tieneLicencia = h.licencias && h.licencias.some(l => hoyStr >= l.fechaInicio && hoyStr <= l.fechaFin);

      if (tieneLicencia) {
        estadoStr = '<span class="estado-box estado-amarillo" style="padding: 6px 12px; font-size: 13px; color: #e65100;">En Licencia Médica</span>';
        botonAccion = `<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px;" disabled>Acción Bloqueada</button>`;
      } else if (tieneFalta) {
        estadoStr = '<span class="estado-box estado-rojo" style="padding: 6px 12px; font-size: 13px; color: #c62828;">Ausente (Inasistencia)</span>';
        botonAccion = `<button class="btn-secundario" style="padding: 8px 14px; font-size: 13px; background: var(--verde-principal); color: white; border: none; cursor: pointer;" onclick="revertirFaltaRapida(${indexP}, ${indexH}, '${hoyStr}')">Deshacer y Marcar Presente</button>`;
      }
    }

    tbody.innerHTML += `
      <tr>
        <td style="text-align: left; padding-left: 20px; font-weight: bold; color: var(--verde-oscuro);">${p.nombre}</td>
        <td>${p.rut}</td>
        <td>${estadoStr}</td>
        <td>${botonAccion}</td>
      </tr>
    `;
  });
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

  // Eliminar la falta del día específico
  profesores[indexP].horarios[indexH].faltas = profesores[indexP].horarios[indexH].faltas.filter(f => f.fecha !== fecha);

  await guardarDatosGlobales();
  renderListaDiaria();
  if (typeof actualizarDashboardInicio === 'function') actualizarDashboardInicio();
}