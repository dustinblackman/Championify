import Promise from 'bluebird';
import R from 'ramda';

import ChampionifyErrors from '../errors';
import { cl, request, spliceVersion, trinksCon, updateProgressBar } from '../helpers';
import Log from '../logger';
import store from '../store';
import T from '../translate';


/**
 * Function Request json from available champs
 * @param {String} Type of process (ARAM, Jungle, Support, Lane)
 * @param {String} Name of stats file
 * @callback {Function} Callback.
 */

function _requestAvailableChamps(process_name, stats_file) {
  return request({url: `http://www.lolflavor.com/data/${stats_file}`, json: true})
    .then(body => {
      if (!body.champions) throw new ChampionifyErrors.MissingData(`Lolflavor: ${process_name}`);
      return R.pluck('name')(body.champions).sort();
    })
    .catch(err => {
      Log.warn(err);
      store.push('undefined_builds', {
        champ: T.t(process_name),
        position: 'All'
      });
      return [];
    });
}


/**
 * Function Request ARAM item sets from lolflavor.
 * @callback {Function} Callback.
 * @param {Object} Async Auto Object
 */

function _requestData(champs_names, process_name) {
  const title_translations = {
    core_items: `${T.t('core_items', true)} - ${T.t('max_skill', true)}: `,
    Consumable: T.t('consumables', true),
    Starter: T.t('starter', true),
    'Core Alternatives - Endgame Items ': `${T.t('core_alternatives', true)} - ${T.t('endgame_items', true)}`,
    Boots: T.t('boots', true),
    'Situational Items': T.t('situational_items', true),
    Elixir: T.t('elixir', true),
    'Upgrade Ultimate': T.t('upgrade_ultimate', true)
  };

  return Promise.resolve(champs_names)
    .map(champ => {
      cl(`${T.t('processing')} ${T.t(process_name)}: ${T.t(champ.replace(/ /g, ''))}`);

      const params = {
        url: `http://www.lolflavor.com/champions/${champ}/Recommended/${champ}_${process_name.toLowerCase()}_scrape.json`,
        json: true
      };

      return request(params)
        .then(riot_json => {
          if (!riot_json.blocks) throw new ChampionifyErrors.MissingData(`Lolflavor: ${champ} ${process_name}`);

          riot_json.blocks = R.map(block => {
            if (block.type.indexOf('Core Items') > -1) {
              block.type = `${title_translations.core_items} ${block.type.split(': ')[1]}`;
            } else if (title_translations[block.type]) {
              block.type = title_translations[block.type];
            } else {
              Log.warn(`Lolflavor: '${block.type}' does not exist in preset translations for ${champ}`);
            }
            return block;
          }, riot_json.blocks);

          // If processing ARAM.
          if (process_name === 'ARAM') {
            // Oracles exlixir
            riot_json.blocks[0].items.push({count: 1, id: '2047'});
            riot_json.map = 'HA';
          }

          // If anything other then ARAM (SR, ect)
          if (process_name !== 'ARAM') {
            if (store.get('settings').locksr) riot_json.map = 'SR';
            riot_json.blocks.shift();
            riot_json.blocks = trinksCon(riot_json.blocks);
          }
          riot_json.title = `${T.t(process_name.toLowerCase(), true)} ${spliceVersion(store.get('riot_ver'))}`;

          if (process_name !== 'ARAM') updateProgressBar(30 / champs_names.length);
          return {champ, file_prefix: process_name.toLowerCase(), riot_json};
        })
        .catch(err => {
          Log.warn(err);
          store.push('undefined_builds', {
            champ,
            position: process_name
          });

          return null;
        });
    }, {concurrency: 3})
    .then(R.reject(R.isNil));
}


/**
 * Function Handle processing lolflavor
 * @param {String} Name of process (ARAM, Jungle, ect)
 * @param {String} Name of .json file on lolflavor
 * @param {String} Riot version
 * @param {Array} Manaless champs
 * @callback {Function} Callback.
 */

function _processLolflavor(process_name, stats_file) {
  Log.info(`Downloading ${process_name} Champs`);
  return _requestAvailableChamps(process_name, stats_file)
    .then(champs => _requestData(champs, process_name));
}


/**
 * Function Helper to request item sets for aram
 * @callback {Function} Callback.
 */

function aram() {
  return _processLolflavor('ARAM', 'statsARAM.json')
    .then(champs => store.set('aram_itemsets', champs));
}


/**
 * Function Helper to request item sets for summoners rift
 * @callback {Function} Callback.
 */

function summonersRift() {
  const stats_pages = [
    {name: 'Lane', file: 'statsLane.json'},
    {name: 'Jungle', file: 'statsJungle.json'},
    {name: 'Support', file: 'statsSupport.json'}
  ];

  return Promise.resolve(stats_pages)
    .map(data => _processLolflavor(data.name, data.file))
    .then(R.flatten)
    .then(data => store.set('sr_itemsets', data));
}


/**
 * Function Get current Lolflavor version
 * @callback {Function} Callback.
 */

function getVersion() {
  return request({url: 'http://www.lolflavor.com/champions/Ahri/Recommended/Ahri_lane_scrape.json', json: true})
    .then(body => {
      if (!body || !body.title) return T.t('unknown');
      return body.title.split(' ')[3];
    })
    .catch(err => {
      Log.warn(err);
      return T.t('unknown');
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
