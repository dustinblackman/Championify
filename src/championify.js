import Promise from 'bluebird';
import glob from 'glob';
import path from 'path';
import R from 'ramda';

import { cl, request, spliceVersion, updateProgressBar } from './helpers';

import ChampionifyErrors from './errors';
import champgg from './sources/championgg';
import Log from './logger';
import lolflavor from './sources/lolflavor';
import optionsParser from './options_parser';
import preferences from './preferences';
import permissions from './permissions';
import store from './store_manager';
import T from './translate';

const fs = Promise.promisifyAll(require('fs-extra'));

// Windows Specific Dependencies
let runas;
if (process.platform === 'win32') runas = require('runas');

/*
 * Function Saves options from the frontend.
 * @callback {Function} Callback.
*/
function saveSettings() {
  return preferences.save();
}

/*
 * Function Gets the latest Riot Version.
 * @callback {Function} Callback.
*/
function getRiotVer() {
  if (store.get('importing')) cl(`${T.t('lol_version')}`);
  return request({url: 'https://ddragon.leagueoflegends.com/realms/na.json', json: true})
    .then(R.prop('v'))
    .tap(version => store.set('riot_ver', version))
    .catch(err => {
      throw new ChampionifyErrors.RequestError('Can\'t get Riot Version').causedBy(err);
    });
}

/*
 * Function Downloads all available champs from Riot.
 * @callback {Function} Callback.
*/
function getChamps(step, r) {
  cl(`${T.t('downloading_champs')}`);
  const params = {
    url: `http://ddragon.leagueoflegends.com/cdn/${store.get('riot_ver')}/data/${T.riotLocale()}/champion.json`,
    json: true
  };

  return request(params)
    .then(R.prop('data'))
    .tap(data => {
      if (!data) throw new ChampionifyErrors.RequestError('Can\'t get Champs');
      T.merge(R.zipObj(R.keys(data), R.pluck('name')(R.values(data))));

      store.set('manaless', R.pluck('id')(R.filter(champ => champ.partype !== 'Mana')));
      store.set('champs', R.keys(data).sort());
    })
    .catch(err => {
      if (err instanceof ChampionifyErrors.ChampionifyError) throw err;
      new ChampionifyErrors.RequestError('Can\'t get Champs').causedBy(err);
    })
    .asCallback(step);
}

/**
 * Function Deletes all previous Championify builds from client.
 * @callback {Function} Callback.
 */

function deleteOldBuilds(deletebtn) {
  if (store.get('settings') && store.get('settings').dontdeleteold || deletebtn !== true) return Promise.resolve();

  cl(T.t('deleting_old_builds'));
  const globbed = [
    glob.sync(`${store.get('itemset_path')}**/CGG_*.json`),
    glob.sync(`${store.get('itemset_path')}**/CIFY_*.json`)
  ];

  return Promise.resolve(R.flatten(globbed))
    .each(f => fs.unlinkAsync(f))
    .catch(err => Log.warn(err))
    .then(() => {
      if (!deletebtn) updateProgressBar(2.5);
    });
}


/**
 * Function Saves all compiled item sets to file, creating paths included.
 * @callback {Function} Callback.
 */

function saveToFile() {
  return Promise.resolve([store.get('sr_itemsets'), store.get('aram_itemsets')])
    .then(R.flatten)
    .then(R.reject(R.isNil))
    .each(data => {
      const itemset_data = JSON.stringify(data.riot_json, null, 4);
      const folder_path = path.join(store.get('itemset_path'), data.champ, 'Recommended');
      const file_path = path.join(folder_path, `CIFY_${data.champ}_${data.file_prefix}.json`);

      return fs.mkdirsAsync(folder_path)
        .catch(err => Log.warn(err))
        .then(() => fs.writeFileAsync(file_path, itemset_data, 'utf8'))
        .catch(err => {
          throw new ChampionifyErrors.FileWriteError('Failed to write item set json file').causedBy(err);
        });
    });
}

/**
 * Function Resave preferences with new local version
 */

function resavePreferences() {
  const prefs = preferences.get();
  prefs.local_is_version = spliceVersion(store.get('riot_ver'));
  return preferences.save(prefs);
}


/**
 * Function Set windows permissions if required
 */

function setWindowsPermissions() {
  if (process.platform === 'win32' && optionsParser.runnedAsAdmin()) {
    cl(T.t('resetting_file_permission'));
    const champ_files = glob.sync(path.join(store.get('itemset_path'), '**'));
    return permissions.setWindowsPermissions(champ_files);
  }
}


/**
 * Function Main function that starts up all the magic.
 * @callback {Function} Callback.
 */

function downloadItemSets() {
  store.set('importing', true);
  store.set('settings', preferences.get().options);

  updateProgressBar(true);

  const toProcess = [];
  if (store.get('settings').aram) toProcess.push(lolflavor.aram);
  if (store.get('settings').sr_source === 'lolflavor') {
    toProcess.push(lolflavor.sr);
  } else {
    toProcess.push(champgg.sr);
  }

  return saveSettings()
    .then(permissions.championTest)
    .then(getRiotVer)
    .then(getChamps)
    .then(() => Promise.all(R.map(fn => fn(), toProcess)))
    .then(deleteOldBuilds)
    .then(saveToFile)
    .then(resavePreferences)
    .then(setWindowsPermissions)
    .then(() => {
      store.set('importing', false);
      updateProgressBar(10);
    })
    .catch(err => {
      Log.error(err);
      if (err instanceof ChampionifyErrors.FileWriteError && process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
        return runas(process.execPath, ['--startAsAdmin', '--import'], {
          hide: false,
          admin: true
        });
      }

      // If not a file write error, end session.
      throw err;
    });
}

/**
 * Export.
 */
export default {
  run: downloadItemSets,
  delete: deleteOldBuilds,
  version: getRiotVer
};
