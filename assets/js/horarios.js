function generarMesesHorario(anio, horario) {
  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  let html = '';
  
  const hoyObj = new Date();
  const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;

  const listaFeriadosSegura = typeof window.obtenerFeriados === 'function' ? window.obtenerFeriados() : [];

  for (let m = 0; m < 12; m++) {
    let diasHtml = '';
    const diasEnMes = new Date(anio, m + 1, 0).getDate();
    const primerDiaSemana = new Date(anio, m, 1).getDay();
    
    let espaciosVacion = primerDiaSemana === 0 ? 0 : primerDiaSemana - 1;
    if (primerDiaSemana === 6) espaciosVacion = 0;

    for (let i = 0; i < espaciosVacion; i++) {
      diasHtml += '<div class="dia-box" style="visibility: hidden;"></div>';
    }

    for (let d = 1; d <= diasEnMes; d++) {
      const fechaActualStr = `${anio}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const fechaObj = new Date(anio, m, d);
      const diaSem = fechaObj.getDay();
      
      if (diaSem === 0 || diaSem === 6) continue;

      const diasActivos = horario.diasActivos || (typeof window.obtenerDiasActivosPorDefecto === 'function' ? window.obtenerDiasActivosPorDefecto() : { lunes: true, martes: true, miercoles: true, jueves: true, viernes: true });
      const nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][diaSem];
      const esDiaActivo = diasActivos[nombreDia] !== false;

      const enSemestre1 = fechaActualStr >= horario.inicioSemestre1 && fechaActualStr <= horario.finSemestre1;
      const enSemestre2 = fechaActualStr >= horario.inicioSemestre2 && fechaActualStr <= horario.finSemestre2;
      const enSemestreActivo = enSemestre1 || enSemestre2;

      const tieneLicencia = horario.licencias && horario.licencias.some(lic => fechaActualStr >= lic.fechaInicio && fechaActualStr <= lic.fechaFin);
      const tieneFalta = horario.faltas && horario.faltas.some(fal => fal.fecha === fechaActualStr);
      
      let feriadoNacional = null;
      if (typeof window.esFeriadoNacional === 'function') {
        feriadoNacional = window.esFeriadoNacional(fechaActualStr);
      }

      const feriadoManual = listaFeriadosSegura.find(f => f.fecha === fechaActualStr);

      let claseDia = '';
      let tooltip = '';

      if (tieneLicencia) {
        claseDia = 'dia-amarillo';
      } else if (tieneFalta) {
        claseDia = 'dia-rojo';
      } else if (feriadoNacional) {
        claseDia = 'dia-morado'; 
        tooltip = `title="${feriadoNacional.desc}"`;
      } else if (feriadoManual) {
        claseDia = 'dia-morado'; 
        tooltip = `title="${feriadoManual.tipo}: ${feriadoManual.desc}"`;
      } else if (!enSemestreActivo || !esDiaActivo) {
        claseDia = 'dia-tachado';
      } else if (fechaActualStr > hoyStr) {
        claseDia = 'dia-gris'; 
      } else {
        claseDia = 'dia-verde'; 
      }

      diasHtml += `<div class="dia-box ${claseDia}" ${tooltip}>${d}</div>`;
    }

    html += `
      <div class="mes-card">
        <h3>${mesesNombres[m]} ${anio}</h3>
        <div class="dias-semana">
          <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div>
        </div>
        <div class="dias-grid">
          ${diasHtml}
        </div>
      </div>
    `;
  }
  return html;
}

function crearHorarioClasesBase() {
  return {
    'lunes': { '1': '', '2': '', '3': '', '4': '', '5': '', '6': '', '7': '', '8': '', '9': '', '10': '', 'llegada': '', 'salida': '' },
    'martes': { '1': '', '2': '', '3': '', '4': '', '5': '', '6': '', '7': '', '8': '', '9': '', '10': '', 'llegada': '', 'salida': '' },
    'miercoles': { '1': '', '2': '', '3': '', '4': '', '5': '', '6': '', '7': '', '8': '', '9': '', '10': '', 'llegada': '', 'salida': '' },
    'jueves': { '1': '', '2': '', '3': '', '4': '', '5': '', '6': '', '7': '', '8': '', '9': '', '10': '', 'llegada': '', 'salida': '' },
    'viernes': { '1': '', '2': '', '3': '', '4': '', '5': '', '6': '', '7': '', '8': '', '9': '', '10': '', 'llegada': '', 'salida': '' }
  };
}

function generarFilasHorarioClases(indexProfesor, indexHorario) {
  const horarioClases = profesores[indexProfesor].horarios[indexHorario].horarioClases;
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  let html = '';

  html += '<tr><td class="celda-bloque">Llegada</td>';
  dias.forEach(d => {
    const h = horarioClases[d].llegada || '<span class="texto-vacio">--:--</span>';
    html += `<td class="celda-editable" onclick="editarHora(${indexProfesor}, ${indexHorario}, '${d}', 'llegada')">${h}</td>`;
  });
  html += '</tr>';

  for (let b = 1; b <= 10; b++) {
    html += `<tr><td class="celda-bloque">Bloque ${b}</td>`;
    dias.forEach(d => {
      if (d === 'viernes' && b >= 7) {
        html += '<td class="celda-viernes-bloqueado">X</td>';
      } else {
        const asig = horarioClases[d][b] || '<span class="texto-vacio">Libre</span>';
        html += `<td class="celda-editable" onclick="editarBloque(${indexProfesor}, ${indexHorario}, '${d}', '${b}')">${asig}</td>`;
      }
    });
    html += '</tr>';

    if (b === 2 || b === 4 || b === 6) html += '<tr><td class="celda-recreo" colspan="6">RECREO</td></tr>';
    if (b === 8) html += '<tr><td class="celda-almuerzo" colspan="6">ALMUERZO</td></tr>';
  }

  html += '<tr><td class="celda-bloque">Salida</td>';
  dias.forEach(d => {
    const h = horarioClases[d].salida || '<span class="texto-vacio">--:--</span>';
    html += `<td class="celda-editable" onclick="editarHora(${indexProfesor}, ${indexHorario}, '${d}', 'salida')">${h}</td>`;
  });
  html += '</tr>';

  return html;
}
