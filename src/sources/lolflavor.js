import Promise from 'bluebird';
import moment from 'moment';
import R from 'ramda';

import ChampionifyErrors from '../errors';
import { cl, request, spliceVersion, trinksCon } from '../helpers';
import Log from '../logger';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate';


export const source_info = {
  name: 'Lolflavor',
  id: 'lolflavor'
};


/**
 * Request for from available champs
 * @param {String} Type of process (ARAM, Jungle, Support, Lane)
 * @param {String} Name of stats file.
 * @returns {Promise.<Array|ChampionifyErrors>} Array of strings containing Champion names
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
        source: source_info.name,
        champ: T.t(process_name),
        position: 'All'
      });
      return [];
    });
}


/**
 * Function Request ARAM item sets from lolflavor.
 * @param {String} Type of process (ARAM, Jungle, Support, Lane)
 * @param {String} Name of stats file.
 * @returns {Promise}
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
      cl(`${T.t('processing')} Lolflavor ${T.t(process_name)}: ${T.t(champ.replace(/ /g, ''))}`);

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
          riot_json.title = `LFV ${T.t(process_name.toLowerCase(), true)} ${spliceVersion(store.get('riot_ver'))}`;

          if (process_name === 'ARAM') {
            progressbar.incrChamp();
          } else {
            progressbar.incrChamp(5);
          }

          return {champ, file_prefix: process_name.toLowerCase(), riot_json, source: 'lolflavor'};
        })
        .catch(err => {
          Log.warn(err);
          store.push('undefined_builds', {
            source: source_info.name,
            champ,
            position: process_name
          });

          return null;
        });
    }, {concurrency: 3})
    .then(R.reject(R.isNil));
}


/**
 * Start process for grabbing data
 * @param {String} Name of process (ARAM, Jungle, ect)
 * @param {String} Name of .json file on lolflavor
 * @returns {Promise.<Array|ChampionifyErrors>} Array of objects with parsed item sets data.
 */

function _processLolflavor(process_name, stats_file) {
  Log.info(`Downloading ${process_name} Champs`);
  return _requestAvailableChamps(process_name, stats_file)
    .then(champs => _requestData(champs, process_name));
}


/**
 * Helper to request ARAM itemsets and saves them in the store.
* @returns {Promise}
 */

export function getAram() {
  return _processLolflavor('ARAM', 'statsARAM.json')
    .then(champs => store.set('aram_itemsets', champs));
}


/**
 * Helper to request Summoners Rift item sets and saves them in the store.
 * @returns {Promise}
 */

export function getSr() {
  const stats_pages = [
    {name: 'Top', file: 'statsTop.json'},
    {name: 'Mid', file: 'statsMid.json'},
    {name: 'ADC', file: 'statsADC.json'},
    {name: 'Jungle', file: 'statsJungle.json'},
    {name: 'Support', file: 'statsSupport.json'}
  ];

  return Promise.resolve(stats_pages)
    .map(data => _processLolflavor(data.name, data.file))
    .then(R.flatten)
    .then(data => store.push('sr_itemsets', data));
}


/**
 * Function Get current Lolflavor version
 * @returns {Promise.<String|Champion>} Lolflavor version
 */

export function getVersion() {
  return request({url: 'http://www.lolflavor.com/champions/Ahri/Recommended/Ahri_mid_scrape.json', json: true})
    .then(body => {
      if (!body || !body.title) return T.t('unknown');
      const version = moment(body.title.split(' ')[3]).format('YYYY-MM-DD');
      store.set('lolflavor_ver', version);
      return version;
    })
    .catch(err => {
      Log.warn(err);
      return T.t('unknown');
    });
}
