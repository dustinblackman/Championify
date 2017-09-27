import Promise from 'bluebird';
import { remote } from 'electron';
import R from 'ramda';
import $ from './jquery';

import ChampionifyErrors from '../errors';
import Log from '../logger';
import store from '../store';
import T from '../translate';
import viewManager from '../view_manager';

// Export methods defined in request.js
export * from './request';

const prebuilts = require('../../data/prebuilts.json');

// Windows Specific Dependencies
let runas;
if (process.platform === 'win32') runas = require('runas');

/**
 * Function if error exists, enable error view and log error ending the session.
 * @param {Object} Error instance
 */

export function EndSession(c_error) {
  Log.error(c_error);
  window.error_message = c_error.message || c_error.rootCause.message;
  viewManager.error();
  return false;
}

/**
 * Re-executes Championify with elevated privileges, closing the current process if successful. Throws an error if user declines. Only works on Windows.
 * @param {Array} Command line parameters
 * @returns {Promise.Boolean|ChampionifyErrors.ElevateError}
 */
export function elevate(params = []) {
  if (!runas) return Promise.reject(new Error('runas does not work on non windows systems'));

  return new Promise((resolve, reject) => {
    const browser_window = remote.getCurrentWindow();
    browser_window.hide();

    const code = runas(process.execPath, ['--runned-as-admin'].concat(params), {
      hide: false,
      admin: true
    });

    if (code !== 0) {
      browser_window.show();
      if (code === -1) return reject(new ChampionifyErrors.ElevateError('User refused to elevate permissions'));
      return reject(new ChampionifyErrors.ElevateError(`runas returned with exit code ${code}`));
    }
    remote.app.quit();
  });
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
 * Capitalizes first letter of string
 * @param {String} String
 */
export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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

/**
 * Converts an array of skills to a shortanded representation
 * @param {Array} Array of skills (as letters)
 * @returns String Shorthand representation
 */
export function shorthandSkills(skills) {
  let skill_count = R.countBy(R.toLower, R.slice(0, 9, skills));
  delete skill_count.r;
  skill_count = R.invertObj(skill_count);
  const counts = R.keys(skill_count).sort().reverse();

  const skill_order = R.map(count_num => R.toUpper(skill_count[count_num]), counts);
  return `${skills.slice(0, 4).join('.')} - ${R.join('>', skill_order)}`;
}

/**
 * Converts an array of IDs to item blocks with the correct counts
 * @param {Array} Array of ids
 * @returns Array of block item
 */
export function arrayToBuilds(ids) {
  ids = R.map(id => {
    id = id.toString();
    if (id === '2010') id = '2003'; // Biscuits
    return id;
  }, ids);
  const counts = R.countBy(R.identity)(ids);
  return R.map(id => ({
    id,
    count: counts[id]
  }), R.uniq(ids));
}
