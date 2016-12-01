import { app, BrowserWindow } from 'electron';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import R from 'ramda';

// Used for Squirrel install on Windows
if (require('electron-squirrel-startup')) app.quit();

const dev_enabled = process.env.NODE_ENV === 'development' || fs.existsSync('./dev_enabled') || fs.existsSync(path.join(__dirname, '..', 'dev_enabled'));


let preference_dir;
if (process.platform === 'darwin') {
  preference_dir = path.join(process.env.HOME, 'Library/Application Support/Championify/');
} else {
  preference_dir = path.join(process.env.APPDATA, 'Championify');
}

if (R.contains('--win-major', process.argv)) {
  const update_file = path.join(preference_dir, 'update_major.bat');
  exec(`START "" "${update_file}"`, {cwd: path.join(process.cwd(), '..')});
}

let mainWindow = null;
app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    fullscreen: false,
    width: 450,
    height: 670,
    center: true,
    resizable: false,
    show: false,
    frame: false,
    title: 'Championify'
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html');
  if (dev_enabled) mainWindow.openDevTools({detach: true});

  mainWindow.webContents.on('did-finish-load', function() {
    if (!R.contains('--autorun', process.argv)) return mainWindow.show();
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
