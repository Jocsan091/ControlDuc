// ==========================================
// ARCHIVO: assets/js/datos.js
// Propósito: Almacenar la data global, utilidades y conexión a BD
// ==========================================

const ASIGNATURAS = [
  'Artes visuales', 'Ciencias naturales', 'Comunicación', 'Educación física y salud',
  'Historia, geografía y ciencias sociales', 'Inglés', 'Lengua y literatura',
  'Lenguaje', 'Matemáticas', 'Música', 'Orientación', 'Religión', 'Tecnología',
  'Taller artístico', 'Taller deportivo'
];

const CURSOS = [
  '1°', '2°', '3°', '4°', '5°A', '5°B', '6°A', '6°B', '7°A', '7°B', '8°'
];

let profesores = [];

function cerrarModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

// NUEVO: Función para guardar automáticamente en el disco duro
async function guardarDatosGlobales() {
  if (window.apiBaseDatos) {
    const exito = await window.apiBaseDatos.guardar({ profesores: profesores });
    if (!exito) console.error("Error crítico: No se pudo guardar en el disco duro.");
  }
}

// NUEVO: Función para cargar los datos al iniciar
async function cargarDatosIniciales() {
  if (window.apiBaseDatos) {
    const bd = await window.apiBaseDatos.leer();
    profesores = bd.profesores || [];
    
    // Actualizar los contadores visuales del dashboard
    const contador = document.getElementById('contadorProfesores');
    if (contador) contador.innerText = profesores.length;

    // Si ya estamos en la vista profesores, refrescar la lista
    if (typeof renderProfesores === 'function' && document.getElementById('listaProfesores')) {
      renderProfesores();
    }
  }
}

// Ejecutar la carga inmediatamente
cargarDatosIniciales();