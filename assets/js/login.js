// ==========================================
// ARCHIVO: assets/js/login.js
// Propósito: Autenticación con soporte de teclado (Enter)
// ==========================================

const btnIngresar = document.getElementById('btnIngresar');
const inputUsuario = document.getElementById('usuario');
const inputPassword = document.getElementById('password');

function iniciarSesion() {
  const usuario = inputUsuario.value.trim();
  const password = inputPassword.value.trim();

  if (usuario === 'admin' && password === '1234') {
    localStorage.setItem('sesionActiva', 'true');
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('error').innerText = 'Credenciales incorrectas';
  }
}

btnIngresar.addEventListener('click', iniciarSesion);

// Escuchar la tecla Enter en ambos inputs
[inputUsuario, inputPassword].forEach(input => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      iniciarSesion();
    }
  });
});