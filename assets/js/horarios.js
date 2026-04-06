// ==========================================
// ARCHIVO: assets/js/horarios.js
// Propósito: Motor lógico para generar calendarios y tablas de clases
// ==========================================

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

function esDentroDeSemestre(fecha, horario) {
  const inicio1 = new Date(horario.inicioSemestre1 + 'T00:00:00');
  const fin1 = new Date(horario.finSemestre1 + 'T00:00:00');
  const inicio2 = new Date(horario.inicioSemestre2 + 'T00:00:00');
  const fin2 = new Date(horario.finSemestre2 + 'T00:00:00');
  return (fecha >= inicio1 && fecha <= fin1) || (fecha >= inicio2 && fecha <= fin2);
}

function esFinDeSemana(fecha) {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6; // 0 es Domingo, 6 es Sábado
}

function obtenerDesfasePrimerDia(anio, mesNumero) {
  const primerDia = new Date(anio, mesNumero - 1, 1).getDay();
  return primerDia === 0 ? 6 : primerDia - 1; // Ajuste para que Lunes sea 0
}

function generarDiasMes(anio, mesNumero, horario) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diasEnMes = new Date(anio, mesNumero, 0).getDate();
  const desfase = obtenerDesfasePrimerDia(anio, mesNumero);

  let html = '';

  // Rellenar espacios en blanco antes del primer día del mes
  for (let i = 0; i < desfase; i++) {
    html += `<div class="dia-vacio"></div>`;
  }

  // Generar los días reales
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(anio, mesNumero - 1, dia);
    fecha.setHours(0, 0, 0, 0);

    const dentroSemestre = esDentroDeSemestre(fecha, horario);
    const finDeSemana = esFinDeSemana(fecha);
    const yaPaso = fecha <= hoy;

    let clase = 'dia-tachado'; // Por defecto, si no es hábil o está fuera de semestre
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

