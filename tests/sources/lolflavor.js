import fs from 'fs';
import glob from 'glob';
import nock from 'nock';
import R from 'ramda';
import path from 'path';


const lolflavor = require(`../../${GLOBAL.src_path}/sources/lolflavor`);
const store = require(`../../${GLOBAL.src_path}/store`).default;

const should = require('chai').should();
let nocked = null;

const RESPONSES_FIXTURES = {};
R.forEach(fixture => {
  RESPONSES_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
}, glob.sync(path.join(__dirname, 'fixtures/lolflavor/responses/*.json')));

const RESULTS_FIXTURES = {};
R.forEach(fixture => {
  RESULTS_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
}, glob.sync(path.join(__dirname, 'fixtures/lolflavor/results/*.json')));

function nockSummonersRift() {
  nocked
    .get('/data/statsMid.json')
    .reply(200, RESPONSES_FIXTURES.stats)
    .get('/data/statsADC.json')
    .reply(200, RESPONSES_FIXTURES.stats)
    .get('/data/statsTop.json')
    .reply(200, RESPONSES_FIXTURES.stats)
    .get('/data/statsJungle.json')
    .reply(200, RESPONSES_FIXTURES.stats)
    .get('/data/statsSupport.json')
    .reply(200, RESPONSES_FIXTURES.stats)
    .get('/champions/Katarina/Recommended/Katarina_top_scrape.json')
    .reply(200, RESPONSES_FIXTURES.katarina_lane_scrape)
    .get('/champions/Katarina/Recommended/Katarina_adc_scrape.json')
    .reply(200, RESPONSES_FIXTURES.katarina_lane_scrape)
    .get('/champions/Katarina/Recommended/Katarina_mid_scrape.json')
    .reply(200, RESPONSES_FIXTURES.katarina_lane_scrape)
    .get('/champions/Katarina/Recommended/Katarina_jungle_scrape.json')
    .reply(200, RESPONSES_FIXTURES.katarina_jungle_scrape)
    .get('/champions/Katarina/Recommended/Katarina_support_scrape.json')
    .reply(200, RESPONSES_FIXTURES.katarina_support_scrape);
}

describe('src/sources/lolflavor', function() {
  before(() => {
    nocked = nock('http://www.lolflavor.com');
    store.set('riot_ver', '5.18');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('version', function() {
    it('should get the stubbed lolflavor version', () => {
      nocked
        .get('/champions/Ahri/Recommended/Ahri_mid_scrape.json')
        .reply(200, RESPONSES_FIXTURES.ahri_lane_scrape);

      return lolflavor.getVersion().then(version => {
        version.should.equal('2015-09-21');
      });
    });
  });

  describe('aram', function() {
    before(function() {
      store.set('settings', {});
      nock.cleanAll();
    });

    it('should get default ARAM item sets for Katarina', () => {
      nocked
        .get('/data/statsARAM.json')
        .reply(200, RESPONSES_FIXTURES.stats)
        .get('/champions/Katarina/Recommended/Katarina_aram_scrape.json')
        .reply(200, RESPONSES_FIXTURES.katarina_aram_scrape);

      return lolflavor.getAram().then(() => {
        const results = R.flatten(store.get('aram_itemsets'));
        if (process.env.BUILD_FIXTURES === 'true') {
          fs.writeFileSync(path.join(__dirname, 'fixtures/lolflavor/results/katarina_aram.json'), JSON.stringify(results, null, 2), 'utf8');
        }
        should.exist(results);
        results.should.eql(RESULTS_FIXTURES.katarina_aram);
      });
    });
  });

  describe('summonersRift', function() {
    beforeEach(function() {
      store.remove('settings');
      store.remove('sr_itemsets');
      nock.cleanAll();
    });

    it('should get default Summoners Rift sets for Katarina', () => {
      nockSummonersRift();
      store.set('settings', {});
      return lolflavor.getSr().then(() => {
        const results = R.flatten(store.get('sr_itemsets'));
        if (process.env.BUILD_FIXTURES === 'true') {
          fs.writeFileSync(path.join(__dirname, 'fixtures/lolflavor/results/katarina_default.json'), JSON.stringify(results, null, 2), 'utf8');
        }
        should.exist(results);
        results.should.eql(RESULTS_FIXTURES.katarina_default);
      });
    });

    it('should get consumables and tickets with Summoners Rift sets for Katarina', () => {
      nockSummonersRift();
      store.set('settings', {
        consumables: true,
        trinkets: true
      });

      return lolflavor.getSr().then(() => {
        const results = R.flatten(store.get('sr_itemsets'));
        if (process.env.BUILD_FIXTURES === 'true') {
          fs.writeFileSync(path.join(__dirname, 'fixtures/lolflavor/results/katarina_trinkcon.json'), JSON.stringify(results, null, 2), 'utf8');
        }
        should.exist(results);
        results.should.eql(RESULTS_FIXTURES.katarina_trinkcon);
      });
    });

    it('should get default Summoners Rift sets for Katarina and lock them to SR', function() {
      nockSummonersRift();
      store.set('settings', {locksr: true});

      return lolflavor.getSr().then(() => {
        const results = R.flatten(store.get('sr_itemsets'));
        if (process.env.BUILD_FIXTURES === 'true') {
          fs.writeFileSync(path.join(__dirname, 'fixtures/lolflavor/results/katarina_locksr.json'), JSON.stringify(results, null, 2), 'utf8');
        }
        should.exist(results);
        results.should.eql(RESULTS_FIXTURES.katarina_locksr);
      });
    });
  });
});
