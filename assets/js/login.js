document.getElementById('btnIngresar').addEventListener('click', () => {
  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  if (usuario === 'admin' && password === '1234') {
    localStorage.setItem('sesionActiva', 'true');
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('error').innerText = 'Credenciales incorrectas';
  }
});

