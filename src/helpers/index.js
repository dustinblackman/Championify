import Promise from 'bluebird';
import R from 'ramda';
import retry from 'bluebird-retry';
import $ from './jquery';

import ChampionifyErrors from '../errors';
import Log from '../logger';
import store from '../store';
import T from '../translate';
import viewManager from '../view_manager';

const requester = Promise.promisify(require('request'));
const prebuilts = require('../../data/prebuilts.json');


/**
 * Function if error exists, enable error view and log error ending the session.
 * @param {Object} Error instance
 */

export function EndSession(c_error) {
  if (c_error) Log.error(c_error);

  window.error_message = c_error.message || c_error.rootCause.message;
  return viewManager.error();
}


/**
 * Makes request with retry and 404 handling
 * @param {Object/String} URL
 * @returns {Promise.<Object|ChampionifyErrors.RequestError>} Request body
 */

export function request(options) {
  let params = {timeout: 10000};
  if (R.is(String, options)) {
    params.url = options;
  } else {
    params = R.merge(params, options);
  }

  return retry(retry => {
    return requester(params)
      .tap(res => {
        if (res.statusCode >= 400) throw new ChampionifyErrors.RequestError(res.statusCode, options.url);
      })
      .then(R.prop('body'))
      .catch(retry);
  }, {max_tries: 3});
}

/**
 * Adds % to string.
 * @param {String} Text.
 * @returns {String} Formatted string with precentage.
 */
export function wins(text) {
  return `${text}%`;
}

/**
 * Splice version number to two.
 * @param {String} Version number
 * @returns {String} Two digit version number
 */
export function spliceVersion(version) {
  return version.split('.').splice(0, 2).join('.');
}

/**
 * Pretty console log, as well as updates the progress div on interface
 * @param {String} Console Message.
 * @param {String} [level='info'] Logging level
 */

export function cl(text, level = 'info') {
  Log[level](text);
  return $('#cl_progress').prepend(`<span>${text}</span><br />`);
}

/**
 * Reusable function for generating Trinkets and Consumables on build blocks.
 * @param {Array} Array of blocks for item sets
 * @param {Object} Formatted skill priorities
 * @returns Array of block item sets with added trinkets and consumables
 */

export function trinksCon(builds, skills = {}) {
  if (store.get('settings').consumables) {
    let consumables_title = T.t('consumables', true);
    if (skills.most_freq) consumables_title += ` | ${T.t('frequent', true)}: ${skills.most_freq}`;

    const consumables_block = {
      items: prebuilts.consumables,
      type: consumables_title
    };
    if (store.get('settings').consumables_position === 'beginning') {
      builds.unshift(consumables_block);
    } else {
      builds.push(consumables_block);
    }
  }

  if (store.get('settings').trinkets) {
    let trinkets_title = T.t('trinkets', true);
    if (skills.highest_win) trinkets_title += ` | ${T.t('wins', true)}: ${skills.highest_win}`;

    const trinkets_block = {
      items: prebuilts.trinket_upgrades,
      type: trinkets_title
    };
    if (store.get('settings').trinkets_position === 'beginning') {
      builds.unshift(trinkets_block);
    } else {
      builds.push(trinkets_block);
    }
  }
  return builds;
}

export function shorthandSkills(skills) {
  let skill_count = R.countBy(R.toLower)(R.slice(0, 9, skills));
  delete skill_count.r;
  skill_count = R.invertObj(skill_count);
  const counts = R.keys(skill_count).sort().reverse();

  const skill_order = R.map(count_num => R.toUpper(skill_count[count_num]), counts);
  return `${skills.slice(0, 4).join('.')} - ${R.join('>', skill_order)}`;
}
