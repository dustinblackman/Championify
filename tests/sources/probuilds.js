import fs from 'fs';
import glob from 'glob';
import moment from 'moment';
import nock from 'nock';
import path from 'path';
import R from 'ramda';

const probuilds = require(`../../${global.src_path}/sources/probuilds`);
const store = require(`../../${global.src_path}/store`).default;

const should = require('chai').should();
let nocked = null;

const RESPONSES_FIXTURES = {};
R.forEach(fixture => {
  RESPONSES_FIXTURES[path.basename(fixture).replace('.html', '')] = fs.readFileSync(fixture, 'utf8');
}, glob.sync(path.join(__dirname, 'fixtures/probuilds/responses/*.html')));

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
    nocked = nock('http://probuilds.net');
    store.set('champ_ids', {ahri: '103'});
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
        version.should.equal(moment().format('YYYY-MM-DD'));
      });
    });
  });

  describe('requestChamps', () => {
    describe('Ahri middle', () => {
      beforeEach(() => {
        store.set('settings', {});
        nock.cleanAll();
        nocked
          .get('/champions')
          .reply(200, RESPONSES_FIXTURES.champions)
          .get('/champions/details/ahri')
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
