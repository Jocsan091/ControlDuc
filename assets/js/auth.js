// ==========================================
// ARCHIVO: assets/js/auth.js
// Propósito: Manejo de sesión y seguridad (Protección de rutas)
// ==========================================

// Validar que la llave exista en sessionStorage, no en localStorage
if (sessionStorage.getItem('sesionActiva') !== 'true') {
  window.location.href = 'login.html';
}

const btnLogout = document.getElementById('logout');
if (btnLogout) {
  btnLogout.addEventListener('click', (e) => {
    e.preventDefault(); 
    sessionStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
  });
}