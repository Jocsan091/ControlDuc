if (sessionStorage.getItem('sesionActiva') !== 'true') {
  window.location.replace('login.html'); 
}

document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('sesionActiva');
      window.location.replace('login.html');
    });
  }
});


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

window.agregarFeriado = async function() {
  const fecha = document.getElementById('inputFeriado').value;
  const tipo = document.getElementById('tipoFeriado').value;
  const desc = document.getElementById('descFeriado').value.trim();
  
  if(!fecha || !desc) return alert("Debes ingresar la fecha y escribir el motivo.");
  
  if(feriadosGlobales.some(f => f.fecha === fecha)) {
    return alert("Este día ya está marcado como libre o feriado.");
  }

  feriadosGlobales.push({ fecha, tipo, desc });
  feriadosGlobales.sort((a,b) => a.fecha.localeCompare(b.fecha)); 
  
  await guardarDatosGlobales();
  window.renderFeriados();
  
  document.getElementById('inputFeriado').value = '';
  document.getElementById('descFeriado').value = '';
}

window.eliminarFeriado = async function(index) {
  if(confirm("¿Quitar este día libre? El día volverá a ser hábil para todos los profesores.")) {
    feriadosGlobales.splice(index, 1);
    await guardarDatosGlobales();
    window.renderFeriados();
  }
}

window.renderFeriados = function() {
  const lista = document.getElementById('listaFeriados');
  if(!lista) return;
  
  if (feriadosGlobales.length === 0) {
    lista.innerHTML = '<li class="text-muted" style="font-style: italic;">No hay días libres registrados.</li>';
    return;
  }

  lista.innerHTML = feriadosGlobales.map((f, i) => {
    const badgeColor = f.tipo === 'Interferiado' ? 'bg-morado-light text-morado' : 'bg-gray-light text-muted border-muted';
    return `
    <li class="d-flex justify-between align-center p-2 bg-white border-muted border-radius-md">
      <div>
        <strong class="text-primary fs-md">${window.formatearFechaGlobal(f.fecha)}</strong> 
        <span class="fs-xs fw-bold py-1 px-2 border-radius-lg ml-1 ${badgeColor}">${f.tipo}</span>
        <span class="text-muted ml-1">${f.desc}</span>
      </div>
      <button class="btn-danger bg-transparent text-danger fw-bold border-danger border-radius-sm py-1 px-2 cursor-pointer" onmouseover="this.style.background='#ffebee'" onmouseout="this.style.background='transparent'" onclick="window.eliminarFeriado(${i})">Quitar</button>
    </li>
  `}).join('');
}
