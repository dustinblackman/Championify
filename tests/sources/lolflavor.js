import glob from 'glob';
import nock from 'nock';
import R from 'ramda';
import path from 'path';

import lolflavor from '../../src/sources/lolflavor';
import store from '../../src/store';

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
    .get('/data/statsLane.json')
    .reply(200, RESPONSES_FIXTURES.stats)
    .get('/data/statsJungle.json')
    .reply(200, RESPONSES_FIXTURES.stats)
    .get('/data/statsSupport.json')
    .reply(200, RESPONSES_FIXTURES.stats)
    .get('/champions/Katarina/Recommended/Katarina_lane_scrape.json')
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
        .get('/champions/Ahri/Recommended/Ahri_lane_scrape.json')
        .reply(200, RESPONSES_FIXTURES.ahri_lane_scrape);

      return lolflavor.version().then(version => {
        version.should.equal('9/21/2015');
      });
    });
  });

  describe('aram', function() {
    beforeEach(function() {
      store.set('settings', {});
      nock.cleanAll();
    });

    it('should get default ARAM item sets for Katarina', () => {
      nocked
        .get('/data/statsARAM.json')
        .reply(200, RESPONSES_FIXTURES.stats)
        .get('/champions/Katarina/Recommended/Katarina_aram_scrape.json')
        .reply(200, RESPONSES_FIXTURES.katarina_aram_scrape);

      return lolflavor.aram().then(() => {
        const results = store.get('aram_itemsets');
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
      return lolflavor.sr().then(() => {
        const results = store.get('sr_itemsets');
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

      return lolflavor.sr().then(() => {
        const results = store.get('sr_itemsets');
        should.exist(results);
        results.should.eql(RESULTS_FIXTURES.katarina_trinkcon);
      });
    });

    it('should get default Summoners Rift sets for Katarina and lock them to SR', function() {
      nockSummonersRift();
      store.set('settings', {locksr: true});

      return lolflavor.sr().then(() => {
        const results = store.get('sr_itemsets');
        should.exist(results);
        results.should.eql(RESULTS_FIXTURES.katarina_locksr);
      });
    });
  });
});
