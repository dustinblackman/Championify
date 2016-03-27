import async from 'async';
import _ from 'lodash';

import { cl, request, spliceVersion, trinksCon, updateProgressBar } from '../helpers';
import Log from '../logger';
import T from '../translate';


/**
 * Function Request json from available champs
 * @param {String} Type of process (ARAM, Jungle, Support, Lane)
 * @param {String} Name of stats file
 * @callback {Function} Callback.
 */

function _requestAvailableChamps(process_name, stats_file, done) {
  return request('http://www.lolflavor.com/data/' + stats_file, function(err, body) {
    if (err || !body.champions) {
      Log.warn(err);
      window.undefinedBuilds.push({
        champ: T.t(process_name),
        position: 'All'
      });
      return done(null, []);
    }
    let champs = _.map(body.champions, function(item) {
      return item.name;
    });
    champs.sort();
    return done(null, champs);
  });
}


/**
 * Function Request ARAM item sets from lolflavor.
 * @callback {Function} Callback.
 * @param {Object} Async Auto Object
 */

function _requestData(champs_names, process_name, riotVer, manaless, step) {
  const champs = {};
  const title_translations = {
    core_items: (T.t('core_items', true)) + " - " + (T.t('max_skill', true)) + ": ",
    'Consumable': T.t('consumables', true),
    'Starter': T.t('starter', true),
    'Core Alternatives - Endgame Items ': (T.t('core_alternatives', true)) + " - " + (T.t('endgame_items', true)),
    'Boots': T.t('boots', true),
    'Situational Items': T.t('situational_items', true),
    'Elixir': T.t('elixir', true),
    'Upgrade Ultimate': T.t('upgrade_ultimate', true)
  };
  async.eachLimit(champs_names, 3, function(champ, next) {
    cl((T.t('processing')) + " " + (T.t(process_name)) + ": " + (T.t(champ.replace(/ /g, ''))));
    const url = "http://www.lolflavor.com/champions/" + champ + "/Recommended/" + champ + "_" + (process_name.toLowerCase()) + "_scrape.json";
    return request(url, function(err, data) {
      if (err || !data.blocks) {
        Log.warn(err);
        window.undefinedBuilds.push({
          champ: champ,
          position: process_name
        });
        return next(null);
      }
      data.blocks = _.map(data.blocks, function(block) {
        if (_.contains(block.type, 'Core Items')) {
          block.type = title_translations.core_items + block.type.split(': ')[1];
        } else if (title_translations[block.type]) {
          block.type = title_translations[block.type];
        } else {
          Log.warn("Lolflavor: '" + block.type + "' does not exist in preset translations for " + champ);
        }

        return block;
      });
      if (process_name === 'ARAM') {
        data.map = 'HA';
        data.blocks[0].items.push({
          count: 1,
          id: '2047'
        });
      }
      if (process_name !== 'ARAM') {
        if (window.cSettings.locksr) {
          data.map = 'SR';
        }
        data.blocks.shift();
        data.blocks = trinksCon(data.blocks, champ, manaless);
      }
      data.title = T.t(process_name.toLowerCase(), true) + ' ' + riotVer;
      champs[champ] = {};
      champs[champ][process_name.toLowerCase()] = data;
      if (process_name !== 'ARAM') {
        updateProgressBar(30 / champs_names.length);
      }
      return next(null);
    });
  }, function(err) {
    if (err) {
      return step(err);
    }
    return step(null, champs);
  });
}


/**
 * Function Handle processing lolflavor
 * @param {String} Name of process (ARAM, Jungle, ect)
 * @param {String} Name of .json file on lolflavor
 * @param {String} Riot version
 * @param {Array} Manaless champs
 * @callback {Function} Callback.
 */

function _processLolflavor(process_name, stats_file, riotVer, manaless, step) {
  Log.info("Downloading " + process_name + " Champs");
  riotVer = spliceVersion(riotVer);
  return _requestAvailableChamps(process_name, stats_file, function(err, champ_names) {
    if (err) {
      return step(err);
    }
    return _requestData(champ_names, process_name, riotVer, manaless, step);
  });
}


/**
 * Function Helper to request item sets for aram
 * @callback {Function} Callback.
 */

function aram(step, r) {
  return _processLolflavor('ARAM', 'statsARAM.json', r.riotVer, r.manaless, step);
}


/**
 * Function Helper to request item sets for summoners rift
 * @callback {Function} Callback.
 */

function summonersRift(step, r) {
  async.series({
    lane: function(next) {
      return _processLolflavor('Lane', 'statsLane.json', r.riotVer, r.manaless, next);
    },
    jungle: function(next) {
      return _processLolflavor('Jungle', 'statsJungle.json', r.riotVer, r.manaless, next);
    },
    support: function(next) {
      return _processLolflavor('Support', 'statsSupport.json', r.riotVer, r.manaless, next);
    }
  }, function(err, results) {
    var champs;
    if (err) {
      return step(err);
    }
    champs = _.merge(results.lane, results.jungle, results.support);
    return step(null, champs);
  });
}


/**
 * Function Get current Lolflavor version
 * @callback {Function} Callback.
 */

function getVersion(step) {
  return request('http://www.lolflavor.com/champions/Ahri/Recommended/Ahri_lane_scrape.json', function(err, body) {
    var body_title, version;
    if (err) {
      return step(null, T.t('unknown'));
    }
    body_title = body != null ? body.title : void 0;
    if (!body_title) {
      return step(null, T.t('unknown'));
    }
    version = body_title.split(' ')[3];
    return step(null, version);
  });
}


/**
 * Export
 */

export default {
  aram: aram,
  sr: summonersRift,
  version: getVersion
};
