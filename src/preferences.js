import Promise from 'bluebird';
import path from 'path';
import R from 'ramda';
import $ from './helpers/jquery';

import ChampionifyErrors from './errors';
import Log from './logger';
import pathManager from './path_manager';
import sourceUIManager from './source_ui_manager';
import store from './store';
import T from './translate';

const fs = Promise.promisifyAll(require('fs-extra'));


class Preferences {
  /**
   * Function set preference directory
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
   * Function set preference file path
   */

  file() {
    return path.join(this.directory(), 'prefs.json');
  }

  /**
   * Function to loads and applies preference files
   */

  load() {
    const preference_file = this.file();
    if (fs.existsSync(preference_file)) return JSON.parse(fs.readFileSync(preference_file));
    return null;
  }

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

      if (key === 'sr_source' && val === 'lolflavor') {
        // TODO: This could be better somewhere else.
        sourceUIManager.lolflavor();
      } else if (key.indexOf('position') > -1) {
        $(`#options_${key}`).find(`.${val}`).addClass('active selected');
      } else {
        $(`#options_${key}`).prop('checked', val);
      }
    }, R.toPairs(preferences.options));
  }

  /**
   * Function gets preferences
   */

  get() {
    const consumables_position = $('#options_consumables_position').find('.beginning').hasClass('selected') ? 'beginning' : 'end';
    const trinkets_position = $('#options_trinkets_position').find('.beginning').hasClass('selected') ? 'beginning' : 'end';
    return {
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
        sr_source: $('#options_sr_source').val(),
        dontdeleteold: $('#options_dontdeleteold').is(':checked'),
        aram: $('#options_aram').is(':checked')
      }
    };
  }

  /**
   * Function to save preference file
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
