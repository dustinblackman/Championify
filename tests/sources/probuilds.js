import fs from 'fs';
import glob from 'glob';
import mockery from 'mockery';
import nock from 'nock';
import path from 'path';
import R from 'ramda';

let probuilds, store;

const should = require('chai').should();
let nocked = null;

const RESPONSES_FIXTURES = {};
R.forEach(fixture => {
  if (fixture.indexOf('json') > -1) {
    RESPONSES_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
  } else {
    RESPONSES_FIXTURES[path.basename(fixture).replace('.html', '')] = fs.readFileSync(fixture, 'utf8');
  }
}, glob.sync(path.join(__dirname, 'fixtures/probuilds/responses/*')));

const RESULTS_FIXTURES = {};
R.forEach(fixture => {
  RESULTS_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
}, glob.sync(path.join(__dirname, 'fixtures/probuilds/results/*.json')));

function testWithFixture(fixture) {
  return probuilds.getSr()
    .then(() => {
      const results = store.get('sr_itemsets');
      if (process.env.BUILD_FIXTURES === 'true') {
        fs.writeFileSync(path.join(__dirname, `fixtures/probuilds/results/${fixture}.json`), JSON.stringify(results, null, 2), 'utf8');
      }
      should.exist(results);
      results.should.eql(RESULTS_FIXTURES[fixture]);
    });
}

describe('src/sources/probuilds', () => {
  before(() => {
    const moment_mock = () => ({format: () => '2016-11-27'});
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });
    mockery.registerMock('moment', moment_mock);
    probuilds = require(`../../${global.src_path}/sources/probuilds`);
    store = require(`../../${global.src_path}/store`).default;

    // TODO: Lazy fix for Probuilds tests. Needs to be replaced.
    const T = require(`../../${global.src_path}/translate`).default;
    const champions = require('../fixtures/all_champions.json').data;
    let translations = R.zipObj(R.keys(champions), R.pluck('name')(R.values(champions)));
    translations = R.zipObj(R.map(key => key.toLowerCase().replace(/ /g, ''), R.keys(translations)), R.values(translations));
    translations.wukong = translations.monkeyking;
    T.merge(translations);

    nocked = nock('http://probuilds.net');
    store.set('champ_ids', {ahri: '103'});
  });

  after(() => {
    mockery.disable();
  });

  beforeEach(() => {
    store.remove('sr_itemsets');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('version', () => {
    it('should get the stubbed probuilds version', () => {
      return probuilds.getVersion().then(version => {
        version.should.equal('2016-11-27');
      });
    });
  });

  describe('requestChamps', () => {
    describe('Ahri middle', () => {
      beforeEach(() => {
        store.set('settings', {});
        nock.cleanAll();
        nocked
          .get('/ajax/championListNew')
          .reply(200, RESPONSES_FIXTURES.champions)
          .get('/champions/details/Ahri')
          .reply(200, RESPONSES_FIXTURES.ahri)
          .get('/ajax/champBuilds?championId=103')
          .reply(200, RESPONSES_FIXTURES.champ_builds);
      });

      it('should default item sets', () => {
        return testWithFixture('ahri_result_default');
      });

      it('should split item sets', () => {
        store.set('settings', {splititems: true});
        return testWithFixture('ahri_result_splititems');
      });

      it('should with item sets locked to Summoners Rift map', () => {
        store.set('settings', {locksr: true});
        return testWithFixture('ahri_result_locksr');
      });

      it('should with shorthanded skills', () => {
        store.set('settings', {
          consumables: true,
          consumables_position: 'beginning',
          skillsformat: true
        });
        return testWithFixture('ahri_result_shorthand');
      });

      it('should with consumables enabled and at the beginning', () => {
        store.set('settings', {
          consumables: true,
          consumables_position: 'beginning'
        });
        return testWithFixture('ahri_result_consumables_beginning');
      });

      it('should with consumables enabled and at the end', () => {
        store.set('settings', {
          consumables: true,
          consumables_position: 'end'
        });
        return testWithFixture('ahri_result_consumables_end');
      });

      it('should with trinkets enabled and at the beginning', () => {
        store.set('settings', {
          trinkets: true,
          trinkets_position: 'beginning'
        });

        return testWithFixture('ahri_result_trinkets_beginning');
      });

      it('should with trinkets enabled and at the end', () => {
        store.set('settings', {
          trinkets: true,
          trinkets_position: 'end'
        });
        return testWithFixture('ahri_result_trinkets_end');
      });

      it('should with consumables enabled and split item sets', () => {
        store.set('settings', {
          splititems: true,
          consumables: true,
          consumables_position: 'beginning'
        });

        return testWithFixture('ahri_result_splititems_consumables');
      });

      it('should with trinkets enabled and split item sets', () => {
        store.set('settings', {
          splititems: true,
          trinkets: true,
          trinkets_position: 'beginning'
        });

        return testWithFixture('ahri_result_splititems_trinkets');
      });
    });
  });
});
