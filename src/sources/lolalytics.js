import Promise from 'bluebird';
import cheerio from 'cheerio';
import R from 'ramda';

import ChampionifyErrors from '../errors.js';
import { cl, request, shorthandSkills, trinksCon } from '../helpers';
import Log from '../logger';
import progressbar from '../progressbar';
import store from '../store';
import T from '../translate';

const default_schema = require('../../data/default.json');  //  Riot JSON schema

//  Item headings from lolalytics website
const item_block_names = ['Starting Items', 'First Item', 'Boots', 'Second Item', 'Third Item', 'Fourth Item', 'Fifth Item'];

const sort_by_win_rate = R.sortBy(R.prop('win'));
const sort_by_pick_rate = R.sortBy(R.prop('pick'));

export const source_info = {
  name: 'Lolalytics',
  id: 'lolalytics'
};

export function getVersion() {
  return request('http://current.lolalytics.com/')
    .then(body => {
      const $c = cheerio.load(body);
      const lolalytics_header = $c('body > div > h2').text();
      const patchRegex = new RegExp('League of Legends Patch ([0-9].[0-9]*)');
      const lolalytics_ver = patchRegex.exec(lolalytics_header)[1];
      store.set('lolalytics_ver', lolalytics_ver);
      return lolalytics_ver;
    })
    .catch(err => {
      throw new ChampionifyErrors.RequestError('Can\'t get Lolalytics Version').causedBy(err);
    });
}

function createChampionifyJson(riot_json, position, champion_name, split_sort) {
  if (split_sort) {
    position += `_${split_sort}`;
  }

  return {
    champ: champion_name,
    file_prefix: position,
    riot_json: riot_json,
    source: 'lolalytics'
  };
}

function createRiotJson(parsed_data, position, champion_name, split_sort) {
  const blocks = [];
  const item_names = store.get('item_names');
  const build_sections = parsed_data.build_sections;
  const skills = parsed_data.skills;

  const build_sections_to_convert = R.filter(R.propSatisfies(R.contains(R.__, item_block_names), 'title', R.__), build_sections);//  Filter out the rows we don't care about (champion counters, etc.)

  function convertBuildSectionJsonToBlock(build_section_json, title) {
    const items = [];

    for (let k = 0; k < build_section_json.length; k++) {
      let id = parseInt(item_names[build_section_json[k].name], 10);

      id = (isNaN(id) ? 2003 : id); //  For biscuit

      items.push({
        count: 1,
        id: id.toString()
      });
    }

    const filtered_items = R.uniqBy(R.prop('id'), items); //  filter out duplicates, mainly just the second health pot from converting buscuits

    let block = {
      type: title,
      items: filtered_items
    };

    return block;
  }

  R.forEach(current_section => {
    if (!split_sort) {
      let block = convertBuildSectionJsonToBlock(R.reverse(sort_by_win_rate(current_section.json)), `${T.t('highest_win', true)} ${T.t(current_section.title.split(' ').join('_'))}`);
      blocks.push(block);
      block = convertBuildSectionJsonToBlock(R.reverse(sort_by_pick_rate(current_section.json)), `${T.t('most_freq', true)} ${T.t(current_section.title.split(' ').join('_'))}`);
      blocks.push(block);
    } else if (R.toLower(split_sort) === 'win') {
      let block = convertBuildSectionJsonToBlock(R.reverse(sort_by_win_rate(current_section.json)), `${T.t(current_section.title.split(' ').join('_'))}`);
      blocks.push(block);
    } else {
      let block = convertBuildSectionJsonToBlock(R.reverse(sort_by_pick_rate(current_section.json)), `${T.t(current_section.title.split(' ').join('_'))}`);
      blocks.push(block);
    }
  }, build_sections_to_convert);

  let riot_json = R.merge(R.clone(default_schema, true), {
    champion: champion_name,
    title: `Lolalytics ${champion_name} ${T.t(R.toLower(position), true)} ${store.get('lolalytics_ver')}`,
    blocks: trinksCon(blocks, skills)
  });

  if (split_sort) {
    if (R.toLower(split_sort) === 'win') {
      riot_json.title += ' ' + T.t('highest_win', true);
    } else {
      riot_json.title += ' ' + T.t('most_freq', true);
    }
  }

  if (store.get('settings').locksr) riot_json.map = 'SR';

  return createChampionifyJson(riot_json, position, champion_name, split_sort);
}

