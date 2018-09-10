import Promise from 'bluebird';
import path from 'path';
import R from 'ramda';
import semver from 'semver';
import $ from './helpers/jquery';

import ChampionifyErrors from './errors';
import Log from './logger';
import pathManager from './path_manager';
import store from './store';
import T from './translate';

const fs = Promise.promisifyAll(require('fs-extra'));
const pkg = require('../package.json');


class Preferences {
  /**
   * Get preference directory
   * @returns {String} Preference directory path
   */

  directory() {
    let preference_dir;
    if (process.platform === 'darwin') {
      preference_dir = path.join(process.env.HOME, 'Library/Application Support/Championify/');
    } else {
      preference_dir = path.join(process.env.APPDATA, 'Championify');
    }
    return preference_dir;
  }

  /**
   * Get preference file path
   * @returns {String} Preference file path
   */

  file() {
    return path.join(this.directory(), 'prefs.json');
  }

  /**
   * Gets preferences file
   * @returns {String|Null} JSON object of preferences, or null
   */

  load() {
    const preference_file = this.file();
    if (fs.existsSync(preference_file)) {
      let prefs = {};
      const rawprefs = fs.readFileSync(preference_file);
      try {
        prefs = JSON.parse(rawprefs);
      } catch (err) {
        Log.warn('Unable to parse preferences');
        Log.warn(rawprefs);
        Log.warn(err);
      }

      if (!prefs.prefs_version || semver.lt(prefs.prefs_version, '1.3.3')) return null;
      return prefs;
    }

    return null;
  }

  /**
   * Applies preferences to UI
   * @param {Object} Preferences object
   */

  set(preferences) {
    if (!preferences) return pathManager.findInstallPath();

    $('#local_version').text(preferences.local_is_version || T.t('unknown'));
    pathManager.checkInstallPath(preferences.install_path, function(err) {
      if (err) {
        pathManager.findInstallPath();
      } else {
        pathManager.checkInstallPath(preferences.install_path, pathManager.setInstallPath);
      }
    });

    // There's a better ramda function for this somewhere...
    R.forEach(entry => {
      const key = entry[0];
      const val = entry[1];

      if (key.indexOf('position') > -1) {
        $(`#options_${key}`).find(`.${val}`).addClass('active selected');
      } else {
        $(`#options_${key}`).prop('checked', val);
      }
    }, R.toPairs(preferences.options));
  }

  /**
   * Gets all preferences from UI
   * @returns {Object} Preferences object
   */

  get() {
    const consumables_position = $('#options_consumables_position').find('.beginning').hasClass('selected') ? 'beginning' : 'end';
    const trinkets_position = $('#options_trinkets_position').find('.beginning').hasClass('selected') ? 'beginning' : 'end';
    return {
      prefs_version: pkg.version,
      locale: T.locale,
      install_path: store.get('lol_install_path'),
      champ_path: store.get('lol_champ_path'),
      local_is_version: $('#local_version').text(),
      options: {
        splititems: $('#options_splititems').is(':checked'),
        skillsformat: $('#options_skillsformat').is(':checked'),
        consumables: $('#options_consumables').is(':checked'),
        consumables_position: consumables_position,
        trinkets: $('#options_trinkets').is(':checked'),
        trinkets_position: trinkets_position,
        locksr: $('#options_locksr').is(':checked'),
        sr_source: $('#options_sr_source').val().split(','),
        dontdeleteold: $('#options_dontdeleteold').is(':checked'),
        aram: $('#options_aram').is(':checked'),
        aram_blitz_lolalytics: $('#options_aram_blitz_lolalytics').is(':checked')
      }
    };
  }

  /**
   * Saves preference file
   * @param {Object} [this.get()] Preferences object
   * @returns {Promise}
   */

  save(preferences) {
    preferences = preferences || this.get();
    if (!preferences) throw new ChampionifyErrors.OperationalError('Preferences object does not exist');
    const preference_file = this.file();
    fs.mkdirsSync(this.directory());
    return fs.writeFileAsync(preference_file, JSON.stringify(preferences, null, 2), 'utf8')
      .tap(() => Log.info(`Saved preference file to ${preference_file}`))
      .catch(err => Log.error(err));
  }
}

const prefs = new Preferences();
export default prefs;
