import fs from 'fs';
import glob from 'glob';
import nock from 'nock';
import path from 'path';
import R from 'ramda';

const leagueofgraphs = require(`../../${GLOBAL.src_path}/sources/leagueofgraphs`);
const store = require(`../../${GLOBAL.src_path}/store`).default;

require('chai').should();
let nocked = null;
let nocked_riot = null;


const RESPONSES_FIXTURES = {};
R.forEach(fixture => {
  RESPONSES_FIXTURES[path.basename(fixture).replace('.html', '')] = fs.readFileSync(fixture, 'utf8');
}, glob.sync(path.join(__dirname, 'fixtures/leagueofgraphs/responses/*.html')));

const RESULTS_FIXTURES = {};
R.forEach(fixture => {
  RESULTS_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
}, glob.sync(path.join(__dirname, 'fixtures/leagueofgraphs/results/*.json')));


function nockSR() {
  nocked_riot
    .get(`/cdn/${store.get('riot_ver')}/data/en_US/item.json`)
    .reply(200, require(path.join(__dirname, '../fixtures/all_items.json')));

  nocked
    .get('/champions/items/ahri/platinum')
    .reply(200, RESPONSES_FIXTURES.ahri_items)
    .get('/champions/items/ahri/middle/platinum')
    .reply(200, RESPONSES_FIXTURES.ahri_items)
    .get('/champions/skills-orders/ahri/middle/platinum')
    .reply(200, RESPONSES_FIXTURES.ahri_skills);
}

describe('src/sources/leagueofgraphs', () => {
  before(() => {
    nocked = nock('http://www.leagueofgraphs.com');
    nocked_riot = nock('http://ddragon.leagueoflegends.com');
    store.set('riot_ver', '6.6.1');
    store.set('leagueofgraphs_ver', '6.6');
    store.set('champs', ['ahri']);
  });

  describe('version', () => {
    it('should get the stubbed koreanbuilds version', () => {
      nocked.get('/contact').reply(200, RESPONSES_FIXTURES.contact);
      return leagueofgraphs.getVersion().then(version => {
        version.should.equal('6.6');
      });
    });
  });

  describe('summoners rift', () => {
    beforeEach(() => {
      store.remove('sr_itemsets');
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return items for ahri middle', () => {
      nockSR();
      store.set('settings', {consumables: true});
      return leagueofgraphs.getSr().then(champs => {
        const itemsets = R.flatten(store.get('sr_itemsets'));
        itemsets.should.eql(RESULTS_FIXTURES.ahri_normal);
      });
    });

    it('should return items for ahri middle with shorthand skills', () => {
      nockSR();
      store.set('settings', {skillsformat: true, consumables: true});
      return leagueofgraphs.getSr().then(champs => {
        const itemsets = R.flatten(store.get('sr_itemsets'));
        itemsets.should.eql(RESULTS_FIXTURES.ahri_shorthand);
      });
    });
  });
});
