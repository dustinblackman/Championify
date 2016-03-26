import remote from 'remote';
import async from 'async';
import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import progress from 'request-progress';
import request from 'request';
import semver from 'semver';
import tar from 'tar-fs';
import zlib from 'zlib';
import _ from 'lodash';

import cErrors from './errors';
import hlp from './helpers';
import optionsParser from './options_parser';
import preferences from './preferences';
import T from './translate';
import viewManager from './view_manager';

const app = remote.require('app');
const pkg = require('../package.json');

let runas;
if (process.platform === 'win32') {
  runas = require('runas');
}

/**
 * Function Downloads update file
 * @callback {Function} Callback.
 */

function download(url, download_path, done) {
  let file;
  try {
    file = fs.createWriteStream(download_path);
  } catch (e) {
    const error = new cErrors.UpdateError("Can\'t write update file: " + (path.basename(download_path))).causedBy(e);
    if (process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
      return runas(process.execPath, ['--startAsAdmin'], {
        hide: false,
        admin: true
      });
    }
    return done(error);
  }
  let last_percent = 0;
  return progress(request(url), {
    throttle: 500
  }).on('progress', function(state) {
    if (state.percent > last_percent) {
      last_percent = state.percent;
      return hlp.incrUIProgressBar('update_progress_bar', last_percent);
    }
  }).on('error', function(err) {
    return done(err);
  }).pipe(file).on('error', function(err) {
    return done(err);
  }).on('close', function() {
    file.close();
    return done();
  });
}


/**
 * Function Sets up flow for download minor update (just update.asar)
 * @callback {Function} Callback.
 */

function minorUpdate(version) {
  viewManager.update();
  const url = 'https://github.com/dustinblackman/Championify/releases/download/' + version + '/update.asar';
  const app_asar = path.join(__dirname, '..');
  const update_asar = path.join(__dirname, '../../', 'update-asar');
  return download(url, update_asar, function(err) {
    if (err && !(err instanceof cErrors.UpdateError)) {
      err = new cErrors.UpdateError('Can\'t write/download update file').causedBy(err);
    }
    if (err) {
      if (process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
        runas(process.execPath, ['--startAsAdmin'], {
          hide: false,
          admin: true
        });
      } else {
        EndSession(err);
      }
    }
    if (process.platform === 'darwin') {
      osxMinor(app_asar, update_asar);
    } else {
      winMinor(app_asar, update_asar);
    }
  });
}


/**
 * Function Sets up flow for download major update (replacing entire install directory)
 * @callback {Function} Callback.
 */

function majorUpdate(version) {
  let platform, install_path, tar_name;
  viewManager.update();
  if (process.platform === 'darwin') {
    platform = 'OSX';
    install_path = path.join(__dirname, '../../../../');
    tar_name = 'u_osx.tar.gz';
  } else {
    platform = 'WIN';
    install_path = path.join(__dirname, '../../../');
    tar_name = 'u_win.tar.gz';
  }
  const tar_path = path.join(preferences.directory(), tar_name);
  install_path = install_path.substring(0, install_path.length - 1);
  const update_path = path.join(preferences.directory(), 'major_update');
  const url = 'https://github.com/dustinblackman/Championify/releases/download/' + version + '/' + tar_name;

  async.series([
    function(step) {
      if (fs.existsSync(update_path)) {
        return fs.remove(update_path, function(err) {
          if (err) {
            step(new cErrors.UpdateError('Can\'t remove previous update path').causedBy(err));
          } else {
            step();
          }
        });
      } else {
        return step();
      }
    }, function(step) {
      return download(url, tar_path, function(err) {
        if (err) {
          return step(new cErrors.UpdateError('Can\'t write/download update file').causedBy(err));
        }
        return step();
      });
    }, function(step) {
      var stream;
      $('#update_current_file').text(T.t('extracting'));
      stream = fs.createReadStream(tar_path).pipe(zlib.Gunzip()).pipe(tar.extract(update_path));
      stream.on('error', function(err) {
        if (err) {
          return step(new cErrors.UpdateError('Can\'t extract update').causedBy(err));
        }
      });
      return stream.on('finish', function() {
        return step();
      });
    }, function(step) {
      return fs.unlink(tar_path, function(err) {
        if (err) {
          return step(new cErrors.UpdateError('Can\'t unlink major update zip').causedBy(err));
        }
        return step();
      });
    }
  ], function(err) {
    if (err) {
      return EndSession(err);
    }
    if (process.platform === 'darwin') {
      osxMajor(install_path, update_path);
    } else {
      winMajor(install_path, update_path);
    }
  });
};


/**
 * Function Reboots Championify for minor updates on OSX
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
 */

