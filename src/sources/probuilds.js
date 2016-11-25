import Promise from 'bluebird';
import cheerio from 'cheerio';
import moment from 'moment';
import R from 'ramda';

import { arrayToBuilds, cl, request, trinksCon } from '../helpers';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate';

const default_schema = require('../../data/default.json');


function getChamps() {
  console.log('Getting probuilds champs');
  return request('http://www.probuilds.net/champions')
    .then(cheerio.load)
    .then($ => {
      return $('.champ-image')
        .map((idx, el) => $(el).attr('data-id').split('|')[0].toLowerCase()).get();
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

function getItems(champ) {
  cl(`${T.t('processing')} probuilds: ${T.t(champ)}`);
  return request(`http://www.probuilds.net/champions/details/${champ}`)
    .then(cheerio.load)
    .then($ => {
      const divs = $('.popular-items').find('div.left');
      const core = mergeIDs($, divs, 0);
      const boots = mergeIDs($, divs, 2);

      const riot_json = R.merge(default_schema, {
        champion: champ,
        title: `ProBuilds ${moment().format('YYYY-MM-DD')}`,
        blocks: trinksCon([
          {
            items: core,
            type: T.t('core_items', true)
          },
          {
            items: boots,
            type: T.t('boots', true)
          }
        ])
      });

      progressbar.incrChamp();
      return {champ, file_prefix: 'all', riot_json, source: 'probuilds'};
    });
}

export function getSr() {
  return getChamps()
    .map(getItems, {concurrency: 3})
    .then(data => store.push('sr_itemsets', data));
}

export function getVersion() {
  return Promise.resolve(moment().format('YYYY-MM-DD'));
}

/**
 * Export
 */
export const source_info = {
  name: 'ProBuilds',
  id: 'probuilds'
};
