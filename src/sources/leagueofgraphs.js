import Promise from 'bluebird';
import cheerio from 'cheerio';
import R from 'ramda';

import { cl, request, shorthandSkills, trinksCon } from '../helpers';
import championify from '../championify';
import Log from '../logger';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate';

const default_schema = require('../../data/default.json');


export const source_info = {
  name: 'LeagueOfGraphs',
  id: 'leagueofgraphs'
};


function _arrayToBuilds(ids) {
  const counts = R.countBy(R.identity)(ids);
  return R.map(id => ({
    id,
    count: counts[id]
  }), ids);
}

function _getItems(champ, position) {
  const riot_items = store.get('item_names');
  return request(`http://www.leagueofgraphs.com/champions/items/${champ.toLowerCase()}/${position}/platinum`)
    .then(cheerio.load)
    .then($c => {
      // Starter Items
      const starter_items_td = $c('.itemStarters').find('td').first();
      const starter_item_imgs = starter_items_td.find('img');
      const last_item_count = Number(starter_items_td.text().replace(/[^0-9]/g, ''));
      const starter_items = R.flatten(starter_item_imgs.map((idx, elem) => {
        let id;
        if ($c(elem).attr('alt') === 'Total Biscuit of Rejuvenation') {
          id = 2010;
        } else {
          id = riot_items[$c(elem).attr('alt')];
        }

        if (idx === (starter_item_imgs.length - 1) && last_item_count) return R.repeat(id, last_item_count);
        return id;
      }).get());

      // Core Items
      const core_items = $c('.data_table').eq(1).find('td').first().find('img').map((idx, elem) => {
        return riot_items[$c(elem).attr('alt')];
      }).get();

      // End Items
      const end_items = R.slice(0, 6, $c('.data_table').eq(2).find('img').map((idx, elem) => {
        return riot_items[$c(elem).attr('alt')];
      }).get());

      // End Items
      const boots = R.slice(0, 3, $c('.data_table').eq(3).find('img').map((idx, elem) => {
        return riot_items[$c(elem).attr('alt')];
      }).get());

      return {
        starter_items,
        core_items,
        end_items,
        boots
      };
    });
}

function _getSkills(champ, position) {
  return request(`http://www.leagueofgraphs.com/champions/skills-orders/${champ.toLowerCase()}/${position}/platinum`)
    .then(cheerio.load)
    .then($c => {
      // Skills
      let skills = [];
      const skill_keys = {
        1: 'Q',
        2: 'W',
        3: 'E',
        4: 'R'
      };

      $c('.skillsOrderTable').first().find('tr').each((idx, elem) => {
        if (idx === 0) return;
        const ability = skill_keys[idx];
        $c(elem).find('.skillCell').each((idx, elem) => {
          if ($c(elem).hasClass('active')) skills[idx] = ability;
        });
      });

      if (store.get('settings').skillsformat) {
        skills = shorthandSkills(skills);
      } else {
        skills = skills.join('.');
      }

      return skills;
    });
}

function _getPositions(champ) {
  return request(`http://www.leagueofgraphs.com/champions/items/${champ.toLowerCase()}/platinum`)
    .then(cheerio.load)
    .then($c => {
      const positions = R.map(position => {
        if (position === 'mid') return 'middle';
        if (position === 'ad carry') return 'adc';
        if (position === 'jungler') return 'jungle';
        return position;
      }, $c('.bannerSubtitle').text().toLowerCase().trim().split(', '));
      return positions;
    });
}

export function getSr() {
  return championify.getItems()
    .then(() => Promise.resolve(store.get('champs')))
    .map(champ => {
      cl(`${T.t('processing')} LeagueOfGraphs: ${T.t(champ)}`);
      progressbar.incrChamp();

      return _getPositions(champ)
        .map(position => {
          return Promise.join(_getItems(champ, position), _getSkills(champ, position))
            .spread((items, skills) => {
              const blocks = [
                {
                  items: _arrayToBuilds(items.starter_items),
                  type: T.t('starter', true)
                },
                {
                  items: _arrayToBuilds(items.core_items),
                  type: T.t('core_items', true)
                },
                {
                  items: _arrayToBuilds(items.end_items),
                  type: T.t('endgame_items', true)
                },
                {
                  items: _arrayToBuilds(items.boots),
                  type: T.t('boots', true)
                }
              ];

              position = T.t(position, true);
              const riot_json = R.merge(R.clone(default_schema, true), {
                champion: champ,
                title: `LOG ${position} ${store.get('leagueofgraphs_ver')}`,
                blocks: trinksCon(blocks, {highest_win: skills, most_freq: skills})
              });

              return {
                champ,
                file_prefix: position,
                riot_json,
                source: 'leagueofgraphs'
              };
            })
            .catch(err => {
              Log.warn(err);
              store.push('undefined_builds', {champ, position, source: source_info.name});
            });
        })
        .catch(err => {
          Log.warn(err);
          store.push('undefined_builds', {champ, position: 'All', source: source_info.name});
        });
    }, {concurrency: 5})
    .then(R.flatten)
    .then(data => store.push('sr_itemsets', data))
    .catch(err => console.log(err.stack));
}

export function getVersion() {
  return request('http://www.leagueofgraphs.com/contact')
    .then(cheerio.load)
    .then($c => $c('.patch').text().replace(/Patch: /g, ''))
    .tap(version => store.set('leagueofgraphs_ver', version));
}
