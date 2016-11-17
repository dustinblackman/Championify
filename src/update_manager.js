import { remote } from 'electron';

import Promise from 'bluebird';
import { exec } from 'child_process';
import path from 'path';
import progress from 'request-progress';
import request from 'request';
import semver from 'semver';
import tar from 'tar-fs';
import zlib from 'zlib';
import $ from './helpers/jquery';

import ChampionifyErrors from './errors';
import { EndSession, request as cRequest } from './helpers';
import optionsParser from './options_parser';
import preferences from './preferences';
import progressbar from './progressbar';
import T from './translate';
import viewManager from './view_manager';

const app = remote.app;
const fs = Promise.promisifyAll(require('fs-extra'));
const pkg = require('../package.json');

let runas;
if (process.platform === 'win32') runas = require('runas');

/**
 * Downloads update file to disk
 * @param {String} Download URL
 * @param {String} Local path
 * @returns {Promise}
 */

function download(url, download_path) {
  let file;
  try {
    file = fs.createWriteStream(download_path);
  } catch (e) {
    const error = new ChampionifyErrors.UpdateError(`Can\'t write update file: ${path.basename(download_path)}`).causedBy(e);
    if (process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
      return runas(process.execPath, ['--startAsAdmin'], {hide: false, admin: true});
    }
    throw error;
  }

  let last_percent = 0;
  return new Promise((resolve, reject) => {
    return progress(request(url), {throttle: 500})
      .on('progress', function(state) {
        if (state.percent > last_percent) {
          last_percent = state.percent;
          return progressbar.incrUI('update_progress_bar', last_percent);
        }
      })
      .on('error', function(err) {
        reject(err);
      }).pipe(file).on('error', function(err) {
        reject(err);
      }).on('close', function() {
        file.close();
        resolve();
      });
  });
}

/**
 * Reboots Championify for minor updates on OSX
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by download
 */

function osxMinor(app_asar, update_asar) {
  fs.unlinkAsync(app_asar)
    .catch(err => {
      throw new ChampionifyErrors.UpdateError('Can\'t unlink file').causedBy(err);
    })
    .then(() => fs.renameAsync(update_asar, app_asar))
    .catch(err => {
      throw new ChampionifyErrors.UpdateError('Can\'t rename app.asar').causedBy(err);
    })
    .then(() => {
      const app_path = __dirname.replace('/Contents/Resources/app.asar/js', '');
      exec(`open -n ${app_path}`);
      setTimeout(function() {
        return app.quit();
      }, 250);
    })
    .catch(err => EndSession(err));
}


/**
 * Reboots Championify for major updates on OSX
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by download
 */

function osxMajor(install_path, update_path) {
  update_path = path.join(update_path, 'Championify.app');
  const cmd = [
    'echo -n -e "\\033]0;Updating ${name}\\007"',
    `echo Updating ${pkg.name}, please wait...`,
    `killall ${pkg.name}`,
    `mv "${update_path}/Contents/Resources/atom-asar" "${update_path}/Contents/Resources/atom.asar"`,
    `mv "${update_path}/Contents/Resources/app-asar" "${update_path}/Contents/Resources/app.asar"`,
    `rm -rf "${install_path}"`,
    `mv "${update_path}" "${install_path}"`,
    `open -n "${install_path}"`,
    'exit'
  ].join('\n');

  const update_file = path.join(preferences.directory(), 'update_major.sh');
  fs.writeFileAsync(update_file, cmd, 'utf8')
    .catch(err => {
      throw new ChampionifyErrors.UpdateError('Can\'t write update_major.sh').causedBy(err);
    })
    .then(() => exec(`bash "${update_file}"`));
}


/**
 * Reboots Championify for updates on Windows
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by download
 */

function winMinor(app_asar, update_asar) {
  const cmd = `@echo off\n title Updating Championify echo Updating Championify, please wait...\n taskkill /IM ${path.basename(process.execPath)} /f\n ping 1.1.1.1 -n 1 -w 1000 > nul\n del "${app_asar}"\n ren "${update_asar}" app.asar\n start "" "${process.execPath}" --update\n exit\n`;
  const update_file = path.join(preferences.directory(), 'update.bat');

  fs.writeFileAsync(update_file, cmd, 'utf8')
    .catch(err => {
      throw new ChampionifyErrors.UpdateError('Can\'t write update.bat').causedBy(err);
    })
    .then(() => exec(`START "" "${update_file}"`));
}


/**
 * Function Reboots Championify for major updates on Windows
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdates
 */

