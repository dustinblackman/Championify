import Promise from 'bluebird';
import cheerio from 'cheerio';
import moment from 'moment';
import R from 'ramda';

import ChampionifyErrors from '../errors';
import Log from '../logger';
import { arrayToBuilds, cl, request, trinksCon } from '../helpers';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate';

const default_schema = require('../../data/default.json');


/**
 * Export
 */
export const source_info = {
  name: 'ProBuilds',
  id: 'probuilds'
};

function getChamps() {
  return request('http://probuilds.net/champions')
    .then(cheerio.load)
    .then($ => {
      return $('.champ-image')
        .map((idx, el) => $(el).attr('data-id').split('|')[0])
        .get();
    });
}

function getIDs($, el) {
  return el.find('.item')
    .map((idx, entry) => $(entry).attr('data-id'))
    .get();
}

function mergeIDs($, divs, start_point) {
  return arrayToBuilds(R.concat(
    getIDs($, divs.eq(start_point)),
    getIDs($, divs.eq(start_point + 1))
  ));
}

function getTopKDAItems(champ) {
  const champ_id = store.get('champ_ids')[champ];
  return request({url: `http://probuilds.net/ajax/champBuilds?championId=${champ_id}`, json: true})
    .then(R.prop('matches'))
    .map(match => {
      const $ = cheerio.load(match);
      const items = $('.items').find('img').map((idx, el) => $(el).attr('data-id')).get();
      const player = $('.player').text();
      const kda_div = $('.kda');
      const kills = Number(kda_div.find('.green').text());
      const assists = Number(kda_div.find('.gold').text());
      const deaths = Number(kda_div.find('.red').text());
      const kda = (kills + assists) / deaths;

      return {
        player,
        items,
        kda,
        kda_text: `${kills} / ${deaths} / ${assists}`
      };
    })
    .then(R.sortBy(R.prop('kda')))
    .then(R.reverse)
    .then(R.nth(0))
    .catch(err => {
      err = new ChampionifyErrors.ExternalError(`Probuilds failed to parse KDA for ${champ}`).causedBy(err);
      Log.warn(err);
      return;
    });
}

function getItems(champ_case) {
  const champ = champ_case.toLowerCase();
  try {
    cl(`${T.t('processing')} ProBuilds: ${T.t(champ)}`);
  } catch (err) {
    store.push('undefined_builds', {
      source: source_info.name,
      champ,
      position: 'All'
    });
    return;
  }

  return Promise.join(
    request(`http://probuilds.net/champions/details/${champ_case}`).then(cheerio.load),
    getTopKDAItems(champ)
  )
  .spread(($, kda) => {
    const divs = $('.popular-items').find('div.left');
    const core = mergeIDs($, divs, 0);
    const boots = mergeIDs($, divs, 2);

    const riot_json = R.merge(default_schema, {
      champion: champ,
      title: `ProBuilds ${moment().format('YYYY-MM-DD')}`,
      blocks: [
        {
          items: core,
          type: T.t('core_items', true)
        },
        {
          items: boots,
          type: T.t('boots', true)
        }
      ]
    });

    if (kda) riot_json.blocks.push({
      items: arrayToBuilds(kda.items),
      type: `${T.t('top_kda_items', true)} - ${kda.player}: ${kda.kda_text}`
    });

    riot_json.blocks = trinksCon(riot_json.blocks);
    progressbar.incrChamp();
    return {champ, file_prefix: 'all', riot_json, source: 'probuilds'};
  })
  .catch(err => {
    Log.error(err);
    store.push('undefined_builds', {
      source: source_info.name,
      champ,
      position: 'All'
    });
  });
}

export function getSr() {
  return getChamps()
    .map(getItems, {concurrency: 3})
    .then(R.reject(R.isNil))
    .then(data => store.push('sr_itemsets', data));
}

export function getVersion() {
  return Promise.resolve(moment().format('YYYY-MM-DD'));
}

