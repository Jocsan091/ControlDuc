document.addEventListener('DOMContentLoaded', async () => {
  const pantallaLogin = document.getElementById('pantallaLogin');
  const pantallaSetup = document.getElementById('pantallaSetup');

  const formLogin = document.getElementById('formLogin');
  const formSetup = document.getElementById('formSetup');

  const errorLogin = document.getElementById('errorLogin');
  const successLogin = document.getElementById('successLogin');
  const errorSetup = document.getElementById('errorSetup');

  let config = { existeUsuario: false };
  if (window.apiAuth) {
    const sesion = await window.apiAuth.estadoSesion();
    if (sesion.autenticado) {
      window.location.replace('dashboard.html');
      return;
    }

    config = await window.apiAuth.verificarConfiguracion();
  }

  if (config.existeUsuario) {
    pantallaLogin.classList.remove('d-none');
    const subtitulo = document.getElementById('subtituloLogin');
    if (subtitulo) subtitulo.innerText = "Escuela Esperanza";
  } else {
    pantallaSetup.classList.remove('d-none');
  }

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      const inputUser = window.normalizarUsuarioAcceso(document.getElementById('loginUsuario').value);
      const inputPass = document.getElementById('loginPassword').value;
      const res = await window.apiAuth.login({ usuario: inputUser, password: inputPass });

      if (res.exito) {
        window.location.replace('dashboard.html');
      } else {
        if (successLogin) {
          successLogin.classList.add('d-none');
          successLogin.classList.remove('d-block');
        }
        errorLogin.classList.remove('d-none');
        errorLogin.classList.add('d-block');
      }
    });
  }

  if (formSetup) {
    formSetup.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nuevoUsuario = window.normalizarUsuarioAcceso(document.getElementById('setupUsuario').value);
      const pass1 = document.getElementById('setupPass').value;
      const pass2 = document.getElementById('setupPassConfirm').value;

      if (!nuevoUsuario) {
        errorSetup.innerText = "Error: Debes ingresar un nombre de usuario.";
        errorSetup.classList.remove('d-none');
        errorSetup.classList.add('d-block');
        return;
      }

      if (pass1 !== pass2) {
        errorSetup.innerText = "Error: Las contrase\u00f1as no coinciden.";
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
          formSetup.reset();
          errorSetup.classList.add('d-none');
          errorSetup.classList.remove('d-block');
          pantallaSetup.classList.add('d-none');
          pantallaLogin.classList.remove('d-none');

          const subtitulo = document.getElementById('subtituloLogin');
          if (subtitulo) subtitulo.innerText = "Escuela Esperanza";

          const inputLoginUsuario = document.getElementById('loginUsuario');
          const inputLoginPassword = document.getElementById('loginPassword');
          if (inputLoginUsuario) inputLoginUsuario.value = nuevoUsuario;
          if (inputLoginPassword) {
            inputLoginPassword.value = '';
            inputLoginPassword.focus();
          }

          errorLogin.classList.add('d-none');
          errorLogin.classList.remove('d-block');
          if (successLogin) {
            successLogin.classList.remove('d-none');
            successLogin.classList.add('d-block');
          }
        } else {
          alert("Error cr\u00edtico al guardar la configuraci\u00f3n inicial.");
        }
      }
    });
  }
});
