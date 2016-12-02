import Promise from 'bluebird';
import { remote } from 'electron';
import express from 'express';
import net from 'net';
import path from 'path';
import progress from 'request-progress';
import request from 'request';
import semver from 'semver';
import tmp from 'tmp';

import ChampionifyErrors from './errors';
import { request as cRequest } from './helpers';
import Log from './logger';
import pkg from '../package.json';
import progressbar from './progressbar';
import viewManager from './view_manager';

const fs = Promise.promisifyAll(require('fs-extra'));


/**
 * Downloads update file to disk
 * @param {String} Download URL
 * @param {String} Local path
 * @returns {Promise}
 */
function download(url, download_path, enable_progress = true) {
  Log.debug(`Downloading ${url} to ${download_path}`);
  let file;
  try {
    file = fs.createWriteStream(download_path);
  } catch (e) {
    const error = new ChampionifyErrors.UpdateError(`Can\'t write update file: ${path.basename(download_path)}`).causedBy(e);
    return Promise.reject(error);
  }

  let last_percent = 0;
  return new Promise((resolve, reject) => {
    return progress(request(url), {throttle: 500})
      .on('progress', state => {
        if (enable_progress && state.percent > last_percent) {
          last_percent = state.percent;
          return progressbar.incrUI('update_progress_bar', last_percent);
        }
      })
      .on('error', err => reject(err))
      .pipe(file)
      .on('error', err => reject(err))
      .on('close', () => {
        file.close();
        resolve();
      });
  });
}

/**
 * Starts express server that Squirrels taps in to.
 * @param {String} Listening port
 * @param {String} Temporary download folder path
 */
function startExpress(port, download_folder) {
  const web = express();
  web.use(require('morgan')('dev'));

  // Returns releases on disk
  web.use('/releases', express.static(download_folder));
  // Handles squirrels OSX
  web.get('/osx', (req, res) => {
    Log.debug('OSX endpoint requested');
    res.json({url: `http://127.0.0.1:${port}/releases/osx.zip`});
  });
  web.listen(port);
  Log.debug(`Express listening on port ${port}`);
}

/**
 * Starts Squirrels update process, if sucsessful the promise should never resolve as the app will quit.
 * @param {String} Local express port
 * @param {String} Temporary download folder path
 * @returns {Promise}
 */
function startSquirrels(port, download_folder) {
  Log.debug('Starting Squirrels');
  if (process.platform === 'darwin') {
    remote.autoUpdater.setFeedURL(`http://127.0.0.1:${port}/osx`);
  } else {
    remote.autoUpdater.setFeedURL(`http://127.0.0.1:${port}/releases`);
  }

  remote.autoUpdater.on('checking-for-update', () => Log.debug('Squirrels checking-for-update'));
  remote.autoUpdater.on('update-available', () => Log.debug('Squirrels update-available'));
  remote.autoUpdater.on('update-not-available', () => Log.debug('Squirrels update-not-available'));

  // Promise never resolves as the app quits first.
  return new Promise((resolve, reject) => {
    remote.autoUpdater.on('error', err => {
      Log.error(err);
      reject(err);
    });
    remote.autoUpdater.on('update-downloaded', () => {
      Log.debug('Squirrels update-downloaded');
      fs.removeSync(download_folder);
      remote.autoUpdater.quitAndInstall();
    });
    remote.autoUpdater.checkForUpdates();
  });
}

function getPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    let port;
    server.on('error', err => reject(err));
    server.on('close', () => resolve(port));
    server.on('listening', () => {
      port = server.address().port;
      server.close();
    });
    server.listen(0, '127.0.0.1');
  });
}

/**
 * Starts update process by changing view and queing downloads
 * @param {String} New version number
 * @returns {Promise}
 */
function startUpdate(version) {
  Log.info(`Update found, ${pkg.version} to ${version}`);
  viewManager.update();
  const download_folder = tmp.dirSync().name;
  const downloads = [];
  if (process.platform === 'darwin') {
    downloads.push(download(
      `https://github.com/dustinblackman/Championify/releases/download/${version}/Championify.OSX.${version}.zip`,
      path.join(download_folder, 'osx.zip')
    ));
  } else {
    downloads.push(download(
      `https://github.com/dustinblackman/Championify/releases/download/${version}/Championify-${version}-full.nupkg`,
      path.join(download_folder, `Championify-${version}-full.nupkg`)
    ));
    downloads.push(download(
      `https://github.com/dustinblackman/Championify/releases/download/${version}/RELEASE`,
      path.join(download_folder, 'RELEASES'),
      false
    ));
  }

  return Promise.all(downloads)
    .then(getPort)
    .then(port => {
      startExpress(port, download_folder);
      return startSquirrels(port, download_folder);
    });
}

/**
 * Checks for updates and begins download process
 * @returns {Promise|Boolean}
 */

export default function update() {
  Log.info('Checking for updates');
  return cRequest({
    url: 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json',
    json: true
  })
  .then(({version}) => {
    if (semver.gt(version, pkg.version)) {
      // TODO: Verify path is correct for squirrel exe
      if (process.platform === 'win32' && !fs.existsSync(path.join(__dirname, '../../../squirrel.exe'))) {
        // This is the portable version, change views for users to go download the new one.
        Log.debug('Squirrel.exe not found');
        return viewManager.manualUpdate();
      }
      return startUpdate(version)
    };
    Log.info('No updates found');
    return false;
  })
  .catch(err => {
    if (err.name === 'RequestError') return false;
    throw err;
  });
}
