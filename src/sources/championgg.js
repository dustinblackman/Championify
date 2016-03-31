import Promise from 'bluebird';
import cheerio from 'cheerio';
import escodegen from 'escodegen';
import esprima from 'esprima';
import R from 'ramda';

import ChampionifyErrors from '../errors.js';
import { cl, request, trinksCon, updateProgressBar, wins } from '../helpers';
import Log from '../logger';
import store from '../store';
import T from '../translate';

const default_schema = require('../../data/default.json');
const csspaths = require('../../data/csspaths.json');
const prebuilts = require('../../data/prebuilts.json');


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
  const parsed_data = {};
  const script_tag = $c('script:contains("matchupData.")').text();

  R.forEach(line => {
    const var_name = line.expression.left.property.name;
    if (R.contains(var_name, ['championData', 'champion'])) {
      const data = escodegen.generate(line.expression.right, {format: {json: true}});
      parsed_data[var_name] = JSON.parse(data);
    }
  }, esprima.parse(script_tag).body);

  return parsed_data;
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
    throw new ChampionifyErrors.ParsingError(`Couldn't parse champion.gg script tag for ${champ}`);
  }
  if (!gg.champion || !gg.champion.roles) {
    throw new ChampionifyErrors.ParsingError(`Couldn't parse roles from champion.gg script tag for ${champ}`);
  }

  let current_position = '';
  $c(csspaths.positions).find('a').each((i, e) => {
    let position = $c(e).attr('href').split('/');
    position = position[position.length - 1];
    if ($c(e).parent().hasClass('selected-role')) current_position = position.toLowerCase();
  });

  let positions = R.map(role => role.title.toLowerCase(), gg.champion.roles);
  positions = R.filter(role => role !== current_position, positions);

  const undefarray = [
    !gg.championData.items.mostGames.winPercent,
    !gg.championData.firstItems.mostGames.winPercent,
    !gg.championData.items.highestWinPercent.winPercent,
    !gg.championData.firstItems.highestWinPercent.winPercent
  ];
  if (R.contains(true, undefarray)) {
    store.push('undefined_builds', {
      champ,
      position: current_position
    });
    return;
  }

  const freq_core = {
    items: gg.championData.items.mostGames.items,
    wins: wins(gg.championData.items.mostGames.winPercent),
    games: gg.championData.items.mostGames.games
  };
  const freq_start = {
    items: gg.championData.firstItems.mostGames.items,
    wins: wins(gg.championData.firstItems.mostGames.winPercent),
    games: gg.championData.firstItems.mostGames.games
  };
  const highest_core = {
    items: gg.championData.items.highestWinPercent.items,
    wins: wins(gg.championData.items.highestWinPercent.winPercent),
    games: gg.championData.items.highestWinPercent.games
  };
  const highest_start = {
    items: gg.championData.firstItems.highestWinPercent.items,
    wins: wins(gg.championData.firstItems.highestWinPercent.winPercent),
    games: gg.championData.firstItems.highestWinPercent.games
  };

  function processSkills(skills) {
    const keys = {
      1: 'Q',
      2: 'W',
      3: 'E',
      4: 'R'
    };
    skills = R.map(skill => keys[skill[0]], skills);

    if (store.get('settings').skillsformat) {
      let skill_count = R.countBy(R.toLower)(R.slice(0, 9, skills));
      delete skill_count.r;
      skill_count = R.invertObj(skill_count);
      const counts = R.keys(skill_count).sort().reverse();

      const skill_order = R.map(count_num => R.toUpper(skill_count[count_num]), counts);
      const skill_overview = skill_order.slice(0, 4).join('.');

      return `${skill_overview} - ${R.join('>', skill_order)}`;
    }

    return skills.join('.');
  }

  const skills = {
    most_freq: processSkills(gg.championData.skills.mostGames.order),
    highest_win: processSkills(gg.championData.skills.highestWinPercent.order)
  };

  function arrayToBuilds(data) {
    const ids = R.map(R.toString, R.pluck('id')(data));
    const counts = R.countBy(R.identity)(ids);
    return R.map(id => ({
      id,
      count: counts[id]
    }), ids);
  }

  freq_start.build = arrayToBuilds(freq_start.items).concat(prebuilts.trinkets);
  highest_start.build = arrayToBuilds(highest_start.items).concat(prebuilts.trinkets);
  freq_core.build = arrayToBuilds(freq_core.items);
  highest_core.build = arrayToBuilds(highest_core.items);

  const templates = {
    combindedStart: (wins, games) => `${T.t('frequent', true)}/${T.t('highest_start', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    combinedCore: (wins, games) => `${T.t('frequent', true)}/${T.t('highest_core', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    freqStart: (wins, games) => `${T.t('mf_starters', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    freqCore: (wins, games) => `${T.t('mf_core', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    highestStart: (wins, games) => `${T.t('hw_starters', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    highestCore: (wins, games) => `${T.t('hw_core', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`
  };

  function normalItemSets() {
    const builds = [];
    if (R.equals(freq_start.build, highest_start.build)) {
      builds.push({
        items: freq_start.build,
        type: templates.combindedStart(freq_start.wins, freq_start.games)
      });
    } else {
      builds.push({
        items: freq_start.build,
        type: templates.freqStart(freq_start.wins, freq_start.games)
      });
      builds.push({
        items: highest_start.build,
        type: templates.highestStart(highest_start.wins, highest_start.games)
      });
    }
    if (R.equals(freq_core.build, highest_core.build)) {
      builds.push({
        items: freq_core.build,
        type: templates.combinedCore(freq_core.wins, freq_core.games)
      });
    } else {
      builds.push({
        items: freq_core.build,
        type: templates.freqCore(freq_core.wins, freq_core.games)
      });
      builds.push({
        items: highest_core.build,
        type: templates.highestCore(highest_core.wins, highest_core.games)
      });
    }

    return trinksCon(builds, skills);
  }

  function splitItemSets() {
    const mf_build = [
      {
        items: freq_start.build,
        type: templates.freqStart(freq_start.wins, freq_start.games)
      },
      {
        items: freq_core.build,
        type: templates.freqCore(freq_core.wins, freq_core.games)
      }
    ];

    const hw_build = [
      {
        items: highest_start.build,
        type: templates.highestStart(highest_start.wins, highest_start.games)
      },
      {
        items: highest_core.build,
        type: templates.highestCore(highest_core.wins, highest_core.games)
      }
    ];

    return {
      mf_build: trinksCon(mf_build, skills),
      hw_build: trinksCon(hw_build, skills)
    };
  }

  function pushToStore(champ, position, set_type, file_prefix, build) {
    let title = T.t(position, true);
    if (set_type) title += ` ${set_type}`;
    const riot_json = R.merge(R.clone(default_schema, true), {
      champion: champ,
      title: `${title} ${store.get('champgg_ver')}`,
      blocks: build
    });

    if (store.get('settings').locksr) riot_json.map = 'SR';
    // Pushes to the itemsets store.
    store.push('sr_itemsets', {champ, file_prefix, riot_json});
  }

  if (store.get('settings').splititems) {
    const builds = splitItemSets();
    pushToStore(champ, current_position, T.t('most_freq', true), `${current_position}_mostfreq`, builds.mf_build);
    pushToStore(champ, current_position, T.t('highest_win', true), `${current_position}_highwin`, builds.hw_build);
  } else {
    const builds = normalItemSets();
    pushToStore(champ, current_position, null, current_position, builds);
  }

  // If there's other positions available, run them, otherwise end for this champ.
  if (!request_params.position && positions.length > 0) {
    positions = R.map(position => ({champ, position}), positions);
    return Promise.resolve(positions)
      .map(request_params => requestPage(request_params)); // eslint-disable-line no-use-before-define
  }

  return Promise.resolve();
}

/**
 * Function Request champion.gg page, 3 retries (according to Helpers).
 * @param {Object} Champion object created by asyncRequestChamps.
 * @callback {Function} Callback.
 */

function requestPage(request_params, step) {
  const { champ, position } = request_params;
  let url = `http://champion.gg/champion/${champ}`;
  if (position) {
    url += `/${position}`;
  } else {
    cl(`${T.t('processing_rift')}: ${T.t(champ)}`);
  }

  function markUndefined() {
    store.push('undefined_builds', {
      champ,
      position: request_params.position || 'All'
    });
  }

  return request(url)
    .then(body => {
      if (body.indexOf('We\'re currently in the process of generating stats for') > -1) return markUndefined();
      return processChamp(request_params, body);
    })
    .catch(err => {
      Log.warn(err);
      markUndefined();
    });
}

/**
 * Function Async execute scraper on Champion.gg. Currently at 2 at a time to prevent high load.
 * @param {Array} Array of strings of Champs from Riot.
 * @callback {Function} Callback.
 */

function getSr() {
  const champs = store.get('champs');
  return Promise.resolve(champs)
    .map(champ => {
      updateProgressBar(90 / champs.length);
      return requestPage({champ});
    }, {concurrency: 2})
    .then(R.flatten)
    .then(R.reject(R.isNil));
}

/**
 * Export
 */

export default {
  getSr,
  getVersion
};
