// ==========================================
// ARCHIVO: assets/js/dashboard.js
// Propósito: Análisis matemático del Panel Principal
// ==========================================

function actualizarDashboardInicio() {
  const statProfesores = document.getElementById('statProfesores');
  const statAsistentes = document.getElementById('statAsistentes');
  const statFaltas = document.getElementById('statFaltas');
  const statLicencias = document.getElementById('statLicencias');

  if (!statProfesores) return;

  const hoyObj = new Date();
  const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
  const anioActual = hoyStr.split('-')[0];

  let totalFaltas = 0;
  let totalLicencias = 0;
  let totalProfesores = profesores.length;

  profesores.forEach(p => {
    const h = p.horarios.find(hor => hor.anio === anioActual);
    if (h) {
      if (h.faltas && h.faltas.some(f => f.fecha === hoyStr)) totalFaltas++;
      if (h.licencias && h.licencias.some(l => hoyStr >= l.fechaInicio && hoyStr <= l.fechaFin)) totalLicencias++;
    }
  });

  const totalAsistentes = totalProfesores - totalFaltas - totalLicencias;

  statProfesores.innerText = totalProfesores;
  statFaltas.innerText = totalFaltas;
  statLicencias.innerText = totalLicencias;
  statAsistentes.innerText = totalAsistentes >= 0 ? totalAsistentes : 0;
}