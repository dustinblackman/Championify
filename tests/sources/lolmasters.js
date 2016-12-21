import fs from 'fs';
import glob from 'glob';
import nock from 'nock';
import path from 'path';
import R from 'ramda';

const lolmasters = require(`../../${global.src_path}/sources/lolmasters`);
const store = require(`../../${global.src_path}/store`).default;

const should = require('chai').should();
let nocked = null;

const champions = ['Brand'];

const RESPONSES_FIXTURES = {};

R.forEach(fixture => {
  if (fixture.indexOf('json') > -1) {
    RESPONSES_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
  } else {
    RESPONSES_FIXTURES[path.basename(fixture).replace('.html', '')] = fs.readFileSync(fixture, 'utf8');
  }
}, glob.sync(path.join(__dirname, 'fixtures/lolmasters/responses/*')));

const RESULTS_FIXTURES = {};
R.forEach(fixture => {
  RESULTS_FIXTURES[path.basename(fixture).replace('.json', '')] = require(fixture);
}, glob.sync(path.join(__dirname, 'fixtures/lolmasters/results/*.json')));

function testWithFixture(fixture) {
  return lolmasters.getSr()
    .then(() => {
      const results = R.flatten(store.get('sr_itemsets'));
      if (process.env.BUILD_FIXTURES === 'true') {
        fs.writeFileSync(path.join(__dirname, `fixtures/lolmasters/results/${fixture}.json`), JSON.stringify(results, null, 2), 'utf8');
      }
      should.exist(results);
      results.should.eql(RESULTS_FIXTURES[fixture]);
    });
}

describe('src/sources/lolmasters', () => {
  before(() => {
    nocked = nock('http://lolmasters.net');
    store.set('champs', champions);
  });

  beforeEach(() => {
    store.remove('sr_itemsets');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('version', () => {
    it('should get the stubbed lolmasters version', () => {
      nocked.get('/about').reply(200, RESPONSES_FIXTURES.about);
      return lolmasters.getVersion().then(version => {
        version.should.equal('6.24');
      });
    });
  });

  describe('requestChamps', () => {
    describe('Brand middle and support', () => {
      beforeEach(() => {
        store.set('settings', {});
        nock.cleanAll();
        nocked
          .get('/championify/Brand/Support')
          .reply(200, RESPONSES_FIXTURES.brand_support)
          .get('/championify/Brand/Mid')
          .reply(200, RESPONSES_FIXTURES.brand_mid)
          .get('/championify/Brand/Jungler')
          .reply(200, {})
          .get('/championify/Brand/Top')
          .reply(200, {})
          .get('/championify/Brand/Carry')
          .reply(200, {});
      });

      it('should default item sets', () => {
        return testWithFixture('brand_result_default');
      });

      it('should split item sets', () => {
        store.set('settings', {splititems: true});
        return testWithFixture('brand_result_splititems');
      });

      it('should with item sets locked to Summoners Rift map', () => {
        store.set('settings', {locksr: true});
        return testWithFixture('brand_result_locksr');
      });

      it('should with consumables enabled and at the beginning', () => {
        store.set('settings', {
          consumables: true,
          consumables_position: 'beginning'
        });
        return testWithFixture('brand_result_consumables_beginning');
      });

      it('should with consumables enabled and at the end', () => {
        store.set('settings', {
          consumables: true,
          consumables_position: 'end'
        });
        return testWithFixture('brand_result_consumables_end');
      });

      it('should with trinkets enabled and at the beginning', () => {
        store.set('settings', {
          trinkets: true,
          trinkets_position: 'beginning'
        });

        return testWithFixture('brand_result_trinkets_beginning');
      });

      it('should with trinkets enabled and at the end', () => {
        store.set('settings', {
          trinkets: true,
          trinkets_position: 'end'
        });
        return testWithFixture('brand_result_trinkets_end');
      });

      it('should with consumables enabled and split item sets', () => {
        store.set('settings', {
          splititems: true,
          consumables: true,
          consumables_position: 'beginning'
        });

        return testWithFixture('brand_result_splititems_consumables');
      });

      it('should with trinkets enabled and split item sets', () => {
        store.set('settings', {
          splititems: true,
          trinkets: true,
          trinkets_position: 'beginning'
        });

        return testWithFixture('brand_result_splititems_trinkets');
      });
    });
  });
});
