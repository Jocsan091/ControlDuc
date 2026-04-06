// ==========================================
// ARCHIVO: assets/js/auth.js
// Propósito: Manejo de sesión y seguridad básica
// ==========================================

// 1. Validar que la sesión esté activa antes de mostrar algo
if (localStorage.getItem('sesionActiva') !== 'true') {
  window.location.href = 'login.html';
}

// 2. Lógica para el botón de cerrar sesión
const btnLogout = document.getElementById('logout');
if (btnLogout) {
  btnLogout.addEventListener('click', (e) => {
    e.preventDefault(); // Evita que el link salte a "#"
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
  });
}