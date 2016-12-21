import Promise from 'bluebird';
import cheerio from 'cheerio';
import R from 'ramda';
import { cl, request, trinksCon } from '../helpers';

import Log from '../logger';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate.js';

const csspaths = require('../../data/csspaths.json');
const default_schema = require('../../data/default.json');

const positions = {
  Top: 'Top',
  Mid: 'Mid',
  Jungler: 'Jungle',
  Carry: 'ADC',
  Support: 'Support'
};


export const source_info = {
  name: 'Lolmasters',
  id: 'lolmasters'
};

export function getVersion() {
  return request('http://lolmasters.net/about')
    .then(cheerio.load)
    .then($ => $(csspaths.lolmasters.version).text().split(' ')[1])
    .tap(version => store.set('lolmasters_ver', version));
}

function pickIDs(data) {
  if (data.main) return [data.id.toString(), pickIDs(data.main)];
  return data.id.toString();
}

function processChampData(champ, lm_position, data) {
  if (!data || !data.buildTree) return;

  const item_ids = R.flatten(pickIDs(data.buildTree.main));
  if (data.boots[0] && data.boots[0].id) item_ids.splice(1, 0, data.boots[0].id.toString()); // Add boots as second item

  const items = R.map(id => ({
    id,
    count: 1
  }), item_ids);

  const riot_json = R.merge(default_schema, {
    champion: champ,
    title: `LM ${store.get('lolmasters_ver')} ${positions[lm_position]}`,
    blocks: trinksCon([{
      type: positions[lm_position],
      items
    }])
  });

  return {
    champ,
    file_prefix: positions[lm_position],
    riot_json,
    source: 'lolmasters'
  };
}

export function getSr() {
  return Promise.map(store.get('champs'), champ => {
    cl(`${T.t('processing')} Lolmasters: ${T.t(champ)}`);
    progressbar.incrChamp();

    return Promise.map(R.keys(positions), position => {
      return request({
        url: `http://lolmasters.net/championify/${champ}/${position}`,
        json: true
      })
      .then(data => processChampData(champ, position, data))
      .catch(err => {
        Log.warn(err);
        store.push('undefined_builds', {
          source: source_info.name,
          champ,
          position: positions[position]
        });
      });
    });
  }, {concurrency: 2})
  .then(R.flatten)
  .then(R.reject(R.isNil))
  .then(data => store.push('sr_itemsets', data));
}

