// Electron
import remote from 'remote';

import { exec } from 'child_process';
import fs from 'fs';
import glob from 'glob';
import mkdirp from 'mkdirp';
import open from 'open';
import path from 'path';
import winston from 'winston';
import $ from './js/helpers/jquery';
import _ from 'lodash';

import championify from './js/championify';
import cErrors from './js/errors';
import hlp from './js/helpers';
import optionsParser from './js/options_parser';
import preferences from './js/preferences';
import pathManager from './js/path_manager';
import pkg from './package.json';
import T from './js/translate';
import updateManager from './js/update_manager';
import viewManager from './js/view_manager';

const app = remote.require('app');
const dialog = remote.require('dialog');

let runas;
if (process.platform === 'win32') {
  runas = require('runas');
}

window.devEnabled = fs.existsSync('./dev_enabled') || fs.existsSync(path.join(__dirname, '..', 'dev_enabled'));
const loadedPrefs = preferences.load();
if (loadedPrefs && loadedPrefs.locale !== 'en') T.loadPhrases(loadedPrefs.locale);
const error_log = path.join(preferences.directory(), 'championify.log.txt');

window.Log = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: true
    }), new winston.transports.File({
      filename: error_log,
      handleExceptions: true,
      prettyPrint: true,
      level: 'debug',
      options: {
        flags: 'w'
      }
    })
  ]
});

Log.exitOnError = function(err) {
  let e;
  if (_.isString(err)) {
    e = new cErrors.UncaughtException(err);
  } else {
    e = new cErrors.UncaughtException().causedBy(err);
  }
  EndSession(e);
  return false;
};

Log.info('Version: ' + pkg.version);


/**
 * Function if error exists, enable error view and log error ending the session.
 * @param {Object} Error instance
 */

function EndSession(c_error) {
  if (c_error) {
    Log.error(c_error);
  }
  window.error_message = c_error.message || c_error.rootCause.message;
  return viewManager.error();
}

/**
 * Function to call Electrons OpenDialog. Sets title based on Platform.
 */

let folder_dialog_open = false;

function openFolder() {
  let properties;
  if (!folder_dialog_open) {
    folder_dialog_open = true;
    if (process.platform === 'win32') {
      properties = ['openDirectory'];
    } else {
      properties = ['openFile'];
    }
    return dialog.showOpenDialog({
      properties: properties,
      title: window.browse_title
    }, function(selected_path) {
      folder_dialog_open = false;
      if (selected_path) {
        return pathManager.checkInstallPath(selected_path, pathManager.setInstallPath);
      }
    });
  }
}


/**
 * Function Warn user if their league folder isn't selected.
 */

function selectFolderWarning() {
  $('#input_msg').addClass('yellow');
  $('#input_msg').text("" + (T.t('select_folder')));
  return $('#input_msg').transition('shake');
};


/**
 * Function Checks and imports item sets
 * @callback {Function} Optional callback called after importing is done
 */

function importItemSets(done) {
  if (!window.lol_install_path) {
    selectFolderWarning();
  } else {
    $('#btns_versions').addClass('hidden');
    $('.status').transition('fade up', '500ms');
    championify.run(function() {
      if (done) {
        return done();
      }
    });
  }
}


/**
 * Function Checks and deletes item sets
 */

function deleteItemSets() {
  if (!window.lol_install_path) {
    selectFolderWarning();
  } else {
    championify['delete'](function() {
      $('#cl_progress > span').append('. ' + T.t('done'));
    }, null, true);
  }
}


/**
 * Function Goes through options parameters and acts.
 */

function executeOptionParameters() {
  if (optionsParser['delete']()) {
    deleteItemSets();
  } else if (optionsParser['import']() || optionsParser.autorun()) {
    importItemSets(function() {
      if (optionsParser.close() || optionsParser.autorun()) {
        app.quit();
      } else {
        viewManager.complete();
        if (optionsParser.startLeague()) {
          startLeague();
        }
      }
    });
  }
};


/**
 * Function Start the League of Legends client.
 */

function startLeague() {
  const exit = function() {
    return setTimeout(function() {
      return app.quit();
    }, 500);
  };
  if (process.platform === 'darwin') {
    exec('open -n "' + window.lol_install_path + '"');
    exit();
  } else {
    if (window.lol_executable) {
      exec('"' + path.join(window.lol_install_path, window.lol_executable) + '"');
      exit();
    } else {
      Log.error('League of legends executable is not defined. ' + window.lol_executable);
      $('#start_league').attr('class', 'ui inverted red button');
      $('#start_league').text('Can\'t start League');
    }
  }
}


/**
 * Add system buttons
 */

if (process.platform === 'darwin') {
  $('.osx_buttons').removeClass('hidden');
} else {
  $('.win_buttons').removeClass('hidden');
}


/**
 * Watches for buttons pressed on GUI.
 */

$(document).on('click', '#browse', function() {
  return openFolder();
});

$(document).on('click', '.donate > a', function(e) {
  e.preventDefault();
  return open('https://salt.bountysource.com/teams/championify');
});

$(document).on('click', '.github > a', function(e) {
  e.preventDefault();
  return open('https://github.com/dustinblackman/Championify#championify');
});

$(document).on('click', '.championify_version > span', function(e) {
  e.preventDefault();
  return open('https://github.com/dustinblackman/Championify/blob/master/CHANGELOG.md');
});

let log_uploaded = false;

$(document).on('click', '#upload_log', function(e) {
  e.preventDefault();
  if (!log_uploaded) {
    uploadLog();
  }
  return log_uploaded = true;
});

$(document).on('click', '#open_log', function(e) {
  return open(path.join(preferences.directory(), 'championify.log.txt'));
});

$(document).on('click', '#import_btn', function() {
  return importItemSets(viewManager.complete);
});

$(document).on('click', '#delete_btn', function() {
  return deleteItemSets();
});

$(document).on('input', '#install_path', function() {
  return pathManager.checkInstallPath($(this).val(), pathManager.setInstallPath);
});

$(document).on('click', '.sys_button.minimize', function(e) {
  e.preventDefault();
  return remote.getCurrentWindow().minimize();
});

$(document).on('click', '.sys_button.close', function(e) {
  e.preventDefault();
  return app.quit();
});

$(document).on('click', '#start_league', function() {
  return startLeague();
});

$(document).on('click', '#back_to_main', function() {
  return viewManager.mainBack();
});

$(document).on('click', '#release_button', function() {
  return open('https://github.com/dustinblackman/Championify/releases/latest');
});


/**
* Execute ASAP after view load
 */

viewManager.init(function() {
  return updateManager.check(function(version, major) {
    if (version && optionsParser.update()) {
      if (process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
        runas(process.execPath, ['--startAsAdmin'], {
          hide: false,
          admin: true
        });
      } else {
        return EndSession(new cErrors.UpdateError('Can\'t auto update, please redownload'));
      }
    } else if (version && major) {
      updateManager.majorUpdate(version);
    } else if (version) {
      updateManager.minorUpdate(version);
    } else {
      executeOptionParameters();
    }
  });
});
