import async from 'async';
import fs from 'fs-extra';
import glob from 'glob';
import mkdirp from 'mkdirp';
import path from 'path';
import _ from 'lodash';

import { cl, EndSession, request, spliceVersion, updateProgressBar } from './helpers';

import cErrors from './errors';
import champgg from './sources/championgg';
import Log from './logger';
import lolflavor from './sources/lolflavor';
import optionsParser from './options_parser';
import preferences from './preferences';
import permissions from './permissions';
import T from './translate';


// Windows Specific Dependencies
let runas;
if (process.platform === 'win32') runas = require('runas');

// Set defaults
window.cSettings = {};

/*
 * Function Saves options from the frontend.
 * @callback {Function} Callback.
*/
function saveSettings(next) {
  preferences.save(next);
}

/*
 * Function Gets the latest Riot Version.
 * @callback {Function} Callback.
*/
function getRiotVer(next, r) {
  if (r) cl(`${T.t('lol_version')}`);
  request('https://ddragon.leagueoflegends.com/realms/na.json', (err, body) => {
    if (err) return next(new cErrors.RequestError('Can\'t get Riot Version').causedBy(err));

    next(null, body.v);
  });
}

/*
 * Function Downloads all available champs from Riot.
 * @callback {Function} Callback.
*/
function getChamps(step, r) {
  cl(`${T.t('downloading_champs')}`);
  request(`http://ddragon.leagueoflegends.com/cdn/${r.riotVer}/data/${T.riotLocale()}/champion.json`, (err, body) => {
    if (err && !body.data) return step(new cErrors.RequestError('Can\'t get Champs').causedBy(err));
    if (!body.data) return step(new cErrors.RequestError('Can\'t get Champs'));

    // Save translated champ names
    const translated_champs = _.mapValues(body.data, data => data.name);
    T.merge(translated_champs);

    step(null, body.data);
  });
}

/*
 * Function Returns array of champs
 * @callback {Function} Callback.
*/
function champNames(next, r) {
  next(null, _.keys(r.champs_json));
}

/**
 * Function Generate manaless champs array
 * @callback {Function} Callback.
 */

function genManaless(next, r) {
  let manaless = _.map(r.champs_json, function(champ_obj) {
    if (champ_obj.partype !== 'Mana') {
      return champ_obj.id;
    }
  });
  return next(null, _.compact(manaless));
}


/**
 * Function Deletes all previous Championify builds from client.
 * @callback {Function} Callback.
 */

function deleteOldBuilds(step, r, deletebtn) {
  if (window.cSettings.dontdeleteold && !deletebtn) {
    return step();
  }
  cl(T.t('deleting_old_builds'));
  let globbed = [glob.sync(window.item_set_path + '**/CGG_*.json'), glob.sync(window.item_set_path + '**/CIFY_*.json')];
  return async.each(_.flatten(globbed), function(item, next) {
    return fs.unlink(item, function(err) {
      if (err) {
        return next(new cErrors.FileWriteError("Can\'t unlink file: " + item).causedBy(err));
      }
      return next(null);
    });
  }, function() {
    if (!deletebtn) {
      updateProgressBar(2.5);
    }
    return step(null);
  });
}


/**
 * Function Saves all compiled item sets to file, creating paths included.
 * @callback {Function} Callback.
 */

function saveToFile(step, r) {
  let champData = _.merge(_.clone(r.srItemSets, true), r.aramItemSets);
  return async.each(_.keys(champData), function(champ, next) {
    return async.each(_.keys(champData[champ]), function(position, nextPosition) {
      let toFileData = JSON.stringify(champData[champ][position], null, 4);
      let folder_path = path.join(window.item_set_path, champ, 'Recommended');
      return mkdirp(folder_path, function(err) {
        if (err) {
          Log.warn(err);
        }
        let file_path = path.join(window.item_set_path, champ, 'Recommended/CIFY_' + champ + '_' + position + '.json');
        return fs.writeFile(file_path, toFileData, function(err) {
          if (err) {
            return nextPosition(new cErrors.FileWriteError('Failed to write item set json file').causedBy(err));
          }
          return nextPosition(null);
        });
      });
    }, function(err) {
      if (err) {
        return next(err);
      }
      return next(null);
    });
  }, function(err) {
    if (err) {
      return step(err);
    }
    return step(null);
  });
}


/**
 * Function Resave preferences with new local version
 */

function resavePreferences(step, r) {
  let prefs = preferences.get();
  prefs.local_is_version = spliceVersion(r.riotVer);
  return preferences.save(prefs, step);
}


/**
 * Function Set windows permissions if required
 */

function setWindowsPermissions(step, r) {
  if (process.platform === 'win32' && optionsParser.runnedAsAdmin()) {
    cl(T.t('resetting_file_permission'));
    let champ_files = glob.sync(path.join(window.item_set_path, '**'));
    permissions.setWindowsPermissions(champ_files, step);
  } else {
    step();
  }
}


/**
 * Function Main function that starts up all the magic.
 * @callback {Function} Callback.
 */

function downloadItemSets(done) {
  window.importing = true;
  window.cSettings = preferences.get().options;
  window.undefinedBuilds = [];

  const async_tasks = {
    settings: saveSettings,
    championTest: ['settings', permissions.championTest],
    riotVer: ['championTest', getRiotVer],
    champs_json: ['riotVer', getChamps],
    champs: ['champs_json', champNames],
    manaless: ['champs_json', genManaless],
    deleteOldBuilds: ['srItemSets', deleteOldBuilds],
    saveBuilds: ['deleteOldBuilds', saveToFile],
    resavePreferences: ['saveBuilds', resavePreferences],
    setPermissions: ['saveBuilds', setWindowsPermissions]
  };
  if (window.cSettings.aram) {
    async_tasks['aramItemSets'] = ['riotVer', 'manaless', lolflavor.aram];
    async_tasks.deleteOldBuilds.unshift('aramItemSets');
  }
  if (window.cSettings.sr_source === 'lolflavor') {
    async_tasks['srItemSets'] = ['riotVer', 'manaless', lolflavor.sr];
  } else {
    async_tasks['champggVer'] = ['championTest', champgg.version];
    async_tasks['srItemSets'] = ['champs', 'champggVer', 'manaless', champgg.sr];
  }
  updateProgressBar(true);
  return async.auto(async_tasks, function(err) {
    window.importing = false;
    if (err instanceof cErrors.FileWriteError && process.platform === 'win32' && !optionsParser.runnedAsAdmin()) {
      Log.error(err);
      return runas(process.execPath, ['--startAsAdmin', '--import'], {
        hide: false,
        admin: true
      });
    }
    if (err) {
      return EndSession(err);
    }
    updateProgressBar(10);
    return done();
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
