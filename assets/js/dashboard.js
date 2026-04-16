async function cargarVistaParcial(idVista, archivo) {
  const contenedor = document.getElementById(idVista);
  if (!contenedor) return;

  const url = new URL(archivo, window.location.href);
  const respuesta = await fetch(url);
  contenedor.innerHTML = await respuesta.text();
}

function inicializarLogout() {
  const btnLogout = document.getElementById('logout');
  if (!btnLogout || btnLogout.dataset.inicializado === 'true') return;

  btnLogout.dataset.inicializado = 'true';
  btnLogout.addEventListener('click', async (e) => {
    e.preventDefault();
    if (window.apiAuth) await window.apiAuth.logout();
    window.location.replace('login.html');
  });
}

async function inicializarDashboard() {
  if (window.apiAuth) {
    const sesion = await window.apiAuth.estadoSesion();
    if (!sesion.autenticado) {
      window.location.replace('login.html');
      return;
    }
  }

  await Promise.all([
    cargarVistaParcial('vista-inicio', 'inicio.html'),
    cargarVistaParcial('vista-profesores', 'profesores.html'),
    cargarVistaParcial('vista-horariosanuales', 'horariosanuales.html'),
    cargarVistaParcial('vista-resumen', 'resumen.html'),
    cargarVistaParcial('vista-interferiados', 'interferiados.html'),
    cargarVistaParcial('vista-resumenes', 'resumenes.html')
  ]);

  inicializarLogout();
  if (typeof window.inicializarVistaProfesores === 'function') window.inicializarVistaProfesores();
  if (typeof window.inicializarVistaResumen === 'function') window.inicializarVistaResumen();
  if (typeof window.inicializarVistaResumenes === 'function') window.inicializarVistaResumenes();
  if (typeof window.inicializarNavegacion === 'function') window.inicializarNavegacion();
  if (typeof window.cargarDatosIniciales === 'function') await window.cargarDatosIniciales();
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarDashboard();
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

  profesores.forEach((p) => {
    const h = p.horarios.find((hor) => hor.anio === anioActual);
    if (h) {
      if (h.faltas && h.faltas.some((f) => f.fecha === hoyStr)) totalFaltas++;
      if (h.licencias && h.licencias.some((l) => hoyStr >= l.fechaInicio && hoyStr <= l.fechaFin)) totalLicencias++;
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

  if (!fecha || !desc) return alert("Debes ingresar la fecha y escribir el motivo.");

  if (feriadosGlobales.some((f) => f.fecha === fecha)) {
    return alert("Este d\u00eda ya est\u00e1 marcado como libre o no h\u00e1bil.");
  }

  feriadosGlobales.push({ fecha, tipo, desc });
  feriadosGlobales.sort((a, b) => a.fecha.localeCompare(b.fecha));

  await guardarDatosGlobales();
  window.renderFeriados();

  document.getElementById('inputFeriado').value = '';
  document.getElementById('descFeriado').value = '';
}

window.eliminarFeriado = async function(index) {
  if (confirm("\u00bfQuitar este d\u00eda libre? El d\u00eda volver\u00e1 a ser h\u00e1bil para todos los profesores.")) {
    feriadosGlobales.splice(index, 1);
    await guardarDatosGlobales();
    window.renderFeriados();
  }
}

window.renderFeriados = function() {
  const lista = document.getElementById('listaFeriados');
  if (!lista) return;

  if (feriadosGlobales.length === 0) {
    lista.innerHTML = '<li class="text-muted" style="font-style: italic;">No hay d\u00edas libres registrados.</li>';
    return;
  }

  lista.innerHTML = feriadosGlobales.map((f, i) => {
    let badgeColor = 'bg-gray-light text-muted border-muted';
    if (f.tipo === 'Interferiado') badgeColor = 'bg-morado-light text-morado';
    if (f.tipo === 'D\u00eda no h\u00e1bil') badgeColor = 'bg-azul-light text-azul border-azul';
    return `
    <li class="d-flex justify-between align-center p-2 bg-white border-muted border-radius-md">
      <div>
        <strong class="text-primary fs-md">${window.formatearFechaGlobal(f.fecha)}</strong>
        <span class="fs-xs fw-bold py-1 px-2 border-radius-lg ml-1 ${badgeColor}">${f.tipo}</span>
        <span class="text-muted ml-1">${f.desc}</span>
      </div>
      <button class="btn-danger bg-transparent text-danger fw-bold border-danger border-radius-sm py-1 px-2 cursor-pointer" onmouseover="this.style.background='#ffebee'" onmouseout="this.style.background='transparent'" onclick="window.eliminarFeriado(${i})">Quitar</button>
    </li>
  `;
  }).join('');
}
