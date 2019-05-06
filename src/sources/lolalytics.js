import R from 'ramda';
import { cl, request, shorthandSkills, trinksCon } from '../helpers';

import progressbar from '../progressbar';
import store from '../store';
import T from '../translate.js';

const default_schema = require('../../data/default.json');

let cache, aram_cache, blitz_cache;
const skills_map = {
  1: 'Q',
  2: 'W',
  3: 'E',
  4: 'R'
};

function getCache(queueType) {
  if (cache) return cache;
  cache = request({url: `http://championify.lolalytics.com/data/1.0/ranked.json`, json: true});
  return cache;
}

function getAramCache(queueType) {
  if (aram_cache) return aram_cache;
  aram_cache = request({url: `http://championify.lolalytics.com/data/1.0/aram.json`, json: true});
  return aram_cache;
}

function getBlitzCache() {
  if (blitz_cache) return blitz_cache;
  blitz_cache = request({url: `http://championify.lolalytics.com/data/1.0/blitz.json`, json: true});
  return blitz_cache;
}

export function getVersion() {
  return getCache()
    .then(R.prop('version'))
    .then(version => {
      const split = version.split('.');
      split.pop();
      return split.join('.');
    })
    .tap(version => store.set('lolalytics_ver', version));
}

function objToItems(title, set_type, obj) {
  let items = R.sortBy(R.prop('rate'), R.map(id => ({
    id,
    count: 1,
    rate: obj[id]
  }), R.keys(obj)));

  return {
    type: `${set_type} ${title}`,
    items: R.reverse(R.map(R.omit(['rate']), items))
  };
}

function mapSkills(skills) {
  if (!skills) return [];

  const skills_list = R.sortBy(R.prop('rate'), R.map(entry => ({
    skills: entry,
    rate: skills[entry]
  }), R.keys(skills)));
  const mapped_skills = R.map(entry => skills_map[entry], R.last(skills_list).skills);

  if (store.get('settings').skillsformat) return shorthandSkills(mapped_skills);
  return mapped_skills;
}

function createJSON(champ, skills, position, blocks, set_type, map) {
  let file_prefix = position;
  let title = position;
  let mapCode = 'any';
  let site_abbr = (store.get('settings').splititems) ? 'LAS' : 'Lolalytics';
  if (map) {
    file_prefix = map;
    // If processing ARAM.
    if (map === 'ARAM') {
      // Oracles exlixir
      // blocks[0].items.push({count: 1, id: '2047'});
      title = `${site_abbr} (ARAM) ${store.get('lolalytics_ver')}`;
      mapCode = 'HA';
    } else if (map === 'Blitz') {
      title = `${site_abbr} (Blitz) ${store.get('lolalytics_ver')}`;
      mapCode = 'SL';
    }
  } else {
    if (store.get('settings').locksr) mapCode = 'SR';
    title = `${site_abbr} ${store.get('lolalytics_ver')} ${file_prefix}`;
  }

  if (set_type) {
    title += ` ${set_type}`;
    file_prefix += ` ${set_type}`;
  }

  const riot_json = R.merge(default_schema, {
    map: mapCode,
    champion: champ,
    title: title,
    blocks: trinksCon(blocks, skills)
  });

  return {
    champ,
    file_prefix:
    file_prefix.replace(/ /g, '_').toLowerCase(),
    riot_json,
    source: 'lolalytics'
  };
}

