import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import path from 'path';
import _ from 'lodash';

import cErrors from './errors';
import pathManager from './path_manager';
import sourceUIManager from './source_ui_manager';

// TODO: rewrite all of this.

/**
 * Function to loads and applies preference files
 */

function load() {
  const preference_file = this.file();
  if (fs.existsSync(preference_file)) {
    return JSON.parse(fs.readFileSync(preference_file));
  }

  return null;
}

function set(preferences) {
  if (!preferences) {
    return pathManager.findInstallPath();
  }
  $('#local_version').text(preferences.local_is_version || T.t('unknown'));
  pathManager.checkInstallPath(preferences.install_path, function(err) {
    if (err) {
      pathManager.findInstallPath();
    } else {
      pathManager.checkInstallPath(preferences.install_path, pathManager.setInstallPath);
    }
  });

  _.each(preferences.options, function(val, key) {
    if (key === 'sr_source' && val === 'lolflavor') {
      sourceUIManager.lolflavor();
    } else if (_.contains(key, 'position')) {
      $('#options_' + key).find('.' + val).addClass('active selected');
    } else {
      $('#options_' + key).prop('checked', val);
    }
  });
}


/**
 * Function to save preference file
 */

function save(preferences, done) {
  if (_.isFunction(preferences)) {
    done = preferences;
    preferences = null;
  }
  preferences = preferences || get();
  if (!preferences) {
    return done(cErrors.OperationalError('Preferences object does not exist'));
  }
  const preference_file = preferenceFile();
  mkdirp(preferenceDir());
  return fs.writeFile(preference_file, JSON.stringify(preferences, null, 2), {
    encoding: 'utf8'
  }, function(err) {
    if (err) {
      Log.error(err);
    } else {
      Log.info('Saved preference file to ' + preference_file);
    }
    return done();
  });
}


/**
 * Function set preference directory
 */

function preferenceDir() {
  let preference_dir;
  if (process.platform === 'darwin') {
    preference_dir = path.join(process.env.HOME, 'Library/Application Support/Championify/');
  } else {
    preference_dir = path.join(process.env.APPDATA, 'Championify');
  }
  return preference_dir;
}


/**
 * Function set preference file path
 */

function preferenceFile() {
  return path.join(preferenceDir(), 'prefs.json');
}


/**
 * Function gets preferences
 */

function get() {
  const consumables_position = $('#options_consumables_position').find('.beginning').hasClass('selected') ? 'beginning' : 'end';
  const trinkets_position = $('#options_trinkets_position').find('.beginning').hasClass('selected') ? 'beginning' : 'end';
  return {
    locale: T.locale,
    install_path: window.lol_install_path,
    champ_path: window.lol_champ_path,
    local_is_version: $('#local_version').text(),
    options: {
      splititems: $('#options_splititems').is(':checked'),
      skillsformat: $('#options_skillsformat').is(':checked'),
      consumables: $('#options_consumables').is(':checked'),
      consumables_position: consumables_position,
      trinkets: $('#options_trinkets').is(':checked'),
      trinkets_position: trinkets_position,
      locksr: $('#options_locksr').is(':checked'),
      sr_source: $('#options_sr_source').val(),
      dontdeleteold: $('#options_dontdeleteold').is(':checked'),
      aram: $('#options_aram').is(':checked')
    }
  };
}

module.exports = {
  load: load,
  save: save,
  directory: preferenceDir,
  file: preferenceFile,
  get: get,
  set: set
};
