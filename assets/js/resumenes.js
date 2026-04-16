const ESTADO_RESUMEN_META = {
  presente: {
    label: 'Presente',
    clase: 'resumen-estado-presente',
    detalle: 'Asistencia registrada sin incidencias.'
  },
  inasistencia: {
    label: 'Inasistencia',
    clase: 'resumen-estado-inasistencia',
    detalle: 'Falta registrada.'
  },
  permiso: {
    label: 'Permiso',
    clase: 'resumen-estado-permiso',
    detalle: 'Ausencia autorizada.'
  },
  licencia: {
    label: 'Licencia',
    clase: 'resumen-estado-licencia',
    detalle: 'Rango medico cargado.'
  },
  feriado: {
    label: 'Feriado',
    clase: 'resumen-estado-feriado',
    detalle: 'Feriado oficial o interferiado.'
  },
  noHabil: {
    label: 'No habil',
    clase: 'resumen-estado-nohabil',
    detalle: 'Dia marcado manualmente como no habil.'
  },
  fueraCalendario: {
    label: 'Fuera de calendario',
    clase: 'resumen-estado-neutro',
    detalle: 'Fecha fuera de los semestres activos.'
  },
  inactivo: {
    label: 'Inactivo',
    clase: 'resumen-estado-neutro',
    detalle: 'Dia desactivado en la configuracion semanal.'
  },
  finDeSemana: {
    label: 'Fin de semana',
    clase: 'resumen-estado-neutro',
    detalle: 'Dia no lectivo por calendario semanal.'
  },
  futuro: {
    label: 'Pendiente',
    clase: 'resumen-estado-neutro',
    detalle: 'Dia lectivo aun no transcurre.'
  }
};

const estadoResumenes = {
  profesorIndex: null,
  anio: '',
  filtroListado: '',
  filtroTabla: 'incidencias',
  busquedaTabla: '',
  ultimaVista: null
};

function escapeHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function obtenerFechaHoyIso() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
}

function nombreDiaDesdeIndice(indice) {
  return ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][indice] || '';
}

function nombreDiaCorto(fechaIso) {
  const fecha = new Date(`${fechaIso}T12:00:00`);
  return ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][fecha.getDay()];
}

function formatearFechaVisual(fechaIso) {
  if (typeof window.formatearFechaGlobal === 'function') return window.formatearFechaGlobal(fechaIso);
  return fechaIso || '-';
}

function obtenerDiasActivosHorario(horario) {
  if (horario && horario.diasActivos) return horario.diasActivos;
  if (typeof window.obtenerDiasActivosPorDefecto === 'function') return window.obtenerDiasActivosPorDefecto();
  return { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true };
}

function obtenerAniosProfesor(profesor) {
  return (profesor.horarios || [])
    .map((horario, indexHorario) => ({ horario, indexHorario }))
    .filter((item) => item.horario && item.horario.anio)
    .sort((a, b) => String(a.horario.anio).localeCompare(String(b.horario.anio)));
}

function obtenerHorarioProfesor(indexProfesor, anio) {
  const profesor = profesores[indexProfesor];
  if (!profesor) return null;
  return (profesor.horarios || []).find((horario) => horario.anio === anio) || null;
}

function obtenerClaseEstado(estado) {
  return ESTADO_RESUMEN_META[estado]?.clase || 'resumen-estado-neutro';
}

function obtenerEtiquetaEstado(estado) {
  return ESTADO_RESUMEN_META[estado]?.label || 'Sin estado';
}

function obtenerDetalleEstado(estado) {
  return ESTADO_RESUMEN_META[estado]?.detalle || '';
}

function obtenerMotivoFeriado(fechaIso) {
  const feriadoNacional = typeof window.esFeriadoNacional === 'function' ? window.esFeriadoNacional(fechaIso) : null;
  const feriadoManual = (typeof window.obtenerFeriados === 'function' ? window.obtenerFeriados() : []).find((item) => item.fecha === fechaIso);

  if (feriadoManual) {
    const tipoNormalizado = normalizarTexto(feriadoManual.tipo);
    return {
      tipo: tipoNormalizado.includes('no habil') ? 'noHabil' : 'feriado',
      detalle: feriadoManual.tipo || 'Feriado',
      motivo: feriadoManual.desc || ''
    };
  }

  if (feriadoNacional) {
    return {
      tipo: 'feriado',
      detalle: feriadoNacional.tipo || 'Feriado oficial',
      motivo: feriadoNacional.desc || ''
    };
  }

  return null;
}

function obtenerLicenciaDelDia(horario, fechaIso) {
  return (horario.licencias || []).find((licencia) => fechaIso >= licencia.fechaInicio && fechaIso <= licencia.fechaFin) || null;
}

function obtenerFaltaDelDia(horario, fechaIso) {
  return (horario.faltas || []).find((falta) => falta.fecha === fechaIso) || null;
}

