let profesores = [];

function renderTabla() {
  const tabla = document.getElementById('tablaProfesores');
  tabla.innerHTML = '';

  profesores.forEach((prof, index) => {
    tabla.innerHTML += `
      <tr>
        <td>${prof.nombre}</td>
        <td>${prof.asignaturas}</td>
        <td>${prof.anio}</td>
        <td>
          <button onclick="eliminarProfesor(${index})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

function eliminarProfesor(index) {
  profesores.splice(index, 1);
  renderTabla();
}

document.getElementById('btnAgregar').addEventListener('click', () => {
  const nombre = prompt('Nombre del profesor:');
  const asignaturas = prompt('Asignaturas (ej: Matemática, Física):');
  const anio = prompt('Año (ej: 2026):');

  if (nombre && asignaturas && anio) {
    profesores.push({
      nombre,
      asignaturas,
      anio
    });

    renderTabla();
  }
});