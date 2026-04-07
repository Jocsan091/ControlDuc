// ==========================================
// ARCHIVO: assets/js/datos.js
// Propósito: Almacenar data global, BD y Herramientas de Pruebas (Mock Data)
// ==========================================

const ASIGNATURAS = ['Artes visuales', 'Ciencias naturales', 'Comunicación', 'Educación física y salud', 'Historia, geografía y ciencias sociales', 'Inglés', 'Lengua y literatura', 'Lenguaje', 'Matemáticas', 'Música', 'Orientación', 'Religión', 'Tecnología', 'Taller artístico', 'Taller deportivo'];
const CURSOS = ['1°', '2°', '3°', '4°', '5°A', '5°B', '6°A', '6°B', '7°A', '7°B', '8°'];

let profesores = [];

function cerrarModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

async function guardarDatosGlobales() {
  if (window.apiBaseDatos) {
    const exito = await window.apiBaseDatos.guardar({ profesores: profesores });
    if (!exito) console.error("Error crítico guardando.");
  }
}

async function cargarDatosIniciales() {
  if (window.apiBaseDatos) {
    const bd = await window.apiBaseDatos.leer();
    profesores = bd.profesores || [];
    
    if (typeof actualizarDashboardInicio === 'function') {
      actualizarDashboardInicio();
    }
    if (typeof renderProfesores === 'function' && document.getElementById('listaProfesores')) {
      renderProfesores();
    }
  }
}

cargarDatosIniciales();

// ==========================================
// HERRAMIENTAS DE DESARROLLO (MOCK DATA)
// ==========================================
window.generarDatosDePrueba = async function() {
  if(!confirm("¿Estás seguro? Esto inyectará 10 profesores falsos a tu sistema para hacer pruebas gráficas.")) return;
  
  const nombres = ['Juan Pérez', 'María González', 'Carlos Soto', 'Ana Silva', 'Luis Morales', 'Carmen Castro', 'Jorge Vargas', 'Paula Medina', 'Roberto Ríos', 'Elena Núñez'];
  const hoyObj = new Date();
  const hoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`;
  const anio = hoyStr.split('-')[0];

  nombres.forEach((n, i) => {
    profesores.push({
      nombre: n,
      rut: `1${i}234567-${i}`,
      profesion: 'Profesor Titular',
      fechaNacimiento: '1980-05-15',
      domicilio: 'Avenida Siempre Viva 123',
      emergencia: [{nombre: 'Contacto Prueba', vinculo: 'Familiar', telefono: '+56912345678'}],
      salud: {enfermedades: 'Ninguna', alergias: 'Ninguna', medicamentos: ''},
      observaciones: 'Ficha inyectada para pruebas de sistema',
      horarios: [{
        anio: anio,
        inicioSemestre1: `${anio}-03-01`,
        finSemestre1: `${anio}-07-15`,
        inicioSemestre2: `${anio}-07-30`,
        finSemestre2: `${anio}-12-15`,
        faltas: i % 2 === 0 ? [{tipo: 'Inasistencia', fecha: hoyStr, motivo: 'Falta inyectada hoy', registro: hoyStr}] : [],
        licencias: i === 3 ? [{fechaInicio: hoyStr, fechaFin: hoyStr, motivo: 'Licencia inyectada', archivo: '', registro: hoyStr}] : [],
        horarioClases: crearHorarioBasePrueba()
      }]
    });
  });

  await guardarDatosGlobales();
  alert("10 profesores inyectados con éxito. Recargando la aplicación...");
  window.location.reload(); 
}

window.borrarBaseDeDatos = async function() {
  if(!confirm("⚠️ PELIGRO EXTREMO: Vas a borrar todos los profesores, horarios y faltas. ¿Confirmar?")) return;
  if(!confirm("Esta acción es irreversible. ¿Destruir base de datos?")) return;
  
  profesores = [];
  await guardarDatosGlobales();
  alert("Base de datos purgada.");
  window.location.reload();
}

function crearHorarioBasePrueba() {
  const d = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const f = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'llegada', 'salida'];
  let b = {};
  d.forEach(dia => { b[dia] = {}; f.forEach(fila => b[dia][fila] = ''); });
  return b;
}