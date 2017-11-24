// TODO Convert this to typescript, possibly use some kind of build and then a watcher file.
const { app, BrowserWindow } = require('electron');
// const fs = require('fs');
// const path = require('path');

// Used for Squirrel install on Windows
if (require('electron-squirrel-startup')) app.quit();

// const dev_enabled = process.env.NODE_ENV === 'development' || fs.existsSync('./dev_enabled') || fs.existsSync(path.join(__dirname, '..', 'dev_enabled'));

let main_window = null;
app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  main_window = new BrowserWindow({
    fullscreen: false,
    width: 450,
    height: 670,
    center: true,
    resizable: false,
    show: false,
    frame: false,
    title: 'Championify'
  });

  main_window.loadURL(`http://localhost:3000`);

  // TODO: The following needs to only be enabled while in dev mode, and only if installed.
  // if (dev_enabled) main_window.openDevTools({detach: true});
  main_window.openDevTools({detach: true});
  require('devtron').install();
  const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');
  installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS]).catch(console.error);

  main_window.webContents.on('did-finish-load', () => {
    if (process.argv.includes('--autorun')) return main_window.show();
  });

  main_window.on('closed', () => {
    main_window = null;
  });
});
