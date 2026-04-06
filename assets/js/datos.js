// ==========================================
// ARCHIVO: assets/js/datos.js
// Propósito: Almacenar la data global y utilidades
// ==========================================

const ASIGNATURAS = [
  'Artes visuales',
  'Ciencias naturales',
  'Comunicación',
  'Educación física y salud',
  'Historia, geografía y ciencias sociales',
  'Inglés',
  'Lengua y literatura',
  'Lenguaje',
  'Matemáticas',
  'Música',
  'Orientación',
  'Religión',
  'Tecnología',
  'Taller artístico',
  'Taller deportivo'
];

const CURSOS = [
  '1°', '2°', '3°', '4°', 
  '5°A', '5°B', '6°A', '6°B', 
  '7°A', '7°B', '8°'
];

// Aquí vivirán los datos temporalmente hasta que conectemos la Base de Datos real
let profesores = [];

// Función utilitaria global para cerrar cualquier ventana emergente (modal)
function cerrarModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}