document.addEventListener('DOMContentLoaded', async () => {
  if (window.apiAuth) {
    const sesion = await window.apiAuth.estadoSesion();
    if (!sesion.autenticado) {
      window.location.replace('login.html');
      return;
    }
  }

  const btnLogout = document.getElementById('logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      if (window.apiAuth) await window.apiAuth.logout();
      window.location.replace('login.html');
    });
  }
});
