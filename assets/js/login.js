// ==========================================
// ARCHIVO: assets/js/login.js
// Propósito: Autenticación dura para un solo usuario local
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('formLogin');
  const btnLogin = document.getElementById('btnLogin');
  const errorMsg = document.getElementById('error');

  function procesarLogin(e) {
    e.preventDefault();
    
    const userEl = document.getElementById('usuario');
    const passEl = document.getElementById('password');

    if (!userEl || !passEl) {
      console.error("Error: No se encontraron los inputs de usuario o contraseña en el HTML.");
      return;
    }

    const user = userEl.value.trim();
    const pass = passEl.value.trim();

    if (user === 'inspector' && pass === 'admin123') {
      sessionStorage.setItem('sesionActiva', 'true');
      window.location.href = 'dashboard.html';
    } else {
      errorMsg.innerText = 'Usuario o contraseña incorrectos.';
      errorMsg.classList.remove('d-none');
      errorMsg.classList.add('d-block');
    }
  }

  if (formLogin) formLogin.addEventListener('submit', procesarLogin);
  else if (btnLogin) btnLogin.addEventListener('click', procesarLogin);
});