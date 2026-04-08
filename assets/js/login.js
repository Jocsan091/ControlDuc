// ==========================================
// ARCHIVO: assets/js/login.js
// Propósito: Asistente de Primer Inicio (Setup) y Autenticación (Usuario + Clave)
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  const pantallaLogin = document.getElementById('pantallaLogin');
  const pantallaSetup = document.getElementById('pantallaSetup');
  
  const formLogin = document.getElementById('formLogin');
  const formSetup = document.getElementById('formSetup');
  
  const errorLogin = document.getElementById('errorLogin');
  const errorSetup = document.getElementById('errorSetup');

  // 1. LEER LA BASE DE DATOS
  let dbConfig = {};
  if (window.apiBaseDatos) {
    const bd = await window.apiBaseDatos.leer();
    dbConfig = bd.configuracion || {};
  }

  // 2. DECIDIR QUÉ PANTALLA MOSTRAR (Si existe usuario y clave, mostramos login normal)
  if (dbConfig.usuario && dbConfig.password) {
    pantallaLogin.classList.remove('d-none');
    if (dbConfig.nombreColegio) {
      document.getElementById('subtituloLogin').innerText = dbConfig.nombreColegio;
    }
  } else {
    pantallaSetup.classList.remove('d-none');
  }

  // --- LÓGICA DE LOGIN NORMAL ---
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const inputUser = document.getElementById('loginUsuario').value.trim();
      const inputPass = document.getElementById('loginPassword').value;

      // Validación doble: Usuario Y Contraseña deben coincidir con la BD
      if (inputUser === dbConfig.usuario && inputPass === dbConfig.password) {
        sessionStorage.setItem('sesionActiva', 'true');
        window.location.href = 'dashboard.html';
      } else {
        errorLogin.classList.remove('d-none');
        errorLogin.classList.add('d-block');
      }
    });
  }

  // --- LÓGICA DE SETUP DE PRIMER INICIO ---
  if (formSetup) {
    formSetup.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const colegio = document.getElementById('setupColegio').value.trim();
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

      // Guardar la configuración en la base de datos
      if (window.apiBaseDatos) {
        const bdFull = await window.apiBaseDatos.leer();
        
        bdFull.configuracion = {
          nombreColegio: colegio,
          usuario: nuevoUsuario, // Guardamos el usuario creado
          password: pass1      // Guardamos la clave creada
        };
        
        const exito = await window.apiBaseDatos.guardar({
          profesores: bdFull.profesores || [],
          feriadosGlobales: bdFull.feriadosGlobales || [],
          configuracion: bdFull.configuracion
        });

        if (exito) {
          sessionStorage.setItem('sesionActiva', 'true');
          window.location.href = 'dashboard.html';
        } else {
          alert("Error crítico al guardar la configuración inicial.");
        }
      } else {
        alert("La base de datos no está conectada. Inicia desde Electron.");
      }
    });
  }
});