function osxMinor(app_asar, update_asar) {
  return fs.unlink(app_asar, function(err) {
    if (err) {
      return EndSession(new cErrors.UpdateError('Can\'t unlink file').causedBy(err));
    }
    return fs.rename(update_asar, app_asar, function(err) {
      var appPath;
      if (err) {
        return EndSession(new cErrors.UpdateError('Can\'t rename app.asar').causedBy(err));
      }
      appPath = __dirname.replace('/Contents/Resources/app.asar/js', '');
      exec('open -n ' + appPath);
      return setTimeout(function() {
        return app.quit();
      }, 250);
    });
  });
}


/**
 * Function Reboots Championify for major updates on OSX
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdaets
 */

function osxMajor(install_path, update_path) {
  const cmd = _.template(['echo -n -e "\\033]0;Updating ${name}\\007"', 'echo Updating ${name}, please wait...', 'killall ${name}', 'mv "${update_path}/Contents/Resources/atom-asar" "${update_path}/Contents/Resources/atom.asar"', 'mv "${update_path}/Contents/Resources/app-asar" "${update_path}/Contents/Resources/app.asar"', 'rm -rf "${install_path}"', 'mv "${update_path}" "${install_path}"', 'open -n "${install_path}"', 'exit'].join('\n'));
  update_path = path.join(update_path, 'Championify.app');
  const params = {
    install_path: install_path,
    update_path: update_path,
    name: pkg.name
  };
  const update_file = path.join(preferences.directory(), 'update_major.sh');
  fs.writeFile(update_file, cmd(params), 'utf8', function(err) {
    if (err) {
      return EndSession(new cErrors.UpdateError('Can\'t write update_major.sh').causedBy(err));
    }
    exec('bash "' + update_file + '"');
  });
}


/**
 * Function Reboots Championify for updates on Windows
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdates
 */

function winMinor(app_asar, update_asar) {
  const cmd = _.template('@echo off\n title Updating Championify echo Updating Championify, please wait...\n taskkill /IM ${process_name} /f\n ping 1.1.1.1 -n 1 -w 1000 > nul\n del "${app_asar}"\n ren "${update_asar}" app.asar\n start "" "${exec_path}" --update\n exit\n');
  const params = {
    app_asar: app_asar,
    update_asar: update_asar,
    exec_path: process.execPath,
    process_name: path.basename(process.execPath)
  };
  const update_file = path.join(preferences.directory(), 'update.bat');
  fs.writeFile(update_file, cmd(params), 'utf8', function(err) {
    if (err) {
      return EndSession(new cErrors.UpdateError('Can\'t write update.bat').causedBy(err));
    }
    return exec('START "" "' + update_file + '"');
  });
}


/**
 * Function Reboots Championify for major updates on Windows
 * @param {String} Current asar archive
 * @param {String} New downloaded asar archive created by runUpdates
 */

function winMajor(install_path, update_path) {
  const cmd = _.template(['@echo off', 'title Updating Championify', 'echo Updating Championify, please wait...', 'taskkill /IM ${process_name} /f', 'ping 1.1.1.1 -n 1 -w 1000 > nul', 'ren "${update_path}\\resources\\app-asar" app.asar', 'ren "${update_path}\\resources\\atom-asar" atom.asar', 'rmdir "${install_path}" /s /q', 'move "${update_path}" "${root_path}"', 'start "" "${exec_path}" --update', 'exit'].join('\n'));
  update_path = path.join(update_path, 'Championify');
  const root_path = path.resolve(path.join(install_path, '../'));
  const params = {
    install_path: install_path,
    update_path: update_path,
    root_path: root_path,
    exec_path: process.execPath,
    process_name: path.basename(process.execPath)
  };
  const update_file = path.join(preferences.directory(), 'update_major.bat');
  fs.writeFile(update_file, cmd(params), 'utf8', function(err) {
    if (err) {
      return EndSession(new cErrors.FileWriteError('Can\'t write update_major.bat').causedBy(err));
    }
    return runas(process.execPath, ['--winMajor'], {
      hide: false,
      admin: true
    });
  });
}


/**
 * Function Check version of Github package.json and local. Executes update if available.
  * @callback {Function} Callback, only accepts a single finished parameter as errors are handled with endSession.
 */

function check(done) {
  if (process.versions.electron === '0.26.0') {
    return viewManager.breakingChanges();
  }
  let version = false;
  let major_update = false;
  const url = 'https://raw.githubusercontent.com/dustinblackman/Championify/master/package.json';
  return hlp.request(url, function(err, data) {
    if (err) {
      return EndSession(new cErrors.RequestError('Can\'t access Github package.json').causedBy(err));
    }
    if (semver.gt(data.devDependencies['electron-prebuilt'], process.versions.electron)) {
      version = data.version;
      major_update = true;
    }
    if (semver.gt(data.version, pkg.version) === 1) {
      version = data.version;
    }
    if (version && optionsParser.update()) {
      return EndSession(new cErrors.UpdateError('New version did not install correctly'));
    }
    return done(version, major_update);
  });
}

module.exports = {
  check: check,
  minorUpdate: minorUpdate,
  majorUpdate: majorUpdate
};
