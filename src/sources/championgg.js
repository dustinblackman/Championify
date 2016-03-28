import Promise from 'bluebird';
import async from 'async';
import cheerio from 'cheerio';
import escodegen from 'escodegen';
import esprima from 'esprima';
import _ from 'lodash';

import ChampionifyErrors from '../errors.js';
import { cl, request, trinksCon, updateProgressBar, wins } from '../helpers';
import Log from '../logger';
import store from '../store_manager';
import T from '../translate';

const defaultSchema = require('../../data/default.json');
const csspaths = require('../../data/csspaths.json');
const prebuilts = require('../../data/prebuilts.json');

let champData = {};


/**
  * Function Gets current version Champion.GG is using.
  * @callback {Function} Callback.
 */

function getVersion() {
  if (store.get('importing')) cl(T.t('cgg_version'));
  return request('http://champion.gg/faq/')
    .then(body => {
      const $c = cheerio.load(body);
      const champgg_ver = $c(csspaths.version).text();
      store.set('champgg_ver', champgg_ver);
      return champgg_ver;
    })
    .catch(err => {
      throw new ChampionifyErrors.RequestError('Can\'t get Champion.GG Version').causedBy(err);
    });
}


/**
 * Function That parses Champion.GG HTML.
 * @param {Function} Cheerio.
 * @returns {Object} Object containing Champion data.
 */

function parseGGData($c) {
  let parsed_data = {};
  let script_tag = $c('script:contains("matchupData.")').text();
  script_tag = esprima.parse(script_tag);
  _.each(script_tag.body, function(line) {
    var data, var_name;
    var_name = line.expression.left.property.name;
    if (_.contains(['championData', 'champion'], var_name)) {
      data = escodegen.generate(line.expression.right, {
        format: {
          json: true
        }
      });
      parsed_data[var_name] = JSON.parse(data);
    }
  });

  return parsed_data;
}


/**
 * Function Async execute scraper on Champion.gg. Currently at 2 at a time to prevent high load.
 * @param {Array} Array of strings of Champs from Riot.
 * @callback {Function} Callback.
 */

function requestChamps() {
  champData = {};
  const champs = store.get('champs');
  const manaless = store.get('manaless');

  return Promise.resolve(['Annie'])
    .map(champ => {
      updateProgressBar(90 / champs.length);
      return new Promise((resolve, reject) => { // TODO: Convert all in to promise.
        requestPage({champ, manaless}, () => {
          return resolve();
        });
      });
    }, {concurrency: 2})
    .then(() => {
      // TODO: This needs to change.
      store.set('sr_itemsets', champData);
    });
}


/**
 * Function Request champion.gg page, 3 retries (according to Helpers).
 * @param {Object} Champion object created by asyncRequestChamps.
 * @callback {Function} Callback.
 */

function requestPage(request_params, step) {
  const champ = request_params.champ;
  let url = 'http://champion.gg/champion/' + champ;
  if (request_params.position) {
    url = url + '/' + request_params.position;
  } else {
    cl((T.t('processing_rift')) + ': ' + T.t(champ));
  }

  function markUndefined() {
    store.push('undefined_builds', {
      champ: champ,
      position: request_params.position || 'All'
    });
  }

  return request(url)
    .then(body => {
      if (_.contains(body, 'We\'re currently in the process of generating stats for')) {
        markUndefined();
        step();
      }

      processChamp(request_params, body, function(err) {
        if (err) {
          Log.error(err);
          markUndefined();
        }
        return step();
      });
    })
    .catch(err => {
      Log.warn(err);
      markUndefined();
      step();
    });
}


/**
 * Function Process scraped Champion.GG page.
 * @param {Object} Champion object created by asyncRequestChamps.
 * @param {String} Body of Champion.GG page.
 * @callback {Function} Callback.
 */

