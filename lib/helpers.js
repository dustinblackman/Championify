import async from 'async';
import remote from 'remote';
import request from 'request';
import _ from 'lodash';

import cErrors from './errors';
import T from './translate';

const prebuilts = require('../data/prebuilts.json');

module.exports = {

  /**
   * Function Preset ajax request.
   * @param {String} URL
   * @callback {Function} Callback
   */
  request: function(url, done) {
    async.retry(3, function(step) {
      const options = {
        timeout: 10000,
        url: url
      };
      request(options, function(err, res, body) {
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
  },

  /**
   * Function Adds % to string.
   * @param {String} Text.
   * @returns {String} Formated String.
   */
  wins: function(text) {
    return text + '%';
  },

  /**
   * Splice version number to two.
   * @param {String} Version number
   */
  spliceVersion: function(version) {
    return version.split('.').splice(0, 2).join('.');
  },

  /**
   * Function Pretty console log, as well as updates the progress div on interface
   * @param {String} Console Message.
   */
  cl: function(text, level) {
    if (level == null) {
      level = 'info';
    }
    Log[level](text);
    return $('#cl_progress').prepend('<span>' + text + '</span><br />');
  },

  /**
   * Function Updates the progress bar on the interface.
   * @param {Number} Increment progress bar.
   */
  updateProgressBar: function(incr) {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    if (!this.incr || incr === true) {
      this.incr = 0;
    }
    this.incr += incr;
    this.incrUIProgressBar('itemsets_progress_bar', this.incr);
    if (this.incr >= 100) {
      remote.getCurrentWindow().setProgressBar(-1);
    } else {
      remote.getCurrentWindow().setProgressBar(this.incr / 100);
    }
  },
  incrUIProgressBar: function(id, incr) {
    var floored;
    floored = Math.floor(incr);
    if (floored > 100) {
      floored = 100;
    }
    $('#' + id).attr('data-percent', floored);
    $('#' + id).find('.bar').css('width', floored + '%');
    return $('#' + id).find('.progress').text(floored + '%');
  },

  /**
   * Function Reusable function for generating Trinkets and Consumables.
   * @param {Array} Array of blocks for item sets
   * @param {String} System name of champ
   * @param {Array} List of manaless champ names
   * @param {Object} Formatted skill priorities
   */
  trinksCon: function(builds, champ, manaless, skills) {
    var consumables, consumables_block, consumables_title, trinkets_block, trinkets_title;
    if (skills == null) {
      skills = {};
    }
    if (window.cSettings.consumables) {
      consumables = _.clone(prebuilts.consumables, true);
      if (_.contains(manaless, champ)) {
        consumables.splice(1, 1);
      }
      consumables_title = T.t('consumables', true);
      if (skills.mostFreq) {
        consumables_title += " | " + (T.t('frequent', true)) + ': ' + skills.mostFreq;
      }
      consumables_block = {
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
      trinkets_title = T.t('trinkets', true);
      if (skills.highestWin) {
        trinkets_title += " | " + (T.t('wins', true)) + ': ' + skills.highestWin;
      }
      trinkets_block = {
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
};