function parseSkillsData($c) {
  let skill_sections = $c('td.summarytitle').map(function(i, el) {
    el = $c(el);
    if (el.text() === 'Abilities') {
      return el.parent().find('table.summaryskillstable').find('tr').map((idx, row) => {
        row = $c(row);
        if (idx === 0) return; // Skip the header row

        const skill_order = row.find('td.summaryskills > div.summaryspellkey').text().split('').join('.');
        const win_rate = parseFloat(row.find('td.win').text());
        const pick_rate = parseFloat(row.find('td.popularity').text());

        return {
          skills: skill_order,
          win: win_rate,
          pick: pick_rate
        };
      });
    }
  }).get();

  skill_sections = R.reject(R.isNil, R.flatten(skill_sections));

  let highest_win_skills = R.reverse(sort_by_win_rate(skill_sections))[0];
  let most_freq_skills = R.reverse(sort_by_pick_rate(skill_sections))[0];

  let shorthand_bool = store.get('settings').skillsformat;

  let skills = {
    most_freq: shorthand_bool ? shorthandSkills(most_freq_skills.skills.split('.')) : most_freq_skills.skills,
    highest_win: shorthand_bool ? shorthandSkills(highest_win_skills.skills.split('.')) : highest_win_skills.skills
  };

  return skills;
}

function parseItemData($c) {
  let build_sections = $c('td.summarytitle').map(function(i, el) {
    el = $c(el);
    let build_section = {
      title: el.text(), //  name of the section
      json: []  //  json object w/ name, win, & pick values
    };

    build_section.json = el.parent().find('table.summaryinner').map(function(j, table) {
      table = $c(table);
      let rows = table.children('tr');
      const item_name_row = $c(rows[0]);
      const win_rates = $c(rows[1]).find('td.win.summarystats');
      const pick_rates = $c(rows[2]).find('td.popularity.summarystats');
      return item_name_row.find('h1').map(function(idx, item_name) {
        const item_title = $c(item_name).text();
        const win_rate = parseFloat($c(win_rates[idx]).text());
        const pick_rate = parseFloat($c(pick_rates[idx]).text());

        return {
          name: item_title,
          win: win_rate,
          pick: pick_rate
        };
      });
    }).get();
    build_section.json = R.flatten(build_section.json);
    return build_section;
  }).get();
  return build_sections;
}

function parseChampionPage(cheerio_data, position, champion_name) {
  const build_sections = parseItemData(cheerio_data);
  const skills = parseSkillsData(cheerio_data);
  const parsed_data = {
    build_sections: build_sections,
    skills: skills
  };
  const builds = [];

  if (store.get('settings').splititems) {
    builds.push(createRiotJson(parsed_data, position, champion_name, 'Win'));
    builds.push(createRiotJson(parsed_data, position, champion_name, 'Pick'));
  } else {
    builds.push(createRiotJson(parsed_data, position, champion_name));
  }
  return builds;
}

function parseChampion(request_params, $c) {
  const champion_name = request_params.champion_name;
  const position = request_params.position;
  let formatted_builds = [];

  const positions = $c('.lanebox > div.lanetitle');
  let position_names = [];
  let current_position = null;
  positions.each(function(i, pos) {
    $c(pos).children().remove(); // Remove the x.xx% after the lane name, it's a child in the div
    position_names.push($c(pos).text());
    if ($c(pos).parent().hasClass('selected'))
      current_position = $c(pos).text();
  });
  position_names = R.filter(role => (role !== position && role !== 'All Lanes'), position_names); //  Remove if exists

  if (position_names.length === 1 || position) { // Single position champ or we were passed a position
    formatted_builds = R.concat(formatted_builds, parseChampionPage($c, current_position, champion_name));
  }

  if (position_names.length > 1 && !position) { //  More positions available and we werent passed one
    let extra_requests = [];
    extra_requests = R.map(position => ({champion_name, position}), position_names);
    return Promise.resolve(extra_requests)
    .map(request_params => getChampionPage(request_params)) // eslint-disable-line no-use-before-define
    .then(R.flatten)
    .then(R.concat(formatted_builds));
  }

  return formatted_builds;
}

function getChampionPage(request_params) {
  const { champion_name, position } = request_params;
  let url = `http://current.lolalytics.com/champion/${champion_name}/`;
  if (position)
    url += position + '/';
  else {
    cl(`${T.t('processing')} Lolalytics: ${T.t(champion_name)}`);
  }

  function markUndefined() {
    store.push('undefined_builds', {
      source: source_info.name,
      champion_name,
      position: request_params.position || 'All'
    });
    return;
  }

  return request(url).then(html => {
    let $ = cheerio.load(html);
    return parseChampion(request_params, $);
  })
  .catch(err => {
    Log.warn(err);
    markUndefined();
    return;
  });
}

export function getSr() {
  const champs = store.get('champs'); //  Array of champ names

  return Promise.resolve(champs)
  .then(R.reverse)
  .map(champion_name => {
    progressbar.incrChamp();
    return getChampionPage({champion_name});
  }, {concurrency: 3})
  .then(data => {
    store.push('sr_itemsets', data);
  });
}
