import Promise from 'bluebird';
import cheerio from 'cheerio';
import R from 'ramda';

import { cl, request, shorthandSkills, trinksCon } from '../helpers';
import Log from '../logger';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate';

const default_schema = require('../../data/default.json');


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

function _arrayToBuilds(ids) {
  const counts = R.countBy(R.identity)(ids);
  return R.map(id => ({
    id,
    count: counts[id]
  }), ids);
}

export function getSr() {
  if (!store.get('koreanbuilds_ver')) return getVersion().then(getSr);

  return request('http://koreanbuilds.net/')
    .then(cheerio.load)
    .then($c => {
      // TODO: Push to undefined builds here.
      return $c('div[class="champIcon "]')
        .map((idx, elem) => ({
          id: $c(elem).attr('id'),
          name: $c(elem).attr('name')
        }))
        .get();
    })
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
    .map(champ_data => {
      cl(`${T.t('processing')} Koreanbuilds: ${T.t(champ_data.name.toLowerCase().replace(/[^a-z]/g, ''))}`);
      progressbar.incrChamp();

      return Promise.resolve(champ_data.roles)
        .map(role => request(`http://koreanbuilds.net/champion/${champ_data.name}/${role}/${store.get('koreanbuilds_ver')}/-1`)
          .then(cheerio.load)
          .then($c => {
            // Item sets
            const items = $c('.item')
              .map((idx, elem) => $c(elem).children().attr('src').match(/([^\/]+)(?=\.\w+$)/)[0])
              .get();

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

            const games_played = $c('p').eq(3).text().split(' ')[0];
            const stats = $c('p').eq(2).text().slice(6);
            const block = [{
              items: _arrayToBuilds(items),
              type: `${stats} - ${games_played} games played` // TODO: add translation
            }];

            const riot_json = R.merge(R.clone(default_schema, true), {
              champion: champ_data.name,
              title: `KRB ${role} ${store.get('koreanbuilds_ver')}`,
              blocks: trinksCon(block, {highest_win: skills, most_freq: skills})
            });

            return {
              champ: champ_data.name,
              file_prefix: role,
              riot_json,
              source: 'koreanbuilds'
            };
          })
        , {concurrency: 1})
        .catch(err => {
          Log.warn(err);
          store.push('undefined_builds', {champ: champ_data.name, position: champ_data.roles, source: source_info.name});
        });
    }, {concurrency: 3})
    .then(R.flatten)
    .then(R.reject(R.isNil))
    .then(data => store.push('sr_itemsets', data));
}