function construirFilaDiaria(profesor, horario, fechaIso, hoyIso) {
  const fecha = new Date(`${fechaIso}T12:00:00`);
  const diaSemana = fecha.getDay();
  const nombreDia = nombreDiaDesdeIndice(diaSemana);
  const diasActivos = obtenerDiasActivosHorario(horario);
  const enSemestre1 = fechaIso >= horario.inicioSemestre1 && fechaIso <= horario.finSemestre1;
  const enSemestre2 = fechaIso >= horario.inicioSemestre2 && fechaIso <= horario.finSemestre2;
  const enCalendario = enSemestre1 || enSemestre2;
  const activoSemana = diasActivos[nombreDia] !== false;
  const feriado = obtenerMotivoFeriado(fechaIso);
  const licencia = obtenerLicenciaDelDia(horario, fechaIso);
  const falta = obtenerFaltaDelDia(horario, fechaIso);

  let estado = 'presente';
  let detalle = 'Asistencia normal';
  let motivo = '';
  let documento = '';
  let cuentaComoLectivo = false;
  let grupoFiltro = 'presente';

  if (diaSemana === 0 || diaSemana === 6) {
    estado = 'finDeSemana';
    detalle = 'Fin de semana';
    grupoFiltro = 'noLectivos';
  } else if (!enCalendario) {
    estado = 'fueraCalendario';
    detalle = 'Fuera del periodo semestral';
    grupoFiltro = 'noLectivos';
  } else if (!activoSemana) {
    estado = 'inactivo';
    detalle = 'Dia desactivado en jornada semanal';
    grupoFiltro = 'noLectivos';
  } else if (feriado) {
    estado = feriado.tipo;
    detalle = feriado.detalle;
    motivo = feriado.motivo;
    grupoFiltro = 'noLectivos';
  } else if (licencia) {
    estado = 'licencia';
    detalle = 'Licencia medica';
    motivo = licencia.motivo || '';
    documento = licencia.archivoAdjunto ? 'Adjunto cargado' : '';
    cuentaComoLectivo = true;
    grupoFiltro = 'incidencias';
  } else if (falta) {
    estado = falta.tipo === 'Permiso' ? 'permiso' : 'inasistencia';
    detalle = falta.tipo || 'Inasistencia';
    motivo = falta.motivo || '';
    cuentaComoLectivo = true;
    grupoFiltro = 'incidencias';
  } else if (fechaIso > hoyIso) {
    estado = 'futuro';
    detalle = 'Pendiente de transcurrir';
    cuentaComoLectivo = true;
    grupoFiltro = 'pendientes';
  } else {
    estado = 'presente';
    detalle = 'Asistencia normal';
    cuentaComoLectivo = true;
    grupoFiltro = 'presente';
  }

  return {
    fecha: fechaIso,
    fechaVisual: formatearFechaVisual(fechaIso),
    dia: nombreDiaCorto(fechaIso),
    estado,
    estadoLabel: obtenerEtiquetaEstado(estado),
    detalle,
    motivo,
    documento,
    profesor: profesor.nombre || '',
    rut: profesor.rut || '',
    cuentaComoLectivo,
    grupoFiltro
  };
}

function generarResumenAnualProfesor(profesor, horario) {
  const anio = parseInt(horario.anio, 10);
  if (Number.isNaN(anio)) return null;

  const hoyIso = obtenerFechaHoyIso();
  const filas = [];
  const resumen = {
    lectivos: 0,
    presentes: 0,
    inasistencias: 0,
    permisos: 0,
    licencias: 0,
    feriados: 0,
    noHabiles: 0,
    fueraCalendario: 0,
    inactivos: 0,
    finesDeSemana: 0,
    futuros: 0
  };

  const detalle = {
    inasistencias: [],
    permisos: [],
    licencias: [],
    noLectivos: []
  };

  const ultimoDia = new Date(anio, 12, 0).getDate();

  for (let mes = 0; mes < 12; mes++) {
    const diasEnMes = mes === 11 ? ultimoDia : new Date(anio, mes + 1, 0).getDate();
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaIso = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const fila = construirFilaDiaria(profesor, horario, fechaIso, hoyIso);
      filas.push(fila);

      if (fila.cuentaComoLectivo) resumen.lectivos++;
      if (fila.estado === 'presente') resumen.presentes++;
      if (fila.estado === 'inasistencia') {
        resumen.inasistencias++;
        detalle.inasistencias.push(fila);
      }
      if (fila.estado === 'permiso') {
        resumen.permisos++;
        detalle.permisos.push(fila);
      }
      if (fila.estado === 'licencia') {
        resumen.licencias++;
        detalle.licencias.push(fila);
      }
      if (fila.estado === 'feriado') {
        resumen.feriados++;
        detalle.noLectivos.push(fila);
      }
      if (fila.estado === 'noHabil') {
        resumen.noHabiles++;
        detalle.noLectivos.push(fila);
      }
      if (fila.estado === 'fueraCalendario') resumen.fueraCalendario++;
      if (fila.estado === 'inactivo') resumen.inactivos++;
      if (fila.estado === 'finDeSemana') resumen.finesDeSemana++;
      if (fila.estado === 'futuro') resumen.futuros++;
    }
  }

  return {
    profesor,
    horario,
    filas,
    resumen,
    detalle
  };
}

