import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import R from 'ramda';

// Used for Squirrel install on Windows
if (require('electron-squirrel-startup')) app.quit();

const dev_enabled = process.env.NODE_ENV === 'development' || fs.existsSync('./dev_enabled') || fs.existsSync(path.join(__dirname, '..', 'dev_enabled'));

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

  main_window.loadURL(`file://${__dirname}/index.html`);
  if (dev_enabled) main_window.openDevTools({detach: true});

  main_window.webContents.on('did-finish-load', () => {
    if (!R.contains('--autorun', process.argv)) return main_window.show();
  });

  main_window.on('closed', () => {
    main_window = null;
  });
});
