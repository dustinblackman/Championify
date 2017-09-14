import Promise from 'bluebird';
import glob from 'glob';
import path from 'path';
import R from 'ramda';
import $ from './helpers/jquery';

import { cl, elevate, request, spliceVersion } from './helpers';

import ChampionifyErrors from './errors';
import Log from './logger';
import optionsParser from './options_parser';
import preferences from './preferences';
import permissions from './permissions';
import progressbar from './progressbar';
import store from './store';
import sources from './sources';
import T from './translate';

const fs = Promise.promisifyAll(require('fs-extra'));


/**
 * Saves settings/options from the frontend.
 * @returns {Promise}
*/
function saveSettings() {
  return preferences.save();
}

/**
 * Gets the latest Riot Version.
 * @returns {Promise.<String| ChampionifyErrors.RequestError>} Riot version.
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

/**
 * Downloads all available champs from Riot.
 * @returns {Promise.<Array|ChampionifyErrors.RequestError>} Array of Champions in Riot's data schema.
*/
function getChamps() {
  cl(`${T.t('downloading_champs')}`);
  const params = {
    url: `http://ddragon.leagueoflegends.com/cdn/${store.get('riot_ver')}/data/${T.riotLocale()}/champion.json`,
    json: true
  };

  return request(params)
    .then(R.prop('data'))
    .tap(data => {
      if (!data) throw new ChampionifyErrors.RequestError('Can\'t get Champs');
      let translations = R.zipObj(R.keys(data), R.pluck('name')(R.values(data)));
      translations = R.zipObj(R.map(key => key.toLowerCase().replace(/ /g, ''), R.keys(translations)), R.values(translations));
      translations.wukong = translations.monkeyking;
      T.merge(translations);

      const champ_ids = R.fromPairs(R.map(champ_data => {
        return [champ_data.id.toLowerCase(), champ_data.key];
      }, R.values(data)));
      store.set('champs', R.keys(data).sort());
      store.set('champ_ids', champ_ids);
    })
    .catch(err => {
      if (err instanceof ChampionifyErrors.ChampionifyError) throw err;
      throw new ChampionifyErrors.RequestError('Can\'t get Champs').causedBy(err);
    });
}

// TODO: Write tests and docs
function getSpecialItems() {
  if (store.get('special_items')) return Promise.resolve(store.get('special_items'));
  const params = {
    url: `http://ddragon.leagueoflegends.com/cdn/${store.get('riot_ver')}/data/en_US/item.json`,
    json: true
  };

  return request(params)
    .then(R.prop('data'))
    .then(items => {
      return R.keys(items).map(id => {
        const data = items[id];
        if (data.specialRecipe) return [id, String(data.specialRecipe)];
        if (data.requiredAlly) return [id, data.from[0]];
      });
    })
    .filter(R.identity)
    .then(R.fromPairs)
    .tap(items => store.set('special_items', items));
}

/**
 * Deletes all previous Championify builds from client.
 * @param {Boolean} [false]
 * @returns {Promise}
 */

function deleteOldBuilds(deletebtn) {
  if (store.get('settings') && store.get('settings').dontdeleteold) return Promise.resolve();

  cl(T.t('deleting_old_builds'));
  const globbed = [
    glob.sync(`${store.get('itemset_path')}**/CGG_*.json`),
    glob.sync(`${store.get('itemset_path')}**/CIFY_*.json`)
  ];

  return Promise.resolve(R.flatten(globbed))
    .each(f => fs.unlinkAsync(f))
    .catch(err => Log.warn(err))
    .then(() => {
      if (deletebtn !== true) progressbar.incr(2.5);
    });
}


/**
 * Fixes common issues between sources generated item sets, then saves all compiled item sets to file, creating paths included.
 * @returns {Promise}
 */

function fixAndSaveToFile() {
  const special_items = store.get('special_items');

  return Promise.resolve([store.get('sr_itemsets'), store.get('aram_itemsets')])
    .then(R.flatten)
    .then(R.reject(R.isNil))
    .each(data => {
      const champ = data.champ.toLowerCase() === 'wukong' ? 'monkeyking' : data.champ;

      // Replaces special items that are not available in store. (e.g. Ornn items)
      data.riot_json.blocks.map(block => {
        block.items = block.items.map(item => {
          if (special_items[item.id]) item.id = special_items[item.id];
          return item;
        });
        return block;
      });

      const itemset_data = JSON.stringify(data.riot_json, null, 4);
      const folder_path = path.join(store.get('itemset_path'), champ, 'Recommended');
      const file_path = path.join(folder_path, `CIFY_${champ}_${data.source}_${data.file_prefix}.json`);

      return fs.mkdirsAsync(folder_path)
        .catch(err => Log.warn(err))
        .then(() => fs.writeFileAsync(file_path, itemset_data, 'utf8'))
        .catch(err => {
          throw new ChampionifyErrors.FileWriteError('Failed to write item set json file').causedBy(err);
        });
    });
}

/**
 * Resave preferences with new local version
 * @returns {Promise}
 */

function resavePreferences() {
  const prefs = preferences.get();
  prefs.local_is_version = spliceVersion(store.get('riot_ver'));
  return preferences.save(prefs);
}


/**
 * Set windows permissions if required
 * @returns {Promise}
 */

function setWindowsPermissions() {
  if (process.platform === 'win32' && optionsParser.runnedAsAdmin()) {
    cl(T.t('resetting_file_permission'));
    const champ_files = glob.sync(path.join(store.get('itemset_path'), '**'));
    return permissions.setWindowsPermissions(champ_files);
  }
}

/**
 * Verifies requires settings in order to importer.
 * @returns {Boolean}
 */

function verifySettings() {
  store.set('settings', preferences.get().options);
  if (!R.filter(R.identity, store.get('settings').sr_source).length) {
    $('.rift_source').transition('jiggle');
    return false;
  }

  return true;
}


/**
 * Main function that starts up all the magic.
 * @returns {Promise}
 */

function downloadItemSets() {
  store.set('importing', true);
  store.remove('sr_itemsets');
  store.remove('aram_itemsets');
  store.remove('undefined_builds');
  progressbar.reset();

  const to_process = [];
  if (store.get('settings').aram) to_process.push({
    name: 'lolflavor',
    method: sources.lolflavor.getAram
  });
  R.forEach(source => {
    if (sources[source]) to_process.push({
      name: source,
      method: sources[source].getSr
    });
  }, store.get('settings').sr_source);

  Log.info(`Locale: ${T.locale}`);

  return saveSettings()
    .then(permissions.championTest)
    .then(getRiotVer)
    .then(getChamps)
    .then(getSpecialItems)
    .then(() => Promise.all(R.map(source => {
      return source.method()
        .catch(err => {
          Log.error(err);
          store.push('undefined_builds', {
            champ: 'All',
            position: 'All',
            source: source.name
          });

          return;
        });
    }, to_process)))
    .then(deleteOldBuilds)
    .then(fixAndSaveToFile)
    .then(resavePreferences)
    .then(setWindowsPermissions)
    .then(() => {
      store.set('importing', false);
      progressbar.incr(100);
      return true;
    })
    .catch(err => {
      if (err instanceof ChampionifyErrors.FileWriteError && process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
        Log.error(err);
        return elevate(['--import']);
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
  getVersion: getRiotVer,
  getSpecialItems,
  verifySettings
};
