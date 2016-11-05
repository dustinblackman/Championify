import Promise from 'bluebird';
import cheerio from 'cheerio';
//import escodegen from 'escodegen';
//import esprima from 'esprima';
import R from 'ramda';

import ChampionifyErrors from '../errors.js';
import { request, trinksCon } from '../helpers';
//import Log from '../logger';
import progressbar from '../progressbar';
import store from '../store';
//import T from '../translate';

const default_schema = require('../../data/default.json');  //Riot JSON schema

const item_block_names = ['Starting Items', 'First Item', 'Boots', 'Second Item', 'Third Item', 'Fourth Item', 'Fifth Item'];

export const source_info = {
  name: 'Lolalytics',
  id: 'lolalytics'
};

export function getVersion() {
  return request('http://current.lolalytics.com/')
    .then(body => {
      const $c = cheerio.load(body);
      const lolalytics_header = $c("body > div > h2").text();
      const patchRegex = new RegExp("League of Legends Patch ([0-9].[0-9]*)");
      const lolalytics_ver = patchRegex.exec(lolalytics_header)[1];
      store.set('lolalytics_ver', lolalytics_ver);
      return lolalytics_ver;
    })
    .catch(err => {
      throw new ChampionifyErrors.RequestError('Can\'t get Lolalytics Version').causedBy(err);
    });
}


export function getSr() {
  const champs = store.get('champs'); //Array of champ names
  
  //const champs = ['Quinn'];
  
  //console.log(champs);
  return Promise.resolve(champs)
  .map(champion_name => getChampionPage({champion_name}))
  .then(data => store.push('sr_itemsets', data));
  
  //.then(cheerio_data => parseChampion(cheerio_data))
  //.then(parsed_data => createRiotJson(parsed_data))
  //.then(riot_json => createChampionifyJson(riot_json))
  //.then(championify_json => store.push('sr_itemsets', championify_json));
}

///////////////////////
// WIP
///////////////////////

function parseChampion(request_params, cheerio_data) {
  let $c = cheerio_data;
  const champion_name = request_params.champion_name;
  const position = request_params.position;
  const formatted_builds = [];
  
  //console.log(champion_name);
  //console.log(request_params.position);
  let positions = $c('.lanebox > div.lanetitle');
  //console.log(positions);
  let position_names = [];
  positions.each(function(i, pos) {
    //console.log(pos);
    $c(pos).children().remove(); //Remove the %
    position_names.push($c(pos).text());
  });
  position_names = R.filter(role => (role !== position && role !== 'All Lanes'), position_names); //Remove if exists
  //console.log('Position names: ');
  //console.log(position_names);

  if (position_names.length == 1 || position){ //Single position champ or we were passed a position
    formatted_builds.push(parseChampionPage(cheerio_data, position_names[0], champion_name));
  }
  //formatted_builds.push(parseChampionPage(cheerio_data, position_names[0]));
  
  if(position_names.length > 1 && !position ) { //More positions available and we werent passed one
    let extra_requests = [];
    //positions = R.map(position => ({champ, position}), positions);
    extra_requests = R.map(position => ({champion_name, position}), position_names);
    //console.log('---------------------');
    //console.log(extra_requests);
    //console.log('---------------------');
    return Promise.resolve(extra_requests)
    .map(request_params => getChampionPage(request_params))
    .then(R.flatten)
    .then(R.concat(formatted_builds));
  }
  progressbar.incrChamp();
  return formatted_builds;
  //}
}

function parseChampionPage(cheerio_data, position, champion_name) { 
  //parseChampion(cheerio_data);
  let build_sections = parseItemData(cheerio_data);
  let skills = parseSkillsData(cheerio_data);
  let parsed_data = {
    build_sections: build_sections,
    skills: skills    
  };
  
  return createRiotJson(parsed_data, position, champion_name);
}

