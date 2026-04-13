// ==========================================
// ARCHIVO: assets/js/login.js
// Propósito: Autenticación directa y segura contra el motor principal
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  const pantallaLogin = document.getElementById('pantallaLogin');
  const pantallaSetup = document.getElementById('pantallaSetup');
  
  const formLogin = document.getElementById('formLogin');
  const formSetup = document.getElementById('formSetup');
  
  const errorLogin = document.getElementById('errorLogin');
  const errorSetup = document.getElementById('errorSetup');

  // 1. Verificar si ya hay credenciales creadas (Sin exponer la clave)
  let config = { existeUsuario: false };
  if (window.apiAuth) {
    config = await window.apiAuth.verificarConfiguracion();
  }

  if (config.existeUsuario) {
    pantallaLogin.classList.remove('d-none');
    const subtitulo = document.getElementById('subtituloLogin');
    if(subtitulo) subtitulo.innerText = "Escuela Esperanza";
  } else {
    pantallaSetup.classList.remove('d-none');
  }

  // 2. LÓGICA DE LOGIN SEGURO
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const inputUser = document.getElementById('loginUsuario').value.trim();
      const inputPass = document.getElementById('loginPassword').value;

      const res = await window.apiAuth.login({ usuario: inputUser, password: inputPass });

      if (res.exito) {
        sessionStorage.setItem('sesionActiva', 'true');
        window.location.href = 'dashboard.html';
      } else {
        errorLogin.classList.remove('d-none');
        errorLogin.classList.add('d-block');
      }
    });
  }

  // 3. LÓGICA DE SETUP DE PRIMER INICIO
  if (formSetup) {
    formSetup.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nuevoUsuario = document.getElementById('setupUsuario').value.trim();
      const pass1 = document.getElementById('setupPass').value;
      const pass2 = document.getElementById('setupPassConfirm').value;

      if (pass1 !== pass2) {
        errorSetup.innerText = "Error: Las contraseñas no coinciden.";
        errorSetup.classList.remove('d-none');
        errorSetup.classList.add('d-block');
        return;
      }
      
      if (nuevoUsuario.includes(' ')) {
        errorSetup.innerText = "Error: El nombre de usuario no puede tener espacios.";
        errorSetup.classList.remove('d-none');
        errorSetup.classList.add('d-block');
        return;
      }

      if (window.apiAuth) {
        const exito = await window.apiAuth.crearUsuarioInicial({
          usuario: nuevoUsuario,
          password: pass1 
        });

        if (exito) {
          sessionStorage.setItem('sesionActiva', 'true');
          window.location.href = 'dashboard.html';
        } else {
          alert("Error crítico al guardar la configuración inicial.");
        }
      }
    });
  }
});