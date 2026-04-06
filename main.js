const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768
  });

  win.loadFile('views/login.html');
}

app.whenReady().then(() => {
  createWindow();
});   