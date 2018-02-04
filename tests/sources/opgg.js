import fs from 'fs';
import glob from 'glob';
import nock from 'nock';
import path from 'path';
import R from 'ramda';

const opgg = require(`../../${global.src_path}/sources/opgg`);
const store = require(`../../${global.src_path}/store`).default;

const should = require('chai').should();
let nocked = null;

const RESPONSES_FIXTURES = {};
R.forEach(fixture => {
  RESPONSES_FIXTURES[path.basename(fixture).replace('.html', '')] = fs.readFileSync(fixture, 'utf8');
}, glob.sync(path.join(__dirname, 'fixtures/opgg/responses/*.html')));

const RESULTS_FIXTURES = {};
R.forEach(fixture => {
  RESULTS_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
}, glob.sync(path.join(__dirname, 'fixtures/opgg/results/*.json')));

function testWithFixture(fixture) {
  return opgg.getSr()
    .then(() => {
      const results = store.get('sr_itemsets');
      if (process.env.BUILD_FIXTURES === 'true') {
        fs.writeFileSync(path.join(__dirname, `fixtures/opgg/results/${fixture}.json`), JSON.stringify(results, null, 2), 'utf8');
      }
      should.exist(results);
      results.should.eql(RESULTS_FIXTURES[fixture]);
    });
}

describe('src/sources/opgg', () => {
  before(() => {
    nocked = nock('https://www.op.gg');
  });

  beforeEach(() => {
    store.remove('sr_itemsets');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('version', () => {
    it('should get the stubbed opgg version', () => {
      nocked.get('/champion/ahri/statistics/mid')
        .reply(200, RESPONSES_FIXTURES.ahri_statistics);
      return opgg.getVersion().then(version => {
        version.should.equal('7.21');
      });
    });
  });

  describe('requestChamps', () => {
    describe('Ahri middle', () => {
      beforeEach(() => {
        store.set('settings', {});
        nock.cleanAll();
        nocked
          .get('/champion/statistics')
          .reply(200, RESPONSES_FIXTURES.stats)
          .get('/champion/ahri/statistics/mid/item')
          .reply(200, RESPONSES_FIXTURES.item)
          .get('/champion/ahri/statistics/mid/skill')
          .reply(200, RESPONSES_FIXTURES.skill);
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