function filtrarFilasResumen(filas) {
  const termino = normalizarTexto(estadoResumenes.busquedaTabla);

  return filas.filter((fila) => {
    if (estadoResumenes.filtroTabla === 'incidencias' && !['inasistencia', 'permiso', 'licencia'].includes(fila.estado)) return false;
    if (estadoResumenes.filtroTabla === 'inasistencias' && fila.estado !== 'inasistencia') return false;
    if (estadoResumenes.filtroTabla === 'permisos' && fila.estado !== 'permiso') return false;
    if (estadoResumenes.filtroTabla === 'licencias' && fila.estado !== 'licencia') return false;
    if (estadoResumenes.filtroTabla === 'presentes' && fila.estado !== 'presente') return false;
    if (estadoResumenes.filtroTabla === 'noLectivos' && !['feriado', 'noHabil', 'fueraCalendario', 'inactivo', 'finDeSemana'].includes(fila.estado)) return false;
    if (estadoResumenes.filtroTabla === 'todo') {
    }

    if (!termino) return true;

    return normalizarTexto([
      fila.fechaVisual,
      fila.dia,
      fila.estadoLabel,
      fila.detalle,
      fila.motivo,
      fila.documento
    ].join(' ')).includes(termino);
  });
}

function construirResumenCompacto(datosResumen) {
  const { resumen } = datosResumen;
  const items = [
    { key: 'futuro', titulo: 'Dias lectivos', valor: resumen.lectivos, texto: 'Base anual del calendario.' },
    { key: 'presente', titulo: 'Presentes', valor: resumen.presentes, texto: 'Asistencia registrada.' },
    { key: 'inasistencia', titulo: 'Inasistencia', valor: resumen.inasistencias, texto: 'Falta registrada.' },
    { key: 'permiso', titulo: 'Permiso', valor: resumen.permisos, texto: 'Ausencia autorizada.' },
    { key: 'licencia', titulo: 'Dias con licencia', valor: resumen.licencias, texto: 'Rango medico cargado.' },
    { key: 'feriado', titulo: 'Feriados', valor: resumen.feriados, texto: 'Feriados o interferiados.' },
    { key: 'noHabil', titulo: 'No lectivos', valor: resumen.noHabiles + resumen.fueraCalendario + resumen.inactivos + resumen.finesDeSemana, texto: 'Dias no utilizables en el calendario.' }
  ];

  return `
    <section class="resumen-lectura-card">
      <div class="resumen-lectura-head">
        <div>
          <h3>Lectura rapida</h3>
          <p>Usa esta franja para entender el año antes de abrir la tabla completa.</p>
        </div>
      </div>
      <div class="resumen-lectura-grid">
        ${items.map((item) => `
          <article class="resumen-mini-estado ${obtenerClaseEstado(item.key)}">
            <strong>${item.titulo}</strong>
            <span class="resumen-mini-valor">${item.valor}</span>
            <small>${item.texto}</small>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function construirIndicadoresSecundarios(datosResumen) {
  const { resumen, horario } = datosResumen;
  return `
    <section class="resumen-indicadores-secundarios">
      <div><strong>Semestre 1:</strong> ${formatearFechaVisual(horario.inicioSemestre1)} a ${formatearFechaVisual(horario.finSemestre1)}</div>
      <div><strong>Semestre 2:</strong> ${formatearFechaVisual(horario.inicioSemestre2)} a ${formatearFechaVisual(horario.finSemestre2)}</div>
      <div><strong>Pendientes:</strong> ${resumen.futuros}</div>
      <div><strong>Fuera calendario:</strong> ${resumen.fueraCalendario}</div>
      <div><strong>Inactivos:</strong> ${resumen.inactivos}</div>
      <div><strong>Fines de semana:</strong> ${resumen.finesDeSemana}</div>
    </section>
  `;
}

function construirDetalleFechas(titulo, filas, estadoClave) {
  const badge = filas.length;
  const vacio = `<p class="text-muted fs-sm">No hay registros para este bloque.</p>`;

  return `
    <details class="resumen-detalle-panel" ${filas.length ? '' : ''}>
      <summary>
        <span>${badge}</span>
        <span class="resumen-badge-estado ${obtenerClaseEstado(estadoClave)}">${titulo}</span>
      </summary>
      <div class="resumen-tags-panel">
        ${filas.length ? `
          <div class="resumen-tags">
            ${filas.map((fila) => `
              <span class="resumen-tag ${obtenerClaseEstado(fila.estado)}">
                ${fila.fechaVisual}${fila.motivo ? ` · ${escapeHtml(fila.motivo)}` : ''}
              </span>
            `).join('')}
          </div>
        ` : vacio}
      </div>
    </details>
  `;
}

function construirTablaResumen(filasFiltradas) {
  if (!filasFiltradas.length) {
    return `
      <div class="sin-profesores">
        <strong>No hay filas visibles con el filtro actual.</strong>
        <p class="mt-2">Cambia el filtro, la búsqueda o el año para exportar datos.</p>
      </div>
    `;
  }

  return `
    <div class="tabla-horario-contenedor">
      <table class="tabla-horario-clases tabla-resumen-anual">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Dia</th>
            <th>Estado</th>
            <th>Detalle</th>
            <th>Motivo</th>
            <th>Documento</th>
          </tr>
        </thead>
        <tbody>
          ${filasFiltradas.map((fila) => `
            <tr>
              <td>${fila.fechaVisual}</td>
              <td>${fila.dia}</td>
              <td>
                <span class="resumen-badge-estado ${obtenerClaseEstado(fila.estado)}">
                  ${fila.estadoLabel}
                </span>
              </td>
              <td>${escapeHtml(fila.detalle)}</td>
              <td>${escapeHtml(fila.motivo || '-')}</td>
              <td>${escapeHtml(fila.documento || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filtrarFilasPorRango(filas, fechaDesde, fechaHasta) {
  return filas.filter((fila) => fila.fecha >= fechaDesde && fila.fecha <= fechaHasta);
}

function construirResumenDesdeFilas(filas) {
  const resumen = {
    lectivos: 0,
    presentes: 0,
    inasistencias: 0,
    permisos: 0,
    licencias: 0,
    feriados: 0,
    noHabiles: 0,
    fueraCalendario: 0,
    inactivos: 0,
    finesDeSemana: 0,
    futuros: 0
  };

  const incidencias = {
    inasistencias: [],
    permisos: [],
    licencias: []
  };

  filas.forEach((fila) => {
    if (fila.cuentaComoLectivo) resumen.lectivos++;
    if (fila.estado === 'presente') resumen.presentes++;
    if (fila.estado === 'inasistencia') {
      resumen.inasistencias++;
      incidencias.inasistencias.push(`${fila.fechaVisual}${fila.motivo ? ` - ${fila.motivo}` : ''}`);
    }
    if (fila.estado === 'permiso') {
      resumen.permisos++;
      incidencias.permisos.push(`${fila.fechaVisual}${fila.motivo ? ` - ${fila.motivo}` : ''}`);
    }
    if (fila.estado === 'licencia') {
      resumen.licencias++;
      incidencias.licencias.push(`${fila.fechaVisual}${fila.motivo ? ` - ${fila.motivo}` : ''}`);
    }
    if (fila.estado === 'feriado') resumen.feriados++;
    if (fila.estado === 'noHabil') resumen.noHabiles++;
    if (fila.estado === 'fueraCalendario') resumen.fueraCalendario++;
    if (fila.estado === 'inactivo') resumen.inactivos++;
    if (fila.estado === 'finDeSemana') resumen.finesDeSemana++;
    if (fila.estado === 'futuro') resumen.futuros++;
  });

  return { resumen, incidencias };
}

function construirPayloadPdf(datosResumen, fechaDesde, fechaHasta) {
  const detalleCompleto = filtrarFilasPorRango(
    [...datosResumen.filas].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    fechaDesde,
    fechaHasta
  );
  const resumenRango = construirResumenDesdeFilas(detalleCompleto);

  return {
    nombre: `${datosResumen.profesor.nombre || 'docente'}_${datosResumen.horario.anio || 'anio'}` ,
    titulo: `Resumen anual - ${datosResumen.profesor.nombre || 'Docente'}` ,
    subtitulo: `RUT: ${datosResumen.profesor.rut || '-'} | Ano: ${datosResumen.horario.anio || '-'} | Periodo: ${formatearFechaVisual(fechaDesde)} a ${formatearFechaVisual(fechaHasta)}` ,
    docente: {
      nombre: datosResumen.profesor.nombre || '',
      rut: datosResumen.profesor.rut || '',
      profesion: datosResumen.profesor.profesion || '',
      fechaNacimiento: formatearFechaVisual(datosResumen.profesor.fechaNacimiento) || '-',
      inicioSemestre1: formatearFechaVisual(datosResumen.horario.inicioSemestre1),
      finSemestre1: formatearFechaVisual(datosResumen.horario.finSemestre1),
      inicioSemestre2: formatearFechaVisual(datosResumen.horario.inicioSemestre2),
      finSemestre2: formatearFechaVisual(datosResumen.horario.finSemestre2)
    },
    resumen: [
      { label: 'Dias lectivos', value: resumenRango.resumen.lectivos },
      { label: 'Presentes', value: resumenRango.resumen.presentes },
      { label: 'Inasistencias', value: resumenRango.resumen.inasistencias },
      { label: 'Permisos', value: resumenRango.resumen.permisos },
      { label: 'Licencias', value: resumenRango.resumen.licencias },
      { label: 'No lectivos', value: resumenRango.resumen.noHabiles + resumenRango.resumen.feriados + resumenRango.resumen.fueraCalendario + resumenRango.resumen.inactivos + resumenRango.resumen.finesDeSemana }
    ],
    incidencias: {
      inasistencias: resumenRango.incidencias.inasistencias,
      permisos: resumenRango.incidencias.permisos,
      licencias: resumenRango.incidencias.licencias
    },
    detalle: detalleCompleto.map((fila) => ({
      fecha: fila.fechaVisual,
      dia: fila.dia,
      estado: fila.estadoLabel,
      detalle: fila.detalle,
      motivo: fila.motivo || '-',
      documento: fila.documento || '-'
    }))
  };
}

function construirHtmlPdfResumen(datosResumen, fechaDesde, fechaHasta) {
  const payload = construirPayloadPdf(datosResumen, fechaDesde, fechaHasta);
  const resumenHtml = payload.resumen.map((item) => `
    <div class="metric">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join('');

  const incidenciasHtml = [
    { titulo: 'Inasistencias', items: payload.incidencias.inasistencias },
    { titulo: 'Permisos', items: payload.incidencias.permisos },
    { titulo: 'Licencias', items: payload.incidencias.licencias }
  ].map((bloque) => `
    <section class="incidence-box">
      <h3>${bloque.titulo}</h3>
      ${bloque.items.length
        ? `<ul>${bloque.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '<p>Sin registros.</p>'
      }
    </section>
  `).join('');

  const filasHtml = payload.detalle.map((fila) => `
    <tr>
      <td>${escapeHtml(fila.fecha)}</td>
      <td>${escapeHtml(fila.dia)}</td>
      <td>${escapeHtml(fila.estado)}</td>
      <td>${escapeHtml(fila.detalle)}</td>
      <td>${escapeHtml(fila.motivo)}</td>
      <td>${escapeHtml(fila.documento)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(payload.titulo)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #1d2a1f; }
        h1 { margin: 0 0 4px 0; font-size: 26px; }
        h2 { margin: 22px 0 12px 0; font-size: 18px; color: #1f4e2d; }
        h3 { margin: 0 0 10px 0; font-size: 15px; color: #1f4e2d; }
        p { margin: 0 0 14px 0; color: #4f5d52; }
        .docente { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 18px; margin: 18px 0 20px; padding: 14px 16px; border: 1px solid #d9e2d4; border-radius: 14px; background: #fbfcfa; }
        .docente div { font-size: 13px; }
        .docente strong { display: block; color: #1f4e2d; margin-bottom: 3px; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0 20px; }
        .metric { padding: 12px 14px; border: 1px solid #d9e2d4; border-radius: 12px; background: #f8fbf6; }
        .metric span { display: block; font-size: 12px; color: #58705d; margin-bottom: 4px; }
        .metric strong { font-size: 19px; color: #1f4e2d; }
        .incidences { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0 22px; }
        .incidence-box { border: 1px solid #d9e2d4; border-radius: 12px; padding: 12px 14px; background: #fff; }
        .incidence-box ul { margin: 0; padding-left: 18px; }
        .incidence-box li, .incidence-box p { font-size: 12px; line-height: 1.45; color: #3d4b40; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #d9e2d4; padding: 7px; font-size: 11px; text-align: left; vertical-align: top; word-break: break-word; }
        th { background: #eef5ea; color: #1f4e2d; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(payload.titulo)}</h1>
      <p>${escapeHtml(payload.subtitulo)}</p>
      <section class="docente">
        <div><strong>Docente</strong>${escapeHtml(payload.docente.nombre)}</div>
        <div><strong>RUT</strong>${escapeHtml(payload.docente.rut)}</div>
        <div><strong>Profesion</strong>${escapeHtml(payload.docente.profesion)}</div>
        <div><strong>Nacimiento</strong>${escapeHtml(payload.docente.fechaNacimiento)}</div>
        <div><strong>Semestre 1</strong>${escapeHtml(payload.docente.inicioSemestre1)} a ${escapeHtml(payload.docente.finSemestre1)}</div>
        <div><strong>Semestre 2</strong>${escapeHtml(payload.docente.inicioSemestre2)} a ${escapeHtml(payload.docente.finSemestre2)}</div>
      </section>
      <section class="metrics">${resumenHtml}</section>
      <section class="incidences">${incidenciasHtml}</section>
      <h2>Detalle diario completo</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Dia</th>
            <th>Estado</th>
            <th>Detalle</th>
            <th>Motivo</th>
            <th>Documento</th>
          </tr>
        </thead>
        <tbody>${filasHtml}</tbody>
      </table>
    </body>
    </html>
  `;
}

function abrirModalRangoResumen(datosResumen) {
  if (document.querySelector('.modal')) return;

  const fechaMin = `${datosResumen.horario.anio}-01-01`;
  const fechaMax = `${datosResumen.horario.anio}-12-31`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal">
      <div class="modal-content">
        <button class="btn-cerrar-modal" onclick="cerrarModal()">&times;</button>
        <h3>Exportar PDF anual</h3>
        <p>Elige el periodo que quieres incluir en el PDF.</p>
        <div class="form-grid">
          <div>
            <label class="d-block mb-1">Desde</label>
            <input type="date" id="resumenFechaDesde" class="input-global w-100" min="${fechaMin}" max="${fechaMax}" value="${fechaMin}">
          </div>
          <div>
            <label class="d-block mb-1">Hasta</label>
            <input type="date" id="resumenFechaHasta" class="input-global w-100" min="${fechaMin}" max="${fechaMax}" value="${fechaMax}">
          </div>
        </div>
        <div id="errorExportacionResumen" class="text-danger fw-bold fs-sm mt-2 d-none"></div>
        <div class="modal-botones mt-3">
          <button id="confirmarExportacionResumen" class="btn-principal">Generar PDF</button>
          <button id="cancelarExportacionResumen" class="btn-secundario">Cancelar</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('cancelarExportacionResumen').addEventListener('click', cerrarModal);
  document.getElementById('confirmarExportacionResumen').addEventListener('click', async () => {
    const fechaDesde = document.getElementById('resumenFechaDesde').value;
    const fechaHasta = document.getElementById('resumenFechaHasta').value;
    const error = document.getElementById('errorExportacionResumen');

    if (!fechaDesde || !fechaHasta) {
      error.textContent = 'Debes seleccionar ambas fechas.';
      error.classList.remove('d-none');
      return;
    }

    if (fechaDesde > fechaHasta) {
      error.textContent = 'La fecha inicial no puede ser mayor que la fecha final.';
      error.classList.remove('d-none');
      return;
    }

    const filasRango = filtrarFilasPorRango(datosResumen.filas, fechaDesde, fechaHasta);
    if (!filasRango.length) {
      error.textContent = 'No hay datos en el periodo seleccionado.';
      error.classList.remove('d-none');
      return;
    }

    error.classList.add('d-none');
    cerrarModal();
    await ejecutarExportacionResumenPdf(datosResumen, fechaDesde, fechaHasta);
  });
}

async function ejecutarExportacionResumenPdf(datosResumen, fechaDesde, fechaHasta) {
  const payload = construirPayloadPdf(datosResumen, fechaDesde, fechaHasta);
  payload.html = construirHtmlPdfResumen(datosResumen, fechaDesde, fechaHasta);
  const resultado = await window.apiExportacion.exportarResumenPdf(payload);

  if (resultado?.ok) {
    mostrarMensajeResumen('PDF anual generado correctamente.', 'success');
    return;
  }

  if (!resultado?.cancelado) {
    mostrarMensajeResumen(resultado?.mensaje || 'No se pudo exportar el PDF.', 'error');
  }
}

function mostrarMensajeResumen(texto, tipo = 'info') {
  const contenedor = document.getElementById('resumenesMensaje');
  if (!contenedor) return;

  contenedor.className = `resumen-alerta resumen-alerta-${tipo}`;
  contenedor.textContent = texto;
}

function limpiarMensajeResumen() {
  const contenedor = document.getElementById('resumenesMensaje');
  if (!contenedor) return;
  contenedor.className = 'resumen-alerta d-none';
  contenedor.textContent = '';
}

async function exportarResumenActual(tipo) {
  const profesor = profesores[estadoResumenes.profesorIndex];
  if (!profesor) {
    mostrarMensajeResumen('Primero selecciona un docente.', 'warning');
    return;
  }

  const horario = obtenerHorarioProfesor(estadoResumenes.profesorIndex, estadoResumenes.anio);
  if (!horario) {
    mostrarMensajeResumen('Selecciona un año valido antes de exportar.', 'warning');
    return;
  }

  const datosResumen = generarResumenAnualProfesor(profesor, horario);

  if (!window.apiExportacion) {
    mostrarMensajeResumen('La exportación solo funciona en la aplicación de escritorio.', 'warning');
    return;
  }

  limpiarMensajeResumen();
  abrirModalRangoResumen(datosResumen);
}

function renderListadoProfesores() {
  const contenedor = document.getElementById('contenidoResumenesAnuales');
  if (!contenedor) return;

  if (!profesores.length) {
    contenedor.innerHTML = `
      <div class="sin-profesores">
        <strong>Aún no hay docentes registrados.</strong>
        <p class="mt-2">Primero crea una ficha docente para generar resúmenes anuales.</p>
      </div>
    `;
    return;
  }

  const filtro = normalizarTexto(estadoResumenes.filtroListado);
  const lista = profesores.filter((profesor) => {
    if (!filtro) return true;
    return normalizarTexto(`${profesor.nombre} ${profesor.rut}`).includes(filtro);
  });

  if (!lista.length) {
    contenedor.innerHTML = `
      <div class="sin-profesores">
        <strong>No se encontraron docentes con ese criterio.</strong>
        <p class="mt-2">Prueba con otro nombre o RUT.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div class="lista-profesores">
      ${lista.map((profesor) => {
        const indexProfesor = profesores.indexOf(profesor);
        const anios = obtenerAniosProfesor(profesor);
        return `
          <article class="profesor-card clickable-card resumen-profesor-card" onclick="window.verResumenProfesor(${indexProfesor})">
            <div class="profesor-info">
              <h3>${escapeHtml(profesor.nombre || 'Sin nombre')}</h3>
              <p><strong>RUT:</strong> ${escapeHtml(profesor.rut || '-')}</p>
              <p><strong>Profesión:</strong> ${escapeHtml(profesor.profesion || '-')}</p>
              <p><strong>Años disponibles:</strong> ${anios.length ? anios.length : 0}</p>
              <div class="resumen-chip-row">
                ${anios.length
                  ? anios.map((item) => `<span class="resumen-chip">${escapeHtml(item.horario.anio)}</span>`).join('')
                  : '<span class="resumen-chip resumen-chip-neutro">Sin calendarios</span>'
                }
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderDetalleResumenProfesor() {
  const contenedor = document.getElementById('contenidoResumenesAnuales');
  if (!contenedor) return;

  const profesor = profesores[estadoResumenes.profesorIndex];
  if (!profesor) {
    estadoResumenes.profesorIndex = null;
    renderListadoProfesores();
    return;
  }

  const anios = obtenerAniosProfesor(profesor);
  if (!anios.length) {
    contenedor.innerHTML = `
      <div class="sin-profesores">
        <strong>${escapeHtml(profesor.nombre)} no tiene calendarios cargados.</strong>
        <p class="mt-2">Primero crea un horario anual para que el resumen pueda mostrar datos.</p>
        <button class="btn-secundario mt-3" onclick="window.volverAListadoResumenes()">Volver al listado</button>
      </div>
    `;
    return;
  }

  if (!estadoResumenes.anio || !anios.some((item) => item.horario.anio === estadoResumenes.anio)) {
    estadoResumenes.anio = anios[anios.length - 1].horario.anio;
  }

  const horario = obtenerHorarioProfesor(estadoResumenes.profesorIndex, estadoResumenes.anio);
  if (!horario) {
    mostrarMensajeResumen('No se pudo cargar el año seleccionado.', 'error');
    return;
  }

  const datosResumen = generarResumenAnualProfesor(profesor, horario);
  const filasFiltradas = filtrarFilasResumen(datosResumen.filas);
  estadoResumenes.ultimaVista = { datosResumen, filasFiltradas };

  contenedor.innerHTML = `
    <section class="resumenes-detalle">
      <div class="resumenes-acciones-superiores">
        <button class="btn-secundario" id="btnVolverResumenesListado">Volver al listado</button>
        <div class="d-flex gap-1 flex-wrap">          <button class="btn-principal" id="btnExportarResumenPdf">Exportar PDF completo</button>
        </div>
      </div>

      <div id="resumenesMensaje" class="resumen-alerta d-none"></div>

      <section class="resumen-cabecera-anual">
        <article class="profesor-card resumen-bloque-lista">
          <div class="profesor-info">
            <h3>${escapeHtml(profesor.nombre || 'Docente')}</h3>
            <p><strong>RUT:</strong> ${escapeHtml(profesor.rut || '-')}</p>
            <p><strong>Profesión:</strong> ${escapeHtml(profesor.profesion || '-')}</p>
            <p><strong>Nacimiento:</strong> ${escapeHtml(formatearFechaVisual(profesor.fechaNacimiento) || '-')}</p>
          </div>
        </article>

        <aside class="resumen-leyenda-card">
          <h3>Guia breve</h3>
          <p>1. Elige el año en las pestañas.</p>
          <p>2. Revisa primero la lectura rápida.</p>
          <p>3. Usa filtros antes de exportar.</p>
        </aside>
      </section>

      <div class="resumen-tabs">
        ${anios.map((item) => `
          <button class="resumen-tab ${item.horario.anio === estadoResumenes.anio ? 'activo' : ''}" data-anio="${escapeHtml(item.horario.anio)}">
            ${escapeHtml(item.horario.anio)}
          </button>
        `).join('')}
      </div>

      ${construirResumenCompacto(datosResumen)}
      ${construirIndicadoresSecundarios(datosResumen)}

      <section class="resumen-paneles-grid">
        ${construirDetalleFechas('Inasistencias', datosResumen.detalle.inasistencias, 'inasistencia')}
        ${construirDetalleFechas('Permisos', datosResumen.detalle.permisos, 'permiso')}
        ${construirDetalleFechas('Licencias', datosResumen.detalle.licencias, 'licencia')}
      </section>

      <section class="resumen-bloque-lista">
        <div class="resumen-tabla-barra">
          <div class="resumen-tabla-controles">
            <input type="text" id="busquedaTablaResumenes" class="input-global resumen-busqueda-tabla" placeholder="Buscar por fecha, motivo o estado..." value="${escapeHtml(estadoResumenes.busquedaTabla)}">
            <div class="resumen-filtro-botones">
                <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'todo' ? 'activo' : ''}" data-filtro="todo">Todo el año</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'noLectivos' ? 'activo' : ''}" data-filtro="noLectivos">No lectivos</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'presentes' ? 'activo' : ''}" data-filtro="presentes">Presentes</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'licencias' ? 'activo' : ''}" data-filtro="licencias">Licencias</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'permisos' ? 'activo' : ''}" data-filtro="permisos">Permisos</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'inasistencias' ? 'activo' : ''}" data-filtro="inasistencias">Inasistencias</button>
              <button class="resumen-filtro-btn ${estadoResumenes.filtroTabla === 'incidencias' ? 'activo' : ''}" data-filtro="incidencias">Solo incidencias</button>
            </div>
          </div>
          <span class="resumen-badge-ayuda">${filasFiltradas.length} fila(s) visibles</span>
        </div>
        ${construirTablaResumen(filasFiltradas)}
      </section>
    </section>
  `;

  const btnVolver = document.getElementById('btnVolverResumenesListado');
  if (btnVolver) btnVolver.addEventListener('click', () => window.volverAListadoResumenes());

  const inputBusquedaTabla = document.getElementById('busquedaTablaResumenes');
  if (inputBusquedaTabla) {
    inputBusquedaTabla.addEventListener('input', (event) => {
      estadoResumenes.busquedaTabla = event.target.value;
      renderDetalleResumenProfesor();
    });
  }

  document.querySelectorAll('.resumen-tab').forEach((boton) => {
    boton.addEventListener('click', () => {
      estadoResumenes.anio = boton.dataset.anio || '';
      estadoResumenes.busquedaTabla = '';
      estadoResumenes.filtroTabla = 'incidencias';
      limpiarMensajeResumen();
      renderDetalleResumenProfesor();
    });
  });

  document.querySelectorAll('.resumen-filtro-btn').forEach((boton) => {
    boton.addEventListener('click', () => {
      estadoResumenes.filtroTabla = boton.dataset.filtro || 'incidencias';
      limpiarMensajeResumen();
      renderDetalleResumenProfesor();
    });
  });

  const btnPdf = document.getElementById('btnExportarResumenPdf');
  if (btnPdf) btnPdf.addEventListener('click', () => exportarResumenActual('pdf'));
}

window.verResumenProfesor = function(indexProfesor) {
  const profesor = profesores[indexProfesor];
  if (!profesor) {
    mostrarMensajeResumen('No se encontró el docente seleccionado.', 'error');
    return;
  }

  const anios = obtenerAniosProfesor(profesor);
  estadoResumenes.profesorIndex = indexProfesor;
  estadoResumenes.anio = anios.length ? anios[anios.length - 1].horario.anio : '';
  estadoResumenes.filtroTabla = 'incidencias';
  estadoResumenes.busquedaTabla = '';
  limpiarMensajeResumen();
  renderDetalleResumenProfesor();
};

window.volverAListadoResumenes = function() {
  estadoResumenes.profesorIndex = null;
  estadoResumenes.anio = '';
  estadoResumenes.filtroTabla = 'incidencias';
  estadoResumenes.busquedaTabla = '';
  limpiarMensajeResumen();
  renderListadoProfesores();
};

window.renderResumenesAnuales = function() {
  if (estadoResumenes.profesorIndex === null) {
    renderListadoProfesores();
    return;
  }
  renderDetalleResumenProfesor();
};

window.inicializarVistaResumenes = function() {
  const buscador = document.getElementById('buscadorResumenes');
  if (!buscador || buscador.dataset.inicializado === 'true') return;

  buscador.dataset.inicializado = 'true';
  buscador.addEventListener('input', (event) => {
    estadoResumenes.filtroListado = event.target.value;
    if (estadoResumenes.profesorIndex === null) renderListadoProfesores();
  });
};