function processSets(champ, position, sets, map) {
  const skills = {
    most_freq: mapSkills(sets.skillpick),
    highest_win: mapSkills(sets.skillwin)
  };

  const mostfreq = {
    starting: objToItems(T.t('starting_items', true), T.t('most_freq', true), sets.startingitempick),
    boots: objToItems(T.t('boots', true), T.t('most_freq', true), sets.bootspick),
    first: objToItems(T.t('first_item', true), T.t('most_freq', true), sets.item1pick),
    second: objToItems(T.t('second_item', true), T.t('most_freq', true), sets.item2pick),
    third: objToItems(T.t('third_item', true), T.t('most_freq', true), sets.item3pick),
    fourth: objToItems(T.t('fourth_item', true), T.t('most_freq', true), sets.item4pick),
    fifth: objToItems(T.t('fifth_item', true), T.t('most_freq', true), sets.item5pick)
  };

  const highestwin = {
    starting: objToItems(T.t('starting_items', true), T.t('highest_win', true), sets.startingitemwin),
    boots: objToItems(T.t('boots', true), T.t('highest_win', true), sets.bootspick),
    first: objToItems(T.t('first_item', true), T.t('highest_win', true), sets.item1win),
    second: objToItems(T.t('second_item', true), T.t('highest_win', true), sets.item2win),
    third: objToItems(T.t('third_item', true), T.t('highest_win', true), sets.item3win),
    fourth: objToItems(T.t('fourth_item', true), T.t('highest_win', true), sets.item4win),
    fifth: objToItems(T.t('fifth_item', true), T.t('highest_win', true), sets.item5win)
  };

  if (store.get('settings').splititems) {
    return [
      createJSON(champ, skills, position, R.values(mostfreq), T.t('most_freq', true), map),
      createJSON(champ, skills, position, R.values(highestwin), T.t('highest_win', true), map)
    ];
  }

  return createJSON(champ, skills, position, R.values(mostfreq).concat(R.values(highestwin)), '', map);
   /* This is not very consumable, even for people okay with combined item sets, for Lolalytics
   in particular, I think the above format would be easier to read.
   return createJSON(champ, skills, position,[
    R.values(mostfreq).concat(R.values(highestwin))
    mostfreq.starting,
    highestwin.starting,
    mostfreq.boots,
    highestwin.boots,
    mostfreq.first,
    highestwin.first,
    mostfreq.second,
    highestwin.second,
    mostfreq.third,
    highestwin.third,
    mostfreq.fourth,
    highestwin.fourth,
    mostfreq.fifth,
    highestwin.fifth
  ]*/
}

export function getSr() {
  if (!store.get('lolalytics_ver')) return getVersion().then(getSr);

  return getCache()
    .then(R.prop('stats'))
    .then(stats => {
      return R.map(champ => {
        cl(`${T.t('processing')} Lolalytics: ${T.t(champ)}`);
        progressbar.incrChamp();

        return R.map(position => {
          return processSets(champ, position, stats[champ][position]);
        }, R.keys(stats[champ]));
      }, R.keys(stats));
    })
    .then(R.flatten)
    .then(data => store.push('sr_itemsets', data));
}

export function getAram() {
  if (!store.get('lolalytics_ver')) return getVersion().then(getAram);

  return getAramCache()
    .then(R.prop('stats'))
    .then(stats => {
      return R.map(champ => {
        cl(`${T.t('processing')} Lolalytics (ARAM): ${T.t(champ)}`);
        // progressbar.incrChamp();

        return R.map(position => {
          return processSets(champ, 'ARAM', stats[champ][position], 'ARAM');
        }, R.keys(stats[champ]));
      }, R.keys(stats));
    })
    .then(R.flatten)
    .then(data => store.push('aram_itemsets', data));
}

export function getBlitz() {
  if (!store.get('lolalytics_ver')) return getVersion().then(getBlitz);

  return getBlitzCache()
    .then(R.prop('stats'))
    .then(stats => {
      return R.map(champ => {
        cl(`${T.t('processing')} Lolalytics (Blitz): ${T.t(champ)}`);
        // progressbar.incrChamp();

        return R.map(position => {
          return processSets(champ, 'Blitz', stats[champ][position], 'Blitz');
        }, R.keys(stats[champ]));
      }, R.keys(stats));
    })
    .then(R.flatten)
    .then(data => store.push('blitz_itemsets', data));
}

export const source_info = {
  name: 'Lolalytics',
  id: 'lolalytics'
};
