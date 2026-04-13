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