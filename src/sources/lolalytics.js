import Promise from 'bluebird';
import cheerio from 'cheerio';
//import escodegen from 'escodegen';
//import esprima from 'esprima';
import R from 'ramda';

import ChampionifyErrors from '../errors.js';
import { request, trinksCon } from '../helpers';
//import Log from '../logger';
//import progressbar from '../progressbar';
import store from '../store';
//import T from '../translate';

const default_schema = require('../../data/default.json');  //Riot JSON schema
const prebuilts = require('../../data/prebuilts.json'); //Trinkets, consumables, trinket 


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
  console.log('A');
  return getItemData().then(function(ret_val) {	//Array of build sections
    console.log('B');
    //getSkillData().then(function(skills) {
      console.log('C');
      let riot_json = createRiotJson(ret_val.build_sections, ret_val.skills);
      console.log(riot_json);
      let championify_json = createChampionifyJson(riot_json);
      console.log(championify_json);
      let itemsets = [];
      itemsets.push(championify_json);
      store.push('sr_itemsets', itemsets);
    //});
  });
}







///////////////////////
// WIP
///////////////////////

function getItemData() {
  console.log(1);
  let buildSections = [];
  let skill_sections = [];
  return request('http://current.lolalytics.com/champion/Ahri/').then(function (html) {
  console.log(2);
  //if (!error && response.statusCode == 200) {
    console.log(3);
    let $ = cheerio.load(html);
    $('td.summarytitle').each(function(i, element) {
		
      console.log($(this).text());
		
      let buildSection = {
        title: $(this).text(), //name of the section
        json: []  //json object w/ name, win, & pick values
      };
      
      let innerTable = $(this).parent().find('table.summaryinner');
      //Pretty sure this is a once thing? don't need each here
      $(innerTable).each(function (k, table) {	
        console.log(k);
        let rows = $(this).find('tr');
        //Store each column in the buildSections.json array
        
        $(rows).each(function(j, row) {
          let rowName = $(row).find('td.summarysubheading').text();
          if (rowName == '') {//Items 
            rowName = 'Items';
            //name.push(rowName);
            $(row).find('h1').each(function(z, itemName) {
              buildSection.json.push({
                name: ($(itemName).text()),
                win: null,
                pick: null								
              });
            }); //end each h1
          } else {
            if (rowName == 'Win') {
              //win.push(rowName);
              $(row).find('td.win.summarystats').each(function(z, winPercent) {
                //newJsonObject.win.push(parseFloat($(winPercent).text()));
                buildSection.json[z].win = parseFloat($(winPercent).text());
              }); //end find
            }
            if (rowName == 'Pick') {
              //pick.push(rowName);
              $(row).find('td.popularity.summarystats').each(function(z, pickPercent) {
                //newJsonObject.pick.push(parseFloat($(pickPercent).text()));
                buildSection.json[z].pick = parseFloat($(pickPercent).text());
              }); //end find 
            }
          } //end else (not items)
        }); //end each row
      }); //end each inner table   
      
    buildSections.push(buildSection);
    
    
    
    if ($(this).text() == 'Abilities')
    {
        
        let skill_section = {
          title: $(this).text(), //name of the section
          json: null  //json object w/ skill order, win, & pick values
        };
        //Skills
        let innerSkillsTable = $(this).parent().find('table.summaryskillstable');
        //Pretty sure this is a once thing? don't need each here
        $(innerSkillsTable).each(function (k, table) {	
          let rows = $(this).find('tr');
          //Store each column in the buildSections.json array
          
          $(rows).each(function(j, row) {
            //let rowName = $(row).find('td.summarysubheading').text();
            let skill_order = $(row).find('td.summaryskills div.summaryspellkey').text().split('').join('.');
            let win_rate =  parseFloat($(row).find('td.win').text());
            let pick_rate = parseFloat($(row).find('td.popularity').text());
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
          
        }); //end each inner table
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
    }
    
    /*
    for (let i = 0; i < buildSections.length; i++) {
      console.log(buildSections[i].title + ':');
      for (let k = 0; k < buildSections[i].json.length; k++) {
        let jsonObject = buildSections[i].json[k];
        let outString = jsonObject.name + '\tWin Percent: ' + jsonObject.win + '\tPick Percent: ' + jsonObject.pick;
        console.log(outString);
      }
      console.log('');
    }*/
    let ret_val = {
      build_sections: buildSections,
      skills: skills    
    };
    return ret_val;
  }); //end request 
}

function getSkillData() {
  let skill_sections = [];
  return request('http://current.lolalytics.com/champion/Ahri/').then(function (html) {
    let $ = cheerio.load(html);
    $('td.summarytitle').each(function(i, element) {
      
      console.log($(this).text());
      
        if ($(this).text() == 'Abilities')
        {
        
        let skill_section = {
          title: $(this).text(), //name of the section
          json: null  //json object w/ skill order, win, & pick values
        };
        //Skills
        let innerSkillsTable = $(this).parent().find('table.summaryskillstable');
        //Pretty sure this is a once thing? don't need each here
        $(innerSkillsTable).each(function (k, table) {	
          let rows = $(this).find('tr');
          //Store each column in the buildSections.json array
          
          $(rows).each(function(j, row) {
            //let rowName = $(row).find('td.summarysubheading').text();
            let skill_order = $(row).find('td.summaryskills div.summaryspellkey').text().split('').join('.');
            let win_rate =  parseFloat($(row).find('td.win').text());
            let pick_rate = parseFloat($(row).find('td.popularity').text());
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
          
        }); //end each inner table
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
    }
    console.log(skills);
    return skills;
  });
}


function createRiotJson(build_sections, skills) {
  let blocks = [];
  const item_names = store.get('item_names');
  
  let item_block_names = ['Starting Items', 'First Item', 'Boots', 'Second Item', 'Third Item', 'Fourth Item', 'Fifth Item'];
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
              champion: 'Ahri',
              title: 'Lolalytics Ahri Mid',
              blocks: trinksCon(blocks, skills)
            });
            
  console.log(riot_json);
  return riot_json;
}

//let items = getItemData();


function createChampionifyJson(riot_json) {
  return {
    champ: 'Ahri',
    file_prefix: 'Mid',
    riot_json: riot_json,
    source: 'lolalytics'
  }
}