function winMajor(install_path, update_path) {
  update_path = path.join(update_path, 'Championify');
  const root_path = path.resolve(path.join(install_path, '../'));
  const cmd = [
    '@echo off',
    'title Updating Championify',
    'echo Updating Championify, please wait...',
    `taskkill /IM ${path.basename(process.execPath)} /f`,
    'ping 1.1.1.1 -n 1 -w 1000 > nul',
    `ren "${update_path}\\resources\\app-asar" app.asar`,
    `ren "${update_path}\\resources\\atom-asar" atom.asar`,
    `rmdir "${install_path}" /s /q`,
    `move "${update_path}" "${root_path}"`,
    `start "" "${process.execPath}" --update`,
    'exit'
  ].join('\n');

  const update_file = path.join(preferences.directory(), 'update_major.bat');
  fs.writeFileAsync(update_file, cmd, 'utf8')
    .catch(err => {
      new ChampionifyErrors.FileWriteError('Can\'t write update_major.bat').causedBy(err);
    })
    .then(() => {
      return runas(process.execPath, ['--winMajor'], {hide: false, admin: true});
    });
}


/**
 * Function Sets up flow for download minor update (just update.asar)
 * @callback {Function} Callback.
 */

function minorUpdate(version) {
  viewManager.update();
  const url = `https://github.com/dustinblackman/Championify/releases/download/${version}/update.asar`;
  const app_asar = path.join(__dirname, '..');
  const update_asar = path.join(__dirname, '../../', 'update-asar');

  return download(url, update_asar)
    .then(() => {
      if (process.platform === 'darwin') {
        osxMinor(app_asar, update_asar);
      } else {
        winMinor(app_asar, update_asar);
      }
    })
    .catch(err => {
      if (!(err instanceof ChampionifyErrors.UpdateError)) {
        err = new ChampionifyErrors.UpdateError('Can\'t write/download update file').causedBy(err);
      }

      if (process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
        runas(process.execPath, ['--startAsAdmin'], {hide: false, admin: true});
      } else {
        EndSession(err);
      }
    });
}


/**
 * Sets up flow for download major update (replacing entire install directory)
 * @param {String} New version number
 * @returns {Promise}
 */

function majorUpdate(version) {
  let install_path, tar_name;
  viewManager.update();
  if (process.platform === 'darwin') {
    install_path = path.join(__dirname, '../../../../');
    tar_name = 'u_osx.tar.gz';
  } else {
    install_path = path.join(__dirname, '../../../');
    tar_name = 'u_win.tar.gz';
  }
  const tar_path = path.join(preferences.directory(), tar_name);
  install_path = install_path.substring(0, install_path.length - 1);
  const update_path = path.join(preferences.directory(), 'major_update');
  const url = `https://github.com/dustinblackman/Championify/releases/download/${version}/${tar_name}`;

  return Promise.resolve()
    .then(() => {
      if (fs.existsSync(update_path)) {
        return fs.removeAsync(update_path)
          .catch(err => {
            throw new ChampionifyErrors.UpdateError('Can\'t remove previous update path').causedBy(err);
          });
      }
      return;
    })
    .then(() => {
      return download(url, tar_path)
        .catch(err => {
          throw new ChampionifyErrors.UpdateError('Can\'t write/download update file').causedBy(err);
        });
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        $('#update_current_file').text(T.t('extracting'));
        const stream = fs.createReadStream(tar_path).pipe(zlib.Gunzip()).pipe(tar.extract(update_path));
        stream.on('error', function(err) {
          if (err) return reject(new ChampionifyErrors.UpdateError('Can\'t extract update').causedBy(err));
        });
        stream.on('finish', function() {
          return resolve()();
        });
      });
    })
    .then(() => {
      return fs.unlinkAsync(tar_path)
        .catch(err => {
          throw new ChampionifyErrors.UpdateError('Can\'t unlink major update zip').causedBy(err);
        });
    })
    .then(() => {
      if (process.platform === 'darwin') {
        osxMajor(install_path, update_path);
      } else {
        winMajor(install_path, update_path);
      }
    })
    .catch(err => EndSession(err));
}

/**
 * Check version of Github package.json and local. Executes update if available.
 * @returns {Promise.<Array|ChampionifyErrors>} Array of version and boolean if it's a major update. Meant to spread.
 */

function check() {
  if (process.versions.electron === '0.26.0') {
    return viewManager.breakingChanges();
  }
  let version = false;
  let major_update = false;
  const url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json';
  return cRequest({url, json: true})
    .then(data => {
      if (semver.gt(data.devDependencies['electron'], process.versions.electron)) {
        version = data.version;
        major_update = true;
      }
      if (semver.gt(data.version, pkg.version)) version = data.version;
      if (version && optionsParser.update()) {
        return EndSession(new ChampionifyErrors.UpdateError('New version did not install correctly'));
      }
      return [version, major_update];
    })
    .catch(err => {
      EndSession(new ChampionifyErrors.RequestError('Can\'t access Github package.json').causedBy(err));
    });
}

export default {
  check,
  minorUpdate,
  majorUpdate
};
