import Promise from 'bluebird';
import cheerio from 'cheerio';
import didyoumean from 'didyoumean';
import R from 'ramda';

import { arrayToBuilds, cl, request, shorthandSkills, trinksCon } from '../helpers';
import Log from '../logger';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate';

const default_schema = require('../../data/default.json');
const prebuilts = require('../../data/prebuilts.json');


export const source_info = {
  name: 'KoreanBuilds',
  id: 'koreanbuilds'
};


export function getVersion() {
  return request('http://koreanbuilds.net/')
    .then(cheerio.load)
    .then($c => $c('#patch').find('option').first().text())
    .tap(version => store.set('koreanbuilds_ver', version));
}

export function getSr() {
  if (!store.get('koreanbuilds_ver')) return getVersion().then(getSr);

  return request('http://koreanbuilds.net/')
    .then(cheerio.load)
    .then($c => {
      // TODO: Fix scrolling in undefined builds before enabling this again.
      // $c('div[class="champIcon grey"]')
      //   .each((idx, elem) => {
      //     store.push('undefined_builds', {
      //       source: source_info.name,
      //       champ: $c(elem).attr('name').toLowerCase().replace(/[^a-z]/g, ''),
      //       position: 'All'
      //     });
      //   });

      return $c('.champIcon')
        .map((idx, elem) => {
          const name = $c(elem).attr('name');
          const id = $c(elem).attr('id');
          if (!id) return;
          return {
            id,
            name,
            formatted_name: didyoumean(name, store.get('champs')) || name
          };
        })
        .get();
    })
    .filter(R.identity)
    .tap(() => Log.info('koreanbuilds: Getting Roles'))
    .map(champ_data => request(`http://koreanbuilds.net/roles?championid=${champ_data.id}`)
      .then(cheerio.load)
      .then($c => {
        champ_data.roles = $c('button')
          .map((idx, elem) => $c(elem).text())
          .get();

        return champ_data;
      })
    , {concurrency: 3})
    .then(R.reverse)
    .map(champ_data => {
      cl(`${T.t('processing')} Koreanbuilds: ${T.t(champ_data.formatted_name.toLowerCase().replace(/[^a-z]/g, ''))}`);
      progressbar.incrChamp();

      return Promise.resolve(champ_data.roles)
        .map(role => request(`http://koreanbuilds.net/champion/${champ_data.name}/${role}/${store.get('koreanbuilds_ver')}/-1`)
          .then(cheerio.load)
          .then($c => {
            // Item sets
            function getItems(idx) {
              return $c('#items').find('.float').eq(idx).find('.item')
               .map((idx, elem) => $c(elem).children().attr('src').match(/([^\/]+)(?=\.\w+$)/)[0])
               .get();
            }

            const items = getItems(0);
            const early_items = R.concat(R.pluck('id', prebuilts.trinkets), getItems(1));

            // Skills
            let skills = [];
            const skill_keys = {
              1: 'Q',
              2: 'W',
              3: 'E',
              4: 'R'
            };

            $c('.skillWrapper').each((idx, elem) => {
              if (idx === 0) return;
              const ability = skill_keys[idx];
              $c(elem).find('.skillUpgrade').each((idx, elem) => {
                if (idx === 0) return;
                if ($c(elem).hasClass('skillUp')) skills[idx] = ability;
              });
            });
            skills.shift();
            if (store.get('settings').skillsformat) {
              skills = shorthandSkills(skills);
            } else {
              skills = skills.join('.');
            }

            const games_played = $c('p').eq(4).text().split(' ')[0];
            const stats = $c('p').eq(2).text().split(': ')[1];
            const block = [
              {
                items: arrayToBuilds(early_items),
                type: `${T.t('starter', true)} - ${stats} - ${games_played} ${T.t('games_played', true)}`
              },
              {
                items: arrayToBuilds(items),
                type: T.t('core_items', true)
              }
            ];

            const riot_json = R.merge(R.clone(default_schema, true), {
              champion: champ_data.formatted_name,
              title: `KRB ${role} ${store.get('koreanbuilds_ver')}`,
              blocks: trinksCon(block, {highest_win: skills, most_freq: skills})
            });

            return {
              champ: champ_data.formatted_name,
              file_prefix: role,
              riot_json,
              source: 'koreanbuilds'
            };
          })
        )
        .catch(err => {
          Log.warn(err);
          store.push('undefined_builds', {champ: champ_data.formatted_name, position: champ_data.roles, source: source_info.name});
        });
    }, {concurrency: 3})
    .then(R.flatten)
    .then(R.reject(R.isNil))
    .then(data => store.push('sr_itemsets', data));
}
