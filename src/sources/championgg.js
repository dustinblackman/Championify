import Promise from 'bluebird';
import cheerio from 'cheerio';
import escodegen from 'escodegen';
import esprima from 'esprima';
import R from 'ramda';

import ChampionifyErrors from '../errors.js';
import { arrayToBuilds, cl, request, shorthandSkills, trinksCon } from '../helpers';
import Log from '../logger';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate';

const default_schema = require('../../data/default.json');
const csspaths = require('../../data/csspaths.json');
const prebuilts = require('../../data/prebuilts.json');
const skillKeys = {
  1: 'Q',
  2: 'W',
  3: 'E',
  4: 'R'
};

function formatWins(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function processSkills(skills) {
  skills = R.map(skill => skillKeys[skill[0]], skills);

  if (store.get('settings').skillsformat) return shorthandSkills(skills);
  return skills.join('.');
}

function formatForStore(champ, position, set_type, file_prefix, build) {
  let title = T.t(position, true);
  if (set_type) title += ` ${set_type}`;
  const riot_json = R.merge(default_schema, {
    champion: champ,
    title: `CGG ${title} ${store.get('championgg_ver')}`,
    blocks: build
  });

  if (store.get('settings').locksr) riot_json.map = 'SR';
  return {champ, file_prefix, riot_json, source: 'championgg'};
}

/**
 * Export
 */

export const source_info = {
  name: 'Champion.gg',
  id: 'championgg'
};


/**
  * Gets current version Champion.GG is using.
  * @returns {Promise.<String|ChampionifyErrors.RequestError>} Championgg version
 */

export function getVersion() {
  if (store.get('importing')) cl(T.t('cgg_version'));
  return request('http://champion.gg/faq/')
    .then(body => {
      const $c = cheerio.load(body);
      const champgg_ver = $c(csspaths.championgg.version).text();
      store.set('championgg_ver', champgg_ver);
      return champgg_ver;
    })
    .catch(err => {
      throw new ChampionifyErrors.RequestError('Can\'t get Champion.gg version').causedBy(err);
    });
}


/**
 * Parses Champion.GG HTML.
 * @param {Function} Cheerio instance.
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

function getChampsAndPositions() {
  return request('http://champion.gg')
    .then(body => {
      const $c = cheerio.load(body);
      const links = $c('.champ-height')
        .find('a')
        .map((idx, el) => $c(el).attr('href'))
        .get();

      return R.pipe(
        R.map(R.split('/')),
        R.filter(entry => entry.length > 3),
        R.map(entry => ({
          champ: entry[2],
          position: entry[3]
        })),
        R.groupBy(R.prop('champ')),
        R.map(R.pluck('position'))
      )(links);
    })
    .catch(err => {
      throw new ChampionifyErrors.RequestError('Can\'t get Champion.gg champions').causedBy(err);
    });
}

/**
 * Process scraped Champion.GG page.
 * @param {Object} Champion object created by getSr
 * @param {String} Body of Champion.GG page
 */

function processChamp(champ, body) {
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
  $c(csspaths.championgg.positions).find('a').each((i, e) => {
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
      source: source_info.name,
      champ,
      position: current_position
    });
    return;
  }

  const freq_core = {
    items: gg.championData.items.mostGames.items,
    wins: formatWins(gg.championData.items.mostGames.winPercent),
    games: gg.championData.items.mostGames.games
  };
  const freq_start = {
    items: gg.championData.firstItems.mostGames.items,
    wins: formatWins(gg.championData.firstItems.mostGames.winPercent),
    games: gg.championData.firstItems.mostGames.games
  };
  const highest_core = {
    items: gg.championData.items.highestWinPercent.items,
    wins: formatWins(gg.championData.items.highestWinPercent.winPercent),
    games: gg.championData.items.highestWinPercent.games
  };
  const highest_start = {
    items: gg.championData.firstItems.highestWinPercent.items,
    wins: formatWins(gg.championData.firstItems.highestWinPercent.winPercent),
    games: gg.championData.firstItems.highestWinPercent.games
  };

  const skills = {
    most_freq: processSkills(gg.championData.skills.mostGames.order),
    highest_win: processSkills(gg.championData.skills.highestWinPercent.order)
  };

  freq_start.build = arrayToBuilds(R.pluck('id', freq_start.items)).concat(prebuilts.trinkets);
  highest_start.build = arrayToBuilds(R.pluck('id', highest_start.items)).concat(prebuilts.trinkets);
  freq_core.build = arrayToBuilds(R.pluck('id', freq_core.items));
  highest_core.build = arrayToBuilds(R.pluck('id', highest_core.items));

  const templates = {
    combindedStart: (wins, games) => `${T.t('frequent', true)}/${T.t('highest_start', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    combinedCore: (wins, games) => `${T.t('frequent', true)}/${T.t('highest_core', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    freqStart: (wins, games) => `${T.t('mf_starters', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    freqCore: (wins, games) => `${T.t('mf_core', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    highestStart: (wins, games) => `${T.t('hw_starters', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`,
    highestCore: (wins, games) => `${T.t('hw_core', true)} (${wins} ${T.t('wins').toLowerCase()} - ${games} ${T.t('games', true)})`
  };

  const formatted_builds = [];
  if (store.get('settings').splititems) {
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
    formatted_builds.push(
      formatForStore(champ, current_position, T.t('most_freq', true), `${current_position}_mostfreq`, trinksCon(mf_build, skills)),
      formatForStore(champ, current_position, T.t('highest_win', true), `${current_position}_highwin`, trinksCon(hw_build, skills))
    );
  } else {
    let builds = [];
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

    builds = trinksCon(builds, skills);
    formatted_builds.push(formatForStore(champ, current_position, null, current_position, builds));
  }

  return formatted_builds;
}

/**
 * Request champion.gg page, handles both the index and positions of champions.
 * @param {Object} Champion object created by getSr.
 * @returns {Promise}
 */

function requestPage(champ, position) {
  function markUndefined() {
    store.push('undefined_builds', {
      source: source_info.name,
      champ,
      position: position
    });
    return;
  }

  return request(`http://champion.gg/champion/${champ}/${position}`)
    .then(body => {
      if (body.indexOf('We\'re currently in the process of generating stats for') > -1) return markUndefined();
      return processChamp(champ, body);
    })
    .catch(err => {
      Log.warn(err);
      markUndefined();
      return;
    });
}

/**
 * Scrapes Champion.gg at 3 concurrenct connections and saves data in the store.
 * @param {Array} Array of strings of Champs from Riot.
 * @returns {Promise}
 */

export function getSr() {
  if (!store.get('championgg_ver')) return getVersion().then(getSr);

  return getChampsAndPositions()
    .then(champs => {
      return Promise.map(R.reverse(R.keys(champs)), champ => {
        cl(`${T.t('processing')} Champion.gg: ${T.t(champ)}`);
        progressbar.incrChamp();

        return Promise.map(champs[champ], position => {
          return requestPage(champ, position);
        }, {concurrency: 1});
      }, {concurrency: 3});
    })
    .then(R.flatten)
    .then(R.reject(R.isNil))
    .then(data => store.push('sr_itemsets', data));
}
