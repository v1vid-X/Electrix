// Desktop wrapper. The app itself is the same static build that `npm run dev` serves —
// Electron just gives it a window and an icon so it can be installed like a normal program.
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

// Vite builds with base './' and the app uses HashRouter, so loading the file directly works.
const INDEX = path.join(__dirname, '..', 'dist', 'index.html');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#101312', // matches --color-bg, so there is no white flash on launch
    show: false,
    autoHideMenuBar: true,
    title: 'Circuit Brain',
    webPreferences: {
      // The app is a plain static site: it needs no Node access, so it does not get any.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile(INDEX);

  // Links to real websites (sources, shops, datasheets) open in the real browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
