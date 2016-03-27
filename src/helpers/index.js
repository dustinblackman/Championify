import async from 'async';
import _request from 'request';
import remote from 'remote';
import $ from './jquery';
import _ from 'lodash';

import cErrors from '../errors';
import Log from '../logger';
import T from '../translate';
import viewManager from '../view_manager';

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
 * Function Preset ajax request.
 * @param {String} URL
 * @callback {Function} Callback
 */

export function request(url, done) {
  async.retry(3, function(step) {
    const options = {
      timeout: 10000,
      url: url
    };
    _request(options, function(err, res, body) {
      if (err) {
        return step(err);
      }
      if (res.statusCode === 404) {
        return step(new cErrors.RequestError(404, url));
      }
      if (res.headers && res.headers['content-type'] && res.headers['content-type'].indexOf('text/json') || _.contains(url, '.json')) {
        try {
          body = JSON.parse(body);
        } catch (_error) {
          // Do nothing
        }
      }
      return step(null, body);
    });
  }, function(err, results) {
    if (err) {
      return done(err);
    }
    return done(null, results);
  });
}

/**
 * Function Adds % to string.
 * @param {String} Text.
 * @returns {String} Formated String.
 */
export function wins(text) {
  return `${text}%`;
}

/**
 * Splice version number to two.
 * @param {String} Version number
 */
export function spliceVersion(version) {
  return version.split('.').splice(0, 2).join('.');
}

/**
 * Function Pretty console log, as well as updates the progress div on interface
 * @param {String} Console Message.
 */

export function cl(text, level = 'info') {
  Log[level](text);
  return $('#cl_progress').prepend(`<span>${text}</span><br />`);
}

// TODO Rewrite this to be a constructor instead.
export function incrUIProgressBar(id, incr) {
  let floored = Math.floor(incr);
  if (floored > 100) floored = 100;

  $(`#${id}`).attr('data-percent', floored);
  $(`#${id}`).find('.bar').css('width', `${floored}%`);
  return $(`#${id}`).find('.progress').text(`${floored}%`);
}

/**
 * Function Updates the progress bar on the interface.
 * @param {Number} Increment progress bar.
 */
let total_incr;
export function updateProgressBar(incr) {
  if (process.env.NODE_ENV === 'test') return;
  if (incr === true) total_incr = 0;

  total_incr += incr;
  incrUIProgressBar('itemsets_progress_bar', total_incr);
  if (total_incr >= 100) {
    remote.getCurrentWindow().setProgressBar(-1);
  } else {
    remote.getCurrentWindow().setProgressBar(total_incr / 100);
  }
}

/**
 * Function Reusable function for generating Trinkets and Consumables.
 * @param {Array} Array of blocks for item sets
 * @param {String} System name of champ
 * @param {Array} List of manaless champ names
 * @param {Object} Formatted skill priorities
 */
export function trinksCon(builds, champ, manaless, skills = {}) {
  if (window.cSettings.consumables) {
    let consumables = _.clone(prebuilts.consumables, true);
    if (_.contains(manaless, champ)) {
      consumables.splice(1, 1);
    }
    let consumables_title = T.t('consumables', true);
    if (skills.mostFreq) consumables_title += ` | ${T.t('frequent', true)}: ${skills.mostFreq}`;

    let consumables_block = {
      items: consumables,
      type: consumables_title
    };
    if (window.cSettings.consumables_position === 'beginning') {
      builds.unshift(consumables_block);
    } else {
      builds.push(consumables_block);
    }
  }

  if (window.cSettings.trinkets) {
    let trinkets_title = T.t('trinkets', true);
    if (skills.highestWin) trinkets_title += ` | ${T.t('wins', true)}: ${skills.highestWin}`;

    let trinkets_block = {
      items: prebuilts.trinketUpgrades,
      type: trinkets_title
    };
    if (window.cSettings.trinkets_position === 'beginning') {
      builds.unshift(trinkets_block);
    } else {
      builds.push(trinkets_block);
    }
  }
  return builds;
}