function processChamp(request_params, body, step) {
  const champ = request_params.champ;
  const $c = cheerio.load(body);
  let gg;
  try {
    gg = parseGGData($c);
  } catch (_error) {
    return step(new ChampionifyErrors.ParsingError("Couldn\'t parse champion.gg script tag for " + champ));
  }
  if (!gg.champion || !gg.champion.roles) {
    return step(new ChampionifyErrors.ParsingError("Couldn\'t parse roles from champion.gg script tag for " + champ));
  }

  let currentPosition = '';
  $c(csspaths.positions).find('a').each(function(i, e) {
    var position;
    position = $c(e).attr('href').split('/');
    position = position[position.length - 1];
    if ($c(e).parent().hasClass('selected-role')) {
      currentPosition = position.toLowerCase();
    }
  });
  let positions = _.map(gg.champion.roles, function(e) {
    return e.title.toLowerCase();
  });
  positions = _.filter(positions, function(e) {
    return e !== currentPosition;
  });

  const undefArray = [
    !gg.championData.items.mostGames.winPercent,
    !gg.championData.firstItems.mostGames.winPercent,
    !gg.championData.items.highestWinPercent.winPercent,
    !gg.championData.firstItems.highestWinPercent.winPercent
  ];
  if (_.contains(undefArray, true)) {
    store.push('undefined_builds', {
      champ: champ,
      position: currentPosition
    });
    return step();
  }
  const freqCore = {
    items: gg.championData.items.mostGames.items,
    wins: wins(gg.championData.items.mostGames.winPercent),
    games: gg.championData.items.mostGames.games
  };
  const freqStart = {
    items: gg.championData.firstItems.mostGames.items,
    wins: wins(gg.championData.firstItems.mostGames.winPercent),
    games: gg.championData.firstItems.mostGames.games
  };
  const highestCore = {
    items: gg.championData.items.highestWinPercent.items,
    wins: wins(gg.championData.items.highestWinPercent.winPercent),
    games: gg.championData.items.highestWinPercent.games
  };
  const highestStart = {
    items: gg.championData.firstItems.highestWinPercent.items,
    wins: wins(gg.championData.firstItems.highestWinPercent.winPercent),
    games: gg.championData.firstItems.highestWinPercent.games
  };
  function processSkills(skills) {
    let keys = {
      1: 'Q',
      2: 'W',
      3: 'E',
      4: 'R'
    };

    const skillOrder = _.map(skills, function(e) {
      return keys[e];
    });

    let formatted_skills;
    if (store.get('settings').skillsformat) {
      let sliced_skills = _.countBy(skillOrder.slice(0, 9), _.identity);
      delete sliced_skills['R'];
      sliced_skills = _.invert(sliced_skills);
      keys = _.keys(sliced_skills);
      keys.sort();
      keys.reverse();
      let mapped_skills = _.map(keys, function(key) {
        return sliced_skills[key];
      });
      formatted_skills = skillOrder.slice(0, 4).join('.') + ' - ' + mapped_skills.join('>');
    } else {
      formatted_skills = skillOrder.join('.');
    }
    return formatted_skills;
  }

  const skills = {
    mostFreq: processSkills(gg.championData.skills.mostGames.order),
    highestWin: processSkills(gg.championData.skills.highestWinPercent.order)
  };

  function arrayToBuilds(arr) {
    let build = [];
    arr = _.map(arr, function(e) {
      return e.id.toString();
    });
    let count_obj = arr.reduce(function(acc, curr) {
      if (typeof acc[curr] === 'undefined') {
        acc[curr] = 1;
      } else {
        acc[curr] += 1;
      }
      return acc;
    }, {});
    arr = arr.filter(function(v, i, a) {
      return a.indexOf(v) === i;
    });
    arr.forEach(function(e) {
      var count;
      count = count_obj[e];
      if (e === '2010') {
        e = '2003';
      }
      return build.push({
        id: e,
        count: count
      });
    });
    return build;
  }

  freqStart.build = arrayToBuilds(freqStart.items).concat(prebuilts.trinkets);
  highestStart.build = arrayToBuilds(highestStart.items).concat(prebuilts.trinkets);
  freqCore.build = arrayToBuilds(freqCore.items);
  highestCore.build = arrayToBuilds(highestCore.items);

  const templates = {
    combindedStart: _.template((T.t('frequent', true)) + "/" + (T.t('highest_start', true)) + " (<%- wins %> " + (T.t('wins').toLowerCase()) + " - <%- games %> " + (T.t('games', true)) + ")"),
    combinedCore: _.template((T.t('frequent', true)) + "/" + (T.t('highest_core', true)) + " (<%- wins %> " + (T.t('wins').toLowerCase()) + " - <%- games %> " + (T.t('games', true)) + ")"),
    freqStart: _.template((T.t('mf_starters', true)) + " (<%- wins %> " + (T.t('wins', true).toLowerCase()) + " - <%- games %> " + (T.t('games', true)) + ")"),
    freqCore: _.template((T.t('mf_core', true)) + " (<%- wins %> " + (T.t('wins', true).toLowerCase()) + " - <%- games %> " + (T.t('games', true)) + ")"),
    highestStart: _.template((T.t('hw_starters', true)) + " (<%- wins %> " + (T.t('wins', true).toLowerCase()) + " - <%- games %> " + (T.t('games', true)) + ")"),
    highestCore: _.template((T.t('hw_core', true)) + " (<%- wins %> " + (T.t('wins', true).toLowerCase()) + " - <%- games %> " + (T.t('games', true)) + ")")
  };

  function normalItemSets() {
    let builds = [];
    if (_.eq(freqStart.build, highestStart.build)) {
      builds.push({
        items: freqStart.build,
        type: templates.combindedStart({
          wins: freqStart.wins,
          games: freqStart.games
        })
      });
    } else {
      builds.push({
        items: freqStart.build,
        type: templates.freqStart({
          wins: freqStart.wins,
          games: freqStart.games
        })
      });
      builds.push({
        items: highestStart.build,
        type: templates.highestStart({
          wins: highestStart.wins,
          games: highestStart.games
        })
      });
    }
    if (_.eq(freqCore.build, highestCore.build)) {
      builds.push({
        items: freqCore.build,
        type: templates.combinedCore({
          wins: freqCore.wins,
          games: freqCore.games
        })
      });
    } else {
      builds.push({
        items: freqCore.build,
        type: templates.freqCore({
          wins: freqCore.wins,
          games: freqCore.games
        })
      });
      builds.push({
        items: highestCore.build,
        type: templates.highestCore({
          wins: highestCore.wins,
          games: highestCore.games
        })
      });
    }
    builds = trinksCon(builds, champ, request_params.manaless, skills);
    return builds;
  }

  function splitItemSets() {
    let mfBuild = [];
    let hwBuild = [];
    mfBuild.push({
      items: freqStart.build,
      type: templates.freqStart({
        wins: freqStart.wins,
        games: freqStart.games
      })
    });
    mfBuild.push({
      items: freqCore.build,
      type: templates.freqCore({
        wins: freqCore.wins,
        games: freqCore.games
      })
    });
    hwBuild.push({
      items: highestStart.build,
      type: templates.highestStart({
        wins: highestStart.wins,
        games: highestStart.games
      })
    });
    hwBuild.push({
      items: highestCore.build,
      type: templates.highestCore({
        wins: highestCore.wins,
        games: highestCore.games
      })
    });
    return {
      mfBuild: trinksCon(mfBuild, champ, request_params.manaless, skills),
      hwBuild: trinksCon(hwBuild, champ, request_params.manaless, skills)
    };
  }

  function pushChampData(champ, position, set_type, position_for_file, build) {
    if (set_type == null) {
      set_type = null;
    }
    let title = T.t(position, true);
    if (set_type) {
      title += ' ' + set_type;
    }
    const newObj = {
      champion: champ,
      title: title + ' ' + store.get('champgg_ver'),
      blocks: build
    };
    const riot_json = _.merge(_.clone(defaultSchema, true), newObj);
    if (store.get('settings').locksr) {
      riot_json.map = 'SR';
    }
    champData[champ][position_for_file] = riot_json;
  }

  if (!champData[champ]) {
    champData[champ] = {};
  }
  if (store.get('settings').splititems) {
    const builds = splitItemSets();
    pushChampData(champ, currentPosition, T.t('most_freq', true), currentPosition + '_mostfreq', builds.mfBuild);
    pushChampData(champ, currentPosition, T.t('highest_win', true), currentPosition + '_highwin', builds.hwBuild);
  } else {
    const builds = normalItemSets();
    pushChampData(champ, currentPosition, null, currentPosition, builds);
  }
  if (!request_params.position && positions.length > 0) {
    positions = positions.map(function(e) {
      return {
        champ: champ,
        position: e,
        manaless: request_params.manaless
      };
    });
    async.each(positions, function(item, next) {
      return requestPage(item, function() {
        next(null);
      });
    }, function() {
      step();
    });
  } else {
    return step();
  }
}


/**
 * Export
 */

export default {
  sr: requestChamps,
  version: getVersion
};
