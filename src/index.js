// Electron
import remote from 'remote';

import { exec } from 'child_process';
import fs from 'fs';
import open from 'open';
import path from 'path';
import $ from './js/helpers/jquery';

import championify from './js/championify';
import ChampionifyErrors from './js/errors';
import { EndSession } from './js/helpers';
import Log from './js/logger';
import optionsParser from './js/options_parser';
import preferences from './js/preferences';
import pathManager from './js/path_manager';
import pkg from './package.json';
import store from './js/store_manager';
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

Log.info('Version: ' + pkg.version);


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

// TODO: rewrite
function importItemSets(done) {
  if (!store.get('lol_install_path')) {
    selectFolderWarning();
  } else {
    $('#btns_versions').addClass('hidden');
    $('.status').transition('fade up', '500ms');
    championify.run()
      .then(() => done())
      .catch(err => EndSession(err));
  }
}


/**
 * Function Checks and deletes item sets
 */

function deleteItemSets() {
  if (!store.get('lol_install_path')) {
    selectFolderWarning();
  } else {
    championify['delete'](true).then(() => $('#cl_progress > span').append(`. ${T.t('done')}`));
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
}


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
    exec('open -n "' + store.get('lol_install_path') + '"');
    exit();
  } else {
    if (store.get('lol_executable')) {
      exec('"' + path.join(store.get('lol_install_path'), store.get('lol_executable')) + '"');
      exit();
    } else {
      Log.error('League of legends executable is not defined. ' + store.get('lol_executable'));
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
        return EndSession(new ChampionifyErrors.UpdateError('Can\'t auto update, please redownload'));
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