function getChampionPage(request_params) {
  const { champion_name , position } = request_params;
  //console.log(champion_name);
  //console.log(position);
  let url = `http://current.lolalytics.com/champion/${champion_name}/`
  if (position)
    url += position + '/';
  
  //console.log(url);
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

function parseItemData(cheerio_data) {
  let build_sections = [];
  let $c = cheerio_data;
  
	$c('td.summarytitle').each(function(i, element) {
    //console.log($c(this).text());

    let build_section = {
    title: $c(this).text(), //name of the section
    json: []  //json object w/ name, win, & pick values
    };

    let innerTable = $c(this).parent().find('table.summaryinner');
    let rows = $c(innerTable).find('tr');
    //Store each column in the build_sections.json array

    $c(rows).each(function(j, row) {
      let rowName = $c(row).find('td.summarysubheading').text();
      if (rowName == '') {//Items 
        rowName = 'Items';
        $c(row).find('h1').each(function(z, itemName) {
          build_section.json.push({
            name: ($c(itemName).text()),
            win: null,
            pick: null								
          });
        }); //end each h1
      } else {
        if (rowName == 'Win') {
          $c(row).find('td.win.summarystats').each(function(z, winPercent) {
            build_section.json[z].win = parseFloat($c(winPercent).text());
          }); //end find win
        }
        if (rowName == 'Pick') {
          $c(row).find('td.popularity.summarystats').each(function(z, pickPercent) {
            build_section.json[z].pick = parseFloat($c(pickPercent).text());
          }); //end find popularity
        }
      } //end else (not items)
    }); //end each row
    build_sections.push(build_section);
  }); //end each summarytitle
  
  return build_sections;
}

function parseSkillsData(cheerio_data) {
  let $c = cheerio_data;
  let skill_sections = [];
  $c('td.summarytitle').each(function(i, element) {
    if ($c(this).text() == 'Abilities')
    { 
      let skill_section = {
        title: $c(this).text(), //name of the section
        json: null  //json object w/ skill order, win, & pick values
      };
      //Skills
      let innerSkillsTable = $c(this).parent().find('table.summaryskillstable');
      let rows = $c(innerSkillsTable).find('tr');
      //Store each column in the buildSections.json array
      
      $c(rows).each(function(j, row) {
        let skill_order = $c(row).find('td.summaryskills div.summaryspellkey').text().split('').join('.');
        let win_rate =  parseFloat($c(row).find('td.win').text());
        let pick_rate = parseFloat($c(row).find('td.popularity').text());
        //console.log('Skills: ' + skill_order);
        //console.log('Win Rate' + win_rate);
        //console.log('Pick Rate' + pick_rate);      

        skill_section.json = {
          skills: skill_order,
          win: win_rate,
          pick: pick_rate
        };
        
      }); //end each row
      
      skill_sections.push(skill_section);
    } //end if abilities section
  }); //end each td.summarytitle
    
  let most_freq_skills = skill_sections.reduce(function(prev, curr) {
    return prev.pick < curr.pick ? prev : curr;
  });
  
  let highest_win_skills = skill_sections.reduce(function(prev, curr) {
    return prev.win < curr.win ? prev : curr;
  });
  
  let skills = {
    most_freq: most_freq_skills.json.skills,
    highest_win: highest_win_skills.json.skills 
  };
  
  return skills;
}

function createRiotJson(parsed_data, position, champion_name) {
  let blocks = [];
  const item_names = store.get('item_names');
  let build_sections = parsed_data.build_sections;
  let skills = parsed_data.skills;
  
  let build_sections_to_convert = [];
  
  R.forEach( function(x) { if (R.contains(x.title, item_block_names)) build_sections_to_convert.push(x) }, build_sections);
  
  //Iterate the sections
  for (let i = 0; i < build_sections_to_convert.length; i++) {
    //Iterate the columns in that section
    //console.log(build_sections[i]);
    let items = [];
    
    for (let k = 0; k < build_sections_to_convert[i].json.length; k++) {
      //console.log(build_sections[i].json);
      let id = parseInt(item_names[build_sections_to_convert[i].json[k].name]);
      
      id = (isNaN(id) ? 2003 : id); //For biscuit
      
      items.push({
        count: 1,
        id: id.toString()
      });
      //console.log(items);
    }
    
    let block = {
      type: build_sections_to_convert[i].title,
      items: items
    }
    blocks.push(block);
  }

  let riot_json = R.merge(R.clone(default_schema, true), {
              champion: champion_name,
              title: `Lolalytics ${champion_name} ${position}`,
              blocks: trinksCon(blocks, skills)
            });
            
  console.log(riot_json);
  return createChampionifyJson(riot_json, position, champion_name);
}

function createChampionifyJson(riot_json, position, champion_name) {
  return {
    champ: champion_name,
    file_prefix: position,
    riot_json: riot_json,
    source: 'lolalytics'
  }
}
