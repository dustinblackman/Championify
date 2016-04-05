import app from 'app';
import BrowserWindow from 'browser-window';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import R from 'ramda';

require('crash-reporter').start();

const dev_enabled = fs.existsSync('./dev_enabled') || fs.existsSync(path.join(__dirname, '..', 'dev_enabled'));

let runas;
if (process.platform === 'win32') runas = require('runas');

let preference_dir;
if (process.platform === 'darwin') {
  preference_dir = path.join(process.env.HOME, 'Library/Application Support/Championify/');
} else {
  preference_dir = path.join(process.env.APPDATA, 'Championify');
}

if (R.contains('--winMajor', process.argv)) {
  const update_file = path.join(preference_dir, 'update_major.bat');
  exec(`START "" "${update_file}"`, {cwd: path.join(process.cwd(), '..')});
}

if (R.contains('--startAsAdmin', process.argv)) {
  let args = R.clone(process.argv, true);
  args.shift();
  args = R.filter(item => item !== '--startAsAdmin', args);
  args.push('--runnedAsAdmin');
  let params = ['/c', 'taskkill', '/IM', 'championify.exe', '/f', '&', process.execPath].concat(args);
  params = params.concat(['&', 'exit']);
  runas('cmd', params, {
    hide: true,
    admin: true
  });
}

let mainWindow = null;
app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    fullscreen: false,
    width: 450,
    height: 650,
    center: true,
    resizable: false,
    show: false,
    frame: false,
    title: 'Championify'
  });

  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  if (dev_enabled) mainWindow.openDevTools({detach: true});

  mainWindow.webContents.on('did-finish-load', function() {
    if (!R.contains('--autorun', process.argv)) return mainWindow.show();
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
